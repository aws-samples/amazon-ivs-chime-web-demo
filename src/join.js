const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const { CONNECTIONS_TABLE_NAME, MEETINGS_TABLE_NAME, ATTENDEES_TABLE_NAME } = process.env;
const chime = new AWS.Chime({ region: 'us-east-1' }); // Must be in us-east-1
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const strictVerify = true;

exports.join = async(event, context, callback) => {
    console.log("join event:", JSON.stringify(event, null, 2));
  
    let payload;
  
    try {
      payload = JSON.parse(event.body);
    } catch (err) {
      console.log("join event > parse payload:", JSON.stringify(err, null, 2));
      response.statusCode = 500;
      response.body = JSON.stringify(err);
      callback(null, response);
      return;
    }
  
    if (!payload || !payload.title || !payload.name) {
      console.log("join > missing required fields: Must provide title and name");
      response.statusCode = 400;
      response.body = "Must provide title and name";
      callback(null, response);
      return;
    }
    
    if (payload.role === 'host' && !payload.playbackURL) {
      console.log("join > missing required field: Must provide playbackURL");
      response.statusCode = 400;
      response.body = "Must provide playbackURL";
      callback(null, response);
      return;
    }
  
    const title = simplifyTitle(payload.title);
    const name = payload.name;
    const region = payload.region || 'us-east-1';
    let meetingInfo = await getMeeting(title);
  
    // If meeting does not exist and role equal to "host" then create meeting room
    if (!meetingInfo && payload.role === 'host') {
      const request = {
        ClientRequestToken: uuid(),
        MediaRegion: region
      };
      console.info('join event > Creating new meeting: ' + JSON.stringify(request, null, 2));
      meetingInfo = await chime.createMeeting(request).promise();
      meetingInfo.PlaybackURL = payload.playbackURL;
      await putMeeting(title, payload.playbackURL, meetingInfo);
    }
  
    console.info("join event > meetingInfo:", JSON.stringify(meetingInfo, null, 2));
  
    console.info('join event > Adding new attendee');
    const attendeeInfo = (await chime.createAttendee({
        MeetingId: meetingInfo.Meeting.MeetingId,
        ExternalUserId: uuid(),
      }).promise());
  
    console.info("join event > attendeeInfo:", JSON.stringify(attendeeInfo, null, 2));
  
    putAttendee(title, attendeeInfo.Attendee.AttendeeId, name);
  
    const joinInfo = {
      JoinInfo: {
        Title: title,
        PlaybackURL: meetingInfo.PlaybackURL,
        Meeting: meetingInfo.Meeting,
        Attendee: attendeeInfo.Attendee
      },
    };
  
    console.info("join event > joinInfo:", JSON.stringify(joinInfo, null, 2));
  
    response.statusCode = 200;
    response.body = JSON.stringify(joinInfo, '', 2);
    
    console.info("join event > response:", JSON.stringify(response, null, 2));
  
    callback(null, response);
  };
  
  