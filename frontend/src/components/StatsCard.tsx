import React, { useState } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "amber" | "purple" | "rose";
  subtitle?: string;
}

const COLOR_MAP = {
  blue: {
    iconBg: "#eff6ff",
    iconBorder: "#dbeafe",
    iconText: "#2563eb",
    accent: "#3b82f6",
  },
  emerald: {
    iconBg: "#ecfdf5",
    iconBorder: "#d1fae5",
    iconText: "#059669",
    accent: "#10b981",
  },
  amber: {
    iconBg: "#fffbeb",
    iconBorder: "#fef3c7",
    iconText: "#d97706",
    accent: "#f59e0b",
  },
  purple: {
    iconBg: "#f5f3ff",
    iconBorder: "#ede9fe",
    iconText: "#7c3aed",
    accent: "#8b5cf6",
  },
  rose: {
    iconBg: "#fff1f2",
    iconBorder: "#ffe4e6",
    iconText: "#e11d48",
    accent: "#f43f5e",
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  const theme = COLOR_MAP[color];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${isHovered ? "#cbd5e1" : "#E5E7EB"}`,
        borderRadius: "16px",
        padding: "20px 22px",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        position: "relative",
        cursor: "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        boxShadow: isHovered
          ? "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon with light accent container */}
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "12px",
          backgroundColor: theme.iconBg,
          border: `1px solid ${theme.iconBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.iconText,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Typography Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#6b7280",
            margin: "0 0 4px 0",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </p>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#9ca3af",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

