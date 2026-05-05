import React from 'react';
import '../styles/Modal.css';

/**
 * Modal Component - Wrapper for modal dialogs
 */
function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        {title && <div className="modal-title">{title}</div>}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
