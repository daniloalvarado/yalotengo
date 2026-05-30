import React from 'react';
import styled from 'styled-components';

const PayButton = ({ onClick, text = "Pagar Ahora", className = "", disabled = false }) => {
  return (
    <StyledWrapper className={className} onClick={!disabled ? onClick : undefined} $disabled={disabled}>
      <div className={`button ${disabled ? 'disabled' : ''}`}>
        <div className="button-wrapper">
          <div className="text">{text}</div>
          <span className="icon">
            <svg viewBox="0 0 16 16" className="bi bi-cart2" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
              <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" />
            </svg>
          </span>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.6 : 1};

  .button {
    --height: 40px;
    --button-color: #059669; /* emerald-600 */
    --button-hover: #047857; /* emerald-700 */
    width: 100%;
    height: var(--height);
    background: var(--button-color);
    position: relative;
    text-align: center;
    border-radius: 0.5rem; /* match Tailwind rounded-lg */
    font-family: inherit;
    transition: background 0.3s;
    overflow: hidden;
    box-shadow: 0 1px 2px 0 rgba(16, 185, 129, 0.2); /* shadow-sm shadow-emerald-200 */
  }

  .text {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem; /* text-sm */
    font-weight: 600; /* font-semibold */
  }

  .button-wrapper, .text, .icon {
    overflow: hidden;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    color: #fff;
  }

  .text {
    top: 0;
  }

  .text, .icon {
    transition: top 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .icon {
    color: #fff;
    top: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon svg {
    width: 20px;
    height: 20px;
  }

  .button:not(.disabled):hover {
    background: var(--button-hover);
  }

  .button:not(.disabled):hover .text {
    top: -100%;
  }

  .button:not(.disabled):hover .icon {
    top: 0;
  }
`;

export default PayButton;
