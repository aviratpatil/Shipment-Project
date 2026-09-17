import React, { useState } from "react";
import { Package, Lock, Mail, User as UserIcon, Shield, ArrowRight, Activity, CheckCircle } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { apiRequest } from "../api/client";
import type { User, UserRole } from "../types";

interface LoginViewProps {
  onSuccess: (user: User) => void;
  isDbConnected: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, isDbConnected }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        await apiRequest<User>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        });
        const loginRes = await apiRequest<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem("token", loginRes.data.token);
        onSuccess(loginRes.data.user);
      } else {
        const res = await apiRequest<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem("token", res.data.token);
        onSuccess(res.data.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px 60px",
        minHeight: "calc(100vh - 160px)",
      }}
    >
      {/* Brand Hero Header */}
      <div style={{ textAlign: "center", marginBottom: "32px", maxWidth: "460px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "var(--brand-gradient)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 10px 25px rgba(59,130,246,0.3)",
            marginBottom: "16px",
          }}
        >
          <Package size={28} strokeWidth={2.5} />
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.6px",
            margin: "0 0 8px 0",
          }}
        >
          Shipment<span style={{ color: "#3b82f6" }}>Pro</span>
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            margin: "0 0 12px 0",
            lineHeight: 1.5,
          }}
        >
          Enterprise logistics management, freight dispatch & live status auditing
        </p>

        {/* Backend health pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: 700,
            backgroundColor: isDbConnected ? "#ecfdf5" : "#fef2f2",
            color: isDbConnected ? "#059669" : "#dc2626",
            border: `1px solid ${isDbConnected ? "#a7f3d0" : "#fecaca"}`,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isDbConnected ? "#10b981" : "#ef4444",
              animation: isDbConnected ? "pulse-dot 2s infinite" : "none",
            }}
          />
          <Activity size={12} />
          {isDbConnected ? "API & Database Connected" : "Connecting to API…"}
        </div>
      </div>

      {/* Main Authentication Card */}
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "32px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Switcher Tab Pills */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#f1f5f9",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "24px",
            border: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "none",
              borderRadius: "9px",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.18s ease",
              backgroundColor: mode === "login" ? "#ffffff" : "transparent",
              color: mode === "login" ? "#2563eb" : "#64748b",
              boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "none",
              borderRadius: "9px",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.18s ease",
              backgroundColor: mode === "register" ? "#ffffff" : "transparent",
              color: mode === "register" ? "#2563eb" : "#64748b",
              boxShadow: mode === "register" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Card Title Subtext */}
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 4px 0",
              letterSpacing: "-0.3px",
            }}
          >
            {mode === "login" ? "Sign in to your account" : "Create operational profile"}
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
            {mode === "login"
              ? "Enter your credentials to access dispatch & tracking"
              : "Register as an operator or manager to manage shipments"}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {mode === "register" && (
            <div style={{ position: "relative" }}>
              <UserIcon
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  marginTop: "13px",
                  pointerEvents: "none",
                }}
              />
              <Input
                label="Full Name"
                placeholder="Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ paddingLeft: "38px" }}
              />
            </div>
          )}

          <div style={{ position: "relative" }}>
            <Mail
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                marginTop: "13px",
                pointerEvents: "none",
              }}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="user@shipmentpro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: "38px" }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Lock
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                marginTop: "13px",
                pointerEvents: "none",
              }}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingLeft: "38px" }}
            />
          </div>

          {mode === "register" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Shield size={12} color="#4f46e5" />
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <option value="USER">USER – Standard Logistics Staff</option>
                <option value="ADMIN">ADMIN – Full Manager / Superuser</option>
              </select>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            icon={<ArrowRight size={16} />}
            style={{ width: "100%", marginTop: "6px", padding: "12px" }}
          >
            {mode === "login" ? "Sign In to Dashboard" : "Create Account & Sign In"}
          </Button>
        </form>

        {/* Feature summary bullets */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {[
            "Role-based permission access (Admin & User)",
            "Live audit trail logging on every shipment update",
            "Customer directory with soft deletion protection",
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
