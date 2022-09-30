import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import RemoteVideo from './RemoteVideo';
import * as config from '../../config';

const MAX_REMOTE_VIDEOS = config.CHIME_ROOM_MAX_ATTENDEE;

const RemoteVideoGroup = ({ chime, joinInfo }) => {
  const [roster, setRoster] = useState([]);
  const [newRoster, setNewRoster] = useState({});
  const [previousRoster, setPreviousRoster] = useState({});
  const [isObservedChime, setIsObservedChime] = useState(false);

  const findRosterSlot = (attendeeId) => {
    let index;
    for (index = 0; index < roster.length; index++) {
      if (roster[index].attendeeId === attendeeId) {
        return index;
      }
    }
    for (index = 0; index < roster.length; index++) {
      if (!roster[index].attendeeId) {
        return index;
      }
    }
    return 0;
  };

  useEffect(() => {
    if (Object.keys(newRoster).length < Object.keys(previousRoster).length) {
      if (config.DEBUG) console.log('Attendee(s) left');
      const differ = Object.keys(previousRoster).filter(
        (k) => previousRoster[k] !== newRoster[k],
      );
      if (config.DEBUG) console.log(differ);

      if (differ.length) {
        let i;
        for (i in differ) {
          const index = findRosterSlot(differ[i]);
          const rosterNew = roster;
          rosterNew[index] = {
            videoElement: rosterNew[index].videoElement,
          };
          setRoster(rosterNew);
        }
      }
    }
    setPreviousRoster({ ...newRoster });
  }, [newRoster]);

  const rosterCallback = (newRoster) => {
    if (Object.keys(newRoster).length > 2) {
      if (config.DEBUG) console.log('More than 2');
    }

    setNewRoster({ ...newRoster });

    let attendeeId;
    for (attendeeId in newRoster) {
      // Exclude self
      if (attendeeId === joinInfo.Attendee.AttendeeId) {
        continue;
      }

      // exclude empty name
      if (!newRoster[attendeeId].name) {
        continue;
      }

      const index = findRosterSlot(attendeeId);
      const rosterNew = roster;
      const attendee = {
        ...rosterNew[index],
        attendeeId,
        ...newRoster[attendeeId],
      };

      rosterNew[index] = attendee;
      setRoster(rosterNew);
    }
  };

  const videoTileDidUpdateCallback = (tileState) => {
    if (
      !tileState.boundAttendeeId ||
      tileState.localTile ||
      tileState.isContent ||
      !tileState.tileId
    ) {
      return;
    }

    let index = findRosterSlot(tileState.boundAttendeeId);
    const rosterNew = roster;
    const attendee = {
      ...rosterNew[index],
      videoEnabled: tileState.active,
      attendeeId: tileState.boundAttendeeId,
      tileId: tileState.tileId,
    };
    rosterNew[index] = attendee;
    setRoster(rosterNew);

    setTimeout(() => {
      if (config.DEBUG) console.log(rosterNew[index]);
      const videoElement = document.getElementById(
        `video_${tileState.boundAttendeeId}`,
      );
      if (videoElement) {
        chime.audioVideo.bindVideoElement(tileState.tileId, videoElement);
      }
    }, 1000);
  };

  const videoTileWasRemovedCallback = (tileId) => {
    let rosterNew = roster;

    // Find the removed tileId in the roster and mark the video as disabled.
    // eslint-disable-next-line
    rosterNew.find((o, i) => {
      if (o.tileId === tileId) {
        rosterNew[i].videoEnabled = false;
        setRoster(rosterNew);
        if (config.DEBUG) console.log(`Tile was removed ${tileId}`);
      }
    });
  };

  useEffect(() => {
    if (isObservedChime === false && roster.length === MAX_REMOTE_VIDEOS) {
      chime.subscribeToRosterUpdate(rosterCallback);
      chime.audioVideo.addObserver({
        videoTileDidUpdate: videoTileDidUpdateCallback,
        videoTileWasRemoved: videoTileWasRemovedCallback,
      });
      setIsObservedChime(true);
    }
  }, [roster]);

  useEffect(() => {
    const rosterNew = [];
    // eslint-disable-next-line
    Array.from(Array(MAX_REMOTE_VIDEOS).keys()).map((key, index) => {
      rosterNew[index] = {
        videoElement: React.createRef(),
      };
    });
    setRoster(rosterNew);

    return () => {
      chime.unsubscribeFromRosterUpdate(rosterCallback);
    };
  }, []);

  return (
    <React.Fragment>
      {roster.map((attendee, index) => {
        return (
          <RemoteVideo
            chime={chime}
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
  );
};

RemoteVideoGroup.propTypes = {
  chime: PropTypes.object,
  joinInfo: PropTypes.object,
};

export default RemoteVideoGroup;
