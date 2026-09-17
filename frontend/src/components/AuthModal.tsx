import React, { useState } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { apiRequest } from "../api/client";
import type { User, UserRole } from "../types";
import { Lock, Mail, User as UserIcon, Shield } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(""); setEmail(""); setPassword(""); setRole("USER"); setError(null);
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
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
        reset();
        onClose();
      } else {
        const res = await apiRequest<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem("token", res.data.token);
        onSuccess(res.data.user);
        reset();
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title={mode === "login" ? "Welcome back" : "Create account"}
    >
      {/* Mode switcher */}
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
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              borderRadius: "9px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.18s ease",
              backgroundColor: mode === m ? "#ffffff" : "transparent",
              color: mode === m ? "#2563eb" : "#64748b",
              boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {m === "login" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>⚠</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {mode === "register" && (
          <div style={{ position: "relative" }}>
            <UserIcon
              size={15}
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
              style={{ paddingLeft: "36px" }}
            />
          </div>
        )}

        <div style={{ position: "relative" }}>
          <Mail
            size={15}
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
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ paddingLeft: "36px" }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <Lock
            size={15}
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
            style={{ paddingLeft: "36px" }}
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
              <Shield size={11} />
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
              <option value="USER">USER – Standard Operations Staff</option>
              <option value="ADMIN">ADMIN – Full Manager Privileges</option>
            </select>
          </div>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          style={{ width: "100%", marginTop: "4px", padding: "12px" }}
        >
          {mode === "login" ? "Sign In →" : "Create Account →"}
        </Button>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "12px",
            }}
          >
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </form>
    </Modal>
  );
};
