import React, { createRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import * as config from '../../config';
import Error from './Error';

const Join = (props) => {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);

  const inputRef = createRef();
  const baseHref = config.BASE_HREF;

  useEffect(() => {
    const qs = new URLSearchParams(props.location.search);
    const room = qs.get('room');
    setTitle(room);
  });

  const joinRoom = async () => {
    const data = {
      username,
      title,
      role: 'attendee',
    };

    sessionStorage.setItem(`chime[${title}]`, JSON.stringify(data));
    props.history.push(`${baseHref}/meeting?room=${title}`);
  };

  const handleNameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    joinRoom();
  };

  const handleClick = (e) => {
    let node = e.target;
    let isModal = false;
    while (node) {
      if (node && node.classList && node.classList.contains('notice--error')) {
        isModal = true;
        break;
      }
      node = node.parentNode;
    }
    if (!isModal) {
      closeError();
    }
  };

  const closeError = () => {
    setErrorMsg('Something went wrong');
    setShowError(false);
  };

  const joinRoomDisabled = !username;
  return (
    <div className="welcome form-grid" onClick={handleClick}>
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
          <h2 className="mg-b-2">Hey there!</h2>
          <form action="">
            <fieldset className="mg-b-2">
              <input
                type="text"
                placeholder="Your name"
                value={username}
                ref={inputRef}
                onChange={handleNameChange}
              />
              <button
                className="mg-t-1 btn btn--primary"
                disabled={joinRoomDisabled}
                onClick={handleJoinRoom}
              >
                Join room
              </button>
            </fieldset>
          </form>
        </div>
      </div>

      {showError && <Error closeError={closeError} errorMsg={errorMsg} />}
    </div>
  );
};

Join.propTypes = {
  location: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(Join);
