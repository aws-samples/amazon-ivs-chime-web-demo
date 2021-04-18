const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;
exports.sendmessage = async event => {
    console.log('sendmessage event:', JSON.stringify(event, null, 2));
    
    let attendees = {};
    try {
      attendees = await ddb
        .query({
          ExpressionAttributeValues: {
            ':meetingId': { S: event.requestContext.authorizer.MeetingId }
          },
          KeyConditionExpression: 'MeetingId = :meetingId',
          ProjectionExpression: 'ConnectionId',
          TableName: CONNECTIONS_TABLE_NAME
        })
        .promise();
    } catch (e) {
      return { statusCode: 500, body: e.stack };
    }
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`
    });
    const postData = JSON.parse(event.body).data;
    const postCalls = attendees.Items.map(async connection => {
      const connectionId = connection.ConnectionId.S;
      try {
        await apigwManagementApi
          .postToConnection({ ConnectionId: connectionId, Data: postData })
          .promise();
      } catch (e) {
        if (e.statusCode === 410) {
          console.log(`found stale connection, skipping ${connectionId}`);
        } else {
          console.error(
            `error posting to connection ${connectionId}: ${e.message}`
          );
        }
      }
    });
    try {
      await Promise.all(postCalls);
    } catch (e) {
      console.error(`failed to post: ${e.message}`);
      return { statusCode: 500, body: e.stack };
    }
    return { statusCode: 200, body: 'Data sent.' };
  };