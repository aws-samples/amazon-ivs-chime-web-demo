#!/bin/bash
set -e

if [ -f "cdk.context.json" ]; then
    echo ""
    echo "INFO: Removing cdk.context.json"
    rm cdk.context.json
else
    echo ""
    echo "INFO: cdk.context.json not present, nothing to remove"
fi
if [ ! -f "package-lock.json" ]; then
    echo ""
    echo "Installing Packages"
    echo ""
    npm install
fi
if [ ! -d "web-ui/build" ]; then
    echo ""
    echo "Creating web-ui/build directory"
    echo ""
    mkdir web-ui/build
fi
echo ""
echo "Building CDK"
echo ""
npm run build
echo ""
echo "Deploying Back End"
echo ""
cdk deploy CdkIvsDemoBackendStack -O web-ui/src/cdk-outputs.json
echo ""
echo "Building React App"
echo ""
cd web-ui
if [ ! -f "package-lock.json" ]; then
    echo ""
    echo "Installing Packages"
    echo ""
    npm install --legacy-peer-deps
fi
npm run build
cd -
echo ""
echo "Deploying Front End"
echo ""
cdk deploy CdkIvsDemoFrontendStack
