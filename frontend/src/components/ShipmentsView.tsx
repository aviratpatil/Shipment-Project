import React, { useState } from "react";
import {
  Plus,
  Package,
  MapPin,
  ArrowRight,
  History,
  Filter,
  Clock,
  Truck,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Input } from "./Input";
import type { Customer, Shipment, ShipmentStatus, User } from "../types";
import { apiRequest } from "../api/client";

interface ShipmentsViewProps {
  shipments: Shipment[];
  customers: Customer[];
  currentUser: User | null;
  onRefresh: () => void;
  onOpenAuth: () => void;
}

const SELECT_STYLE: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
  cursor: "pointer",
  width: "100%",
  transition: "border-color 0.2s ease",
};

const STATUS_FILTERS = ["ALL", "PENDING", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;
const STATUS_LABELS: Record<string, string> = {
  ALL: "All",
  PENDING: "Pending",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  shipments,
  customers,
  currentUser,
  onRefresh,
  onOpenAuth,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>("IN_TRANSIT");

  const [trackingNumber, setTrackingNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [initialStatus, setInitialStatus] = useState<ShipmentStatus>("PENDING");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const filteredShipments = shipments.filter(
    (s) => statusFilter === "ALL" || s.status === statusFilter
  );

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onOpenAuth(); return; }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiRequest("/shipments", {
        method: "POST",
        body: JSON.stringify({ trackingNumber, customerId, origin, destination, status: initialStatus }),
      });
      setIsCreateModalOpen(false);
      setTrackingNumber(""); setCustomerId(""); setOrigin(""); setDestination("");
      onRefresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !currentUser) { onOpenAuth(); return; }

    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const res = await apiRequest<Shipment>(`/shipments/${selectedShipment.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedShipment(res.data);
      onRefresh();
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openStatusModal = async (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status);
    setStatusError(null);
    try {
      const res = await apiRequest<Shipment>(`/shipments/${shipment.id}`);
      setSelectedShipment(res.data);
    } catch {
      // fallback to existing data
    }
  };

  const openCreate = () => {
    if (!currentUser) { onOpenAuth(); return; }
    if (customers.length > 0 && !customerId) setCustomerId(customers[0].id);
    setTrackingNumber(`TRK-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px 0",
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            Shipment Dispatch & Tracking
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
            Track freight milestones, update live status, and inspect chronological audit history
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openCreate}>
          Create Shipment
        </Button>
      </div>

      {/* ── Quick stat chips ── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { icon: <Package size={12} />, label: "Total", value: shipments.length, color: "#4f46e5" },
          { icon: <Truck size={12} />, label: "In Transit", value: shipments.filter(s => s.status === "IN_TRANSIT").length, color: "#2563eb" },
          { icon: <Clock size={12} />, label: "Pending", value: shipments.filter(s => s.status === "PENDING").length, color: "#d97706" },
        ].map(({ icon, label, value, color }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "9999px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              fontSize: "12px",
              fontWeight: 600,
              color,
            }}
          >
            {icon}
            <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>{label}:</span>
            {value}
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "4px",
          alignItems: "center",
        }}
      >
        <Filter size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        {STATUS_FILTERS.map((status) => {
          const active = statusFilter === status;
          const count = status === "ALL"
            ? shipments.length
            : shipments.filter((s) => s.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "inherit",
                border: "1px solid",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                backgroundColor: active ? "#eff6ff" : "transparent",
                color: active ? "#2563eb" : "var(--text-secondary)",
                borderColor: active ? "#93c5fd" : "var(--border)",
              }}
            >
              {STATUS_LABELS[status]}
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  backgroundColor: active ? "#dbeafe" : "#f1f5f9",
                  color: active ? "#1d4ed8" : "var(--text-muted)",
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        {filteredShipments.length === 0 ? (
          <div
            style={{
              padding: "80px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              color: "var(--text-muted)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "rgba(59,130,246,0.07)",
                border: "1px solid rgba(59,130,246,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#60a5fa",
              }}
            >
              <Package size={24} />
            </div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)" }}>
              {statusFilter !== "ALL" ? `No ${STATUS_LABELS[statusFilter]} shipments` : "No shipments created yet"}
            </p>
            {statusFilter === "ALL" && (
              <Button size="sm" icon={<Plus size={13} />} onClick={openCreate}>
                Create First Shipment
              </Button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Tracking #", "Customer", "Route", "Status", "Created", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 20px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          backgroundColor: "#f8fafc",
                          textAlign: i === 5 ? "right" : "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment, idx) => (
                  <tr
                    key={shipment.id}
                    className="slide-in"
                    style={{
                      borderBottom:
                        idx < filteredShipments.length - 1 ? "1px solid var(--border)" : "none",
                      transition: "background-color 0.15s ease",
                      animationDelay: `${idx * 0.03}s`,
                    }}
                  >
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#2563eb",
                        fontFamily: "monospace",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {shipment.trackingNumber}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {shipment.customer ? (
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {shipment.customer.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {shipment.customer.company}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <MapPin size={12} color="var(--text-muted)" />
                        <span>{shipment.origin}</span>
                        <ArrowRight size={11} color="var(--text-muted)" />
                        <span>{shipment.destination}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(shipment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<History size={13} />}
                        onClick={() => openStatusModal(shipment)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredShipments.length > 0 && (
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textAlign: "right" }}>
          Showing {filteredShipments.length} of {shipments.length} shipments
        </p>
      )}

      {/* ── Create Shipment Modal ── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setFormError(null); }}
        title="Dispatch New Shipment"
      >
        {formError && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {formError}
          </div>
        )}
        <form
          onSubmit={handleCreateShipment}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Input
            label="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Assigned Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              style={SELECT_STYLE}
            >
              {customers.length === 0 ? (
                <option value="">No customers available</option>
              ) : (
                customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.company}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input
              label="Origin"
              placeholder="Seattle, WA"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
            <Input
              label="Destination"
              placeholder="Austin, TX"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Initial Status
            </label>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as ShipmentStatus)}
              style={SELECT_STYLE}
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            style={{ width: "100%", marginTop: "4px", padding: "12px" }}
          >
            Dispatch Shipment →
          </Button>
        </form>
      </Modal>

      {/* ── Status & History Modal ── */}
      {selectedShipment && (
        <Modal
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          title={`Tracking: ${selectedShipment.trackingNumber}`}
          maxWidth="560px"
        >
          {/* Shipment meta */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              padding: "14px",
              backgroundColor: "#f8fafc",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            {[
              { label: "Customer", value: selectedShipment.customer?.name ?? "N/A" },
              { label: "Company", value: selectedShipment.customer?.company ?? "N/A" },
              { label: "Origin", value: selectedShipment.origin },
              { label: "Destination", value: selectedShipment.destination },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ margin: "0 0 2px 0", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
                  {label}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {statusError && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {statusError}
            </div>
          )}

          {/* Update status */}
          <form onSubmit={handleUpdateStatus} style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
              }}
            >
              Update Status
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                style={{ ...SELECT_STYLE, flex: 1 }}
              >
                {(["PENDING", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  )
                )}
              </select>
              <Button type="submit" isLoading={isUpdatingStatus} style={{ flexShrink: 0 }}>
                Update
              </Button>
            </div>
          </form>

          {/* Audit trail */}
          <div>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <History size={13} color="#60a5fa" />
              Audit Trail
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0",
                maxHeight: "220px",
                overflowY: "auto",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                padding: "4px",
              }}
            >
              {!selectedShipment.statusHistory || selectedShipment.statusHistory.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                  No audit records available
                </div>
              ) : (
                selectedShipment.statusHistory.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor:
                        idx === 0 ? "#eff6ff" : "transparent",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {/* Timeline dot */}
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: idx === 0 ? "#10b981" : "#cbd5e1",
                          boxShadow: idx === 0 ? "0 0 6px #10b981" : "none",
                          flexShrink: 0,
                        }}
                      />
                      <StatusBadge status={item.status} />
                      {idx === 0 && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#059669",
                            letterSpacing: "0.05em",
                          }}
                        >
                          LATEST
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(item.updatedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
