import React from "react";
import styled, { keyframes } from "styled-components";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Users, CreditCard } from "lucide-react";

export default function StaffSidebar({ open, setOpen }) {
  // Automatically close sidebar on mobile when a navigation link is clicked
  const handleMobileClose = () => {
    if (window.innerWidth <= 768 && setOpen) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* 1. Mobile Overlay - Only renders when open is true */}
      {open && <Overlay onClick={() => setOpen && setOpen(false)} />}

      <SidebarContainer $open={open}>
        {/* Background Glow Blob matching your theme */}
        <Blob className="sidebar-blob" />

        <Logo>
          <h2>{open ? "Abson Energy" : "AE"}</h2>
        </Logo>

        <NavList>
          <NavItem to="/staff/dashboard" onClick={handleMobileClose}>
            <LayoutDashboard size={20} />
            {open && <span>Dashboard</span>}
          </NavItem>
          <NavItem to="/staff/invoice" onClick={handleMobileClose}>
            <FileText size={20} />
            {open && <span>Invoices</span>}
          </NavItem>
          <NavItem to="/staff/myinvoices" onClick={handleMobileClose}>
            <FileText size={20} />
            {open && <span>My Invoices</span>}
          </NavItem>
          <NavItem to="/staff/customer" onClick={handleMobileClose}>
            <Users size={20} />
            {open && <span>Customers</span>}
          </NavItem>
          <NavItem to="/staff/payments" onClick={handleMobileClose}>
            <CreditCard size={20} />
            {open && <span>Payments</span>}
          </NavItem>
          <NavItem to="/staff/Products" onClick={handleMobileClose}>
            <CreditCard size={20} />
            {open && <span>Products</span>}
          </NavItem>
        </NavList>
      </SidebarContainer>
    </>
  );
}

/* ================= ANIMATIONS ================= */

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    backdrop-filter: blur(0px); 
  }
  to { 
    opacity: 1; 
    backdrop-filter: blur(4px); 
  }
`;

/* ================= STYLES ================= */

const SidebarContainer = styled.div`
  width: ${(props) => (props.$open ? "240px" : "80px")};
  height: 100vh;
  background: #020617;
  position: fixed;
  left: 0;
  top: 0;
  transition: 0.3s;
  z-index: 1000;

  @media (max-width: 768px) {
    transform: ${(props) =>
      props.$open ? "translateX(0)" : "translateX(-100%)"};
    width: 240px;
  }
`;

const Blob = styled.div`
  position: absolute;
  width: 250px;
  height: 250px;
  background: #06b6d4;
  filter: blur(100px);
  opacity: 0.15;
  top: -50px;
  left: -50px;
  z-index: 0;
  pointer-events: none;
`;

const Logo = styled.div`
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;
  
  h2 {
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: 1px;
    white-space: nowrap;
    margin: 0;
    /* Gradient Text */
    background: linear-gradient(135deg, #ffffff, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 15px;
  gap: 12px;
  position: relative;
  z-index: 1;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
  border: 1px solid transparent;

  /* Glassmorphism Hover Effect */
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
    transform: translateX(5px); /* Smooth slide right on hover */
  }

  /* Active/Selected State Gradient + Glow */
  &.active {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: #fff;
    border: 1px solid rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 999;
  animation: ${fadeIn} 0.3s ease-out forwards;

  @media (min-width: 768px) {
    display: none;
  }
`;