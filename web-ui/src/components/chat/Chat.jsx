import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  DefaultPromisedWebSocketFactory,
  DefaultDOMWebSocketFactory,
  FullJitterBackoff,
  ReconnectingPromisedWebSocket
} from 'amazon-chime-sdk-js';
import * as config from '../../config';

// Styles
import './Chat.css';

class Chat extends Component {
  constructor() {
    super ();

    this.WEB_SOCKET_TIMEOUT_MS = 10000;

    this.state = {
      message: '',
      messages: [],
      connection: null,
      showPopup: false
    }
    this.chatRef = React.createRef();
    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    this.initChatConnection();
  }

  async initChatConnection() {
    const { Meeting, Attendee } = this.props.joinInfo;
    const messagingUrl = `${config.CHAT_WEBSOCKET}?MeetingId=${Meeting.MeetingId}&AttendeeId=${Attendee.AttendeeId}&JoinToken=${Attendee.JoinToken}`
    const connection = new ReconnectingPromisedWebSocket(
      messagingUrl,
      [],
      'arraybuffer',
      new DefaultPromisedWebSocketFactory(new DefaultDOMWebSocketFactory()),
      new FullJitterBackoff(1000, 0, 10000)
    );

    if (config.DEBUG) console.log(connection);

    await connection.open(this.WEB_SOCKET_TIMEOUT_MS);

    connection.addEventListener('message', event => {
      const messages = this.state.messages;
      const data = event.data.split('::');
      const username = data[0];
      const message = data.slice(1).join('::'); // in case the message contains the separator '::'

      messages.push({
        timestamp: Date.now(),
        username,
        message
      });

      this.setState({ messages });
    });

    this.setState({ connection });

    this.chatRef.current.focus();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  handleChange = e => {
    this.setState({ message: e.target.value })
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 13) { // keyCode 13 is carriage return
      const { message, connection } = this.state;
      const { username } = this.props;
      if (message) {
        const data = `{
          "message": "sendmessage",
          "data": "${username}::${message.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"
        }`;
        connection.send(data);

        this.setState({ message: '' });
      }
    }
  }

  handleRoomClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const { title } = this.props;
    const link = `${window.location.origin}${window.location.pathname.replace('meeting', 'index.html')}?action=join&room=${title}`;
    if (config.DEBUG) console.log(link);
    this.copyTextToClipboard(encodeURI(link));
  }

  setShowPopup = () => {
    // show popup message
    this.setState({ showPopup: true });

    // hide popup message after 2 seconds
    setTimeout(() => {
      this.setState({ showPopup: false })
    }, 2000);
  }

  copyTextToClipboard = text => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      .then(() => {
        this.setShowPopup();
        if (config.DEBUG) console.log('Room link copied to clipboard');
      }, (err) => {
        if (config.DEBUG) console.log('Could not copy text: ', err);
      });
    }
  }

  parseUrls = (userInput) => {
    var urlRegExp = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)/g;
    let formattedMessage = userInput.replace(urlRegExp, (match) => {
      let formattedMatch = match;
      if (!match.startsWith('http')) {
        formattedMatch = `http://${match}`;
      }
      return `<a href=${formattedMatch} class="chat-line__link" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
    return formattedMessage;
  }

  renderMessages = () => {
    const { messages } = this.state;
    return (
      messages.map(message => {
        let formattedMessage = this.parseUrls(message.message);
        return (
          <div className="chat-line" key={message.timestamp}>
            <p><span className="username">{message.username}</span><span dangerouslySetInnerHTML={{__html: formattedMessage}} /></p>
          </div>
        )
      })
    )
  }

  render() {
    const { message, showPopup } = this.state;
    const popup = showPopup ? 'show' : '';
    return (
      <div className="chat full-height pos-relative">
        <div className="chat__room-link full-width">
          <button className="room-link popup" onClick={this.handleRoomClick}>
            <span className="room-link__label">{this.props.title}</span>
            <svg className="room-link__svg" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.25033 9.99999C3.25033 8.57499 4.40866 7.41666 5.83366 7.41666H9.16699V5.83333H5.83366C3.53366 5.83333 1.66699 7.69999 1.66699 9.99999C1.66699 12.3 3.53366 14.1667 5.83366 14.1667H9.16699V12.5833H5.83366C4.40866 12.5833 3.25033 11.425 3.25033 9.99999ZM6.66699 10.8333H13.3337V9.16666H6.66699V10.8333ZM14.167 5.83333H10.8337V7.41666H14.167C15.592 7.41666 16.7503 8.57499 16.7503 9.99999C16.7503 11.425 15.592 12.5833 14.167 12.5833H10.8337V14.1667H14.167C16.467 14.1667 18.3337 12.3 18.3337 9.99999C18.3337 7.69999 16.467 5.83333 14.167 5.83333Z" fill="white"/></svg>
            <span className={`popuptext ${popup}`} id="myPopup">Room link copied to clipboard</span>
          </button>
        </div>
        <div className="chat__wrapper full-width pos-relative">
          <div className="messages pd-x-1 pos-absolute">
            {this.renderMessages()}
            <div ref={this.messagesEndRef} />
          </div>
        </div>
        <div className="composer chime-web-composer full-width">
          <input
            ref={this.chatRef}
            type="text"
            placeholder="Say something"
            value={message}
            maxLength={510}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
          />
        </div>
      </div>
    )
  }
}

Chat.propTypes = {
  chime: PropTypes.object,
  title: PropTypes.string,
  username: PropTypes.string,
  joinInfo: PropTypes.object
};

export default Chat;
