import React from "react";

export default function SummaryCard({ title, value, color }) {
  return (
    <div className="col-md-4">
      <div className="card p-3 shadow-sm">
        <small className="text-muted">{title}</small>
        <h5 className={`text-${color}`}>{value}</h5>
      </div>
    </div>
  );
}