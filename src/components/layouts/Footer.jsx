import React from "react";
import styled from "styled-components";

export default function Footer() {
  return (
    <FooterBar>
      © {new Date().getFullYear()} Abson Energy 
    </FooterBar>
  );
}

const FooterBar = styled.div`
  height: 50px;
  background: #111827;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
`;