import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// Styles
import './Error.css';

const Error = (props) => {
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  const handleKeyDown = (e) => {
    if (e.keyCode === 27) {
      // keyCode 27 is Escape key
      props.closeError();
    }
  };

  const handleClick = (e) => {
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
      props.closeError();
    }
  };

  const handleGoCreateRoom = () => {
    window.location.replace('/index.html');
  };

  return (
    <div className="notice notice--error" onClick={handleClick}>
      <div className="notice__content">
        <div className="icon icon--24 notice__icon">
          <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <path d="M 500 0C 224 0 0 224 0 500C 0 776 224 1000 500 1000C 776 1000 1000 776 1000 500C 1000 224 776 0 500 0C 500 0 500 0 500 0M 526 150C 576 150 602 175 601 224C 600 300 600 350 575 525C 570 560 560 575 525 575C 525 575 475 575 475 575C 440 575 430 560 425 525C 400 355 400 300 400 226C 400 175 425 150 475 150M 500 650C 527 650 552 661 571 679C 589 698 600 723 600 750C 600 805 555 850 500 850C 445 850 400 805 400 750C 400 723 411 698 429 679C 448 661 473 650 500 650C 500 650 500 650 500 650" />
          </svg>
        </div>
        {props.errorMsg}
        <div>
          To create your own room, click{' '}
          <span className="go-create-room" onClick={handleGoCreateRoom}>
            here
          </span>
          .
        </div>
      </div>
    </div>
  );
};

Error.propTypes = {
  errorMsg: PropTypes.string,
  closeError: PropTypes.func,
};

export default Error;
