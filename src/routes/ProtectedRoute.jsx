import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const stored = localStorage.getItem("adminAuth");

  if (!stored) return <Navigate to="/" replace />;

  const user = JSON.parse(stored);

  if (!user.token || user.role !== "Admin") {
    localStorage.removeItem("adminAuth");
    return <Navigate to="/" replace />;
  }

  return children;
}