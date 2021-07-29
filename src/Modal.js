import React from 'react';
import './Modal.scss';

const Modal = ({
  children,
  title,
  show,
  isCloseable,
  handleClose,
  className
}) => (
  <div className={`Modal modal ${show ? 'is-active' : ''}${className ? ' ' + className : ''}`}>
    <div onClick={() => isCloseable && handleClose && handleClose()}>
      <div className="modal-background"></div>
    </div>
    <div className="modal-content">
      <div className="card">
        <button
          onClick={() => isCloseable && handleClose && handleClose()}
          className={`modal-close is-large ${!isCloseable ? 'is-invisible' : ''}`}></button>
        <div className="card-content">
          <div className="content">
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Modal;
