const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;

exports.onconnect = async event => {
    console.log('onconnect event:', JSON.stringify(event, null, 2));
    
    try {
      await ddb
        .putItem({
          TableName: process.env.CONNECTIONS_TABLE_NAME,
          Item: {
            MeetingId: { S: event.requestContext.authorizer.MeetingId },
            AttendeeId: { S: event.requestContext.authorizer.AttendeeId },
            ConnectionId: { S: event.requestContext.connectionId },
            TTL: { N: `${oneDayFromNow}` }
          }
        })
        .promise();
    } catch (err) {
      console.error(`error connecting: ${err.message}`);
      return {
        statusCode: 500,
        body: `Failed to connect: ${JSON.stringify(err)}`
      };
    }
    return { statusCode: 200, body: 'Connected.' };
  };