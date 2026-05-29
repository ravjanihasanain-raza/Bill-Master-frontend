import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Header({
  toggleSidebar,
  isDarkMode,
  toggleTheme,
  isMobile,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("adminAuth") || "null");
  const userName = user?.name || "Admin";
  // useEffect(() => {
  //   fetchLowStock();

  //   const interval = setInterval(() => {
  //     fetchLowStock();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, []);


//   useEffect(() => {
//   window.addEventListener("stockUpdated", fetchLowStock);

//   return () => {
//     window.removeEventListener("stockUpdated", fetchLowStock);
//   };
// }, []);



  const fetchLowStock = async () => {
    try {
      const res = await fetch("https://localhost:7116/api/Stock/GetLowStock");
      const data = await res.json();

      if (data.status === "OK") {
        setLowStock(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [lowStock, setLowStock] = useState([]);
  const [showStock, setShowStock] = useState(false);

  /* Strict click-based outside detection */
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleStockClose(e) {
      if (!e.target.closest(".stock-bell")) {
        setShowStock(false);
      }
    }

    document.addEventListener("mousedown", handleStockClose);
    return () => document.removeEventListener("mousedown", handleStockClose);
  }, []);

  const logout = () => {
    Swal.fire({
      title: "Ready to leave?",
      text: "You will be securely logged out of your session.",
      icon: "warning",
      background: isDarkMode ? "#0B1221" : "#ffffff",
      color: isDarkMode ? "#f8fafc" : "#0f172a",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "<i class='fas fa-sign-out-alt me-2'></i> Logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("adminAuth");
        window.location.href = "/Adminlogin";
      }
    });
  };

  return (
    <HeaderContainer $isDark={isDarkMode} $isMobile={isMobile}>
      <LeftSection>
        {/* 🔥 FIX 3: Button is absolute highest priority */}
        <ActionBtn
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="menu-toggle"
        >
          <i className="fas fa-bars-staggered"></i>
        </ActionBtn>

        {/* ⚡ THE ELECTRIC LOGO & TEXT ⚡ */}
        <BrandLogo $isDark={isDarkMode}>
          <div className="icon-box">
            <i className="fas fa-bolt"></i>
          </div>
          <span className="brand-text d-none d-md-block">Abson Energy</span>
        </BrandLogo>
      </LeftSection>

      <RightSection>
        {/* Dynamic Welcome Message */}
        <WelcomeMessage className="d-none d-lg-block">
          Welcome back, <span>{userName}</span>
        </WelcomeMessage>

        {/* 🌟 Theme Toggle */}
        <ActionBtn
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
        >
          <i
            className={`fas ${isDarkMode ? "fa-sun text-warning" : "fa-moon"}`}
          ></i>
        </ActionBtn>

        <div className="stock-bell" style={{ position: "relative" }}>
          <ActionBtn onClick={() => setShowStock(!showStock)}>
            <i className="fas fa-bell"></i>
          </ActionBtn>

          {lowStock.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                background: "red",
                color: "#fff",
                borderRadius: "50%",
                fontSize: "10px",
                padding: "3px 6px",
              }}
            >
              {lowStock.length}
            </span>
          )}

          {/* 🔥 DROPDOWN OUTSIDE */}
          {showStock && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "50px",
                width: "250px",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "10px",
                zIndex: 1000,
              }}
            >
              <h6>Low Stock</h6>

              {lowStock.length === 0 ? (
                <p>No low stock</p>
              ) : (
                lowStock.map((item, i) => (
                  <div
                    key={i}
                    style={{ fontSize: "12px", marginBottom: "5px" }}
                  >
                    {item.productName} - {item.availableQty}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ===== PREMIUM USER DROPDOWN ===== */}
        <DropdownWrapper ref={dropdownRef}>
          <UserPill onClick={() => setOpen(!open)} $isOpen={open}>
            <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
            <div className="user-info d-none d-sm-flex">
              <span className="name">{userName}</span>
              <span className="role">Administrator</span>
            </div>
            <i
              className={`fas fa-chevron-down chevron d-none d-sm-block ${open ? "open" : ""}`}
            ></i>
          </UserPill>

          {open && (
            <DropdownMenu>
              <div className="menu-header d-sm-none">
                <strong>{userName}</strong>
                <small>Administrator</small>
                <div className="divider mt-2"></div>
              </div>

              <MenuItem
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/profile");
                }}
              >
                <div className="icon-wrap text-primary">
                  <i className="fas fa-user-circle"></i>
                </div>
                My Profile
              </MenuItem>

              <MenuItem
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/softwaresettings");
                }}
              >
                <div className="icon-wrap text-info">
                  <i className="fas fa-cog"></i>
                </div>
                Settings
              </MenuItem>

              <div className="divider"></div>

              <MenuItem onClick={logout} className="logout">
                <div className="icon-wrap text-danger">
                  <i className="fas fa-sign-out-alt"></i>
                </div>
                Logout
              </MenuItem>
            </DropdownMenu>
          )}
        </DropdownWrapper>
      </RightSection>
    </HeaderContainer>
  );
}

/* ================= ANIMATIONS ================= */

const slideDown = keyframes`
  0% { opacity: 0; transform: translateY(-10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const energyShine = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

const boltPulse = keyframes`
  0% { filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.4)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 15px rgba(255, 204, 0, 0.9)); transform: scale(1.15); }
  100% { filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.4)); transform: scale(1); }
`;

const rgbFloat = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/* ================= STYLED COMPONENTS ================= */

const HeaderContainer = styled.header`
  height: 76px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  position: sticky;
  top: 0;
  /* On mobile, this needs to be strictly managed to allow the button to pop over the overlay */
  z-index: ${(props) => (props.$isMobile ? "1100" : "900")};

  /* 🌌 Animated RGB Layered Background */
  background: ${(props) =>
    props.$isDark
      ? `linear-gradient(135deg, rgba(2, 6, 23, 0.85), rgba(11, 18, 33, 0.85)),
       radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15), transparent 50%),
       radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.12), transparent 50%)`
      : `linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(248, 250, 252, 0.85)),
       radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08), transparent 50%),
       radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.05), transparent 50%)`};
  background-size: 200% 200%;
  animation: ${rgbFloat} 12s ease infinite;

  /* Glassmorphism */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid
    ${(props) => props.theme.border || "rgba(59, 130, 246, 0.2)"};
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);

  /* Subtle Glowing Bottom Line */
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
      rgba(59, 130, 246, 0.6),
      rgba(6, 182, 212, 0.6),
      transparent
    );
  }

  @media (max-width: 768px) {
    padding: 0 16px;
    height: 76px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  @media (max-width: 768px) {
    gap: 12px;
  }
`;

/* ===== PREMIUM ACTION BUTTONS ===== */
const ActionBtn = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid
    ${(props) => props.theme.border || "rgba(59, 130, 246, 0.2)"};
  background: ${(props) => props.theme.bgLight || "rgba(255, 255, 255, 0.5)"};
  color: ${(props) => props.theme.textMuted || "#64748b"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 10;

  &.menu-toggle {
    z-index: 1100; /* Force above the mobile overlay */
  }

  &:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }
  @media (max-width: 768px) {
    width: 38px;
    height: 38px;
    font-size: 15px;
  }
`;

/* ===== ⚡ ELECTRIC BRAND LOGO ===== */
const BrandLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
  cursor: pointer;
  transition: all 0.3s ease;

  .icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);

    i {
      animation: ${boltPulse} 2s infinite ease-in-out;
    }
  }

  .brand-text {
    font-weight: 900;
    font-size: 1.25rem;
    letter-spacing: -0.5px;

    /* Dynamic Lightning Gradient */
    background: ${(props) =>
      props.$isDark
        ? "linear-gradient(to right, #f8fafc 20%, #38bdf8 40%, #38bdf8 60%, #f8fafc 80%)"
        : "linear-gradient(to right, #0f172a 20%, #2563eb 40%, #2563eb 60%, #0f172a 80%)"};
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: ${energyShine} 4s linear infinite;
  }

  &:hover {
    .icon-box {
      transform: scale(1.1) rotate(8deg);
      box-shadow: 0 0 25px rgba(255, 200, 0, 0.8);
    }
    .brand-text {
      transform: scale(1.02);
      text-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
    }
  }

  @media (max-width: 768px) {
    .icon-box {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }
  }
`;

const WelcomeMessage = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.textMuted};
  margin-right: 10px;
  span {
    color: ${(props) => props.theme.text};
    font-weight: 700;
    letter-spacing: 0.3px;
  }
`;

/* ===== USER PROFILE PILL ===== */
const DropdownWrapper = styled.div`
  position: relative;
  z-index: 10;
`;

const UserPill = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px 6px 6px;
  border-radius: 50px;
  border: 1px solid
    ${(props) => (props.$isOpen ? props.theme.primary : props.theme.border)};
  background: ${(props) =>
    props.$isOpen ? `${props.theme.primary}10` : props.theme.bgLight};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(props) =>
    props.$isOpen ? `0 0 15px ${props.theme.primary}20` : "none"};

  &:hover {
    border-color: ${(props) => props.theme.primary}60;
    background: ${(props) => props.theme.primary}10;
    box-shadow: 0 4px 15px ${(props) => props.theme.primary}20;
  }

  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      ${(props) => props.theme.primary},
      #06b6d4
    );
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    .name {
      font-size: 13px;
      font-weight: 700;
      color: ${(props) => props.theme.text};
      line-height: 1.2;
    }
    .role {
      font-size: 10px;
      font-weight: 600;
      color: ${(props) => props.theme.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .chevron {
    font-size: 12px;
    color: ${(props) => props.theme.textMuted};
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    &.open {
      transform: rotate(180deg);
      color: ${(props) => props.theme.primary};
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

/* ===== DROPDOWN MENU ===== */
const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 240px;
  border-radius: 16px;
  background: ${(props) => props.theme.card};
  border: 1px solid ${(props) => props.theme.border};
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.2),
    0 0 20px ${(props) => props.theme.primary}15;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 8px 0;
  z-index: 1000;
  animation: ${slideDown} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: top right;

  .menu-header {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    strong {
      font-size: 14px;
      color: ${(props) => props.theme.text};
    }
    small {
      font-size: 11px;
      color: ${(props) => props.theme.textMuted};
      font-weight: 600;
      text-transform: uppercase;
    }
  }

  .divider {
    height: 1px;
    background: ${(props) => props.theme.border};
    margin: 6px 0;
  }
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  margin: 0 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  color: ${(props) => props.theme.text};
  transition: all 0.2s ease;

  .icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${(props) => props.theme.bgLight};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: 0.3s ease;
  }

  &:hover {
    background: ${(props) => props.theme.primary}15;
    color: ${(props) => props.theme.primary};
    padding-left: 18px; /* Smooth slide right */

    .icon-wrap {
      background: ${(props) => props.theme.primary};
      color: white !important;
      box-shadow: 0 4px 10px ${(props) => props.theme.primary}40;
    }
  }

  &.logout:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    .icon-wrap {
      background: #ef4444;
      color: white !important;
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
    }
  }
`;
