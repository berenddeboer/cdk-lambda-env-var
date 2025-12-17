import { awscdk, javascript, github } from "projen"
import { TrailingComma } from "projen/lib/javascript"
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Berend de Boer",
  authorAddress: "berend@pobox.com",
  constructsVersion: "10.4.4",
  cdkVersion: "2.232.2",
  defaultReleaseBranch: "main",
  majorVersion: 1,
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
  npmTrustedPublishing: true,
  devDeps: ["husky"],
  depsUpgradeOptions: {
    workflowOptions: {
      projenCredentials: github.GithubCredentials.fromPersonalAccessToken({
        secret: "GITHUB_TOKEN",
      }),
      permissions: {
        contents: github.workflows.JobPermission.WRITE,
        pullRequests: github.workflows.JobPermission.WRITE,
      },
    },
  },

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
})

project.synth()
