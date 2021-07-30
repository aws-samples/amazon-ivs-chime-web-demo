import React, { useState, useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import * as config from '../../config';

import { MeetingSessionStatusCode } from 'amazon-chime-sdk-js';

// Components
import VideoPlayer from '../videoPlayer/VideoPlayer';
import Chat from '../chat/Chat';
import Controls from './Controls';
import Settings from './Settings';
import LocalVideo from './LocalVideo';
import RemoteVideoGroup from './RemoteVideoGroup';
import Error from './Error';

// Styles
import './ChimeWeb.css';

const Meeting = ({ chime, history, location }) => {
  const [meetingStatus, setMeetingStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showError, setShowError] = useState();
  const [errorMsg, setErrorMsg] = useState();
  const [ssName, setSSName] = useState('');
  const [playbackURL, setPlaybackURL] = useState('');
  const [joinInfo, setJoinInfo] = useState('');
  const [ssData, setSSData] = useState('');

  const baseHref = config.BASE_HREF;
  const audioElementRef = useRef();
  const myVideoElement = useRef();

  useEffect(() => {
    const start = async () => {
      try {
        const qs = new URLSearchParams(location.search);
        const room = qs.get('room');
        const ssNameChime = `chime[${room}]`;
        setSSName(ssNameChime);
        if (!room || !sessionStorage.getItem(ssNameChime)) {
          history.push(`${baseHref}/`);
        }

        const ssDataChime = JSON.parse(sessionStorage.getItem(ssNameChime));
        if (config.DEBUG) console.log(ssDataChime);

        const { username, title, role } = ssDataChime;
        setSSData(ssDataChime);

        if (!ssDataChime.joinInfo) {
          const joinInfoRoom = await chime.createRoom(
            role,
            username,
            title,
            ssDataChime.playbackURL,
          );
          const data = {
            ...ssDataChime,
            joinInfo: joinInfoRoom,
          };
          sessionStorage.setItem(ssNameChime, JSON.stringify(data));
          setJoinInfo(joinInfoRoom);
          setPlaybackURL(joinInfoRoom.PlaybackURL);
        } else {
          // Browser refresh
          const joinInfoRoom = ssDataChime.joinInfo;
          await chime.reInitializeMeetingSession(joinInfoRoom, username);
          setJoinInfo(joinInfoRoom);
          setPlaybackURL(ssDataChime.joinInfo.PlaybackURL);
        }
        setMeetingStatus('Success');

        chime.audioVideo.addObserver({
          audioVideoDidStop: async (sessionStatus) => {
            if (
              sessionStatus.statusCode() ===
              MeetingSessionStatusCode.AudioCallEnded
            ) {
              const whereTo = `${baseHref}/${role === 'host' ? '' : 'end'}`;
              chime.leaveRoom(role === 'host');
              history.push(whereTo);
            }
          },
        });

        await chime.joinRoom(audioElementRef.current);
      } catch (error) {
        // eslint-disable-next-line
        console.log('error', error);
        setShowError(true);
        setErrorMsg(error.message);
        setMeetingStatus('Failed');
      }
    };
    start();
  }, []);

  /*
   * Settings
   */
  const handleClick = (e) => {
    if (showSettings) {
      let node = e.target;
      let isModal = false;
      while (node) {
        if (node && node.classList && node.classList.contains('modal__el')) {
          isModal = true;
          break;
        }
        node = node.parentNode;
      }
      if (!isModal) {
        setShowSettings(true);
      }
    }
  };

  const saveSettings = (
    currentAudioInputDevice,
    currentAudioOutputDevice,
    currentVideoInputDevice,
  ) => {
    chime.chooseCurrentVideoInputDevice = currentVideoInputDevice;
    chime.chooseCurrentAudioinputDevice = currentAudioInputDevice;
    chime.chooseCurrentAudioOutputDevice = currentAudioOutputDevice;

    setShowSettings(false);
  };

  const layout = () => {
    if (meetingStatus !== 'Success') {
      return;
    }

    return (
      <div className="app-grid" onClick={handleClick}>
        <div className="main-stage">
          <div className="cams pos-relative">
            <LocalVideo chime={chime} joinInfo={joinInfo} />
            <RemoteVideoGroup chime={chime} joinInfo={joinInfo} />
          </div>
          <VideoPlayer
            setMetadataId={(metadataId) => (this.metadataId = metadataId)}
            videoStream={playbackURL}
          />
          <Controls
            chime={chime}
            baseHref={baseHref}
            ssName={ssName}
            title={ssData.title}
            openSettings={() => setShowSettings(true)}
            role={ssData.role}
            history={history}
            myVideoElement={myVideoElement.current}
          />
        </div>
        <Chat
          chime={chime}
          title={ssData.title}
          username={ssData.username}
          joinInfo={joinInfo}
        />
        {showSettings && (
          <Settings
            chime={chime}
            joinInfo={joinInfo}
            saveSettings={saveSettings}
            closeSettings={() => setShowSettings(false)}
          />
        )}
      </div>
    );
  };

  return (
    <React.Fragment>
      <audio ref={audioElementRef} style={{ display: 'none' }} />

      {layout()}

      {showError && (
        <Error closeError={() => setShowError(false)} errorMsg={errorMsg} />
      )}
    </React.Fragment>
  );
};

Meeting.propTypes = {
  chime: PropTypes.object,
  history: PropTypes.object,
  location: PropTypes.object,
};

export default withRouter(Meeting);
