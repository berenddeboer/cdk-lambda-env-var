# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AWS CDK Construct Library that provides `SetLambdaEnvironmentVariables` - a construct that sets Lambda environment variables after deployment to solve circular dependency issues. Published as a multi-language package via JSII.

## Project Management

This project uses **Projen** to manage configuration. All build tools, dependencies, and scripts are generated from `.projenrc.ts`.

**Critical:** Never manually edit `package.json`, `tsconfig.json`, `API.md`, GitHub workflows, or other generated files. Instead:
1. Modify `.projenrc.ts`
2. Run `npx projen` to regenerate all configuration files

## Common Commands

```bash
# Build (compile TypeScript + run JSII + generate docs + run tests)
npm run build

# Run tests only
npm test

# Run tests in watch mode
npm run test:watch

# Lint and auto-fix
npm run eslint

# Regenerate projen files after modifying .projenrc.ts
npx projen

# Package for publishing (generates multi-language packages)
npm run package
```

## Architecture

### Core Construct (`src/set-lambda-environment-variables.ts`)

The construct uses a **Lambda-backed custom resource** (not `AwsCustomResource`) to handle merge/delete logic:

1. **Custom Resource Handler Lambda**: Inline Node.js 22 function that uses AWS SDK v3 (`@aws-sdk/client-lambda`)
2. **One custom resource per environment variable**: Each env var gets its own custom resource for independence
3. **onCreate/onUpdate**: Fetches current env vars → merges single key/value → updates Lambda
4. **onDelete**: Fetches current env vars → removes only the specified key → updates Lambda

The handler is wrapped in a CDK `Provider` construct which manages the custom resource lifecycle. Multiple `SetLambdaEnvironmentVariables` instances in the same stack share a singleton provider to minimize resource overhead.

### Key Implementation Details

- **One resource per variable**: The construct creates one `CustomResource` per environment variable (via `Object.entries(props.environment).forEach(...)`)
- **Independent lifecycle**: Adding/removing an env var only affects that specific custom resource, not others
- **Custom resource type**: `Custom::SetLambdaEnvVar` (not the default `AWS::CloudFormation::CustomResource`)
- **IAM permissions**: Handler needs `lambda:GetFunctionConfiguration` and `lambda:UpdateFunctionConfiguration` on target Lambda
- **Physical Resource ID**: `SetEnvVars-${functionName}-${key}` - includes function name and single env var key
- **Custom resource properties**: Each resource receives `FunctionArn`, `Key`, and `Value` (not a `EnvironmentVariables` object)

### Testing Strategy (`test/set-lambda-environment-variables.test.ts`)

Tests use CDK assertions framework (`Template.fromStack()`):
- Verify correct resource counts (one `Custom::SetLambdaEnvVar` per environment variable)
- Check IAM policy statements
- Validate each custom resource has correct `Key` and `Value` properties
- Inspect inline Lambda handler code contains merge/delete logic for single key/value
- Verify empty environment object creates 0 custom resources

**Important**: Tests check for `Custom::SetLambdaEnvVar` resource type, not `AWS::CloudFormation::CustomResource`.

## JSII Multi-Language Support

This project uses JSII (v5.9.0) to publish to multiple package managers. The construct must follow JSII compatibility rules:
- Use `readonly` for all props
- Avoid TypeScript-specific features in public APIs
- JSDoc `@example` must NOT use code fences (`` ```ts ``) - just indent the code

## Code Style

Enforced via Prettier:
- No semicolons
- Double quotes
- 90 character line width
- Trailing commas (ES5)

## Dependencies

- **CDK version**: 2.170.0+ (for Node.js 22 Lambda runtime support)
- **Target runtime**: Node.js 22.x for custom resource handler
- **Peer dependencies**: `aws-cdk-lib` ^2.170.0, `constructs` ^10.0.5
