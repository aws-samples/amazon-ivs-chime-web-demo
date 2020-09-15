# Amazon IVS + Chime Demo

## Prerequisites 

* Access to AWS Account with permission to create IAM role, DynamoDB, Lambda, API Gateway, S3, and Cloudformation.
* [AWS CLI Version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)

## Deploy from your local machine

Before you start, run below command to make sure you're in the correct AWS account and configured.
```
aws configure
```
For additional help on configuring, please see https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html

### 1. Create an S3 bucket

* Replace `<my-bucket-name>` with your bucket name.
* Replace `<my-region>` with your region name.

```
aws s3api create-bucket --bucket <my-bucket-name> --region <my-region> \
--create-bucket-configuration LocationConstraint=<my-region>
```

### 2. Pack template with SAM

```
sam package \
--template-file template.yaml \
--output-template-file packaged.yaml \
--s3-bucket <my-bucket-name>
```
DO NOT run the output from above command, proceed to next step.

### 3. Deploy Cloudformation with SAM

Replace `<my-stack-name>` with your stack name.

```
sam deploy \
--template-file packaged.yaml \
--stack-name <my-stack-name> \
--capabilities CAPABILITY_IAM
```
On completion, copy the value of `ApiURL` and `WebSocketURI` as you will need it later for your client.

Example of ApiURL: `https://xxxxxxxxxx.execute-api.us-west-2.amazonaws.com/Prod/`<br />
Example of WebSocketURI: `wss://xxxxxxxxxx.execute-api.us-west-2.amazonaws.com/Prod`

To retrieve Cloudformation stack outputs again, run below command:
```
aws cloudformation describe-stacks \
--stack-name <my-stack-name> --query 'Stacks[].Outputs'
```

## Rest API

### Create a Room

Endpoint: `<ApiURL>join`<br />
Method: POST<br />
Content Type: JSON<br />
Payload:
```
{
    "title": "My-Room-Title",
    "name": "My-Name",
    "playbackURL": "My-Video-Link"
    "role": "host"
}
```
Response Code: 200<br />
Response Body:
```
{
  "JoinInfo": {
    "Title": "My-Room-Title",
    "PlaybackURL": "My-PlaybackURL",
    "Meeting": {
      "MeetingId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "MediaPlacement": {
        "AudioHostUrl": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.k.m3.ue1.app.chime.aws:3478",
        "AudioFallbackUrl": "wss://haxrp.m3.ue1.app.chime.aws:443/calls/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "ScreenDataUrl": "wss://bitpw.m3.ue1.app.chime.aws:443/v2/screen/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "ScreenSharingUrl": "wss://bitpw.m3.ue1.app.chime.aws:443/v2/screen/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "ScreenViewingUrl": "wss://bitpw.m3.ue1.app.chime.aws:443/ws/connect?passcode=null&viewer_uuid=null&X-BitHub-Call-Id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "SignalingUrl": "wss://signal.m3.ue1.app.chime.aws/control/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "TurnControlUrl": "https://ccp.cp.ue1.app.chime.aws/v2/turn_sessions"
      },
      "MediaRegion": "us-east-1"
    },
    "Attendee": {
      "ExternalUserId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "AttendeeId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "JoinToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  }
}
```

### Join a Room

Endpoint: `<ApiURL>join`<br />
Method: POST<br />
Content Type: JSON<br />
Payload:
```
{
    "title": "My-Room-Title",
    "name": "My-Name",
    "role": "attendee"
}
```
Response Code: 200<br />
Response Body: similar to above response

### Get a List of Attendees

Endpoint: `<ApiURL>attendees?title=<My-Room-Title>`<br />
Method: GET<br />
Content Type: JSON<br />
Response Code: 200<br />
Response Body: 
```
[
    {
        "Name": "User-1"
        "AttendeeId": "My-Room-Title/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    },
    {
        "Name": "User-2"
        "AttendeeId": "My-Room-Title/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
]
```

### Get an Attendee

Endpoint: `<ApiURL>attendee?title=<My-Room-Title>&attendeeId=<Attendee-Id>`<br />
Method: GET<br />
Content Type: JSON<br />
Response: 200

### Delete a Room

Endpoint: `<ApiURL>end?title=<My-Room-Title>`<br />
Method: POST<br />
Content Type: JSON<br />
Response: 200

## Websocket API

```
    const connection = new WebSocket("<WebSocketURI>?MeetingId=<replace-me>&AttendeeId=<replace-me>&JoinToken=<replace-me>");

    onnection.onopen = (event) => {
        console.log("WebSocket is open now.");
    };

    connection.onclose = (event) => {
        console.log("WebSocket is closed now.");
    };

    connection.onerror = (event) => {
        console.error("WebSocket error observed:", event);
    };

    // Incoming message
    connection.onmessage = (event) => {
        // DO SOMETHING...
    };

    // Send a message
    var myMessage = `{
        "message": "sendmessage",
        "data": "<My-Message>"
    }`;
    connection.send(myMessage);
```

## Deploy UI for Amazon IVS + Chime Demo

Follow these [detailed instructions](../web-ui) on how to get the UI running.

## Clean Up

1. Delete Cloudformation stack:
```
aws cloudformation delete-stack --stack-name <my-stack-name>
```

3. Remove files in S3 bucket
```
aws s3 rm s3://<my-bucket-name> --recursive
```

2. Delete S3 bucket
```
aws s3api delete-bucket --bucket <my-bucket-name> --region <my-region>
```