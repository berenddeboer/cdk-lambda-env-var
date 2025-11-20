# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### SetLambdaEnvironmentVariables <a name="SetLambdaEnvironmentVariables" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables"></a>

A construct that sets environment variables on a Lambda function after deployment.

This construct uses a custom resource to update the Lambda function's environment
variables after the function has been deployed. The variables are merged with any
existing environment variables on the function.

On deletion, the environment variables set by this construct are removed from the
Lambda function.

*Example*

```typescript
new SetLambdaEnvironmentVariables(this, 'SetEnvVars', {
  function: myLambdaFunction,
  environmentVariables: {
    API_KEY: 'some-value',
    REGION: 'us-east-1',
  },
});
```


#### Initializers <a name="Initializers" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.Initializer"></a>

```typescript
import { SetLambdaEnvironmentVariables } from 'cdk-lambda-env-var'

new SetLambdaEnvironmentVariables(scope: Construct, id: string, props: SetLambdaEnvironmentVariablesProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariables.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariables.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariables.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps">SetLambdaEnvironmentVariablesProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps">SetLambdaEnvironmentVariablesProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariables.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariables.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.isConstruct"></a>

```typescript
import { SetLambdaEnvironmentVariables } from 'cdk-lambda-env-var'

SetLambdaEnvironmentVariables.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariables.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-lambda-env-var.SetLambdaEnvironmentVariables.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


## Structs <a name="Structs" id="Structs"></a>

### SetLambdaEnvironmentVariablesProps <a name="SetLambdaEnvironmentVariablesProps" id="cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps"></a>

#### Initializer <a name="Initializer" id="cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps.Initializer"></a>

```typescript
import { SetLambdaEnvironmentVariablesProps } from 'cdk-lambda-env-var'

const setLambdaEnvironmentVariablesProps: SetLambdaEnvironmentVariablesProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables to set on the Lambda function. |
| <code><a href="#cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps.property.function">function</a></code> | <code>aws-cdk-lib.aws_lambda.IFunction</code> | The Lambda function to set environment variables on. |

---

##### `environment`<sup>Required</sup> <a name="environment" id="cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}

Environment variables to set on the Lambda function.

These will be merged with existing environment variables.

---

##### `function`<sup>Required</sup> <a name="function" id="cdk-lambda-env-var.SetLambdaEnvironmentVariablesProps.property.function"></a>

```typescript
public readonly function: IFunction;
```

- *Type:* aws-cdk-lib.aws_lambda.IFunction

The Lambda function to set environment variables on.

---



