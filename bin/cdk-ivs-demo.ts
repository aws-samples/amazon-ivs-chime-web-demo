#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkIvsDemoBackendStack } from '../lib/cdk-ivs-demo-backend-stack';
import { CdkIvsDemoFrontendStack } from '../lib/cdk-ivs-demo-frontend-stack';

const app = new cdk.App();

new CdkIvsDemoBackendStack(app, 'CdkIvsDemoBackendStack', {});
new CdkIvsDemoFrontendStack(app, 'CdkIvsDemoFrontendStack', {});
