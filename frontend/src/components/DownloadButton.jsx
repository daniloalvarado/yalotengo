import React from 'react';
import styled from 'styled-components';

const DownloadButton = ({ onClick, text = "Descargar", className = "" }) => {
  return (
    <StyledWrapper className={className} onClick={onClick}>
      <button className="button" type="button">
        <span className="button__text">{text}</span>
        <span className="button__icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" className="svg">
            <path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z" />
            <path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z" />
            <path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z" />
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
    fill: #fff;
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

export default DownloadButton;
