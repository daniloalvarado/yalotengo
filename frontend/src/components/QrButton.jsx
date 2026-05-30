import React from 'react';
import styled from 'styled-components';

const QrButton = ({ onClick, text = "Ver QR / Detalles", className = "" }) => {
  return (
    <StyledWrapper className={className} onClick={onClick}>
      <button className="button" type="button">
        <span className="button__text">{text}</span>
        <span className="button__icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </span>
      </button>
    </StyledWrapper>
  );
};

// Adaptado a la paleta emerald del proyecto Yalotengo
const StyledWrapper = styled.div`
  .button {
    position: relative;
    width: 100%;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    border: 1px solid #059669; /* emerald-600 */
    background-color: #10b981; /* emerald-500 */
    border-radius: 0.5rem; /* rounded-lg */
    overflow: hidden;
  }

  .button, .button__icon, .button__text {
    transition: all 0.3s;
  }

  .button .button__text {
    transform: translateX(18px);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    width: 100%;
    text-align: left;
  }

  .button .button__icon {
    position: absolute;
    right: 0;
    height: 100%;
    width: 39px;
    background-color: #059669; /* emerald-600 */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button .svg {
    width: 20px;
    color: #fff;
  }

  .button:hover {
    background: #059669; /* emerald-600 */
  }

  .button:hover .button__text {
    color: transparent;
  }

  .button:hover .button__icon {
    width: 100%; /* Cubre todo el botón */
    transform: translateX(0);
  }

  .button:active .button__icon {
    background-color: #047857; /* emerald-700 */
  }

  .button:active {
    border: 1px solid #047857; /* emerald-700 */
  }
`;

export default QrButton;
