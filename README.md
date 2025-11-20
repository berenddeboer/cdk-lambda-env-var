# SetLambdaEnvironmentVariables

A CDK construct to set Lambda environment variables after deployment, helping you break circular dependency chains.

## About

Set Lambda environment variables after the Lambda function has been deployed. This allows you to set environment variables based on resources that require this Lambda, which would normally lead to a circular dependency.

Now you can deploy the Lambda and the other resources first, and add environment variables later using this construct.

## Installation

### npm

```bash
npm install cdk-lambda-env-var
```

### yarn

```bash
yarn add cdk-lambda-env-var
```

### pnpm

```bash
pnpm add cdk-lambda-env-var
```

## Usage

### Basic Example

```typescript
import { Stack, App } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SetLambdaEnvironmentVariables } from "cdk-lambda-env-var";

const app = new App();
const stack = new Stack(app, "MyStack");

// Create your Lambda function
const myFunction = new lambda.Function(stack, "MyFunction", {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "index.handler",
  code: lambda.Code.fromAsset("lambda"),
});

// Set environment variables after deployment
new SetLambdaEnvironmentVariables(stack, "SetEnvVars", {
  function: myFunction,
  environmentVariables: {
    API_ENDPOINT: "https://api.example.com",
    REGION: "us-east-1",
    DEBUG: "true",
  },
});
```

### Breaking Circular Dependencies

This construct is particularly useful when you have circular dependencies. For example, when a Lambda needs to know about a resource that depends on the Lambda itself:

```typescript
import { Stack } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { SetLambdaEnvironmentVariables } from "cdk-lambda-env-var";

// Lambda function that needs to know the API URL
const authFunction = new lambda.Function(this, "AuthFunction", {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "index.handler",
  code: lambda.Code.fromAsset("lambda"),
});

// API Gateway that uses the Lambda
const api = new apigateway.LambdaRestApi(this, "MyApi", {
  handler: authFunction,
});

// Set the API URL as an environment variable on the Lambda
// This would normally create a circular dependency!
new SetLambdaEnvironmentVariables(this, "SetApiUrl", {
  function: authFunction,
  environmentVariables: {
    API_URL: api.url,
  },
});
```

## How It Works

The construct uses a custom resource with a Lambda-backed handler to:

1. **On Create/Update**: Fetches the current environment variables from the target Lambda, merges them with the new variables you provide, and updates the Lambda configuration
2. **On Delete**: Fetches the current environment variables, removes only the variables set by this construct, and updates the Lambda configuration

This ensures that:
- Existing environment variables are preserved (merge behavior)
- Stack updates properly update the environment variables
- Stack deletion only removes the variables added by this construct

## API Reference

### SetLambdaEnvironmentVariables

#### Props

| Property | Type | Description |
|----------|------|-------------|
| `function` | `lambda.IFunction` | The Lambda function to set environment variables on |
| `environmentVariables` | `Record<string, string>` | Environment variables to set. These will be merged with existing variables |

## Requirements

- AWS CDK v2.170.0 or later
- Node.js 18 or later

## License

This project is licensed under the Apache-2.0 License.
