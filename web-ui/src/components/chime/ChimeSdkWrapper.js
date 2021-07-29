import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultDOMWebSocketFactory,
  DefaultMeetingSession,
  DefaultModality,
  DefaultPromisedWebSocketFactory,
  FullJitterBackoff,
  LogLevel,
  MeetingSessionConfiguration,
  ReconnectingPromisedWebSocket,
} from 'amazon-chime-sdk-js';

import throttle from 'lodash/throttle';
import * as config from '../../config';

export default class ChimeSdkWrapper {
  static WEB_SOCKET_TIMEOUT_MS = 10000;
  static ROSTER_THROTTLE_MS = 400;

  constructor() {
    this.initializeSdkWrapper();
  }

  initializeSdkWrapper() {
    this.meetingSession = null;
    this.audioVideo = null;
    this.title = null;
    this.name = null;
    this.region = null;
    this.currentAudioInputDevice = null;
    this.currentAudioOutputDevice = null;
    this.currentVideoInputDevice = null;
    this.audioInputDevices = [];
    this.audioOutputDevices = [];
    this.videoInputDevices = [];
    this.devicesUpdatedCallbacks = [];
    this.roster = {};
    this.rosterUpdateCallbacks = [];
    this.configuration = null;
    this.messagingSocket = null;
    this.messageUpdateCallbacks = [];
  }

  logError(error) {
    console.error(error);
  }

  async createRoom(role, name, title, playbackURL, region) {
    if (!name || !title || !role) {
      console.error(`role=${role} name=${name} title=${title} must exist`);
      return;
    }

    const payload = {
      name,
      title,
      playbackURL,
      role,
    };

    const response = await fetch(`${config.CHIME_ROOM_API}/join`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(json.error);
    }

    const { JoinInfo } = json;
    if (!JoinInfo) {
      throw new Error('CreateOrJoin.classRoomDoesNotExist');
    }
    this.configuration = new MeetingSessionConfiguration(
      JoinInfo.Meeting,
      JoinInfo.Attendee,
    );
    await this.initializeMeetingSession(this.configuration);

    this.title = title;
    this.name = name;
    this.region = region;

    return JoinInfo;
  }

  async reInitializeMeetingSession(JoinInfo, name) {
    this.configuration = new MeetingSessionConfiguration(
      JoinInfo.Meeting,
      JoinInfo.Attendee,
    );
    await this.initializeMeetingSession(this.configuration);

    this.title = JoinInfo.Title;
    this.name = name;
    // this.region = region;
  }

  async initializeMeetingSession(configuration) {
    const logger = new ConsoleLogger('SDK', LogLevel.ERROR);
    const deviceController = new DefaultDeviceController(logger);
    this.meetingSession = new DefaultMeetingSession(
      configuration,
      logger,
      deviceController,
    );
    this.audioVideo = this.meetingSession.audioVideo;

    this.audioInputDevices = [];
    (await this.audioVideo.listAudioInputDevices()).forEach(
      (mediaDeviceInfo) => {
        this.audioInputDevices.push({
          label: mediaDeviceInfo.label,
          value: mediaDeviceInfo.deviceId,
        });
      },
    );
    this.audioOutputDevices = [];
    (await this.audioVideo.listAudioOutputDevices()).forEach(
      (mediaDeviceInfo) => {
        this.audioOutputDevices.push({
          label: mediaDeviceInfo.label,
          value: mediaDeviceInfo.deviceId,
        });
      },
    );
    this.videoInputDevices = [];
    (await this.audioVideo.listVideoInputDevices()).forEach(
      (mediaDeviceInfo) => {
        this.videoInputDevices.push({
          label: mediaDeviceInfo.label,
          value: mediaDeviceInfo.deviceId,
        });
      },
    );
    this.publishDevicesUpdated();
    this.audioVideo.addDeviceChangeObserver(this);

    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(
      (presentAttendeeId, present) => {
        if (!present) {
          delete this.roster[presentAttendeeId];
          //this.publishRosterUpdate.cancel();
          this.publishRosterUpdate()();
          return;
        }

        this.audioVideo.realtimeSubscribeToVolumeIndicator(
          presentAttendeeId,
          async (attendeeId, volume, muted, signalStrength) => {
            const baseAttendeeId = new DefaultModality(attendeeId).base();
            if (baseAttendeeId !== attendeeId) {
              // Don't include the content attendee in the roster.
              //
              // When you or other attendees share content (a screen capture, a video file,
              // or any other MediaStream object), the content attendee (attendee-id#content) joins the session and
              // shares content as if a regular attendee shares a video.
              //
              // For example, your attendee ID is "my-id". When you call meetingSession.audioVideo.startContentShare,
              // the content attendee "my-id#content" will join the session and share your content.
              return;
            }

            let shouldPublishImmediately = false;

            if (!this.roster[attendeeId]) {
              this.roster[attendeeId] = { name: '' };
            }
            if (volume !== null) {
              this.roster[attendeeId].volume = Math.round(volume * 100);
            }
            if (muted !== null) {
              this.roster[attendeeId].muted = muted;
            }
            if (signalStrength !== null) {
              this.roster[attendeeId].signalStrength = Math.round(
                signalStrength * 100,
              );
            }
            if (this.title && attendeeId && !this.roster[attendeeId].name) {
              const response = await fetch(
                `${config.CHIME_ROOM_API}/attendee?title=${encodeURIComponent(
                  this.title,
                )}&attendeeId=${encodeURIComponent(attendeeId)}`,
              );
              const json = await response.json();
              if (json.AttendeeInfo && this.roster[attendeeId]) {
                this.roster[attendeeId].name = json.AttendeeInfo.Name || '';
                shouldPublishImmediately = true;
              }
            }

            if (shouldPublishImmediately) {
              //this.publishRosterUpdate.cancel();
            }
            this.publishRosterUpdate()();
          },
        );
      },
    );
  }

  async joinRoom(element) {
    if (!element) {
      this.logError(new Error(`element does not exist`));
      return;
    }

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason);
    });

    const audioInputs = await this.audioVideo.listAudioInputDevices();
    if (audioInputs && audioInputs.length > 0 && audioInputs[0].deviceId) {
      this.currentAudioInputDevice = {
        label: audioInputs[0].label,
        value: audioInputs[0].deviceId,
      };
      await this.audioVideo.chooseAudioInputDevice(audioInputs[0].deviceId);
    }

    const audioOutputs = await this.audioVideo.listAudioOutputDevices();
    if (audioOutputs && audioOutputs.length > 0 && audioOutputs[0].deviceId) {
      this.currentAudioOutputDevice = {
        label: audioOutputs[0].label,
        value: audioOutputs[0].deviceId,
      };
      await this.audioVideo.chooseAudioOutputDevice(audioOutputs[0].deviceId);
    }

    const videoInputs = await this.audioVideo.listVideoInputDevices();
    if (videoInputs && videoInputs.length > 0 && videoInputs[0].deviceId) {
      this.currentVideoInputDevice = {
        label: videoInputs[0].label,
        value: videoInputs[0].deviceId,
      };
      await this.audioVideo.chooseVideoInputDevice(null);
    }

    this.publishDevicesUpdated();

    try {
      await this.audioVideo.bindAudioElement(element);
      this.audioVideo.start();
    } catch (error) {
      console.log('failed to bind audio element: ', error);
    }
  }

  async joinRoomMessaging() {
    if (!this.configuration) {
      this.logError(new Error('configuration does not exist'));
      return;
    }

    const messagingUrl = `${config.CHAT_WEBSOCKET}?MeetingId=${this.configuration.meetingId}&AttendeeId=${this.configuration.credentials.attendeeId}&JoinToken=${this.configuration.credentials.joinToken}`;
    this.messagingSocket = new ReconnectingPromisedWebSocket(
      messagingUrl,
      [],
      'arraybuffer',
      new DefaultPromisedWebSocketFactory(new DefaultDOMWebSocketFactory()),
      new FullJitterBackoff(1000, 0, 10000),
    );

    await this.messagingSocket.open(this.WEB_SOCKET_TIMEOUT_MS);

    this.messagingSocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        const { attendeeId } = data.payload;

        let name;
        if (this.roster[attendeeId]) {
          name = this.roster[attendeeId].name;
        }

        this.publishMessageUpdate({
          type: data.type,
          payload: data.payload,
          timestampMs: Date.now(),
          name,
        });
      } catch (error) {
        this.logError(error);
      }
    });
  }

  sendMessage(type, payload) {
    if (!this.messagingSocket) {
      return;
    }
    const message = {
      message: 'sendmessage',
      data: JSON.stringify({ type, payload }),
    };
    try {
      this.messagingSocket.send(JSON.stringify(message));
    } catch (error) {
      this.logError(error);
    }
  }

  async leaveRoom(end) {
    try {
      this.audioVideo.stop();
    } catch (error) {
      this.logError(error);
    }

    // try {
    //   await this.messagingSocket.close(this.WEB_SOCKET_TIMEOUT_MS);
    // } catch (error) {
    //   this.logError(error);
    // }

    try {
      if (end && this.title) {
        await fetch(
          `${config.CHIME_ROOM_API}/end?title=${encodeURIComponent(
            this.title,
          )}`,
          {
            method: 'POST',
          },
        );
      }
    } catch (error) {
      this.logError(error);
    }

    this.initializeSdkWrapper();
  }

  // Device

  async chooseAudioInputDevice(device) {
    try {
      await this.audioVideo.chooseAudioInputDevice(device.value);
      this.currentAudioInputDevice = device;
    } catch (error) {
      this.logError(error);
    }
  }

  async chooseAudioOutputDevice(device) {
    try {
      await this.audioVideo.chooseAudioOutputDevice(device.value);
      this.currentAudioOutputDevice = device;
    } catch (error) {
      this.logError(error);
    }
  }

  async chooseVideoInputDevice(device) {
    try {
      await this.audioVideo.chooseVideoInputDevice(device.value);
      this.currentVideoInputDevice = device;
    } catch (error) {
      this.logError(error);
    }
  }

  // Observer methods

  audioInputsChanged(freshAudioInputDeviceList) {
    let hasCurrentDevice = false;
    this.audioInputDevices = [];
    freshAudioInputDeviceList.forEach((mediaDeviceInfo) => {
      if (
        this.currentAudioInputDevice &&
        mediaDeviceInfo.deviceId === this.currentAudioInputDevice.value
      ) {
        hasCurrentDevice = true;
      }
      this.audioInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentAudioInputDevice =
        this.audioInputDevices.length > 0 ? this.audioInputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  audioOutputsChanged(freshAudioOutputDeviceList) {
    let hasCurrentDevice = false;
    this.audioOutputDevices = [];
    freshAudioOutputDeviceList.forEach((mediaDeviceInfo) => {
      if (
        this.currentAudioOutputDevice &&
        mediaDeviceInfo.deviceId === this.currentAudioOutputDevice.value
      ) {
        hasCurrentDevice = true;
      }
      this.audioOutputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentAudioOutputDevice =
        this.audioOutputDevices.length > 0 ? this.audioOutputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  videoInputsChanged(freshVideoInputDeviceList) {
    let hasCurrentDevice = false;
    this.videoInputDevices = [];
    freshVideoInputDeviceList.forEach((mediaDeviceInfo) => {
      if (
        this.currentVideoInputDevice &&
        mediaDeviceInfo.deviceId === this.currentVideoInputDevice.value
      ) {
        hasCurrentDevice = true;
      }
      this.videoInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentVideoInputDevice =
        this.videoInputDevices.length > 0 ? this.videoInputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  // Subscribe and unsubscribe

  subscribeToDevicesUpdated(callback) {
    this.devicesUpdatedCallbacks.push(callback);
  }

  unsubscribeFromDevicesUpdated(callback) {
    const index = this.devicesUpdatedCallbacks.indexOf(callback);
    if (index !== -1) {
      this.devicesUpdatedCallbacks.splice(index, 1);
    }
  }

  publishDevicesUpdated() {
    this.devicesUpdatedCallbacks.forEach((callback) => {
      callback({
        currentAudioInputDevice: this.currentAudioInputDevice,
        currentAudioOutputDevice: this.currentAudioOutputDevice,
        currentVideoInputDevice: this.currentVideoInputDevice,
        audioInputDevices: this.audioInputDevices,
        audioOutputDevices: this.audioOutputDevices,
        videoInputDevices: this.videoInputDevices,
      });
    });
  }

  subscribeToRosterUpdate(callback) {
    this.rosterUpdateCallbacks.push(callback);
  }

  unsubscribeFromRosterUpdate(callback) {
    const index = this.rosterUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.rosterUpdateCallbacks.splice(index, 1);
    }
  }

  publishRosterUpdate() {
    return throttle(() => {
      for (let i = 0; i < this.rosterUpdateCallbacks.length; i += 1) {
        const callback = this.rosterUpdateCallbacks[i];
        callback(this.roster);
      }
    }, this.ROSTER_THROTTLE_MS);
  }

  subscribeToMessageUpdate(callback) {
    this.messageUpdateCallbacks.push(callback);
  }

  unsubscribeFromMessageUpdate(callback) {
    const index = this.messageUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.messageUpdateCallbacks.splice(index, 1);
    }
  }

  publishMessageUpdate(message) {
    for (let i = 0; i < this.messageUpdateCallbacks.length; i += 1) {
      const callback = this.messageUpdateCallbacks[i];
      callback(message);
    }
  }
}
