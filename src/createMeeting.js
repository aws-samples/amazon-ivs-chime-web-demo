const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;

exports.handler = async(event, context, callback) => {
    console.log("createMeeting event:", JSON.stringify(event, null, 2));
  
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (err) {
      console.log("createMeeting event > parse payload:", JSON.stringify(err, null, 2));
      response.statusCode = 500;
      response.body = JSON.stringify(err);
      callback(null, response);
      return;
    }
  
  
    if (!payload || !payload.title) {
      console.log("createMeeting event > missing required field: Must provide title");
      response.statusCode = 400;
      response.body = "Must provide title";
      callback(null, response);
      return;
    }
    const title = simplifyTitle(payload.title);
    const region = payload.region || 'us-east-1';
    let meetingInfo = await getMeeting(title);
    if (!meetingInfo) {
      const request = {
        ClientRequestToken: uuid(),
        MediaRegion: region
      };
      console.info('createMeeting event > Creating new meeting: ' + JSON.stringify(request, null, 2));
      meetingInfo = await chime.createMeeting(request).promise();
      await putMeeting(title, meetingInfo);
    }
  
    const joinInfo = {
      JoinInfo: {
        Title: title,
        Meeting: meetingInfo.Meeting,
      },
    };
  
    response.statusCode = 201;
    response.body = JSON.stringify(joinInfo, '', 2);
    
    console.info("createMeeting event > response:", JSON.stringify(response, null, 2));
  
    callback(null, response);
  };