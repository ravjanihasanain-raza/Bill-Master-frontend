import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { NavLink } from "react-router-dom";

export default function Sidebar({ open, closeSidebar }) {
  const [masters, setMasters] = useState(true);
  const [transactions, setTransactions] = useState(false);
  const [stock, setStock] = useState(false);
  const [reports, setReports] = useState(false);

  return (
    <SidebarWrapper $open={open}>
      <Logo>
        <LogoIcon>
          <i className="fas fa-cube"></i>
        </LogoIcon>
        {open && <LogoText>Abson Admin</LogoText>}
      </Logo>

      <MenuArea>
        {/* Dashboard */}
        <StyledLink to="/admin/dashboard" onClick={closeSidebar}>
          {({ isActive }) => (
            <NavItem $active={isActive}>
              <i className="fas fa-chart-pie"></i>
              {open && <span>Dashboard</span>}
            </NavItem>
          )}
        </StyledLink>

        {/* Masters */}
        <Section onClick={() => setMasters(!masters)}>
          <div className="d-flex align-items-center">
            <i className="fas fa-database section-icon"></i>
            {open && <span>Masters</span>}
          </div>
          {open && (
            <i
              className={`fas fa-chevron-${masters ? "up" : "down"} toggle-icon`}
            ></i>
          )}
        </Section>

        {masters && (
          <SubMenu>
            <StyledLink to="/admin/productcategory" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-tags"></i>
                  {open && <span>Categories</span>}
                </NavItem>
              )}
            </StyledLink>
            {/* <StyledLink to="/admin/productmaster" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-box"></i>
                  {open && <span>Products</span>}
                </NavItem>
              )}
            </StyledLink> */}
            <StyledLink to="/admin/vendormaster" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-truck"></i>
                  {open && <span>Vendors</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/clientmaster" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-user-friends"></i>
                  {open && <span>Clients</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/staffmaster" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-id-badge"></i>
                  {open && <span>Staff</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/financialyear" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-calendar-alt"></i>
                  {open && <span>Financial Year</span>}
                </NavItem>
              )}
            </StyledLink>
          </SubMenu>
        )}

        {/* Transactions */}
        <Section onClick={() => setTransactions(!transactions)}>
          <div className="d-flex align-items-center">
            <i className="fas fa-exchange-alt section-icon"></i>
            {open && <span>Transactions</span>}
          </div>
          {open && (
            <i
              className={`fas fa-chevron-${transactions ? "up" : "down"} toggle-icon`}
            ></i>
          )}
        </Section>

        {transactions && (
          <SubMenu>
            <StyledLink to="/admin/purchaseentry" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-shopping-cart"></i>
                  {open && <span>Purchase Entry</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/invoiceentry" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-file-invoice-dollar"></i>
                  {open && <span>Invoice Entry</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/expensecategory" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-tag"></i>
                  {open && <span>Expense Category</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/expensemaster" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-tag"></i>
                  {open && <span>ExpenseMaster</span>}
                </NavItem>
              )}
            </StyledLink>
          </SubMenu>
        )}

        {/* Stock */}
        <Section onClick={() => setStock(!stock)}>
          <div className="d-flex align-items-center">
            <i className="fas fa-boxes section-icon"></i>
            {open && <span>Inventory</span>}
          </div>
          {open && (
            <i
              className={`fas fa-chevron-${stock ? "up" : "down"} toggle-icon`}
            ></i>
          )}
        </Section>

        {stock && (
          <SubMenu>
            <StyledLink to="/admin/inwardstock" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-arrow-circle-down"></i>
                  {open && <span>Stock Inward</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/outward" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-arrow-circle-up"></i>
                  {open && <span>Stock Outward</span>}
                </NavItem>
              )}
            </StyledLink>
          </SubMenu>
        )}

        {/* Reports */}
        <Section onClick={() => setReports(!reports)}>
          <div className="d-flex align-items-center">
            <i className="fas fa-chart-bar section-icon"></i>
            {open && <span>Reports</span>}
          </div>
          {open && (
            <i
              className={`fas fa-chevron-${reports ? "up" : "down"} toggle-icon`}
            ></i>
          )}
        </Section>

        {reports && (
          <SubMenu>
            <StyledLink to="/admin/purchasereport" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-file-contract"></i>
                  {open && <span>Purchase Report</span>}
                </NavItem>
              )}
            </StyledLink>
            <StyledLink to="/admin/salesreport" onClick={closeSidebar}>
              {({ isActive }) => (
                <NavItem $active={isActive} $isSub>
                  <i className="fas fa-chart-line"></i>
                  {open && <span>Sales Report</span>}
                </NavItem>
              )}
            </StyledLink>
          </SubMenu>
        )}
      </MenuArea>

      <BottomSection>
        <StyledLink to="/admin/softwaresettings" onClick={closeSidebar}>
          {({ isActive }) => (
            <NavItem $active={isActive}>
              <i className="fas fa-cog"></i>
              {open && <span>Settings</span>}
            </NavItem>
          )}
        </StyledLink>
      </BottomSection>
    </SidebarWrapper>
  );
}

/* ================= STYLES ================= */

const expandAnimation = keyframes`from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); }`;

const SidebarWrapper = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${(p) => (p.$open ? "260px" : "75px")};
  background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  box-shadow:
    inset -1px 0 0 rgba(255, 255, 255, 0.05),
    4px 0 25px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    transform: ${(p) => (p.$open ? "translateX(0)" : "translateX(-100%)")};
    width: 260px;
    box-shadow: ${(p) => (p.$open ? "4px 0 25px rgba(0,0,0,0.5)" : "none")};
  }
`;

const MenuArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 12px;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  height: 76px;
`;
const LogoIcon = styled.div`
  min-width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
`;
const LogoText = styled.div`
  font-weight: 800;
  font-size: 16px;
  color: #f8fafc;
  letter-spacing: 0.5px;
  white-space: nowrap;
`;

const Section = styled.div`
  padding: 14px 12px;
  margin-top: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 8px;
  .section-icon {
    font-size: 14px;
    margin-right: 12px;
  }
  .toggle-icon {
    font-size: 10px;
    transition: transform 0.3s;
  }
  &:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.03);
  }
`;

const SubMenu = styled.div`
  padding-left: 8px;
  margin-bottom: 8px;
  animation: ${expandAnimation} 0.3s ease-out forwards;
`;

const NavItem = styled.div`
  padding: 12px 14px;
  margin: 4px 0;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  background: ${(p) =>
    p.$active ? "rgba(59, 130, 246, 0.15)" : "transparent"};
  color: ${(p) => (p.$active ? "#60a5fa" : "#94a3b8")};
  box-shadow: ${(p) => (p.$active ? "inset 3px 0 0 #3b82f6" : "none")};
  i {
    min-width: 28px;
    font-size: 15px;
    transition: transform 0.3s ease;
  }
  &:hover {
    background: ${(p) =>
      p.$active ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)"};
    color: ${(p) => (p.$active ? "#93c5fd" : "#f8fafc")};
    transform: translateX(4px);
    i {
      transform: scale(1.15);
      color: ${(p) => (p.$active ? "#93c5fd" : "#3b82f6")};
    }
  }
`;

const BottomSection = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 16px 12px;
`;
const StyledLink = styled(NavLink)`
  text-decoration: none;
  color: inherit;
  display: block;
`;
