import React, { useState, useEffect, createRef } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import * as config from '../../config';
import Error from './Error';

const Welcome = ({ location, history }) => {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [playbackURL, setPlaybackURL] = useState(config.DEFAULT_VIDEO_STREAM);
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);

  const baseHref = config.BASE_HREF;
  const inputRef = createRef();

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const action = qs.get('action');
    if (action === 'join') {
      const title = qs.get('room');
      history.push(`${baseHref}/join?room=${title}`);
    }
    inputRef.current.focus();
  }, []);

  const handleNameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleRoomChange = (e) => {
    setTitle(e.target.value);
  };

  const handlePlaybackURLChange = (e) => {
    setPlaybackURL(e.target.value);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      createRoom();
    } catch (error) {
      handleErrorMsg(errorMsg);
    }
  };

  const handleErrorMsg = (errorMsg) => {
    setErrorMsg(errorMsg);
    setShowError(true);
  };

  const createRoom = async () => {
    const data = {
      username,
      title,
      playbackURL,
      role: 'host',
    };
    sessionStorage.setItem(`chime[${title}]`, JSON.stringify(data));
    history.push(`${baseHref}/meeting?room=${title}`);
  };

  const createRoomDisabled = !username || !title || !playbackURL;
  return (
    <React.Fragment>
      <div className="welcome form-grid">
        <div className="welcome__intro">
          <div className="intro__inner formatted-text">
            <h1>Amazon IVS with ChimeSDK</h1>
            <h3>
              Create or join rooms, and watch Amazon IVS streams with anyone.
            </h3>
          </div>
        </div>

        <div className="welcome__content pd-4">
          <div className="content__inner">
            <h2 className="mg-b-2">Get started</h2>
            <form action="">
              <fieldset className="mg-b-2">
                <input
                  className="mg-b-2"
                  type="text"
                  placeholder="Your name"
                  value={username}
                  ref={inputRef}
                  onChange={handleNameChange}
                />
                <input
                  type="text"
                  placeholder="Room name"
                  value={title}
                  onChange={handleRoomChange}
                />
                <input
                  type="text"
                  placeholder="Playback URL"
                  value={playbackURL}
                  onChange={handlePlaybackURLChange}
                />
                <button
                  className="mg-t-2 btn btn--primary"
                  disabled={createRoomDisabled}
                  onClick={handleCreateRoom}
                >
                  Create room
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
      {showError && (
        <Error closeError={() => showError(false)} errorMsg={errorMsg} />
      )}
    </React.Fragment>
  );
};

Welcome.propTypes = {
  history: PropTypes.object,
  location: PropTypes.object,
};

export default withRouter(Welcome);
