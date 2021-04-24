import * as cdk from '@aws-cdk/core';
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam')
import { CustomResource, Duration } from '@aws-cdk/core';
import apigateway = require('@aws-cdk/aws-apigateway'); 
import apigatewayv2 = require('@aws-cdk/aws-apigatewayv2')
import integrations = require('@aws-cdk/aws-apigatewayv2-integrations')
import { Authorizer } from '@aws-cdk/aws-apigateway';
export class CdkIvsDemoBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const meetingsTable = new dynamodb.Table(this, 'meetings', {
      partitionKey: {
        name: 'Title',
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,            
    });

    meetingsTable.addGlobalSecondaryIndex ({
      indexName: "Passcode",
      partitionKey: {
        name: 'Passcode',
        type: dynamodb.AttributeType.STRING
      }
    });

    const attendeeTable = new dynamodb.Table(this, 'attendees', {
      partitionKey: {
        name: 'AttendeeId',
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const connectionsTable = new dynamodb.Table(this, 'connections', {
      partitionKey: {
        name: 'MeetingId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'AttendeeId',
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const layer = new lambda.LayerVersion(this, 'NodeLayer', {
      code: new lambda.AssetCode('src/lambda_layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      license: 'Apache-2.0',
      description: 'Node Layer',
  });

  const lambdaRole = new iam.Role(this, 'lambdaRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    inlinePolicies: {
      ['chimePolicy']: new iam.PolicyDocument( { statements: [new iam.PolicyStatement({
        resources: ['*'],
        actions: ['chime:*',
                  'lambda:*']})]})
    },
    managedPolicies: [ iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole") ]
  })

  const attendeeLambda = new lambda.Function(this, 'attendeeLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!attendee.js"]}),
    handler: 'attendee.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60),
    layers: [layer]
  });

  const attendeesLambda = new lambda.Function(this, 'attendeesLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!attendees.js"]}),
    handler: 'attendees.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60),
    layers: [layer]
  });

  const authorizeLambda = new lambda.Function(this, 'authorizeLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!authorize.js"]}),
    handler: 'authorize.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60),
    layers: [layer]
  });

  const createMeetingLambda = new lambda.Function(this, 'createMeetingLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!createMeeting.js"]}),
    handler: 'createMeeting.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60)
  });

  const endLambda = new lambda.Function(this, 'endLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!end.js"]}),
    handler: 'end.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60)
  });

  const joinLambda = new lambda.Function(this, 'joinLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!join.js"]}),
    handler: 'join.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60),
    layers: [layer]
  });

  const onConnectLambda = new lambda.Function(this, 'onConnectLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!onConnect.js"]}),
    handler: 'onConnect.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60),
    layers: [layer]
  });

  const onDisonnectLambda = new lambda.Function(this, 'onDisonnectLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!onDisconnect.js"]}),
    handler: 'onDisonnect.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60),
    layers: [layer]
  });

  const sendMessageLambda = new lambda.Function(this, 'sendMessageLambda', {
    code: lambda.Code.fromAsset("src", {exclude: ["**", "!sendMessage.js"]}),
    handler: 'sendMessage.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    environment: {
      ATTENDEES_TABLE_NAME: attendeeTable.tableName,
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      MEETINGS_TABLE_NAME: meetingsTable.tableName,
    },
    role: lambdaRole,
    timeout: Duration.seconds(60),
    layers: [layer]
  });


  const webApi = new apigateway.RestApi(this, 'meetingApi', {
    endpointConfiguration: {
      types: [ apigateway.EndpointType.EDGE ]
    }
  });

  const createMeeting = webApi.root.addResource('meeting');
  const createMeetingIntegration = new apigateway.LambdaIntegration(createMeetingLambda);
  createMeeting.addMethod('POST', createMeetingIntegration);

  const joinMeeting = webApi.root.addResource('join');
  const joinMeetingIntegration = new apigateway.LambdaIntegration(joinLambda);
  joinMeeting.addMethod('POST', joinMeetingIntegration);

  const endMeeting = webApi.root.addResource('end');
  const endMeetingIntegration = new apigateway.LambdaIntegration(endLambda);
  endMeeting.addMethod('POST', endMeetingIntegration);

  const attendee = webApi.root.addResource('attendee');
  const attendeeIntegration = new apigateway.LambdaIntegration(attendeeLambda);
  attendee.addMethod('GET', attendeeIntegration);

  const attendees = webApi.root.addResource('attendees');
  const attendeesIntegration = new apigateway.LambdaIntegration(attendeesLambda);
  attendees.addMethod('GET', attendeesIntegration);


  const webSocketApi = new apigatewayv2.WebSocketApi(this, 'webSocketAPI', {
    connectRouteOptions: { integration: new integrations.LambdaWebSocketIntegration({ handler: onConnectLambda }) },
    disconnectRouteOptions: { integration: new integrations.LambdaWebSocketIntegration({ handler: onDisonnectLambda }) },
  });

  const webSocketApiStage = new apigatewayv2.WebSocketStage(this, 'apiStage', {
    webSocketApi,
    stageName: 'Prod',
    autoDeploy: true,
  });

  webSocketApi.addRoute('sendmessage', {
    integration: new integrations.LambdaWebSocketIntegration({
      handler: sendMessageLambda}
    )
  })

  new apigatewayv2.CfnAuthorizer(this, "authorizer", {
    apiId: webSocketApi.apiId,
    name: "LambdaAuthorizer",
    authorizerType: "REQUEST",
    authorizerUri: "arn:aws:apigateway:" + this.region + ":lambda:path/2015-03-31/functions/" + authorizeLambda.functionArn + "/invocations",
    identitySource: [
      "route.request.querystring.MeetingId",
      "route.request.querystring.AttendeeId",
      "route.request.querystring.JoinToken"
    ],
  })

attendeeTable.grantReadWriteData(attendeeLambda)
attendeeTable.grantReadWriteData(attendeesLambda)
attendeeTable.grantReadWriteData(createMeetingLambda)
attendeeTable.grantReadWriteData(endLambda)
attendeeTable.grantReadWriteData(joinLambda)

meetingsTable.grantReadWriteData(attendeeLambda)
meetingsTable.grantReadWriteData(attendeesLambda)
meetingsTable.grantReadWriteData(createMeetingLambda)
meetingsTable.grantReadWriteData(endLambda)
meetingsTable.grantReadWriteData(joinLambda)

connectionsTable.grantReadWriteData(onDisonnectLambda)
connectionsTable.grantReadWriteData(onConnectLambda)
connectionsTable.grantReadWriteData(authorizeLambda)
connectionsTable.grantReadWriteData(sendMessageLambda)

new cdk.CfnOutput(this, 'apiGateway', { value: webApi.url })
new cdk.CfnOutput(this, 'webSocketGateway', { value: webSocketApi.apiEndpoint + webSocketApiStage.stageName})
}
};
