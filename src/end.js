const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;

exports.handler = async(event, context, callback) => {
    console.log("end event:", JSON.stringify(event, null, 2));
  
    if (!event.queryStringParameters.title) {
      console.log("end event > missing required fields: Must provide title");
      response.statusCode = 400;
      response.body = "Must provide title";
      callback(null, response);
      return;
    }
  
    const title = simplifyTitle(event.queryStringParameters.title);
  
    response.statusCode = 200;
    response.body = JSON.stringify(endMeeting(title));
    
    console.info("end event > response:", JSON.stringify(response, null, 2));
  
    callback(null, response);
  };