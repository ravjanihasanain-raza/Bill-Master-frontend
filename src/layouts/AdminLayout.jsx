import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { ThemeProvider, createGlobalStyle, keyframes } from "styled-components";
import { Outlet } from "react-router-dom";

import Header from "../components/layouts/Header";
import Sidebar from "../components/layouts/Sidebar";
import Footer from "../components/layouts/Footer";

/* ===== PREMIUM SAAS THEMES ===== */
const lightTheme = {
  body: "#f8fafc", text: "#0f172a", textMuted: "#64748b", card: "#ffffff", border: "#e2e8f0", bgLight: "#f1f5f9", primary: "#3b82f6",
};

const darkTheme = {
  body: "#020617", text: "#f8fafc", textMuted: "#94a3b8", card: "rgba(15, 23, 42, 0.7)", border: "rgba(255, 255, 255, 0.08)", bgLight: "rgba(255, 255, 255, 0.03)", primary: "#3b82f6",
};

const GlobalStyle = createGlobalStyle`
  body {
    background: ${(props) => props.theme.body};
    color: ${(props) => props.theme.text};
    transition: background 0.3s ease, color 0.3s ease;
    margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("appTheme") === "dark");

  useEffect(() => {
    localStorage.setItem("appTheme", isDarkMode ? "dark" : "light");
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Handle Resize for Mobile Detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        if (sidebarOpen) setSidebarOpen(false); // Auto close on resize to mobile
      } else {
        setIsMobile(false);
        if (!sidebarOpen) setSidebarOpen(true); // Auto open on resize to desktop
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock Body Scroll on Mobile when Sidebar is Open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobile, sidebarOpen]);

  const navigate = useNavigate();

useEffect(() => {
  const user = localStorage.getItem("adminAuth");
  if (!user) {
    navigate("/Adminlogin");
  }
}, []);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Wrapper>
        {/* 🔥 MOBILE OVERLAY FIX */}
        {isMobile && sidebarOpen && (
          <SidebarOverlay onClick={() => setSidebarOpen(false)} />
        )}
        
        <Sidebar open={sidebarOpen} closeSidebar={() => isMobile && setSidebarOpen(false)} />
        
        <ContentWrapper $open={sidebarOpen} $isMobile={isMobile}>
          <Header
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
            isMobile={isMobile}
          />
          <Main><Outlet /></Main>
          <Footer />
        </ContentWrapper>
      </Wrapper>
    </ThemeProvider>
  );
}

/* ================= STYLES ================= */
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const Wrapper = styled.div` display: flex; min-height: 100vh; width: 100%; overflow-x: hidden; position: relative; `;

const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 999;
  animation: ${fadeIn} 0.3s ease-out forwards;
`;

const ContentWrapper = styled.div`
  flex: 1; display: flex; flex-direction: column;
  margin-left: ${(props) => (props.$isMobile ? "0" : props.$open ? "260px" : "75px")};
  width: ${(props) => (props.$isMobile ? "100%" : props.$open ? "calc(100% - 260px)" : "calc(100% - 75px)")};
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Main = styled.main` flex: 1; display: flex; flex-direction: column; `;