import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as config from '../../config';

class Settings extends Component {

  state = {
    microphone: '',
    speaker: '',
    camera: ''
  }

  devicesUpdatedCallback = (fullDeviceInfo) => {
    if (config.DEBUG) console.log(fullDeviceInfo);
  };

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);

    this.props.chime.subscribeToDevicesUpdated(this.devicesUpdatedCallback);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);

    this.props.chime.unsubscribeFromDevicesUpdated(this.devicesUpdatedCallback);
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 27) { // keyCode 27 is Escape key
      this.props.closeSettings();
    }
  }

  handlePlaybackURLChange = (e) => {
    this.setState({ playbackURL: e.target.value });
  }

  handleMicrophoneChange = (e) => {
    this.setState({ microphone: e.target.value });

    if (this.props.chime.audioInputDevices.length) {
      let selectedDevice;
      let o;
      for (o in this.props.chime.audioInputDevices) {
        if (this.props.chime.audioInputDevices[o].value === e.target.value) {
          selectedDevice = this.props.chime.audioInputDevices[o];
          break;
        }
      }
      this.props.chime.chooseAudioInputDevice(selectedDevice);
    }
  }

  handleSpeakerChange = (e) => {
    this.setState({ speaker: e.target.value });

    if (this.props.chime.audioOutputDevices.length) {
      let selectedDevice;
      let o;
      for (o in this.props.chime.audioOutputDevices) {
        if (this.props.chime.audioOutputDevices[o].value === e.target.value) {
          selectedDevice = this.props.chime.audioOutputDevices[o];
          break;
        }
      }
      this.props.chime.chooseAudioOutputDevice(selectedDevice);
    }
  }

  handleCameraChange = async (e) => {
    this.setState({ camera: e.target.value });

    if (this.props.chime.videoInputDevices.length) {
      let selectedDevice;
      let o;
      for (o in this.props.chime.videoInputDevices) {
        if (this.props.chime.videoInputDevices[o].value === e.target.value) {
          selectedDevice = this.props.chime.videoInputDevices[o];
          break;
        }
      }
      this.props.chime.chooseVideoInputDevice(selectedDevice);
    }
  }

  handleSave = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const {microphone, speaker, camera } = this.state;
    this.props.saveSettings(microphone, speaker, camera);
  }

  renderDevices = (devices, defaultValue, label) => {
    if (devices && devices.length) {
      return (
        devices.map(device => {
          return (
            <option key={device.value} value={device.value}>{`${device.label}`}</option>
          )
        })
      )
    } else {
      return (
      <option value="no-permission">{`Permission not granted to access ${label} devices`}</option>
      );
    }
  }

  render() {
    const currentMic = this.props.chime.currentAudioInputDevice;
    const currentSpeaker = this.props.chime.currentAudioOutputDevice;
    const currentCam = this.props.chime.currentVideoInputDevice;
    const availableMics = this.props.chime.audioInputDevices;
    const availableSpeakers = this.props.chime.audioOutputDevices;
    const availableCams = this.props.chime.videoInputDevices;

    return (
      <div className="modal pos-absolute top-0 bottom-0 ">
        <div className="modal__el">
          <h1 className="mg-b-2">Settings</h1>
          <form>
            <fieldset>
              <input className="mg-b-2" name="" id="" type="text" readOnly={true} placeholder="Playback URL" onChange={this.handlePlaybackURLChange} value={this.props.joinInfo.PlaybackURL} disabled />
              <select
                name="microphone"
                className="select__field"
                onChange={this.handleMicrophoneChange}
                value={this.state.microphone || currentMic.value}
                disabled={!availableMics.length}
              >
                {this.renderDevices(availableMics, currentMic, 'microphone')}
              </select>
              <select
                name="speaker"
                className="select__field"
                onChange={this.handleSpeakerChange}
                value={this.state.speaker || currentSpeaker.value}
                disabled={!availableSpeakers.length}
              >
                {this.renderDevices(availableSpeakers, currentSpeaker, 'speaker')}
              </select>
              <select
                name="camera"
                className="select__field"
                onChange={this.handleCameraChange}
                value={this.state.camera || currentCam.value}
                disabled={!availableCams.length}
              >
                {this.renderDevices(availableCams, currentCam, 'camera')}
              </select>
              <button className="btn btn--primary mg-t-2" onClick={this.handleSave}>Save</button>
            </fieldset>
          </form>
        </div>
        <div className="modal__overlay"></div>
      </div>
    )
  }
}

Settings.propTypes = {
  chime: PropTypes.object,
  joinInfo: PropTypes.object,
  saveSettings: PropTypes.func,
  closeSettings: PropTypes.func,
  settings: PropTypes.object,
  checkAudioVideoPermission: PropTypes.func,
  updateAudioVideoDevices: PropTypes.func,
};

export default Settings;
