import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { DatabaseBackup } from "lucide-react";

const EmptyContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  width: 100%;

  .icon-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 24px;
    background: rgba(59, 130, 246, 0.08);
    border: 1px dashed rgba(59, 130, 246, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    color: #3b82f6;
  }

  h3 {
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: var(--text-muted);
    max-width: 320px;
    margin: 0 auto;
  }
`;

export default function PremiumEmptyState({
  icon,
  title = "No Data Found",
  subtitle = "There are no records matching your current filters.",
}) {

  // ✅ FIX: handle BOTH JSX & Component
  const renderIcon = () => {
    if (!icon) {
      return <DatabaseBackup size={36} strokeWidth={1.5} />;
    }

    // JSX case
    if (React.isValidElement(icon)) {
      return icon;
    }

    // Component case
    const IconComponent = icon;
    return <IconComponent size={36} strokeWidth={1.5} />;
  };

  return (
    <EmptyContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="icon-wrapper">
        {renderIcon()}
      </div>

      <h3>{title}</h3>
      <p>{subtitle}</p>
    </EmptyContainer>
  );
}