import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

export const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.04) 25%,
    rgba(6, 182, 212, 0.12) 50%,
    rgba(59, 130, 246, 0.04) 75%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2.5s infinite linear;
  border-radius: ${(props) => props.$radius || "8px"};
  height: ${(props) => props.$height || "20px"};
  width: ${(props) => props.$width || "100%"};
  margin-bottom: ${(props) => props.$mb || "0"};
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
`;

// Reusable Table Rows Skeleton
export const SkeletonTableRows = ({ rows = 5, columns = 6 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} style={{ padding: "18px 20px" }}>
              <SkeletonBase 
                $width={j === 0 ? "60%" : j === columns - 1 ? "40px" : "80%"} 
                $height="18px" 
                $radius="6px" 
                style={j === columns - 1 ? { margin: "0 auto" } : {}}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Reusable Top Stat Card Skeleton
export const SkeletonStats = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "18px", padding: "10px 0" }}>
    <SkeletonBase $width="54px" $height="54px" $radius="16px" />
    <div style={{ flex: 1 }}>
      <SkeletonBase $width="40%" $height="12px" $mb="8px" />
      <SkeletonBase $width="70%" $height="24px" />
    </div>
  </div>
);

// Reusable Input Form Field Skeleton
export const SkeletonForm = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
    <SkeletonBase $width="30%" $height="12px" />
    <SkeletonBase $width="100%" $height="45px" $radius="14px" />
  </div>
);

// Reusable Basic Card/List Item Skeleton
export const SkeletonCard = () => (
  <div style={{ padding: "20px", border: "1px solid var(--border-custom)", borderRadius: "24px", background: "var(--card)" }}>
    <SkeletonBase $width="100%" $height="150px" $radius="12px" $mb="15px" />
    <SkeletonBase $width="60%" $height="20px" $mb="10px" />
    <SkeletonBase $width="40%" $height="14px" />
  </div>
);

// Grid wrapper for skeletons
export const SkeletonGrid = ({ count = 4, Component = SkeletonStats }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ background: "var(--card)", padding: "22px", borderRadius: "24px", border: "1px solid var(--border-custom)" }}>
        <Component />
      </div>
    ))}
  </div>
);