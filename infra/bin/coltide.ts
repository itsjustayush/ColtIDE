#!/usr/bin/env node
import "source-map-support/register.js";
import * as cdk from "aws-cdk-lib";
import { resolveStageConfig } from "../lib/config.js";
import { ColtIDEAuthStack } from "../lib/auth-stack.js";
import { ColtIDEDataStack } from "../lib/data-stack.js";
import { ColtIDEStorageStack } from "../lib/storage-stack.js";
import { ColtIDEApiStack } from "../lib/api-stack.js";
import { ColtIDEConnectorsStack } from "../lib/connectors-stack.js";
import { ColtIDEGitHubStack } from "../lib/github-stack.js";
import { ColtIDERdsStack } from "../lib/rds-stack.js";

const app = new cdk.App();

const stage = app.node.tryGetContext("stage") ?? "dev";
const config = resolveStageConfig(stage);

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region,
};

cdk.Tags.of(app).add("Project", "coltide");
cdk.Tags.of(app).add("Stage", config.stage);
cdk.Tags.of(app).add("ManagedBy", "cdk");

new ColtIDERdsStack(app, `ColtIDERds-${config.stage}`, {
  env,
  config,
  description: `ColtIDE — RDS Postgres for coltide-web (${config.stage})`,
});

const github = new ColtIDEGitHubStack(app, `ColtIDEGitHub-${config.stage}`, {
  env,
  config,
  description: `ColtIDE — GitHub OIDC wrapper + token storage (${config.stage})`,
});

const connectors = new ColtIDEConnectorsStack(app, `ColtIDEConnectors-${config.stage}`, {
  env,
  config,
  description: `ColtIDE — generic app connector token storage (${config.stage})`,
});

const auth = new ColtIDEAuthStack(app, `ColtIDEAuth-${config.stage}`, {
  env,
  config,
  githubOidcIssuerUrl: github.oidcApi.apiEndpoint,
  githubTokensTableName: github.tokensTable.tableName,
  githubPendingTableName: github.pendingTable.tableName,
  description: `ColtIDE — Cognito auth (${config.stage})`,
});
auth.addDependency(github);

const data = new ColtIDEDataStack(app, `ColtIDEData-${config.stage}`, {
  env,
  config,
  authenticatedRole: auth.authenticatedRole,
  description: `ColtIDE — DynamoDB tables (${config.stage})`,
});

const storage = new ColtIDEStorageStack(app, `ColtIDEStorage-${config.stage}`, {
  env,
  config,
  authenticatedRole: auth.authenticatedRole,
  description: `ColtIDE — S3 share cards bucket (${config.stage})`,
});

const api = new ColtIDEApiStack(app, `ColtIDEApi-${config.stage}`, {
  env,
  config,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
  statsTable: data.statsTable,
  dailyActivityTable: data.dailyActivityTable,
  shareCardsTable: data.shareCardsTable,
  shareCardsBucket: storage.shareCardsBucket,
  githubLinkStartFn: github.linkStartLambda,
  githubGetTokenFn: github.getTokenLambda,
  githubUnlinkFn: github.unlinkLambda,
  connectorsListTokensFn: connectors.listTokensLambda,
  connectorsGetTokenFn: connectors.getTokenLambda,
  connectorsPutTokenFn: connectors.putTokenLambda,
  connectorsDeleteTokenFn: connectors.deleteTokenLambda,
  description: `ColtIDE — API Gateway + Lambdas (${config.stage})`,
});
api.addDependency(connectors);
