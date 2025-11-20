import { awscdk, javascript } from "projen"
import { TrailingComma } from "projen/lib/javascript"
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Berend de Boer",
  authorAddress: "berend@pobox.com",
  constructsVersion: "10.3.0",
  cdkVersion: "2.170.0",
  defaultReleaseBranch: "main",
  jsiiVersion: "~5.9.0",
  name: "cdk-lambda-env-var",
  description:
    "A CDK construct to set Lambda environment variables after deployment. This allows you to break those pesky circular dependency issues you will have for many common use-cases.",
  packageManager: javascript.NodePackageManager.NPM,
  prettier: true,
  prettierOptions: {
    settings: {
      trailingComma: TrailingComma.ES5,
      semi: false,
      singleQuote: false,
      printWidth: 90,
    },
    yaml: true,
  },
  projenrcTs: true,
  repositoryUrl: "https://github.com/berenddeboer/cdk-lambda-env-var",
  keywords: ["aws", "aws-cdk", "lambda"],
  workflowNodeVersion: "24.x",
  devDeps: ["husky"],

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
})

project.synth()
