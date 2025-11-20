import { CustomResource, Duration } from "aws-cdk-lib"
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
 *   environmentVariables: {
 *     API_KEY: 'some-value',
 *     REGION: 'us-east-1',
 *   },
 * });
 */
export class SetLambdaEnvironmentVariables extends Construct {
  constructor(scope: Construct, id: string, props: SetLambdaEnvironmentVariablesProps) {
    super(scope, id)

    const onEventHandler = new lambda.Function(this, "Handler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
const { LambdaClient, GetFunctionConfigurationCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const functionArn = event.ResourceProperties.FunctionArn;
  const desiredEnvVars = event.ResourceProperties.EnvironmentVariables;
  const envVarKeys = Object.keys(desiredEnvVars);

  try {
    const getConfigResponse = await lambda.send(
      new GetFunctionConfigurationCommand({ FunctionName: functionArn })
    );

    const currentEnvVars = getConfigResponse.Environment?.Variables || {};

    let newEnvVars;

    if (event.RequestType === 'Delete') {
      newEnvVars = { ...currentEnvVars };
      envVarKeys.forEach(key => delete newEnvVars[key]);
      console.log('Deleting env vars:', envVarKeys);
    } else {
      newEnvVars = { ...currentEnvVars, ...desiredEnvVars };
      console.log('Merging env vars. Current:', Object.keys(currentEnvVars), 'Adding:', envVarKeys);
    }

    await lambda.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: functionArn,
        Environment: {
          Variables: newEnvVars,
        },
      })
    );

    console.log('Successfully updated environment variables');

    return {
      PhysicalResourceId: \`SetEnvVars-\${functionArn.split(':').pop()}-\${envVarKeys.join('-')}\`,
      Data: {
        EnvVarKeys: envVarKeys.join(','),
      },
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
      `),
      timeout: Duration.minutes(5),
      logRetention: logs.RetentionDays.ONE_DAY,
    })

    props.function.grantInvoke(onEventHandler)
    onEventHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "lambda:GetFunctionConfiguration",
          "lambda:UpdateFunctionConfiguration",
        ],
        resources: [props.function.functionArn],
      })
    )

    const provider = new cr.Provider(this, "Provider", {
      onEventHandler,
      logRetention: logs.RetentionDays.ONE_DAY,
    })

    new CustomResource(this, "CustomResource", {
      serviceToken: provider.serviceToken,
      resourceType: "Custom::SetLambdaEnvVar",
      properties: {
        FunctionArn: props.function.functionArn,
        EnvironmentVariables: props.environment,
      },
    })
  }
}
