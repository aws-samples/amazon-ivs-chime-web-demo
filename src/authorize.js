const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;

exports.handler = async (event, context, callback) => {
    console.log('authorize event:', JSON.stringify(event, null, 2));
  
    const generatePolicy = (principalId, effect, resource, context) => {
      const authResponse = {};
      authResponse.principalId = principalId;
      if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
      }
      authResponse.context = context;
      return authResponse;
    };
    let passedAuthCheck = false;
    if (
      !!event.queryStringParameters.MeetingId &&
      !!event.queryStringParameters.AttendeeId &&
      !!event.queryStringParameters.JoinToken
    ) {
      try {
        let attendeeInfo = await chime
          .getAttendee({
            MeetingId: event.queryStringParameters.MeetingId,
            AttendeeId: event.queryStringParameters.AttendeeId
          })
          .promise();
        if (
          attendeeInfo.Attendee.JoinToken ===
          event.queryStringParameters.JoinToken
        ) {
          passedAuthCheck = true;
        } else if (strictVerify) {
          console.error('failed to authenticate with join token');
        } else {
          passedAuthCheck = true;
          console.warn(
            'failed to authenticate with join token (skipping due to strictVerify=false)'
          );
        }
      } catch (e) {
        if (strictVerify) {
          console.error(`failed to authenticate with join token: ${e.message}`);
        } else {
          passedAuthCheck = true;
          console.warn(
            `failed to authenticate with join token (skipping due to strictVerify=false): ${e.message}`
          );
        }
      }
    } else {
      console.error('missing MeetingId, AttendeeId, JoinToken parameters');
    }
    return generatePolicy(
      'me',
      passedAuthCheck ? 'Allow' : 'Deny',
      event.methodArn,
      {
        MeetingId: event.queryStringParameters.MeetingId,
        AttendeeId: event.queryStringParameters.AttendeeId
      }
    );
  };
  