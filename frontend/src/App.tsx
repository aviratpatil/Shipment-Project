import { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardView } from "./components/DashboardView";
import { CustomersView } from "./components/CustomersView";
import { ShipmentsView } from "./components/ShipmentsView";
import { LoginView } from "./components/LoginView";
import { AnalyticsView } from "./components/AnalyticsView";
import { ChatBot } from "./components/ChatBot";
import { NotificationToast } from "./components/NotificationToast";
import { apiRequest } from "./api/client";
import type { Customer, Shipment, User } from "./types";
import { Loader2 } from "lucide-react";

export function App() {
  const [currentTab, setCurrentTab] = useState<"dashboard" | "customers" | "shipments" | "analytics">("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setCurrentUser(null); return; }
    try {
      const res = await apiRequest<User>("/auth/me");
      setCurrentUser(res.data);
    } catch {
      localStorage.removeItem("token");
      setCurrentUser(null);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/health");
      const data = await response.json();
      setIsDbConnected(data.status === "ok" && data.database === "connected");
    } catch {
      setIsDbConnected(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [custRes, shipRes] = await Promise.all([
        apiRequest<Customer[]>("/customers?limit=100"),
        apiRequest<Shipment[]>("/shipments"),
      ]);
      setCustomers(custRes.data);
      setShipments(shipRes.data);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchProfile().finally(() => setIsLoading(false));
  }, [checkHealth, fetchProfile]);

  // Fetch data once user is authenticated
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setCurrentTab("dashboard");
    // Clear app data on logout for security
    setCustomers([]);
    setShipments([]);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab("dashboard");
  };

  // ── Initial loading splash ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          backgroundColor: "var(--bg-base)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(59,130,246,0.3)",
          }}
        >
          <Loader2
            size={24}
            color="#fff"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 4px 0",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Connecting to Logistics API
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
            Please wait…
          </p>
        </div>
      </div>
    );
  }

  // ── Not authenticated → show full-page Login/Register view ─────────────────
  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-base)" }}>
        {/* Minimal header for unauthenticated users */}
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
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>
              Shipment<span style={{ color: "#3b82f6" }}>Pro</span>
            </span>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          <LoginView
            onSuccess={handleLoginSuccess}
            isDbConnected={isDbConnected}
          />
        </main>

        <footer
          style={{
            borderTop: "1px solid var(--border)",
            padding: "14px 24px",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--text-muted)",
            backgroundColor: "#ffffff",
          }}
        >
          ShipmentPro &copy; {new Date().getFullYear()} · Logistics Management Platform
        </footer>
      </div>
    );
  }

  // ── Authenticated → show full dashboard ────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => {}}
      />

      <main
        style={{
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px 80px 24px",
          flex: 1,
        }}
      >
        {currentTab === "dashboard" && (
          <DashboardView
            customers={customers}
            shipments={shipments}
            isDbConnected={isDbConnected}
            onOpenAddCustomer={() => setCurrentTab("customers")}
            onOpenAddShipment={() => setCurrentTab("shipments")}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === "customers" && (
          <CustomersView
            customers={customers}
            currentUser={currentUser}
            onRefresh={fetchData}
            onOpenAuth={() => {}}
          />
        )}
        {currentTab === "shipments" && (
          <ShipmentsView
            shipments={shipments}
            customers={customers}
            currentUser={currentUser}
            onRefresh={fetchData}
            onOpenAuth={() => {}}
          />
        )}
        {currentTab === "analytics" && <AnalyticsView />}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 24px",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--text-muted)",
          backgroundColor: "#ffffff",
        }}
      >
        ShipmentPro &copy; {new Date().getFullYear()} · Logistics Management Platform
      </footer>

      {/* Module 4 – AI Chatbot (global floating widget) */}
      <ChatBot />

      {/* Module 5 – Real-time WebSocket notifications */}
      <NotificationToast />
    </div>
  );
}

export default App;
