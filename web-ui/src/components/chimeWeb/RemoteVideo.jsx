import React, { Component } from 'react';
import PropTypes from 'prop-types';

class RemoteVideo extends Component {

  state = {
    showMeta: true
  }
  
  componentDidMount() {
    // Hide meta info after 2 seconds
    if (!this.props.muted) {
      setTimeout(() => {
        this.setState({
          showMeta: false
        });
      }, 2000);
    }
  }

  handleMouseEnter(e) {
    this.setState({
      showMeta: true
    });
  }

  handleMouseLeave(e) {
    this.setState({
      showMeta: false
    });
  }

  render() {
    const {
      attendeeId,
      videoEnabled,
      name,
      muted,
      videoElement
    } = this.props;
    // always show metadata when participant is muted or cam is off
    const showMeta = this.state.showMeta || muted || !videoEnabled;

    const camClass = attendeeId ? '' : ' hidden';
    const micMuteCls = muted ? 'controls__btn--mic_on' : 'controls__btn--mic_off';
    const metaCls =  showMeta ? '' : ' cam__meta--hide';
    const videoId = `video_${attendeeId}`;
    return(

        <div className={`cam${camClass}`} key={attendeeId} onMouseEnter={this.handleMouseEnter.bind(this)} onMouseLeave={this.handleMouseLeave.bind(this)}>
          <div className="cam__preview">
            <div className="video-container pos-relative">
              <video ref={videoElement} className="attendee_cam remote-attendee" id={videoId} />
            </div>
          </div>
          <span className={`cam__meta${metaCls}`}>
            {name}
            <span className={`${micMuteCls} btn--mic`} data-id={attendeeId}>
              <svg className="attendee mg-l-1 btn__svg btn__svg--sm btn__svg--mic_on" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.24 19 14.42 19 11H17.3Z" fill="white"/></svg>
              <svg className="attendee mg-l-1 btn__svg btn__svg--sm btn__svg--mic_off" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 11H17.3C17.3 11.74 17.14 12.43 16.87 13.05L18.1 14.28C18.66 13.3 19 12.19 19 11ZM14.98 11.17C14.98 11.11 15 11.06 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V5.18L14.98 11.17ZM4.27 3L3 4.27L9.01 10.28V11C9.01 12.66 10.34 14 12 14C12.22 14 12.44 13.97 12.65 13.92L14.31 15.58C13.6 15.91 12.81 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C13.91 17.59 14.77 17.27 15.54 16.82L19.73 21L21 19.73L4.27 3Z" fill="white"/></svg>
            </span>
          </span>
        </div>

    )
  }
}

RemoteVideo.propTypes = {
  chime: PropTypes.object,
  attendeeId: PropTypes.string,
  videoEnabled: PropTypes.bool,
  name: PropTypes.string,
  muted: PropTypes.bool,
  videoElement: PropTypes.object
};

export default RemoteVideo;
