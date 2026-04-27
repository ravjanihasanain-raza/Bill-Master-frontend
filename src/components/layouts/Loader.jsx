import React from "react";
import styled, { keyframes } from "styled-components";

export default function Loader() {
  return (
    <Overlay>
      <LoaderContainer>
        <SpinnerWrapper>
          <SpinnerRing />
          <SpinnerIcon>
            <i className="fas fa-cube"></i>
          </SpinnerIcon>
        </SpinnerWrapper>
        <LoadingText>Loading Workspace...</LoadingText>
      </LoaderContainer>
    </Overlay>
  );
}

/* ================= STYLES ================= */

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulseIcon = keyframes`
  0%, 100% { opacity: 0.7; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.8)); }
`;

const pulseText = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(2, 6, 23, 0.7); /* Deep dark blur overlay */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
`;

const LoaderContainer = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 20px;
`;

const SpinnerWrapper = styled.div`
  position: relative; width: 70px; height: 70px;
`;

const SpinnerRing = styled.div`
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, #3b82f6, #06b6d4, #22c55e, #3b82f6);
  animation: ${spin} 1.2s linear infinite;
  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0);
  box-shadow: 0 0 25px rgba(59, 130, 246, 0.4);
`;

const SpinnerIcon = styled.div`
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #3b82f6; 
  animation: ${pulseIcon} 2s ease-in-out infinite;
`;

const LoadingText = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 14px; font-weight: 600; color: #94a3b8;
  letter-spacing: 2px; text-transform: uppercase;
  animation: ${pulseText} 1.5s infinite;
`;