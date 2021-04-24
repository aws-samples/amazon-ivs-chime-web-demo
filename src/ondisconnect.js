const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;
exports.handler = async event => {
    console.log('ondisconnect event:', JSON.stringify(event, null, 2));
    
    try {
      await ddb
        .deleteItem({
          TableName: process.env.CONNECTIONS_TABLE_NAME,
          Key: {
            MeetingId: { S: event.requestContext.authorizer.MeetingId },
            AttendeeId: { S: event.requestContext.authorizer.AttendeeId },
          },
        })
        .promise();
    } catch (err) {
      return {
        statusCode: 500,
        body: `Failed to disconnect: ${JSON.stringify(err)}`
      };
    }
    return { statusCode: 200, body: 'Disconnected.' };
  };