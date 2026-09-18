import React, { useState, useEffect, useCallback } from "react";
import {
  Truck as TruckIcon,
  Package,
  MapPin,
  Phone,
  CreditCard,
  Zap,
  Flag,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Clock,
  Hash,
} from "lucide-react";
import { apiRequest } from "../api/client";
import type { Driver, User } from "../types";

interface DriverPortalProps {
  currentUser: User;
  onLogout: () => void;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  IN_TRANSIT: { label: "In Transit", color: "#2563eb", bg: "#eff6ff" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#7c3aed", bg: "#f5f3ff" },
  DELIVERED: { label: "Delivered", color: "#16a34a", bg: "#f0fdf4" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
};

const TRUCK_STATUS_ICON: Record<string, React.ReactNode> = {
  NO_ALLOTMENT: <AlertTriangle size={16} />,
  READY: <Clock size={16} />,
  ACTIVE: <Zap size={16} />,
  INACTIVE: <AlertTriangle size={16} />,
};

export function DriverPortal({ currentUser, onLogout }: DriverPortalProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest<Driver>("/drivers/me");
      setDriver(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleStartJourney = async () => {
    if (!driver?.truck) return;
    if (driver.truck.shipments?.length === 0) {
      alert("No shipments loaded on your truck yet. Please wait for staff to load parcels.");
      return;
    }
    if (!confirm("Start your journey? All parcels in your truck will be marked IN_TRANSIT.")) return;
    setJourneyLoading(true);
    try {
      await apiRequest(`/trucks/${driver.truck.id}/start-journey`, { method: "POST" });
      await fetchProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleCompleteJourney = async () => {
    if (!driver?.truck) return;
    if (
      !confirm(
        "Confirm arrival at destination hub?\nAll parcels in your truck will automatically be marked OUT_FOR_DELIVERY."
      )
    )
      return;
    setJourneyLoading(true);
    try {
      await apiRequest(`/trucks/${driver.truck.id}/complete-journey`, { method: "POST" });
      await fetchProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJourneyLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <Loader2 size={32} color="#6366f1" style={{ animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading your driver portal…</p>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <AlertTriangle size={40} color="#ef4444" />
        <p style={{ color: "#f87171", fontSize: "15px", fontWeight: 600 }}>
          {error || "Driver profile not found."}
        </p>
        <button
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            borderRadius: "12px",
            border: "1px solid #475569",
            background: "transparent",
            color: "#94a3b8",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  const truck = driver.truck ?? null;
  const isActive = truck?.status === "ACTIVE";
  const isReady = truck?.status === "READY";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "24px",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TruckIcon size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              Shipment<span style={{ color: "#6366f1" }}>Pro</span>
              <span style={{ color: "#475569", fontWeight: 400, fontSize: "12px" }}> · Driver Portal</span>
            </span>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Signed in as {currentUser.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchProfile}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              padding: "8px 12px",
              cursor: "pointer",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
            }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "8px 14px",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Approval warning */}
        {!driver.isApproved && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "14px",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <AlertTriangle size={20} color="#f59e0b" />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24" }}>Account Pending Approval</div>
              <div style={{ fontSize: "12px", color: "#d97706", marginTop: "2px" }}>
                Your account is awaiting approval by a staff member. Please contact your dispatcher.
              </div>
            </div>
          </div>
        )}

        {/* Driver Profile Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Photo */}
          {driver.photoUrl ? (
            <img
              src={driver.photoUrl}
              alt={driver.user.name}
              style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #6366f1", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                border: "3px solid rgba(99,102,241,0.4)",
              }}
            >
              {driver.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px" }}>
              {driver.user.name}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 700,
                color: driver.isApproved && driver.isOnDuty ? "#34d399" : "#94a3b8",
                background: "rgba(255,255,255,0.08)",
                padding: "3px 10px",
                borderRadius: "20px",
                marginBottom: "10px",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: driver.isApproved && driver.isOnDuty ? "#34d399" : "#94a3b8", display: "inline-block" }} />
              {driver.isApproved ? (driver.isOnDuty ? "On Duty" : "Off Duty") : "Pending Approval"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "13px", color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Phone size={13} /> {driver.phone}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <CreditCard size={13} /> {driver.licenseNumber}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <MapPin size={13} /> {driver.address}
              </span>
            </div>
          </div>
        </div>

        {/* Truck Assignment Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isActive ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Your Truck
          </h2>

          {!truck ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "14px",
                border: "1.5px dashed rgba(255,255,255,0.1)",
              }}
            >
              <TruckIcon size={36} color="#475569" style={{ marginBottom: "10px" }} />
              <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 600, margin: 0 }}>No truck assigned yet</p>
              <p style={{ color: "#475569", fontSize: "12px", margin: "4px 0 0 0" }}>
                A dispatcher will assign you a truck before your shift starts.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background: isActive
                        ? "rgba(52,211,153,0.15)"
                        : isReady
                        ? "rgba(96,165,250,0.15)"
                        : "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isActive ? "#34d399" : isReady ? "#60a5fa" : "#64748b",
                      border: `1.5px solid ${isActive ? "rgba(52,211,153,0.3)" : isReady ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <TruckIcon size={26} />
                  </div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9" }}>{truck.name}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Hash size={12} />
                      {truck.plateNumber}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: isActive
                      ? "rgba(52,211,153,0.15)"
                      : isReady
                      ? "rgba(96,165,250,0.15)"
                      : "rgba(255,255,255,0.08)",
                    border: `1px solid ${isActive ? "rgba(52,211,153,0.3)" : isReady ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.1)"}`,
                    color: isActive ? "#34d399" : isReady ? "#60a5fa" : "#64748b",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {TRUCK_STATUS_ICON[truck.status]}
                  {truck.status}
                </div>
              </div>

              {/* Journey action */}
              {isReady && (
                <button
                  onClick={handleStartJourney}
                  disabled={journeyLoading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "none",
                    background: "linear-gradient(135deg, #16a34a, #059669)",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: 800,
                    cursor: journeyLoading ? "not-allowed" : "pointer",
                    opacity: journeyLoading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
                    marginBottom: "16px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {journeyLoading ? (
                    <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <Zap size={20} />
                  )}
                  🚀 Start Journey
                </button>
              )}

              {isActive && (
                <button
                  onClick={handleCompleteJourney}
                  disabled={journeyLoading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: 800,
                    cursor: journeyLoading ? "not-allowed" : "pointer",
                    opacity: journeyLoading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
                    marginBottom: "16px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {journeyLoading ? (
                    <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <Flag size={20} />
                  )}
                  🏁 Reached Destination (Mark Out for Delivery)
                </button>
              )}

              {/* Parcel list */}
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Your Parcels ({truck.shipments?.length ?? 0})
              </h3>

              {!truck.shipments || truck.shipments.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "12px",
                    color: "#475569",
                    fontSize: "13px",
                  }}
                >
                  <Package size={28} style={{ marginBottom: "8px", opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>No parcels loaded yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {truck.shipments.map((shipment) => {
                    const sc = STATUS_LABEL[shipment.status] ?? { label: shipment.status, color: "#64748b", bg: "#f1f5f9" };
                    return (
                      <div
                        key={shipment.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "14px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "rgba(99,102,241,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Package size={16} color="#818cf8" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
                              {shipment.trackingNumber}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: sc.color,
                                background: `${sc.color}20`,
                                padding: "2px 8px",
                                borderRadius: "20px",
                              }}
                            >
                              {sc.label}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", display: "flex", gap: "10px" }}>
                            {shipment.customer && (
                              <span>{shipment.customer.name}</span>
                            )}
                            <span>
                              {shipment.origin} → {shipment.destination}
                            </span>
                          </div>
                        </div>
                        {shipment.status === "DELIVERED" && (
                          <CheckCircle2 size={18} color="#34d399" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
