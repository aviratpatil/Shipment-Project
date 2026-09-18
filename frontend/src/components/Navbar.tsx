import React from "react";
import {
  Package,
  Users,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Shield,
  ChevronDown,
  BarChart3,
  Truck,
  ClipboardList,
} from "lucide-react";
import type { User } from "../types";

interface NavbarProps {
  currentTab: "dashboard" | "customers" | "shipments" | "analytics" | "fleet" | "manifest";
  onTabChange: (tab: "dashboard" | "customers" | "shipments" | "analytics" | "fleet" | "manifest") => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "customers" as const, label: "Customers", icon: Users },
  { id: "shipments" as const, label: "Shipments", icon: Package },
  { id: "fleet" as const, label: "Fleet", icon: Truck },
  { id: "manifest" as const, label: "Manifest", icon: ClipboardList },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onLogout,
  onOpenAuth,
}) => {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid var(--border)",
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {/* Logo */}
          <button
            onClick={() => onTabChange("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--brand-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
              }}
            >
              <Package size={18} strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.4px",
              }}
            >
              Shipment<span style={{ color: "#3b82f6" }}>Pro</span>
            </span>
          </button>

          {/* Navigation tabs */}
          <nav
            style={{
              display: "flex",
              gap: "2px",
              backgroundColor: "#f1f5f9",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = currentTab === id;
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "9px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.18s ease",
                    backgroundColor: active ? "#ffffff" : "transparent",
                    color: active ? "#2563eb" : "#64748b",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.7)";
                      e.currentTarget.style.color = "#334155";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#64748b";
                    }
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Auth section */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* User pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 12px 6px 8px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "#f8faff",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "var(--brand-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.2,
                    }}
                  >
                    {currentUser.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Shield
                      size={10}
                      color={currentUser.role === "ADMIN" ? "#7c3aed" : currentUser.role === "DRIVER" ? "#16a34a" : "#2563eb"}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: currentUser.role === "ADMIN" ? "#7c3aed" : currentUser.role === "DRIVER" ? "#16a34a" : "#2563eb",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <ChevronDown size={12} color="#94a3b8" />
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                title="Logout"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fef2f2";
                  e.currentTarget.style.borderColor = "#fecaca";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onOpenAuth}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8faff";
                  e.currentTarget.style.borderColor = "#bfdbfe";
                  e.currentTarget.style.color = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.color = "#475569";
                }}
              >
                <UserIcon size={13} />
                Sign In
              </button>
              <button
                onClick={onOpenAuth}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--brand-gradient)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.28)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(1.08)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(59,130,246,0.38)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.28)";
                }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
