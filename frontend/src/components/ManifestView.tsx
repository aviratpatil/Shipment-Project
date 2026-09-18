import { useState, useEffect, useCallback } from "react";
import {
  Truck as TruckIcon,
  Package,
  Plus,
  Minus,
  RefreshCw,
  ChevronLeft,
  Search,
  Loader2,
  Zap,
  CheckCircle2,
  MapPin,
  Hash,
  User as UserIcon,
  Flag,
} from "lucide-react";
import { apiRequest } from "../api/client";
import type { Truck, Shipment, User, TruckStatus } from "../types";

interface ManifestViewProps {
  currentUser: User;
  onBack: () => void;
}

const STATUS_COLORS: Record<TruckStatus, { border: string; bg: string; text: string }> = {
  NO_ALLOTMENT: { border: "#fbbf24", bg: "#fffbeb", text: "#92400e" },
  READY: { border: "#60a5fa", bg: "#eff6ff", text: "#1d4ed8" },
  ACTIVE: { border: "#34d399", bg: "#f0fdf4", text: "#065f46" },
  INACTIVE: { border: "#f87171", bg: "#fef2f2", text: "#991b1b" },
};

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "#d97706",
  IN_TRANSIT: "#2563eb",
  OUT_FOR_DELIVERY: "#7c3aed",
  DELIVERED: "#16a34a",
  CANCELLED: "#dc2626",
};

export function ManifestView({ currentUser, onBack }: ManifestViewProps) {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showLoadPicker, setShowLoadPicker] = useState(false);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const canManage = currentUser.role === "ADMIN" || currentUser.role === "USER";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        apiRequest<Truck[]>("/trucks"),
        apiRequest<Shipment[]>("/shipments"),
      ]);
      setTrucks(tRes.data);
      const pending = sRes.data.filter((s) => s.status === "PENDING" && !s.truckId);
      setPendingShipments(pending);

      // If we have a selected truck, refresh it
      if (selectedTruck) {
        const refreshed = tRes.data.find((t) => t.id === selectedTruck.id);
        setSelectedTruck(refreshed ?? null);
      }
    } catch (err) {
      console.error("Manifest fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTruck?.id]);

  useEffect(() => { fetchData(); }, []);

  const handleLoadShipment = async (shipmentId: string) => {
    if (!selectedTruck) return;
    setLoadingAction(shipmentId);
    try {
      await apiRequest(`/trucks/${selectedTruck.id}/load`, {
        method: "POST",
        body: JSON.stringify({ shipmentId }),
      });
      await fetchData();
      setShowLoadPicker(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUnloadShipment = async (shipmentId: string) => {
    if (!selectedTruck) return;
    if (!confirm("Unload this shipment from the truck?")) return;
    setLoadingAction(shipmentId);
    try {
      await apiRequest(`/trucks/${selectedTruck.id}/unload`, {
        method: "POST",
        body: JSON.stringify({ shipmentId }),
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartJourney = async () => {
    if (!selectedTruck) return;
    if (selectedTruck.shipments.length === 0) {
      alert("Cannot start journey: truck has no shipments loaded.");
      return;
    }
    if (!confirm(`Start journey for ${selectedTruck.name}?\nAll ${selectedTruck.shipments.length} parcel(s) will be marked IN_TRANSIT.`)) return;
    setJourneyLoading(true);
    try {
      await apiRequest(`/trucks/${selectedTruck.id}/start-journey`, { method: "POST" });
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleCompleteJourney = async () => {
    if (!selectedTruck) return;
    if (
      !confirm(
        `Truck arrived at destination hub for ${selectedTruck.name}?\nAll ${selectedTruck.shipments.length} parcel(s) will automatically be updated to OUT_FOR_DELIVERY.`
      )
    )
      return;
    setJourneyLoading(true);
    try {
      await apiRequest(`/trucks/${selectedTruck.id}/complete-journey`, { method: "POST" });
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJourneyLoading(false);
    }
  };

  const filteredTrucks = trucks.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.plateNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={15} />
          Fleet
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
            Truck Manifest
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "#64748b" }}>
            Load and track shipments on each truck
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
          <button
            onClick={fetchData}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", borderRadius: "12px", border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "13px", color: "#64748b", cursor: "pointer" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedTruck ? "280px 1fr" : "1fr", gap: "20px" }}>
        {/* LEFT: Truck list */}
        <div>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trucks..."
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 36px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", outline: "none" }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: "#94a3b8" }}>
              <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredTrucks.map((truck) => {
                const loaded = truck._count?.shipments ?? truck.shipments.length;
                const pct = truck.capacity > 0 ? Math.min((loaded / truck.capacity) * 100, 100) : 0;
                const cfg = STATUS_COLORS[truck.status];
                const isSelected = selectedTruck?.id === truck.id;

                return (
                  <button
                    key={truck.id}
                    onClick={() => setSelectedTruck(isSelected ? null : truck)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "14px",
                      borderRadius: "14px",
                      border: `2px solid ${isSelected ? "#3b82f6" : cfg.border}`,
                      background: isSelected ? "#eff6ff" : cfg.bg,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{truck.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>#{truck.plateNumber}</div>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: cfg.text,
                          background: "white",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        {truck.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                      {loaded} / {truck.capacity} parcels
                    </div>
                    <div style={{ height: "5px", borderRadius: "4px", background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: pct >= 100 ? "#dc2626" : pct >= 75 ? "#d97706" : "#3b82f6",
                          borderRadius: "4px",
                          transition: "width 0.4s",
                        }}
                      />
                    </div>
                    {truck.driver && (
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <UserIcon size={11} />
                        {truck.driver.user.name}
                      </div>
                    )}
                  </button>
                );
              })}
              {filteredTrucks.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                  No trucks found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Truck detail / manifest */}
        {selectedTruck && (
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            {/* Truck header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <TruckIcon size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                    {selectedTruck.name}
                  </h2>
                  <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                    <Hash size={12} />
                    {selectedTruck.plateNumber}
                    {selectedTruck.driver && (
                      <>
                        <span style={{ color: "#cbd5e1" }}>·</span>
                        <UserIcon size={12} />
                        {selectedTruck.driver.user.name}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Journey buttons */}
              {canManage && (
                <div style={{ display: "flex", gap: "10px" }}>
                  {selectedTruck.status === "READY" && (
                    <button
                      onClick={handleStartJourney}
                      disabled={journeyLoading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 18px",
                        borderRadius: "12px",
                        border: "none",
                        background: "linear-gradient(135deg, #16a34a, #059669)",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: journeyLoading ? "not-allowed" : "pointer",
                        opacity: journeyLoading ? 0.7 : 1,
                        boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                      }}
                    >
                      {journeyLoading ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Zap size={14} />}
                      Start Journey
                    </button>
                  )}
                  {selectedTruck.status === "ACTIVE" && (
                    <button
                      onClick={handleCompleteJourney}
                      disabled={journeyLoading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 18px",
                        borderRadius: "12px",
                        border: "none",
                        background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: journeyLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                      }}
                    >
                      {journeyLoading ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Flag size={14} />}
                      🏁 Reached Hub (Out for Delivery)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Capacity bar */}
            <div
              style={{
                padding: "16px",
                borderRadius: "14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Loading Capacity</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color:
                      selectedTruck.shipments.length >= selectedTruck.capacity
                        ? "#dc2626"
                        : selectedTruck.shipments.length >= selectedTruck.capacity * 0.75
                        ? "#d97706"
                        : "#16a34a",
                  }}
                >
                  {selectedTruck.shipments.length} / {selectedTruck.capacity} Parcels
                </span>
              </div>
              <div style={{ height: "10px", borderRadius: "6px", background: "#e2e8f0", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min((selectedTruck.shipments.length / selectedTruck.capacity) * 100, 100)}%`,
                    background:
                      selectedTruck.shipments.length >= selectedTruck.capacity
                        ? "#dc2626"
                        : selectedTruck.shipments.length >= selectedTruck.capacity * 0.75
                        ? "#d97706"
                        : "linear-gradient(90deg, #3b82f6, #6366f1)",
                    borderRadius: "6px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            {/* Shipments list */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                Loaded Shipments
              </h3>
              {canManage && selectedTruck.status !== "ACTIVE" && selectedTruck.shipments.length < selectedTruck.capacity && (
                <button
                  onClick={() => setShowLoadPicker(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={13} />
                  Load Parcel
                </button>
              )}
            </div>

            {selectedTruck.shipments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border: "1.5px dashed #cbd5e1",
                }}
              >
                <Package size={36} color="#cbd5e1" style={{ marginBottom: "10px" }} />
                <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
                  No parcels loaded
                </p>
                <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
                  Click "Load Parcel" to add PENDING shipments
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedTruck.shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#3b82f6",
                        flexShrink: 0,
                      }}
                    >
                      <Package size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                          {shipment.trackingNumber}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: SHIPMENT_STATUS_COLORS[shipment.status],
                            background: `${SHIPMENT_STATUS_COLORS[shipment.status]}18`,
                            padding: "2px 8px",
                            borderRadius: "20px",
                          }}
                        >
                          {shipment.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {shipment.customer && (
                          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <UserIcon size={10} />
                            {shipment.customer.name}
                          </span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <MapPin size={10} />
                          {shipment.origin} → {shipment.destination}
                        </span>
                      </div>
                    </div>
                    {canManage && selectedTruck.status !== "ACTIVE" && (
                      <button
                        onClick={() => handleUnloadShipment(shipment.id)}
                        disabled={loadingAction === shipment.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "1.5px solid #fecaca",
                          background: "#fff",
                          color: "#dc2626",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title="Unload"
                      >
                        {loadingAction === shipment.id ? (
                          <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                        ) : (
                          <Minus size={12} />
                        )}
                        Unload
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Placeholder when no truck selected */}
        {!selectedTruck && !loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              background: "#f8fafc",
              borderRadius: "20px",
              border: "1.5px dashed #cbd5e1",
              color: "#94a3b8",
            }}
          >
            <TruckIcon size={48} style={{ marginBottom: "12px", opacity: 0.4 }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#64748b" }}>Select a truck to view its manifest</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Click any truck on the left panel</p>
          </div>
        )}
      </div>

      {/* Load Parcel Picker Modal */}
      {showLoadPicker && selectedTruck && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowLoadPicker(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#fff",
                borderBottom: "1px solid #f1f5f9",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Load Parcel</h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  {selectedTruck.shipments.length}/{selectedTruck.capacity} slots used
                </p>
              </div>
              <button
                onClick={() => setShowLoadPicker(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "10px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "16px 24px 24px" }}>
              {pendingShipments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                  <CheckCircle2 size={36} style={{ marginBottom: "10px", opacity: 0.4 }} />
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>No unloaded pending shipments</p>
                  <p style={{ fontSize: "12px", margin: 0 }}>All pending shipments are already on trucks</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {pendingShipments.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid #e2e8f0",
                        background: "#f8fafc",
                      }}
                    >
                      <Package size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{s.trackingNumber}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {s.customer?.name ?? "—"} · {s.origin} → {s.destination}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadShipment(s.id)}
                        disabled={loadingAction === s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "7px 12px",
                          borderRadius: "8px",
                          border: "none",
                          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {loadingAction === s.id ? (
                          <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                        ) : (
                          <Plus size={12} />
                        )}
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
