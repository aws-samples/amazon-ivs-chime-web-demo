import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const Controls = (props) => {
  const [muted, setMuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState('Disabled');
  const [spinning, setSpinning] = useState(false);

  const callback = (localMuted) => {
    setMuted(localMuted);
  };

  useEffect(() => {
    props.chime.audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(callback);
    return function cleanup() {
      if (props && props.chime.audioVideo) {
        props.chime.audioVideo.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(
          callback,
        );
      }
    };
  }, []);

  const muteButtonOnClick = async () => {
    if (muted) {
      props.chime.audioVideo.realtimeUnmuteLocalAudio();
    } else {
      props.chime.audioVideo.realtimeMuteLocalAudio();
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  };

  const videoButtonOnClick = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (videoStatus === 'Disabled') {
      setVideoStatus('Loading');
      try {
        if (!props.chime.currentVideoInputDevice) {
          throw new Error('currentVideoInputDevice does not exist');
        }

        try {
          await props.chime.chooseVideoInputDevice(
            props.chime.currentVideoInputDevice,
          );
        } catch (err) {
          const videoInputDevices =
            await props.chime.audioVideo.listVideoInputDevices();
          await props.chime.audioVideo.chooseVideoInputDevice(
            videoInputDevices[0].deviceId,
          );
        }

        props.chime.audioVideo.startLocalVideoTile();
        setVideoStatus('Enabled');
      } catch (error) {
        // eslint-disable-next-line
        console.error(error);
        setVideoStatus('Disabled');
      }
    } else if (videoStatus === 'Enabled') {
      setVideoStatus('Loading');
      props.chime.meetingSession.audioVideo.stopLocalVideoTile();
      setVideoStatus('Disabled');
    }
  };

  const endButtonOnClick = async () => {
    setSpinning(true);
    await props.chime.leaveRoom(props.role === 'host');
    sessionStorage.removeItem(props.ssName);
    const whereTo = `${props.baseHref}/${
      props.role === 'host' ? '' : 'join?room=' + props.title
    }`;
    props.history.push(whereTo);
    setSpinning(false);
  };

  const mic_controls = muted
    ? 'controls__btn--mic_on'
    : 'controls__btn--mic_off';
  const cam_controls =
    videoStatus === 'Enabled'
      ? 'controls__btn--cam_off'
      : 'controls__btn--cam_on';
  return (
    <div className="controls pos-relative">
      {/* <!-- on click, toggle this control between .controls__btn--mic_on and .controls__btn--mic_off --> */}
      <button
        className={`controls__btn ${mic_controls} btn rounded btn--mic`}
        onClick={muteButtonOnClick}
      >
        <svg
          className="btn__svg btn__svg--mic_on"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.24 19 14.42 19 11H17.3Z"
            fill="white"
          />
        </svg>
        <svg
          className="btn__svg btn__svg--mic_off"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 11H17.3C17.3 11.74 17.14 12.43 16.87 13.05L18.1 14.28C18.66 13.3 19 12.19 19 11ZM14.98 11.17C14.98 11.11 15 11.06 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V5.18L14.98 11.17ZM4.27 3L3 4.27L9.01 10.28V11C9.01 12.66 10.34 14 12 14C12.22 14 12.44 13.97 12.65 13.92L14.31 15.58C13.6 15.91 12.81 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C13.91 17.59 14.77 17.27 15.54 16.82L19.73 21L21 19.73L4.27 3Z"
            fill="white"
          />
        </svg>
      </button>
      {/* <!-- on click, toggle this control between .controls__btn--cam_on and .controls__btn--cam_off --> */}
      <button
        className={`controls__btn ${cam_controls} btn rounded btn--cam`}
        onClick={videoButtonOnClick}
      >
        <svg
          className="btn__svg btn__svg--cam_on"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z"
            fill="white"
          />
        </svg>
        <svg
          className="btn__svg btn__svg--cam_off"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 6.5L17 10.5V7C17 6.45 16.55 6 16 6H9.82L21 17.18V6.5ZM3.27 2L2 3.27L4.73 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.21 18 16.39 17.92 16.54 17.82L19.73 21L21 19.73L3.27 2Z"
            fill="white"
          />
        </svg>
      </button>
      <button
        className="controls__btn btn rounded btn--settings"
        onClick={props.openSettings}
      >
        <svg
          className="btn__svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19.1401 12.936C19.1761 12.636 19.2001 12.324 19.2001 12C19.2001 11.676 19.1761 11.364 19.1281 11.064L21.1561 9.48002C21.3361 9.33602 21.3841 9.07202 21.2761 8.86802L19.3561 5.54402C19.2361 5.32802 18.9841 5.25602 18.7681 5.32802L16.3801 6.28802C15.8761 5.90402 15.3481 5.59202 14.7601 5.35202L14.4001 2.80802C14.3641 2.56802 14.1601 2.40002 13.9201 2.40002H10.0801C9.84011 2.40002 9.64811 2.56802 9.61211 2.80802L9.25211 5.35202C8.66411 5.59202 8.12411 5.91602 7.63211 6.28802L5.24411 5.32802C5.02811 5.24402 4.77611 5.32802 4.65611 5.54402L2.73611 8.86802C2.61611 9.08402 2.66411 9.33602 2.85611 9.48002L4.88411 11.064C4.83611 11.364 4.80011 11.688 4.80011 12C4.80011 12.312 4.82411 12.636 4.87211 12.936L2.84411 14.52C2.66411 14.664 2.61611 14.928 2.72411 15.132L4.64411 18.456C4.76411 18.672 5.01611 18.744 5.23211 18.672L7.62011 17.712C8.12411 18.096 8.65211 18.408 9.24011 18.648L9.60011 21.192C9.64811 21.432 9.84011 21.6 10.0801 21.6H13.9201C14.1601 21.6 14.3641 21.432 14.3881 21.192L14.7481 18.648C15.3361 18.408 15.8761 18.084 16.3681 17.712L18.7561 18.672C18.9721 18.756 19.2241 18.672 19.3441 18.456L21.2641 15.132C21.3841 14.916 21.3361 14.664 21.1441 14.52L19.1401 12.936ZM12.0001 15.6C10.0201 15.6 8.40011 13.98 8.40011 12C8.40011 10.02 10.0201 8.40002 12.0001 8.40002C13.9801 8.40002 15.6001 10.02 15.6001 12C15.6001 13.98 13.9801 15.6 12.0001 15.6Z" />
        </svg>
      </button>
      <button
        className="controls__btn btn rounded btn--leave btn--destruct"
        onClick={endButtonOnClick}
      >
        {spinning ? (
          <div className="spinner" />
        ) : (
          <svg
            className="btn__svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 9C10.4 9 8.85 9.25 7.4 9.72V12.82C7.4 13.21 7.17 13.56 6.84 13.72C5.86 14.21 4.97 14.84 4.18 15.57C4 15.75 3.75 15.85 3.48 15.85C3.2 15.85 2.95 15.74 2.77 15.56L0.29 13.08C0.11 12.91 0 12.66 0 12.38C0 12.1 0.11 11.85 0.29 11.67C3.34 8.78 7.46 7 12 7C16.54 7 20.66 8.78 23.71 11.67C23.89 11.85 24 12.1 24 12.38C24 12.66 23.89 12.91 23.71 13.09L21.23 15.57C21.05 15.75 20.8 15.86 20.52 15.86C20.25 15.86 20 15.75 19.82 15.58C19.03 14.84 18.13 14.22 17.15 13.73C16.82 13.57 16.59 13.23 16.59 12.83V9.73C15.15 9.25 13.6 9 12 9Z" />
          </svg>
        )}
      </button>
    </div>
  );
};

Controls.propTypes = {
  chime: PropTypes.object,
  baseHref: PropTypes.string,
  ssName: PropTypes.string,
  title: PropTypes.string,
  openSettings: PropTypes.func,
  role: PropTypes.string,
  history: PropTypes.object,
  myVideoElement: PropTypes.object,
};

export default Controls;
