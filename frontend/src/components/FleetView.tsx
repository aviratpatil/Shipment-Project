import React, { useState, useEffect, useCallback } from "react";
import {
  Truck as TruckIcon,
  User as UserIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  Zap,
  ArrowRight,
  X,
  Loader2,
  Hash,
  Layers,
  Power,
  Clock,
  UserCheck,
  UserX,
  ClipboardList,
} from "lucide-react";
import { apiRequest } from "../api/client";
import type { Truck, Driver, User, TruckStatus, ShortageCheck } from "../types";

interface FleetViewProps {
  currentUser: User;
  onOpenManifest: () => void;
}

type FleetTab = "trucks" | "drivers";

// ─── Status Helpers ──────────────────────────────────────────────────────────

const TRUCK_STATUS_CONFIG: Record<
  TruckStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  NO_ALLOTMENT: {
    label: "No Driver",
    color: "#d97706",
    bg: "#fffbeb",
    icon: <AlertTriangle size={12} />,
  },
  READY: {
    label: "Ready",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: <Clock size={12} />,
  },
  ACTIVE: {
    label: "Active",
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: <Zap size={12} />,
  },
  INACTIVE: {
    label: "Maintenance",
    color: "#dc2626",
    bg: "#fef2f2",
    icon: <Power size={12} />,
  },
};

function TruckStatusBadge({ status }: { status: TruckStatus }) {
  const cfg = TRUCK_STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}22`,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Capacity Bar ─────────────────────────────────────────────────────────────

function CapacityBar({ loaded, capacity }: { loaded: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((loaded / capacity) * 100, 100) : 0;
  const color = pct >= 100 ? "#dc2626" : pct >= 75 ? "#d97706" : "#16a34a";
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#64748b",
          marginBottom: "4px",
        }}
      >
        <span>Parcels loaded</span>
        <span style={{ fontWeight: 700, color }}>
          {loaded}/{capacity}
        </span>
      </div>
      <div
        style={{
          height: "6px",
          borderRadius: "4px",
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "4px",
            background: color,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Driver Avatar ────────────────────────────────────────────────────────────

function DriverAvatar({
  driver,
  size = 40,
}: {
  driver: Driver;
  size?: number;
}) {
  const initials = driver.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return driver.photoUrl ? (
    <img
      src={driver.photoUrl}
      alt={driver.user.name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: "2px solid #e2e8f0",
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.38,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 24px 0 24px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "10px",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "0 24px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        htmlFor={id}
        style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}
      >
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 14px",
          borderRadius: "10px",
          border: "1.5px solid #e2e8f0",
          fontSize: "14px",
          color: "#0f172a",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
    </div>
  );
}

// ─── Add/Edit Truck Modal ─────────────────────────────────────────────────────

function TruckFormModal({
  truck,
  onClose,
  onSaved,
}: {
  truck?: Truck | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(truck?.name ?? "");
  const [plateNumber, setPlateNumber] = useState(truck?.plateNumber ?? "");
  const [capacity, setCapacity] = useState(String(truck?.capacity ?? 20));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !plateNumber.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (truck) {
        await apiRequest(`/trucks/${truck.id}`, {
          method: "PUT",
          body: JSON.stringify({ name, plateNumber, capacity: Number(capacity) }),
        });
      } else {
        await apiRequest("/trucks", {
          method: "POST",
          body: JSON.stringify({ name, plateNumber, capacity: Number(capacity) }),
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={truck ? "Edit Truck" : "Add New Truck"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Truck Name / Model" id="truck-name" value={name} onChange={setName} placeholder="e.g. Tata LPT 1618" required />
        <Field label="License Plate Number" id="truck-plate" value={plateNumber} onChange={setPlateNumber} placeholder="e.g. MH-12-AB-1234" required />
        <Field label="Max Parcel Capacity" id="truck-capacity" type="number" value={capacity} onChange={setCapacity} placeholder="20" required />
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading && <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />}
          {truck ? "Save Changes" : "Add Truck"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Add Driver Modal ─────────────────────────────────────────────────────────

function DriverFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    licenseNumber: "",
    photoUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("/drivers/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          photoUrl: form.photoUrl || undefined,
        }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Register New Driver" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Full Name" id="d-name" value={form.name} onChange={set("name")} placeholder="John Doe" required />
        <Field label="Email Address" id="d-email" type="email" value={form.email} onChange={set("email")} placeholder="driver@company.com" required />
        <Field label="Temporary Password" id="d-password" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required />
        <Field label="Phone Number" id="d-phone" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" required />
        <Field label="Home Address" id="d-address" value={form.address} onChange={set("address")} placeholder="Full residential address" required />
        <Field label="Driving License No." id="d-license" value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="DL-1234567890" required />
        <Field label="Profile Photo URL (optional)" id="d-photo" value={form.photoUrl} onChange={set("photoUrl")} placeholder="https://example.com/photo.jpg" />
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fffbeb", border: "1px solid #fde68a", fontSize: "12px", color: "#92400e", marginBottom: "16px" }}>
          ⚠️ After registration, the driver won't have access until you <strong>approve</strong> them.
        </div>
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading && <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />}
          Register Driver
        </button>
      </form>
    </Modal>
  );
}

// ─── Assign Driver Modal ──────────────────────────────────────────────────────

function AssignDriverModal({
  truck,
  drivers,
  onClose,
  onSaved,
}: {
  truck: Truck;
  drivers: Driver[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eligible = drivers.filter((d) => d.isApproved && d.isOnDuty && !d.truck);

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/trucks/${truck.id}/assign-driver`, {
        method: "POST",
        body: JSON.stringify({ driverId: selectedDriverId }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Assign Driver to ${truck.name}`} onClose={onClose}>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
        Select an available, approved, on-duty driver:
      </p>
      {eligible.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "12px" }}>
          No eligible drivers available right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {eligible.map((d) => (
            <label
              key={d.id}
              htmlFor={`driver-${d.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "12px",
                border: `2px solid ${selectedDriverId === d.id ? "#6366f1" : "#e2e8f0"}`,
                cursor: "pointer",
                background: selectedDriverId === d.id ? "#f5f3ff" : "#fff",
                transition: "all 0.15s",
              }}
            >
              <input
                type="radio"
                id={`driver-${d.id}`}
                name="driver"
                value={d.id}
                checked={selectedDriverId === d.id}
                onChange={() => setSelectedDriverId(d.id)}
                style={{ accentColor: "#6366f1" }}
              />
              <DriverAvatar driver={d} size={36} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{d.user.name}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {d.phone} · {d.licenseNumber}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>
          {error}
        </div>
      )}
      <button
        onClick={handleAssign}
        disabled={loading || !selectedDriverId}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 700,
          cursor: loading || !selectedDriverId ? "not-allowed" : "pointer",
          opacity: loading || !selectedDriverId ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading && <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />}
        Assign Driver
      </button>
    </Modal>
  );
}

// ─── Main FleetView Component ─────────────────────────────────────────────────

export function FleetView({ currentUser, onOpenManifest }: FleetViewProps) {
  const [tab, setTab] = useState<FleetTab>("trucks");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [shortage, setShortage] = useState<ShortageCheck | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAddTruck, setShowAddTruck] = useState(false);
  const [editTruck, setEditTruck] = useState<Truck | null>(null);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [assignTruck, setAssignTruck] = useState<Truck | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManage = currentUser.role === "ADMIN" || currentUser.role === "USER";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, dRes, sRes] = await Promise.all([
        apiRequest<Truck[]>("/trucks"),
        apiRequest<Driver[]>("/drivers"),
        apiRequest<ShortageCheck>("/trucks/shortage"),
      ]);
      setTrucks(tRes.data);
      setDrivers(dRes.data);
      setShortage(sRes.data);
    } catch (err) {
      console.error("Fleet fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteTruck = async (truckId: string) => {
    if (!confirm("Delete this truck? All loaded shipments will be unloaded.")) return;
    setActionLoading(truckId);
    try {
      await apiRequest(`/trucks/${truckId}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveDriver = async (truckId: string) => {
    if (!confirm("Remove driver from this truck? Truck will go back to NO_ALLOTMENT.")) return;
    setActionLoading(truckId);
    try {
      await apiRequest(`/trucks/${truckId}/remove-driver`, { method: "POST" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoAllot = async () => {
    setActionLoading("auto-allot");
    try {
      const res = await apiRequest<{ allotmentsCreated: number; shortageCount: number }>("/trucks/auto-allot", { method: "POST" });
      const result = res.data;
      alert(`✅ Auto-allotment complete!\n${result.allotmentsCreated} driver(s) assigned.${result.shortageCount > 0 ? `\n⚠️ ${result.shortageCount} truck(s) still need a driver.` : ""}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveDriver = async (driverId: string) => {
    setActionLoading(driverId);
    try {
      await apiRequest(`/drivers/${driverId}/approve`, { method: "POST" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm("Remove this driver from the system? Their user account will also be deleted.")) return;
    setActionLoading(driverId);
    try {
      await apiRequest(`/drivers/${driverId}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDuty = async (driver: Driver) => {
    setActionLoading(driver.id);
    try {
      await apiRequest(`/drivers/${driver.id}`, {
        method: "PUT",
        body: JSON.stringify({ isOnDuty: !driver.isOnDuty }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "26px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
            Fleet Management
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            Manage trucks, drivers, and dispatch operations
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={onOpenManifest}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#2563eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#374151"; }}
          >
            <ClipboardList size={15} />
            Manifest View
            <ChevronRight size={14} />
          </button>

          {canManage && (
            <button
              onClick={handleAutoAllot}
              disabled={actionLoading === "auto-allot"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                fontSize: "13px",
                fontWeight: 700,
                color: "#fff",
                cursor: actionLoading === "auto-allot" ? "not-allowed" : "pointer",
                opacity: actionLoading === "auto-allot" ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
              }}
            >
              {actionLoading === "auto-allot" ? (
                <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
              ) : (
                <Zap size={14} />
              )}
              Auto-Allot Drivers
            </button>
          )}

          <button
            onClick={fetchData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              fontSize: "13px",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Shortage alert banner */}
      {shortage?.hasShortage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "16px 20px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
            border: "1.5px solid #fbbf24",
            marginBottom: "24px",
            boxShadow: "0 4px 16px rgba(251,191,36,0.15)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#92400e" }}>
              ⚠️ Driver Shortage Alert — {shortage.shortageCount} Driver{shortage.shortageCount > 1 ? "s" : ""} Needed!
            </div>
            <div style={{ fontSize: "12px", color: "#b45309", marginTop: "2px" }}>
              {shortage.readyTrucks} truck{shortage.readyTrucks !== 1 ? "s" : ""} waiting for dispatch, but only {shortage.availableDrivers} driver{shortage.availableDrivers !== 1 ? "s" : ""} available.
              Please assign more drivers or mark them on-duty.
            </div>
          </div>
          <ArrowRight size={18} color="#d97706" />
        </div>
      )}

      {/* Stats Row */}
      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            { label: "Total Trucks", value: trucks.length, color: "#3b82f6", icon: <TruckIcon size={18} /> },
            { label: "Active (Moving)", value: trucks.filter((t) => t.status === "ACTIVE").length, color: "#16a34a", icon: <Zap size={18} /> },
            { label: "Ready to Depart", value: trucks.filter((t) => t.status === "READY").length, color: "#2563eb", icon: <Clock size={18} /> },
            { label: "Need Driver", value: trucks.filter((t) => t.status === "NO_ALLOTMENT").length, color: "#d97706", icon: <AlertTriangle size={18} /> },
            { label: "Total Drivers", value: drivers.length, color: "#6366f1", icon: <UserIcon size={18} /> },
            { label: "On Duty Today", value: drivers.filter((d) => d.isOnDuty && d.isApproved).length, color: "#059669", icon: <UserCheck size={18} /> },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: `${s.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                  }}
                >
                  {s.icon}
                </div>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#f1f5f9",
          padding: "4px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          width: "fit-content",
          marginBottom: "24px",
        }}
      >
        {(["trucks", "drivers"] as FleetTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 20px",
              borderRadius: "9px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#2563eb" : "#64748b",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t === "trucks" ? <TruckIcon size={14} /> : <UserIcon size={14} />}
            {t === "trucks" ? `Trucks (${trucks.length})` : `Drivers (${drivers.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "#94a3b8" }}>
          <Loader2 size={32} style={{ animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : tab === "trucks" ? (
        /* ─── TRUCKS GRID ─────────────────────────────────────────────── */
        <div>
          {canManage && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button
                onClick={() => setShowAddTruck(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                }}
              >
                <Plus size={15} />
                Add Truck
              </button>
            </div>
          )}

          {trucks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
              <TruckIcon size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
              <p style={{ color: "#64748b", fontSize: "15px", fontWeight: 600 }}>No trucks registered yet</p>
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Add your first truck to get started</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "20px",
              }}
            >
              {trucks.map((truck) => (
                <div
                  key={truck.id}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = ""; }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          background: truck.status === "ACTIVE" ? "#f0fdf4" : truck.status === "READY" ? "#eff6ff" : truck.status === "INACTIVE" ? "#fef2f2" : "#fffbeb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: TRUCK_STATUS_CONFIG[truck.status].color,
                        }}
                      >
                        <TruckIcon size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{truck.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                          <Hash size={11} />
                          {truck.plateNumber}
                        </div>
                      </div>
                    </div>
                    <TruckStatusBadge status={truck.status} />
                  </div>

                  {/* Capacity bar */}
                  <div style={{ marginBottom: "14px" }}>
                    <CapacityBar
                      loaded={truck._count?.shipments ?? truck.shipments.length}
                      capacity={truck.capacity}
                    />
                  </div>

                  {/* Driver info */}
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      marginBottom: "14px",
                    }}
                  >
                    {truck.driver ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <DriverAvatar driver={truck.driver} size={32} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                            {truck.driver.user.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{truck.driver.phone}</div>
                        </div>
                        {canManage && truck.status !== "ACTIVE" && (
                          <button
                            onClick={() => handleRemoveDriver(truck.id)}
                            disabled={actionLoading === truck.id}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: "4px" }}
                            title="Remove driver"
                          >
                            <UserX size={15} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                          No driver assigned
                        </span>
                        {canManage && truck.status !== "INACTIVE" && (
                          <button
                            onClick={() => setAssignTruck(truck)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              border: "1.5px solid #3b82f6",
                              background: "#fff",
                              color: "#2563eb",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <UserCheck size={12} />
                            Assign
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {canManage && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => onOpenManifest()}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          padding: "8px",
                          borderRadius: "10px",
                          border: "1.5px solid #e2e8f0",
                          background: "#fff",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        <Layers size={13} />
                        Manifest
                      </button>
                      <button
                        onClick={() => setEditTruck(truck)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1.5px solid #e2e8f0",
                          background: "#fff",
                          cursor: "pointer",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTruck(truck.id)}
                        disabled={actionLoading === truck.id || truck.status === "ACTIVE"}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1.5px solid #e2e8f0",
                          background: "#fff",
                          cursor: truck.status === "ACTIVE" ? "not-allowed" : "pointer",
                          color: truck.status === "ACTIVE" ? "#cbd5e1" : "#dc2626",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title={truck.status === "ACTIVE" ? "Cannot delete active truck" : "Delete"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── DRIVERS LIST ─────────────────────────────────────────────── */
        <div>
          {canManage && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button
                onClick={() => setShowAddDriver(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                }}
              >
                <Plus size={15} />
                Register Driver
              </button>
            </div>
          )}

          {drivers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
              <UserIcon size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
              <p style={{ color: "#64748b", fontSize: "15px", fontWeight: 600 }}>No drivers registered yet</p>
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Register your first driver to begin operations</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    border: `1px solid ${!driver.isApproved ? "#fde68a" : "#e2e8f0"}`,
                    padding: "18px 20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <DriverAvatar driver={driver} size={52} />

                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                        {driver.user.name}
                      </span>
                      {!driver.isApproved ? (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "2px 8px", borderRadius: "20px", border: "1px solid #fde68a" }}>
                          Pending Approval
                        </span>
                      ) : driver.isOnDuty ? (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: "20px", border: "1px solid #bbf7d0" }}>
                          On Duty
                        </span>
                      ) : (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "20px" }}>
                          Off Duty
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#64748b" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Phone size={11} /> {driver.phone}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <CreditCard size={11} /> {driver.licenseNumber}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={11} /> {driver.address}
                      </span>
                    </div>
                    {driver.truck && (
                      <div
                        style={{
                          marginTop: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          fontSize: "12px",
                          color: "#2563eb",
                          fontWeight: 600,
                        }}
                      >
                        <TruckIcon size={12} />
                        Assigned: {driver.truck.name} ({driver.truck.plateNumber})
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {!driver.isApproved && (
                        <button
                          onClick={() => handleApproveDriver(driver.id)}
                          disabled={actionLoading === driver.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "8px 14px",
                            borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #16a34a, #059669)",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {actionLoading === driver.id ? (
                            <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          Approve
                        </button>
                      )}
                      {driver.isApproved && (
                        <button
                          onClick={() => handleToggleDuty(driver)}
                          disabled={actionLoading === driver.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "8px 14px",
                            borderRadius: "10px",
                            border: `1.5px solid ${driver.isOnDuty ? "#e2e8f0" : "#16a34a"}`,
                            background: driver.isOnDuty ? "#fff" : "#f0fdf4",
                            color: driver.isOnDuty ? "#64748b" : "#16a34a",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {driver.isOnDuty ? <UserX size={13} /> : <UserCheck size={13} />}
                          {driver.isOnDuty ? "Set Off Duty" : "Set On Duty"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        disabled={actionLoading === driver.id}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: "1.5px solid #e2e8f0",
                          background: "#fff",
                          cursor: "pointer",
                          color: "#dc2626",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Remove driver"
                      >
                        {actionLoading === driver.id ? (
                          <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showAddTruck && (
        <TruckFormModal onClose={() => setShowAddTruck(false)} onSaved={fetchData} />
      )}
      {editTruck && (
        <TruckFormModal truck={editTruck} onClose={() => setEditTruck(null)} onSaved={fetchData} />
      )}
      {showAddDriver && (
        <DriverFormModal onClose={() => setShowAddDriver(false)} onSaved={fetchData} />
      )}
      {assignTruck && (
        <AssignDriverModal
          truck={assignTruck}
          drivers={drivers}
          onClose={() => setAssignTruck(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
