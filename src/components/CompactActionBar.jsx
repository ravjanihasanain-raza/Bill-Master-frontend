import styled from "styled-components";

export const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

export const CompactBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;   /* 🔥 FIXED SMALL SIZE */
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--border-custom);
  background: var(--card);
  cursor: pointer;
  transition: 0.25s;

  &:hover {
    transform: translateY(-1px);
  }

  &.primary {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    border: none;
  }

  &.success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
  }

  &.ghost {
    background: transparent;
  }
`;