import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function StaffHeader({
  toggleSidebar,
  isDarkMode,
  toggleTheme,
  isMobile,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

 

  /* Outside click detection */
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    Swal.fire({
      title: "Ready to leave?",
      text: "You will be securely logged out of your session.",
      icon: "warning",
      background: isDarkMode ? "#0B1221" : "#ffffff",
      color: isDarkMode ? "#f8fafc" : "#0f172a",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("staffAuth");

        // 🔥 HARD RESET (IMPORTANT)
        navigate("/staff/Login");
      }
    });
  };

const user = JSON.parse(localStorage.getItem("staffAuth") || "{}");

const staffName =
  user?.name?.trim() ||
  user?.fullName?.trim() ||
  user?.staffName?.trim() ||
  "Staff Member";
    return (
    <HeaderBar $isDark={isDarkMode}>
      <Left>
        <MenuBtn onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <i className="fas fa-bars-staggered"></i>
        </MenuBtn>
        <Logo>
          <div className="icon-box">
            <i className="fas fa-bolt"></i>
          </div>
          <span className="brand-text d-none d-sm-block">Abson Staff</span>
        </Logo>
      </Left>

      <Right>
        <WelcomeText className="d-none d-lg-block">
          Welcome, <span>{staffName}</span>
        </WelcomeText>

        {/* 🌟 Theme Toggle (Integrated from Admin) */}
        <ActionBtn
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
          $isDark={isDarkMode}
        >
          <i
            className={`fas ${isDarkMode ? "fa-sun text-warning" : "fa-moon"}`}
          ></i>
        </ActionBtn>

        {/* ===== PREMIUM USER DROPDOWN (Integrated from Admin) ===== */}
        <DropdownWrapper ref={dropdownRef}>
          <UserPill
            onClick={() => setOpen(!open)}
            $isOpen={open}
            $isDark={isDarkMode}
          >
            <div className="avatar">{staffName.charAt(0).toUpperCase()}</div>
            <div className="user-info d-none d-sm-flex">
              <span className="name">{staffName}</span>
              <span className="role">Staff Account</span>
            </div>
            <i
              className={`fas fa-chevron-down chevron d-none d-sm-block ${open ? "open" : ""}`}
            ></i>
          </UserPill>

          {open && (
            <DropdownMenu $isDark={isDarkMode}>
              <div className="menu-header">
                <strong>{staffName}</strong>
                <small>Staff Member</small>
                <div className="divider mt-2"></div>
              </div>

              <MenuItem
                onClick={() => {
                  setOpen(false);
                  navigate("/staff/StaffProfile");
                }}
                $isDark={isDarkMode}
              >
                <div className="icon-wrap text-primary">
                  <i className="fas fa-user-circle"></i>
                </div>
                My Profile
              </MenuItem>

              <MenuItem
                onClick={() => {
                  setOpen(false);
                  navigate("/staff/settings");
                }}
                $isDark={isDarkMode}
              >
                <div className="icon-wrap text-info">
                  <i className="fas fa-cog"></i>
                </div>
                Settings
              </MenuItem>

              <div className="divider"></div>

              {user ? (
                <MenuItem onClick={logout} className="logout">
                  Logout
                </MenuItem>
              ) : (
                <MenuItem onClick={() => navigate("/Staff/login")}>
                  Login
                </MenuItem>
              )}
            </DropdownMenu>
          )}
        </DropdownWrapper>
      </Right>
    </HeaderBar>
  );
}

/* ================= ANIMATIONS ================= */

const slideDown = keyframes`
  0% { opacity: 0; transform: translateY(-10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const boltPulse = keyframes`
  0% { filter: drop-shadow(0 0 4px rgba(14, 165, 233, 0.4)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 15px rgba(14, 165, 233, 0.9)); transform: scale(1.15); }
  100% { filter: drop-shadow(0 0 4px rgba(14, 165, 233, 0.4)); transform: scale(1); }
`;

/* ================= STYLED COMPONENTS ================= */

const HeaderBar = styled.header`
  height: 76px;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) =>
    props.$isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.8)"};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid
    ${(props) =>
      props.$isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(226, 232, 240, 0.8)"};
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 990;

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(59, 130, 246, 0.5),
      transparent
    );
  }
  @media (max-width: 768px) {
    padding: 0 16px;
    height: 70px;
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;
const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MenuBtn = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #94a3b8;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  position: relative;
  z-index: 1100;
  &:hover {
    color: #38bdf8;
    background: rgba(14, 165, 233, 0.1);
    border-color: rgba(14, 165, 233, 0.5);
    box-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
    transform: translateY(-2px);
  }
`;

const ActionBtn = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid
    ${(props) =>
      props.$isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(226, 232, 240, 1)"};
  background: transparent;
  color: ${(props) => (props.$isDark ? "#94a3b8" : "#64748b")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
  .icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0ea5e9, #3b82f6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    box-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
    i {
      animation: ${boltPulse} 2s infinite ease-in-out;
    }
  }
  .brand-text {
    font-weight: 800;
    font-size: 1.2rem;
    color: inherit;
    letter-spacing: -0.5px;
  }
`;

const WelcomeText = styled.div`
  font-size: 13px;
  color: #94a3b8;
  span {
    color: inherit;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
`;

const DropdownWrapper = styled.div`
  position: relative;
`;

const UserPill = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px 6px 6px;
  border-radius: 50px;
  background: ${(props) =>
    props.$isOpen ? "rgba(59, 130, 246, 0.1)" : "transparent"};
  border: 1px solid
    ${(props) =>
      props.$isOpen ? "rgba(59, 130, 246, 0.6)" : "rgba(59, 130, 246, 0.2)"};
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
  }

  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #0ea5e9);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    .name {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.2;
    }
    .role {
      font-size: 10px;
      font-weight: 600;
      opacity: 0.6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .chevron {
    font-size: 12px;
    color: #94a3b8;
    transition: 0.3s;
    &.open {
      transform: rotate(180deg);
      color: #3b82f6;
    }
  }
  @media (max-width: 768px) {
    padding: 4px;
    .avatar {
      width: 32px;
      height: 32px;
    }
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  width: 240px;
  border-radius: 16px;
  background: ${(props) =>
    props.$isDark ? "rgba(11, 18, 33, 0.95)" : "#ffffff"};
  border: 1px solid
    ${(props) =>
      props.$isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(226, 232, 240, 1)"};
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  padding: 8px 0;
  z-index: 1000;
  animation: ${slideDown} 0.2s forwards;
  transform-origin: top right;

  .menu-header {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    strong {
      font-size: 14px;
    }
    small {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 4px;
      opacity: 0.7;
    }
  }
  .divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.05);
    margin: 6px 0;
  }
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin: 0 8px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;

  .icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: 0.3s;
  }

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    .icon-wrap {
      background: #3b82f6;
      color: white;
    }
  }

  &.logout:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    .icon-wrap {
      background: #ef4444;
      color: white;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
    }
  }
`;
