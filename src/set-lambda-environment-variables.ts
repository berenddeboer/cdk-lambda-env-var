import { CustomResource, Duration, RemovalPolicy, Stack } from "aws-cdk-lib"
import * as iam from "aws-cdk-lib/aws-iam"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as logs from "aws-cdk-lib/aws-logs"
import * as cr from "aws-cdk-lib/custom-resources"
import { Construct } from "constructs"

export interface SetLambdaEnvironmentVariablesProps {
  /**
   * The Lambda function to set environment variables on
   */
  readonly function: lambda.IFunction

  /**
   * Environment variables to set on the Lambda function.
   * These will be merged with existing environment variables.
   */
  readonly environment: Record<string, string>

  /**
   * The number of days log events are kept in CloudWatch Logs for the
   * custom resource handler Lambda and provider.
   *
   * A shared log group is created for all SetLambdaEnvironmentVariables
   * instances in the same stack. If multiple instances specify different
   * retention values, the first one to create the log group wins.
   *
   * @default logs.RetentionDays.ONE_WEEK
   */
  readonly logRetention?: logs.RetentionDays
}

/**
 * Internal singleton construct that holds the shared provider and handler.
 * This allows multiple SetLambdaEnvironmentVariables instances to share
 * the same custom resource provider and handler Lambda.
 */
class SetLambdaEnvVarProviderSingleton extends Construct {
  public readonly provider: cr.Provider
  public readonly handler: lambda.IFunction
  public readonly logGroup: logs.LogGroup

  constructor(scope: Construct, id: string, logRetention: logs.RetentionDays) {
    super(scope, id)

    // Create shared log group for handler and provider
    this.logGroup = new logs.LogGroup(this, "LogGroup", {
      retention: logRetention,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.handler = new lambda.Function(this, "Handler", {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
const { LambdaClient, GetFunctionConfigurationCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateWithRetry(functionArn, key, value, isDelete) {
  const maxRetries = 10;
  const maxDelay = 40000; // Cap at 40 seconds
  let delay = 10000; // Start with 10 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const getConfigResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn })
      );

      const currentEnvVars = getConfigResponse.Environment?.Variables || {};

      let newEnvVars;

      if (isDelete) {
        newEnvVars = { ...currentEnvVars };
        delete newEnvVars[key];
        console.log('Deleting env var:', key);
      } else {
        newEnvVars = { ...currentEnvVars, [key]: value };
        console.log('Setting env var:', key, '=', value);
      }

      await lambdaClient.send(
        new UpdateFunctionConfigurationCommand({
          FunctionName: functionArn,
          Environment: {
            Variables: newEnvVars,
          },
        })
      );

      console.log('Successfully updated environment variable');
      return;
    } catch (error) {
      const isRetryable = error.name === 'ResourceConflictException' ||
        error.message?.includes('An update is in progress');

      if (isRetryable && attempt < maxRetries) {
        console.log(\`Attempt \${attempt} failed due to concurrent update, retrying in \${delay}ms...\`);
        await sleep(delay);
        delay = Math.min(delay * 2, maxDelay); // Double the delay, but cap at 40s
      } else {
        throw error;
      }
    }
  }
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const functionArn = event.ResourceProperties.FunctionArn;
  const key = event.ResourceProperties.Key;
  const value = event.ResourceProperties.Value;

  try {
    await updateWithRetry(functionArn, key, value, event.RequestType === 'Delete');

    return {
      PhysicalResourceId: key,
      Data: {
        Key: key,
      },
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
      `),
      timeout: Duration.minutes(7),
      logGroup: this.logGroup,
    })

    this.provider = new cr.Provider(this, "Provider", {
      onEventHandler: this.handler,
      logGroup: this.logGroup,
    })
  }
}

/**
 * A construct that sets environment variables on a Lambda function after deployment.
 *
 * This construct uses a custom resource to update the Lambda function's environment
 * variables after the function has been deployed. The variables are merged with any
 * existing environment variables on the function.
 *
 * On deletion, the environment variables set by this construct are removed from the
 * Lambda function.
 *
 * @example
 *
 * new SetLambdaEnvironmentVariables(this, 'SetEnvVars', {
 *   function: myLambdaFunction,
 *   environment: {
 *     CLOUDFRONT_DOMAIN: distribution.domainName,
 *     CLOUDFRONT_URL: `https://${distribution.domainName}`,
 *   },
 * });
 */
export class SetLambdaEnvironmentVariables extends Construct {
  /**
   * Get or create the singleton provider for this stack.
   * Multiple instances of SetLambdaEnvironmentVariables in the same stack
   * will share the same provider and handler Lambda.
   *
   * If the singleton doesn't exist yet, it will be created with the specified
   * log retention. If it already exists, the log retention parameter is ignored
   * (the first instance to create the singleton determines the retention).
   */
  private static getOrCreateProvider(
    scope: Construct,
    logRetention: logs.RetentionDays
  ): SetLambdaEnvVarProviderSingleton {
    const stack = Stack.of(scope)
    const providerId = "SetLambdaEnvVarProviderSingleton"

    let singleton = stack.node.tryFindChild(
      providerId
    ) as SetLambdaEnvVarProviderSingleton

    if (!singleton) {
      singleton = new SetLambdaEnvVarProviderSingleton(stack, providerId, logRetention)
    }

    return singleton
  }

  constructor(scope: Construct, id: string, props: SetLambdaEnvironmentVariablesProps) {
    super(scope, id)

    // Get or create the shared singleton provider for this stack
    const singleton = SetLambdaEnvironmentVariables.getOrCreateProvider(
      this,
      props.logRetention ?? logs.RetentionDays.ONE_WEEK
    )

    // Grant permissions for this specific Lambda function
    props.function.grantInvoke(singleton.handler)
    singleton.handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "lambda:GetFunctionConfiguration",
          "lambda:UpdateFunctionConfiguration",
        ],
        resources: [props.function.functionArn],
      })
    )

    // Create one custom resource per environment variable
    // Chain them with dependencies to prevent concurrent Lambda updates
    let previousResource: CustomResource | undefined

    Object.entries(props.environment).forEach(([key, value]) => {
      const resource = new CustomResource(this, `CustomResource-${key}`, {
        serviceToken: singleton.provider.serviceToken,
        resourceType: "Custom::SetLambdaEnvVar",
        properties: {
          FunctionArn: props.function.functionArn,
          Key: key,
          Value: value,
        },
      })

      // Chain resources to run sequentially
      if (previousResource) {
        resource.node.addDependency(previousResource)
      }

      previousResource = resource
    })
  }
}
