import React, { createRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as config from '../../config';

// Styles
import './Chat.css';

const Chat = (props) => {
  const [message, setMesssage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connection, setConnection] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const chatRef = createRef();
  const messagesEndRef = createRef();

  useEffect(() => {
    const initChatConnection = async () => {
      const { Meeting, Attendee } = props.joinInfo;
      const messagingUrl = `${config.CHAT_WEBSOCKET}?MeetingId=${Meeting.MeetingId}&AttendeeId=${Attendee.AttendeeId}&JoinToken=${Attendee.JoinToken}`;
      const connectionInit = await new WebSocket(messagingUrl);

      if (config.DEBUG) console.log(connectionInit);
      connectionInit.onopen = (event) => {
        console.log('websocket is now open', event);
      };

      connectionInit.addEventListener('message', (event) => {
        const data = event.data.split('::');
        const username = data[0];
        const newMessage = data.slice(1).join('::'); // in case the message contains the separator '::'

        setMessages((prevState) => {
          return [
            ...prevState,
            {
              timestamp: Date.now(),
              username,
              message: newMessage,
            },
          ];
        });
      });

      setConnection(connectionInit);

      return () => {
        connectionInit.removeEventListener('message', () => {
          console.log('Message event cancelled');
        });
      };
    };

    initChatConnection();
  }, []);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  });

  const handleChange = (e) => {
    setMesssage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      // keyCode 13 is carriage return
      const { username } = props;
      if (message) {
        const data = `{
          "message": "sendmessage",
          "data": "${username}::${message
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')}"
        }`;
        connection.send(data);
        setMesssage('');
      }
    }
  };

  const handleRoomClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const { title } = props;
    const link = `${window.location.origin}${window.location.pathname.replace(
      'meeting',
      'index.html',
    )}?action=join&room=${title}`;
    if (config.DEBUG) console.log(link);
    copyTextToClipboard(encodeURI(link));
  };

  const handleShowPopup = () => {
    // show popup message
    setShowPopup(true);
    // hide popup message after 2 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 2000);
  };

  const copyTextToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => {
          handleShowPopup();
          if (config.DEBUG) console.log('Room link copied to clipboard');
        },
        (err) => {
          if (config.DEBUG) console.log('Could not copy text: ', err);
        },
      );
    }
  };

  const parseUrls = (userInput) => {
    var urlRegExp =
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)/g;
    let formattedMessage = userInput.replace(urlRegExp, (match) => {
      let formattedMatch = match;
      if (!match.startsWith('http')) {
        formattedMatch = `http://${match}`;
      }
      return `<a href=${formattedMatch} class="chat-line__link" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
    return formattedMessage;
  };

  const popup = showPopup ? 'show' : '';
  return (
    <div className="chat full-height pos-relative">
      <div className="chat__room-link full-width">
        <button className="room-link popup" onClick={handleRoomClick}>
          <span className="room-link__label">{props.title}</span>
          <svg
            className="room-link__svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.25033 9.99999C3.25033 8.57499 4.40866 7.41666 5.83366 7.41666H9.16699V5.83333H5.83366C3.53366 5.83333 1.66699 7.69999 1.66699 9.99999C1.66699 12.3 3.53366 14.1667 5.83366 14.1667H9.16699V12.5833H5.83366C4.40866 12.5833 3.25033 11.425 3.25033 9.99999ZM6.66699 10.8333H13.3337V9.16666H6.66699V10.8333ZM14.167 5.83333H10.8337V7.41666H14.167C15.592 7.41666 16.7503 8.57499 16.7503 9.99999C16.7503 11.425 15.592 12.5833 14.167 12.5833H10.8337V14.1667H14.167C16.467 14.1667 18.3337 12.3 18.3337 9.99999C18.3337 7.69999 16.467 5.83333 14.167 5.83333Z"
              fill="white"
            />
          </svg>
          <span className={`popuptext ${popup}`} id="myPopup">
            Room link copied to clipboard
          </span>
        </button>
      </div>
      <div className="chat__wrapper full-width pos-relative">
        <div className="messages pd-x-1 pos-absolute">
          {messages.map((msg) => {
            let formattedMessage = parseUrls(msg.message);
            return (
              <div className="chat-line" key={msg.timestamp}>
                <p>
                  <span className="username">{msg.username}</span>
                  <span
                    dangerouslySetInnerHTML={{ __html: formattedMessage }}
                  />
                </p>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="composer chime-web-composer full-width">
        <input
          ref={chatRef}
          type="text"
          placeholder="Say something"
          value={message}
          maxLength={510}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

Chat.propTypes = {
  chime: PropTypes.object,
  title: PropTypes.string,
  username: PropTypes.string,
  joinInfo: PropTypes.object,
};

export default Chat;
