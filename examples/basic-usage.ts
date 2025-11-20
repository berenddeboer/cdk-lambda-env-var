import { Stack, App } from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { SetLambdaEnvironmentVariables } from "cdk-lambda-env-var"

const app = new App()
const stack = new Stack(app, "ExampleStack")

const myFunction = new lambda.Function(stack, "MyFunction", {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "index.handler",
  code: lambda.Code.fromInline("exports.handler = async () => ({ statusCode: 200 });"),
  environment: {
    INITIAL_VAR: "initial-value",
  },
})

new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
  function: myFunction,
  environment: {
    API_KEY: "my-api-key",
    REGION: "us-east-1",
    DEBUG: "true",
  },
})
