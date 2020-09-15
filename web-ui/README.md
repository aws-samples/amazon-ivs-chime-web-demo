# Amazon IVS + Chime Demo

## Prerequisites

* [NodeJS](https://nodejs.org/)
* Npm is installed with Node.js
* Amazon IVS + Chime back-end (Please refer to the [serverless REAMDE](../serverless) for details on back-end configuration).

## Running the demo

To get the web demo running, follow these instructions:

1. [Install NodeJS](https://nodejs.org/). Download latest LTS version ("Recommended for Most Users")
2. Navigate to the web-ui project directory on your local computer.
   Example: `~/Developer/amazon-ivs-chime-web-demo/web-ui`
3. Run: npm install
4. Run: npm start
5. Open your web-browser and enter the URL: http://localhost:3000/

## Configuration

The following entries in `src/config.js` (inside the web-ui project directory) are used for this demo

* `CHIME_ROOM_API`
  - API endpoint for retrieving the attendees list, joining the room, and ending the room

* `CHIME_ROOM_MAX_ATTENDEE` (default 16)
  - Chime-SDK allows up to 16 attendee videos

* `DEFAULT_VIDEO_STREAM`
  - Default video stream to play inside the video player

* `CHAT_WEBSOCKET`
  - Default WebSocket server URL for the chat

* `CHIME_LOG_LEVEL` (default WARN)
  - Chime-SDK logging level: INFO, WARN, ERROR, DEBUG

* `DEBUG` (default false)
  - Chime-Web UI debug logging: true / false

 --------------------------------------------------

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
