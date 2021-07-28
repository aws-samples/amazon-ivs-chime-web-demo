import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as config from '../../config';

const Settings = ({ chime, closeSettings, saveSettings, joinInfo }) => {
  const [microphone, setMicrophone] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [camera, setCamera] = useState('');

  const devicesUpdatedCallback = (fullDeviceInfo) => {
    if (config.DEBUG) console.log(fullDeviceInfo);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    chime.subscribeToDevicesUpdated(devicesUpdatedCallback);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      chime.unsubscribeFromDevicesUpdated(devicesUpdatedCallback);
    };
  });

  const handleKeyDown = (e) => {
    if (e.keyCode === 27) {
      // keyCode 27 is Escape key
      closeSettings();
    }
  };

  const handleMicrophoneChange = (e) => {
    setMicrophone(e.target.value);

    if (chime.audioInputDevices.length) {
      let selectedDevice;
      let o;
      for (o in chime.audioInputDevices) {
        if (chime.audioInputDevices[o].value === e.target.value) {
          selectedDevice = chime.audioInputDevices[o];
          break;
        }
      }
      chime.chooseAudioInputDevice(selectedDevice);
    }
  };

  const handleSpeakerChange = (e) => {
    setSpeaker(e.target.value);

    if (chime.audioOutputDevices.length) {
      let selectedDevice;
      let o;
      for (o in chime.audioOutputDevices) {
        if (chime.audioOutputDevices[o].value === e.target.value) {
          selectedDevice = chime.audioOutputDevices[o];
          break;
        }
      }
      chime.chooseAudioOutputDevice(selectedDevice);
    }
  };

  const handleCameraChange = async (e) => {
    setCamera(e.target.value);

    if (chime.videoInputDevices.length) {
      let selectedDevice;
      let o;
      for (o in chime.videoInputDevices) {
        if (chime.videoInputDevices[o].value === e.target.value) {
          selectedDevice = chime.videoInputDevices[o];
          break;
        }
      }
      chime.chooseVideoInputDevice(selectedDevice);
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    e.preventDefault();
    saveSettings(microphone, speaker, camera);
  };

  const renderDevices = (devices, defaultValue, label) => {
    if (devices && devices.length) {
      return devices.map((device) => {
        return (
          <option
            key={device.value}
            value={device.value}
          >{`${device.label}`}</option>
        );
      });
    } else {
      return (
        <option value="no-permission">{`Permission not granted to access ${label} devices`}</option>
      );
    }
  };

  const currentMic = chime.currentAudioInputDevice;
  const currentSpeaker = chime.currentAudioOutputDevice;
  const currentCam = chime.currentVideoInputDevice;
  const availableMics = chime.audioInputDevices;
  const availableSpeakers = chime.audioOutputDevices;
  const availableCams = chime.videoInputDevices;

  return (
    <div className="modal pos-absolute top-0 bottom-0 ">
      <div className="modal__el">
        <h1 className="mg-b-2">Settings</h1>
        <form>
          <fieldset>
            <input
              className="mg-b-2"
              name=""
              id=""
              type="text"
              readOnly={true}
              placeholder="Playback URL"
              value={joinInfo.PlaybackURL}
              disabled
            />
            <select
              name="microphone"
              className="select__field"
              onChange={handleMicrophoneChange}
              value={microphone || currentMic.value}
              disabled={!availableMics.length}
            >
              {renderDevices(availableMics, currentMic, 'microphone')}
            </select>
            <select
              name="speaker"
              className="select__field"
              onChange={handleSpeakerChange}
              value={speaker || currentSpeaker.value}
              disabled={!availableSpeakers.length}
            >
              {renderDevices(availableSpeakers, currentSpeaker, 'speaker')}
            </select>
            <select
              name="camera"
              className="select__field"
              onChange={handleCameraChange}
              value={camera || currentCam.value}
              disabled={!availableCams.length}
            >
              {renderDevices(availableCams, currentCam, 'camera')}
            </select>
            <button className="btn btn--primary mg-t-2" onClick={handleSave}>
              Save
            </button>
          </fieldset>
        </form>
      </div>
      <div className="modal__overlay"></div>
    </div>
  );
};

Settings.propTypes = {
  chime: PropTypes.object,
  joinInfo: PropTypes.object,
  saveSettings: PropTypes.func,
  closeSettings: PropTypes.func,
};

export default Settings;
