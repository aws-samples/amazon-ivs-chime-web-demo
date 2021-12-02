import React, { useEffect, createRef } from 'react';
import PropTypes from 'prop-types';
import * as config from '../../config';

const VideoPlayer = (props) => {
  const videoElement = createRef();

  useEffect(() => {
    const mediaPlayerScript = document.createElement('script');
    mediaPlayerScript.src =
      'https://player.live-video.net/1.6.1/amazon-ivs-player.min.js';
    mediaPlayerScript.async = true;
    mediaPlayerScript.onload = () => mediaPlayerScriptLoaded();
    document.body.appendChild(mediaPlayerScript);
  }, []);

  const mediaPlayerScriptLoaded = () => {
    // This shows how to include the Amazon IVS Player with a script tag from our CDN
    // If self hosting, you may not be able to use the create() method since it requires
    // that file names do not change and are all hosted from the same directory.

    const MediaPlayerPackage = window.IVSPlayer;

    const playerOverlay = document.getElementById('overlay');
    const btnPlay = document.getElementById('play');
    const btnMute = document.getElementById('mute');

    // First, check if the browser supports the Amazon IVS player.
    if (!MediaPlayerPackage.isPlayerSupported) {
      console.warn(
        'The current browser does not support the Amazon IVS player.',
      );
      return;
    }

    const PlayerState = MediaPlayerPackage.PlayerState;
    const PlayerEventType = MediaPlayerPackage.PlayerEventType;

    // Initialize player
    const player = MediaPlayerPackage.create();
    player.attachHTMLVideoElement(document.getElementById('video-player'));

    // Attach event listeners
    player.addEventListener(PlayerState.PLAYING, function () {
      if (config.DEBUG) console.log('Player State - PLAYING');
    });
    player.addEventListener(PlayerState.ENDED, function () {
      if (config.DEBUG) console.log('Player State - ENDED');
    });
    player.addEventListener(PlayerState.READY, function () {
      if (config.DEBUG) console.log('Player State - READY');
    });
    player.addEventListener(PlayerEventType.ERROR, function (err) {
      if (config.DEBUG) console.warn('Player Event - ERROR:', err);
    });

    player.addEventListener(PlayerEventType.TEXT_METADATA_CUE, function (cue) {
      const metadataText = cue.text;
      const position = player.getPosition().toFixed(2);
      if (config.DEBUG)
        console.log(
          `Player Event - TEXT_METADATA_CUE: "${metadataText}". Observed ${position}s after playback started.`,
        );
    });

    // Setup stream and play
    player.setAutoplay(true);
    player.load(props.videoStream);

    // Setvolume
    player.setVolume(0.1);

    // Show/Hide player controls
    playerOverlay.addEventListener(
      'mouseover',
      function (e) {
        playerOverlay.classList.add('overlay--hover');
      },
      false,
    );
    playerOverlay.addEventListener('mouseout', function (e) {
      playerOverlay.classList.remove('overlay--hover');
    });

    // Controls events
    // Play/Pause
    btnPlay.addEventListener(
      'click',
      function (e) {
        if (btnPlay.classList.contains('player-btn--play')) {
          // change to pause
          btnPlay.classList.remove('player-btn--play');
          btnPlay.classList.add('player-btn--pause');
          player.pause();
        } else {
          // change to play
          btnPlay.classList.remove('player-btn--pause');
          btnPlay.classList.add('player-btn--play');
          player.play();
        }
      },
      false,
    );

    // Mute/Unmute
    btnMute.addEventListener(
      'click',
      function (e) {
        if (btnMute.classList.contains('player-btn--mute')) {
          btnMute.classList.remove('player-btn--mute');
          btnMute.classList.add('player-btn--unmute');
          player.setMuted(1);
        } else {
          btnMute.classList.remove('player-btn--unmute');
          btnMute.classList.add('player-btn--mute');
          player.setMuted(0);
        }
      },
      false,
    );
  };

  return (
    <div className="player-wrapper pos-relative">
      <div className="aspect-spacer"></div>
      <div className="pos-absolute full-width full-height top-0">
        <div id="overlay" className="overlay">
          <div id="player-controls">
            <div className="player-controls__inner">
              <button
                id="play"
                className="mg-x-1 player-btn player-btn--icon player-btn--play"
              >
                <svg
                  className="player-icon player-icon--play"
                  xmlns="http://www.w3.org/2000/svg"
                  height="36"
                  viewBox="0 0 24 24"
                  width="36"
                >
                  <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                </svg>
                <svg
                  className="player-icon player-icon--pause"
                  xmlns="http://www.w3.org/2000/svg"
                  height="36"
                  viewBox="0 0 24 24"
                  width="36"
                >
                  <path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z" />
                </svg>
              </button>
              <button
                id="mute"
                className="mg-x-1 player-btn player-btn--icon player-btn--unmute"
              >
                <svg
                  className="player-icon player-icon--volume_up"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85z" />
                </svg>
                <svg
                  className="player-icon player-icon--volume_off"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path d="M3.63 3.63c-.39.39-.39 1.02 0 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <video
          id="video-player"
          className="el-player"
          ref={videoElement}
          playsInline
          muted
        ></video>
      </div>
    </div>
  );
};

VideoPlayer.propTypes = {
  videoStream: PropTypes.string,
};

export default VideoPlayer;
