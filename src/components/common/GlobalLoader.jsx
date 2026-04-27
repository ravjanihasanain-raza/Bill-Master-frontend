import React, { useEffect, useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

const spin1 = keyframes`
  0% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg); }
  100% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg); }
`;

const spin2 = keyframes`
  0% { transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg); }
  100% { transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg); }
`;

const spin3 = keyframes`
  0% { transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg); }
  100% { transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
  50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 60px rgba(6, 182, 212, 0.9); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(11, 17, 32, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 99999;
`;

const AmbientGlow = styled.div`
  position: absolute;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(6,182,212,0.1) 50%, transparent 70%);
  border-radius: 50%;
  animation: ${pulse} 4s ease-in-out infinite;
  pointer-events: none;
`;

const HolographicOrb = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: preserve-3d;
  perspective: 800px;
  animation: ${float} 4s ease-in-out infinite;
  z-index: 2;

  .ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid transparent;
  }

  .ring:nth-child(1) {
    border-top: 3px solid #3b82f6;
    border-right: 3px solid #3b82f6;
    animation: ${spin1} 2s linear infinite;
    box-shadow: inset 0 0 15px rgba(59, 130, 246, 0.4);
  }

  .ring:nth-child(2) {
    border-right: 3px solid #06b6d4;
    border-bottom: 3px solid #06b6d4;
    animation: ${spin2} 2.5s linear infinite;
    box-shadow: inset 0 0 15px rgba(6, 182, 212, 0.4);
  }

  .ring:nth-child(3) {
    border-bottom: 3px solid #10b981;
    border-left: 3px solid #10b981;
    animation: ${spin3} 3s linear infinite;
    box-shadow: inset 0 0 15px rgba(16, 185, 129, 0.4);
  }

  .core {
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, #06b6d4, #3b82f6);
    border-radius: 50%;
    box-shadow: 0 0 30px #3b82f6, 0 0 60px #06b6d4;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const LoaderTextContainer = styled.div`
  margin-top: 40px;
  text-align: center;
  height: 60px;
  position: relative;
  z-index: 2;
  
  h2 {
    font-family: "Inter", sans-serif;
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 8px 0;
    letter-spacing: 1px;
    background: linear-gradient(90deg, #3b82f6, #06b6d4, #f8fafc);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: textShine 3s linear infinite;
  }

  p {
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    margin: 0;
    letter-spacing: 0.5px;
  }

  @keyframes textShine {
    to { background-position: 200% center; }
  }
`;

const loadingMessages = [
  "Loading Workspace...",
  "Preparing Dashboard...",
  "Fetching Records...",
  "Finalizing Experience..."
];

export default function GlobalLoader({ isLoading }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const mountTime = useRef(0);

  // Handle minimum display time (700ms) to prevent flicker and handle scroll lock
  useEffect(() => {
    let timer;
    if (isLoading) {
      setShouldRender(true);
      mountTime.current = Date.now();
      document.body.style.overflow = "hidden"; // Lock scroll
    } else {
      const elapsed = Date.now() - mountTime.current;
      const remaining = Math.max(0, 700 - elapsed);
      timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = "auto"; // Restore scroll
      }, remaining);
    }
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "auto";
    };
  }, [isLoading]);

  // Rotate text every 2 seconds
  useEffect(() => {
    if (!shouldRender) return;
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [shouldRender]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <Overlay
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <AmbientGlow />
          <HolographicOrb>
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="core"></div>
          </HolographicOrb>
          
          <LoaderTextContainer>
            <AnimatePresence mode="wait">
              <motion.div
                key={textIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h2>{loadingMessages[textIndex]}</h2>
                <p>Preparing your enterprise System....</p>
              </motion.div>
            </AnimatePresence>
          </LoaderTextContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
}