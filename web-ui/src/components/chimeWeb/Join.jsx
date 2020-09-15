import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import * as config from '../../config';
import Error from './Error';

class Join extends Component {

  state = {
    role: 'attendee',
    username: '',
    title: '',
    errorMsg: '',
    showError: false
  }

  constructor() {
    super ();
    this.inputRef = React.createRef();
    this.baseHref = config.BASE_HREF;
  }

  componentDidMount() {
    const qs = new URLSearchParams(this.props.location.search);
    const room = qs.get('room');
    this.setState({ title: room });
  }

  joinRoom = async () => {
    const { username, title } = this.state;
    const data = {
      username,
      title,
      role: this.state.role
    }
    sessionStorage.setItem(`chime[${title}]`, JSON.stringify(data));
    this.props.history.push(`${this.baseHref}/meeting?room=${title}`);
  }

  handleNameChange = e => {
    this.setState({ username: e.target.value })
  }

  handleJoinRoom = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.joinRoom();
  }

  handleClick = (e) => {
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
      this.closeError();
    }
  }

  setErrorMsg = errorMsg => {
    this.setState({ errorMsg, showError: true });
  }

  closeError = () => {
    this.setState({ showError: false });
  }

  render() {
    const { username } = this.state;
    const joinRoomDisabled = !username;
    return (
      <div className="welcome form-grid" onClick={this.handleClick}>

        <div className="welcome__intro">
          <div className="intro__inner formatted-text">
            <h1>Amazon IVS with ChimeSDK</h1>
            <h3>Create or join rooms, and watch Amazon IVS streams with anyone.</h3>
          </div>
        </div>

        <div className="welcome__content pd-4">
          <div className="content__inner">
            <h2 className="mg-b-2">Hey there!</h2>
            <form action="">
              <fieldset className="mg-b-2">
                <input type="text" placeholder="Your name" value={username} ref={this.inputRef} onChange={this.handleNameChange} />
                <button className="mg-t-1 btn btn--primary" disabled={joinRoomDisabled} onClick={this.handleJoinRoom}>Join room</button>
              </fieldset>
            </form>
          </div>
        </div>

        {this.state.showError && (
          <Error
            closeError={this.closeError}
            errorMsg={this.state.errorMsg}
          />
        )}
      </div>
    )
  }
}

export default withRouter(Join);
