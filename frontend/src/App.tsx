import { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardView } from "./components/DashboardView";
import { CustomersView } from "./components/CustomersView";
import { ShipmentsView } from "./components/ShipmentsView";
import { AuthModal } from "./components/AuthModal";
import { apiRequest } from "./api/client";
import type { Customer, Shipment, User } from "./types";
import { Loader2 } from "lucide-react";

export function App() {
  const [currentTab, setCurrentTab] = useState<"dashboard" | "customers" | "shipments">("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
    fetchProfile();
    fetchData();
  }, [checkHealth, fetchProfile, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main
        style={{
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px",
          flex: 1,
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "120px 0",
              gap: "16px",
            }}
          >
            {/* Animated logo */}
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
                Loading shipments & customer data…
              </p>
            </div>
          </div>
        ) : (
          <>
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
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}
            {currentTab === "shipments" && (
              <ShipmentsView
                shipments={shipments}
                customers={customers}
                currentUser={currentUser}
                onRefresh={fetchData}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}
          </>
        )}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          fetchData();
        }}
      />
    </div>
  );
}

export default App;
