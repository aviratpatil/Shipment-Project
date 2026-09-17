import React from "react";
import type { CustomerStatus, ShipmentStatus } from "../types";

interface StatusBadgeProps {
  status: ShipmentStatus | CustomerStatus;
}

const CONFIG: Record<
  string,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  Active: {
    bg: "var(--status-active-bg)",
    text: "var(--status-active-text)",
    border: "var(--status-active-border)",
    dot: "#10b981",
    label: "Active",
  },
  Inactive: {
    bg: "var(--status-inactive-bg)",
    text: "var(--status-inactive-text)",
    border: "var(--status-inactive-border)",
    dot: "#ef4444",
    label: "Inactive",
  },
  PENDING: {
    bg: "var(--status-pending-bg)",
    text: "var(--status-pending-text)",
    border: "var(--status-pending-border)",
    dot: "#f59e0b",
    label: "Pending",
  },
  IN_TRANSIT: {
    bg: "var(--status-transit-bg)",
    text: "var(--status-transit-text)",
    border: "var(--status-transit-border)",
    dot: "#3b82f6",
    label: "In Transit",
  },
  OUT_FOR_DELIVERY: {
    bg: "var(--status-delivery-bg)",
    text: "var(--status-delivery-text)",
    border: "var(--status-delivery-border)",
    dot: "#8b5cf6",
    label: "Out for Delivery",
  },
  DELIVERED: {
    bg: "var(--status-delivered-bg)",
    text: "var(--status-delivered-text)",
    border: "var(--status-delivered-border)",
    dot: "#10b981",
    label: "Delivered",
  },
  CANCELLED: {
    bg: "var(--status-cancelled-bg)",
    text: "var(--status-cancelled-text)",
    border: "var(--status-cancelled-border)",
    dot: "#ef4444",
    label: "Cancelled",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = CONFIG[status] ?? {
    bg: "rgba(100,116,139,0.12)",
    text: "#94a3b8",
    border: "rgba(100,116,139,0.2)",
    dot: "#64748b",
    label: status,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        backgroundColor: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: cfg.dot,
          flexShrink: 0,
          boxShadow: `0 0 4px ${cfg.dot}`,
        }}
      />
      {cfg.label}
    </span>
  );
};
