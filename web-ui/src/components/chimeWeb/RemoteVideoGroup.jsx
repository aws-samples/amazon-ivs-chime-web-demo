import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RemoteVideo from './RemoteVideo';
import * as config from '../../config';

const MAX_REMOTE_VIDEOS = config.CHIME_ROOM_MAX_ATTENDEE;

class RemoteVideoGroup extends Component {

  state = {
    rosterChanged: false,
    roster: []
  }

  constructor() {
    super();
    this.previousRoster = {};
  }

  findRosterSlot = (attendeeId) => {
    let index;
    for (index = 0; index < this.state.roster.length; index++) {
      if (this.state.roster[index].attendeeId === attendeeId) {
        return index;
      }
    }
    for (index = 0; index < this.state.roster.length; index++) {
      if (!this.state.roster[index].attendeeId) {
        return index;
      }
    }
    return 0;
  }

  rosterCallback = (newRoster) => {

    if (Object.keys(newRoster).length > 2) {
      if (config.DEBUG) console.log('More than 2');
    }

    if (Object.keys(newRoster).length < Object.keys(this.previousRoster).length) {
      if (config.DEBUG) console.log('Attendee(s) left');
      const differ = Object.keys(this.previousRoster).filter(k => this.previousRoster[k] !== newRoster[k]);
      if (config.DEBUG) console.log(differ);

      if (differ.length) {
        let i;
        for (i in differ) {
          const index = this.findRosterSlot(differ[i]);
          const roster = this.state.roster;
          roster[index] = {
            videoElement: roster[index].videoElement
          }
          this.setState({ roster });
        }
      }
    }

    this.previousRoster = Object.assign({}, newRoster);

    let attendeeId;
    for (attendeeId in newRoster) {

      // Exclude self
      if (attendeeId === this.props.joinInfo.Attendee.AttendeeId) {
        continue;
      }

      // exclude empty name
      if (!newRoster[attendeeId].name) {
        continue;
      }

      const index = this.findRosterSlot(attendeeId);
      const roster = this.state.roster;
      const attendee = {
        ...roster[index],
        attendeeId,
        ...newRoster[attendeeId]
      };

      roster[index] = attendee;
      this.setState({ roster });
    }
  };

  videoTileDidUpdateCallback = (tileState) => {
    if (
      !tileState.boundAttendeeId ||
      tileState.localTile ||
      tileState.isContent ||
      !tileState.tileId
    ) {
      return;
    }

    let index = this.findRosterSlot(tileState.boundAttendeeId);
    const roster = this.state.roster;
    const attendee = {
      ...roster[index],
      videoEnabled: tileState.active,
      attendeeId: tileState.boundAttendeeId,
      tileId: tileState.tileId
    };
    roster[index] = attendee;
    this.setState({ roster });

    setTimeout(() => {
      if (config.DEBUG) console.log(roster[index]);
      const videoElement = document.getElementById(`video_${tileState.boundAttendeeId}`);
      if (videoElement) {
        this.props.chime.audioVideo.bindVideoElement(
          tileState.tileId,
          videoElement
        );
      }
    }, 1000);
  };

  videoTileWasRemovedCallback = (tileId) => {
    let roster = this.state.roster;

    // Find the removed tileId in the roster and mark the video as disabled.
    // eslint-disable-next-line
    roster.find((o, i) => {
      if (o.tileId === tileId) {
        roster[i].videoEnabled = false;
        this.setState({ roster });
        if (config.DEBUG) console.log(`Tile was removed ${tileId}`);
      }
    });
  }

  componentDidMount() {
    const roster = [];
    // eslint-disable-next-line
    Array.from(Array(MAX_REMOTE_VIDEOS).keys()).map((key, index) => {
      roster[index] = {
        videoElement: React.createRef()
      };
    });
    this.setState({ roster });

    this.props.chime.subscribeToRosterUpdate(this.rosterCallback);

    this.props.chime.audioVideo.addObserver({
      videoTileDidUpdate: this.videoTileDidUpdateCallback,
      videoTileWasRemoved: this.videoTileWasRemovedCallback,
    });
  }

  componentWillUnmount() {
    this.props.chime.unsubscribeFromRosterUpdate(this.rosterCallback);
  }

  render() {
    return(
      <React.Fragment>
        {this.state.roster.map((attendee, index) => {
          return (
            <RemoteVideo
              chime={this.props.chime}
              key={index}
              attendeeId={attendee.attendeeId}
              videoEnabled={attendee.videoEnabled}
              name={attendee.name}
              muted={attendee.muted}
              videoElement={attendee.videoElement}
            />
          );
        })}
      </React.Fragment>
    )
  }
}

RemoteVideoGroup.propTypes = {
  chime: PropTypes.object,
  joinInfo: PropTypes.object
};

export default RemoteVideoGroup;
