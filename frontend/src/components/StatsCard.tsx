import React from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "amber" | "purple" | "rose";
  subtitle?: string;
}

const COLOR_MAP = {
  blue: {
    gradient: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
    border: "#bfdbfe",
    icon: "#dbeafe",
    iconText: "#1d4ed8",
    accent: "#3b82f6",
    value: "#1e3a8a",
  },
  emerald: {
    gradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    border: "#a7f3d0",
    icon: "#d1fae5",
    iconText: "#065f46",
    accent: "#10b981",
    value: "#064e3b",
  },
  amber: {
    gradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    border: "#fde68a",
    icon: "#fef3c7",
    iconText: "#92400e",
    accent: "#f59e0b",
    value: "#78350f",
  },
  purple: {
    gradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    border: "#ddd6fe",
    icon: "#ede9fe",
    iconText: "#5b21b6",
    accent: "#8b5cf6",
    value: "#4c1d95",
  },
  rose: {
    gradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    border: "#fecdd3",
    icon: "#ffe4e6",
    iconText: "#9f1239",
    accent: "#f43f5e",
    value: "#881337",
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

  return (
    <div
      className="glass-card fade-up"
      style={{
        background: theme.gradient,
        border: `1px solid ${theme.border}`,
        borderRadius: "16px",
        padding: "22px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${theme.border}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: theme.icon,
          border: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.iconText,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: theme.iconText,
            margin: "0 0 4px 0",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {title}
        </p>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: theme.value,
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </div>
        {subtitle && (
          <p style={{ fontSize: "12px", color: theme.iconText, marginTop: "4px", opacity: 0.65 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
