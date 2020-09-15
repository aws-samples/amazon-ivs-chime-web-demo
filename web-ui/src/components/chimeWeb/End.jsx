import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import * as config from '../../config';

class End extends Component {

  constructor() {
    super();
    this.baseHref = config.BASE_HREF;
  }

  render() {
    return (
      <div className="welcome form-grid">
        <div className="welcome__intro">
          <div className="intro__inner formatted-text">
            <h1>Amazon IVS with ChimeSDK</h1>
            <h3>Create or join rooms, and watch Amazon IVS streams with anyone.</h3>
          </div>
        </div>

        <div className="welcome__content pd-4">
          <div className="content__inner formatted-text">
            <h2 className="mg-b-2">Room closed</h2>
            <p>The host has ended the meeting and closed the room.</p>
            <a href={`${this.baseHref}/`} className="mg-t-3 btn btn--primary">Create a new room</a>
          </div>
        </div>
      </div>
    )
  }
}

export default withRouter(End);
