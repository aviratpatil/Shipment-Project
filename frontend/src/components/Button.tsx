import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--brand-gradient)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
  },
  secondary: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    boxShadow: "none",
  },
  outline: {
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
    boxShadow: "none",
  },
  danger: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    boxShadow: "none",
  },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "12px", borderRadius: "8px", gap: "5px" },
  md: { padding: "9px 18px", fontSize: "13px", borderRadius: "10px", gap: "7px" },
  lg: { padding: "12px 24px", fontSize: "14px", borderRadius: "12px", gap: "8px" },
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  style,
  disabled,
  ...props
}) => {
  const vs = VARIANT_STYLES[variant];
  const ss = SIZE_STYLES[size];

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
        fontWeight: 600,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
        userSelect: "none",
        ...vs,
        ...ss,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled || isLoading) return;
        const el = e.currentTarget;
        if (variant === "primary") {
          el.style.filter = "brightness(1.12)";
          el.style.transform = "translateY(-1px)";
          el.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)";
        } else {
          el.style.opacity = "0.8";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.filter = "";
        el.style.transform = "";
        el.style.boxShadow = vs.boxShadow as string ?? "";
        el.style.opacity = "1";
      }}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={14} style={{ animation: "spin 0.75s linear infinite" }} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};
