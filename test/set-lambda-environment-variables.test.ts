import { App, Stack } from "aws-cdk-lib"
import { Template, Match } from "aws-cdk-lib/assertions"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { SetLambdaEnvironmentVariables } from "../src"

describe("SetLambdaEnvironmentVariables", () => {
  let app: App
  let stack: Stack
  let targetFunction: lambda.Function

  beforeEach(() => {
    app = new App()
    stack = new Stack(app, "TestStack")
    targetFunction = new lambda.Function(stack, "TargetFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromInline("exports.handler = async () => {};"),
    })
  })

  test("construct creates necessary resources", () => {
    new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
      function: targetFunction,
      environmentVariables: {
        API_KEY: "test-key",
        REGION: "us-east-1",
      },
    })

    const template = Template.fromStack(stack)

    template.resourceCountIs("AWS::Lambda::Function", 4)

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "index.handler",
      Runtime: "nodejs22.x",
    })

    template.hasResourceProperties("Custom::SetLambdaEnvVar", Match.objectLike({}))
  })

  test("grants correct IAM permissions to custom resource handler", () => {
    new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
      function: targetFunction,
      environmentVariables: {
        TEST_VAR: "test-value",
      },
    })

    const template = Template.fromStack(stack)

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              "lambda:GetFunctionConfiguration",
              "lambda:UpdateFunctionConfiguration",
            ]),
            Effect: "Allow",
            Resource: Match.objectLike({
              "Fn::GetAtt": Match.arrayEquals([
                Match.stringLikeRegexp("TargetFunction.*"),
                "Arn",
              ]),
            }),
          }),
        ]),
      },
    })
  })

  test("custom resource receives correct properties", () => {
    new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
      function: targetFunction,
      environmentVariables: {
        KEY1: "value1",
        KEY2: "value2",
      },
    })

    const template = Template.fromStack(stack)

    template.hasResourceProperties("Custom::SetLambdaEnvVar", {
      FunctionArn: Match.objectLike({
        "Fn::GetAtt": Match.arrayEquals([
          Match.stringLikeRegexp("TargetFunction.*"),
          "Arn",
        ]),
      }),
      EnvironmentVariables: {
        KEY1: "value1",
        KEY2: "value2",
      },
    })
  })

  test("handler code contains merge logic", () => {
    new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
      function: targetFunction,
      environmentVariables: {
        TEST_VAR: "test",
      },
    })

    const template = Template.fromStack(stack)

    const allFunctions = template.findResources("AWS::Lambda::Function")

    const handlerFunction = Object.values(allFunctions).find(
      (fn: any) =>
        fn.Properties.Code.ZipFile &&
        fn.Properties.Code.ZipFile.includes("GetFunctionConfigurationCommand")
    )

    expect(handlerFunction).toBeDefined()

    const handlerCode = handlerFunction!.Properties.Code.ZipFile
    expect(handlerCode).toContain("GetFunctionConfigurationCommand")
    expect(handlerCode).toContain("UpdateFunctionConfigurationCommand")
    expect(handlerCode).toContain("currentEnvVars")
    expect(handlerCode).toContain("RequestType")
    expect(handlerCode).toContain("Delete")
  })

  test("works with multiple environment variables", () => {
    new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
      function: targetFunction,
      environmentVariables: {
        VAR1: "value1",
        VAR2: "value2",
        VAR3: "value3",
        VAR4: "value4",
      },
    })

    const template = Template.fromStack(stack)

    template.hasResourceProperties("Custom::SetLambdaEnvVar", {
      EnvironmentVariables: {
        VAR1: "value1",
        VAR2: "value2",
        VAR3: "value3",
        VAR4: "value4",
      },
    })
  })

  test("works with empty environment variables object", () => {
    new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
      function: targetFunction,
      environmentVariables: {},
    })

    const template = Template.fromStack(stack)

    template.hasResourceProperties("Custom::SetLambdaEnvVar", {
      EnvironmentVariables: {},
    })
  })

  test("synthesizes without errors", () => {
    new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
      function: targetFunction,
      environmentVariables: {
        API_KEY: "test-key",
      },
    })

    expect(() => app.synth()).not.toThrow()
  })
})
