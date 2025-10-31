import React from 'react';
import styled, { keyframes } from 'styled-components';
import spinnerGif from '../assets/spinner.gif'; // calea către GIF-ul tău

interface SpinnerProps {
    size?: number; // dimensiune în px, optional
    className?: string; // <--- adaugă asta

}

const SpinnerWrapper = styled.div<{ size: number }>`
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;
  }
`;

const Spinner: React.FC<SpinnerProps> = ({ size = 50,className }) => {
    return (
        <SpinnerWrapper size={size} className={className}>
            <img src={spinnerGif} alt="Loading..." />
        </SpinnerWrapper>
    );
};

export default Spinner;
