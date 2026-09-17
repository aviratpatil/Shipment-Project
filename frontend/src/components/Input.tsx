import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, style, ...props }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          padding: "10px 14px",
          borderRadius: "10px",
          border: `1px solid ${error ? "#fca5a5" : "#cbd5e1"}`,
          backgroundColor: "#ffffff",
          color: "var(--text-primary)",
          fontSize: "14px",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          width: "100%",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#3b82f6";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "#fca5a5" : "#cbd5e1";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...props}
      />
      {error && (
        <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "2px", fontWeight: 500 }}>{error}</p>
      )}
    </div>
  );
};
