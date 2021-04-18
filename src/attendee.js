const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;

exports.attendee = async(event, context, callback) => {
    console.log("attendee event:", JSON.stringify(event, null, 2));
  
    if (!event.queryStringParameters.title || !event.queryStringParameters.attendeeId) {
      console.log("attendee event > missing required fields: Must provide title and attendeeId");
      response.statusCode = 400;
      response.body = "Must provide title and attendeeId";
      callback(null, response);
      return;
    }
  
    const title = simplifyTitle(event.queryStringParameters.title);
    const attendeeId = event.queryStringParameters.attendeeId;
    const attendeeInfo = {
      AttendeeInfo: {
        AttendeeId: attendeeId,
        Name: await getAttendee(title, attendeeId)
      }
    };
  
    response.statusCode = 200;
    response.body = JSON.stringify(attendeeInfo, '', 2);
    
    console.info("attendee event > response:", JSON.stringify(response, null, 2));
  
    callback(null, response);
  };
  
  exports.attendees = async(event, context, callback) => {
    console.log("attendees event:", JSON.stringify(event, null, 2));
  
    if (!event.queryStringParameters.title) {
      console.log("attendees event > missing required fields: Must provide title");
      response.statusCode = 400;
      response.body = "Must provide title";
      callback(null, response);
      return;
    }
  
    const title = simplifyTitle(event.queryStringParameters.title);
    const attendeeInfo = await getAttendees(title);
  
    response.statusCode = 200;
    response.body = JSON.stringify(attendeeInfo, '', 2);
    
    console.info("attendees event > response:", JSON.stringify(response, null, 2));
  
    callback(null, response);
  };