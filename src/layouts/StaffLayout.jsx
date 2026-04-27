import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import { Outlet } from "react-router-dom";

// ✅ Components
import StaffHeader from "../components/layouts/StaffHeader";
import Footer from "../components/layouts/Footer";
import StaffSidebar from "../components/layouts/StaffSidebar";

/* =========================================================
    THEME DEFINITIONS
   ========================================================= */

const lightTheme = {
  body: "#f4f7f9",
  text: "#1e293b",
  card: "#ffffff",
  border: "#e2e8f0",
  primary: "#3b82f6",
  textMuted: "#64748b",
  bgLight: "rgba(0, 0, 0, 0.05)"
};

const darkTheme = {
  body: "#0f172a",
  text: "#f8fafc",
  card: "#1e293b",
  border: "rgba(59, 130, 246, 0.2)",
  primary: "#3b82f6",
  textMuted: "#94a3b8",
  bgLight: "rgba(255, 255, 255, 0.05)"
};

const GlobalStyle = createGlobalStyle`
  :root {
    --bg: ${(props) => props.theme.body};
    --card: ${(props) => props.theme.card};
    --text: ${(props) => props.theme.text};
    --text-muted: ${(props) => props.theme.textMuted};
    --border-custom: ${(props) => props.theme.border};
    --primary: ${(props) => props.theme.primary};
  }

  body {
    background: var(--bg);
    color: var(--text);
    margin: 0;
    font-family: 'Inter', sans-serif;
    transition: background 0.3s ease, color 0.3s ease;
  }
`;

/* =========================================================
    MAIN LAYOUT COMPONENT
   ========================================================= */

export default function StaffLayout() {
  // 1. Theme Persistence Logic
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("staffTheme") === "dark";
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("staffTheme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  // 2. Sidebar State (Handles Mobile/Desktop)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 3. Responsive Listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true); // Auto open on desktop
      else setSidebarOpen(false); // Auto close on mobile
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigate = useNavigate();

useEffect(() => {
  const user = localStorage.getItem("staffAuth");
  if (!user) {
    navigate("/Stafflogin");
  }
}, []);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Wrapper>
        {/* Pass both state and setter for mobile overlay functionality */}
        <StaffSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        <ContentWrapper $open={sidebarOpen}>
          <StaffHeader
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isMobile={isMobile}
          />

          <Main>
            <Outlet />
          </Main>

          <Footer />
        </ContentWrapper>
      </Wrapper>
    </ThemeProvider>
  );
}

/* ================= STYLES ================= */

const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
  position: relative;
`;

const ContentWrapper = styled.div`
  flex: 1;
  /* Adjust margin based on sidebar state (Desktop only) */
  margin-left: ${(p) => (p.$open ? "240px" : "80px")};
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 100%;

  @media (max-width: 768px) {
    margin-left: 0; /* No margin on mobile, sidebar will be absolute/overlay */
  }
`;

const Main = styled.main`
  flex: 1;
  padding: 24px;
  min-height: calc(100vh - 76px); /* Header height compensation */
  overflow-x: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;