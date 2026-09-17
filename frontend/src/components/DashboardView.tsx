import React, { useState } from "react";
import {
  Package,
  Users,
  Truck,
  CheckCircle,
  Plus,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./Button";
import type { Customer, Shipment } from "../types";

interface DashboardViewProps {
  customers: Customer[];
  shipments: Shipment[];
  isDbConnected: boolean;
  onOpenAddCustomer: () => void;
  onOpenAddShipment: () => void;
  onNavigate: (tab: "customers" | "shipments") => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  shipments,
  isDbConnected,
  onOpenAddCustomer,
  onOpenAddShipment,
  onNavigate,
}) => {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const inTransitCount = shipments.filter((s) => s.status === "IN_TRANSIT").length;
  const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;
  const pendingCount = shipments.filter((s) => s.status === "PENDING").length;
  const cancelledCount = shipments.filter((s) => s.status === "CANCELLED").length;
  const activeCustomers = customers.filter((c) => !c.isDeleted && c.status === "Active").length;

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "40px" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              Operations Overview
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: isDbConnected ? "#ecfdf5" : "#fef2f2",
                color: isDbConnected ? "#059669" : "#dc2626",
                border: `1px solid ${isDbConnected ? "#a7f3d0" : "#fecaca"}`,
                alignSelf: "center",
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
              <Activity size={11} />
              {isDbConnected ? "⚡ Live" : "Offline"}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
            Real-time shipment monitoring and customer logistics dashboard
          </p>
        </div>

        {/* Action Buttons: Solid primary blue for Shipment, outlined neutral for Customer */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={onOpenAddCustomer}
            style={{
              borderColor: "#d1d5db",
              color: "#374151",
              backgroundColor: "#ffffff",
              fontWeight: 600,
            }}
          >
            + New Customer
          </Button>
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={onOpenAddShipment}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          >
            + Create Shipment
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <StatsCard
          title="Active Customers"
          value={activeCustomers}
          color="blue"
          icon={<Users size={20} />}
          subtitle={`${customers.length} total registered`}
        />
        <StatsCard
          title="Total Shipments"
          value={shipments.length}
          color="purple"
          icon={<Package size={20} />}
          subtitle="All time records"
        />
        <StatsCard
          title="In Transit"
          value={inTransitCount}
          color="amber"
          icon={<Truck size={20} />}
          subtitle="Currently moving"
        />
        <StatsCard
          title="Pending Dispatch"
          value={pendingCount}
          color="rose"
          icon={<Clock size={20} />}
          subtitle="Awaiting processing"
        />
        <StatsCard
          title="Delivered"
          value={deliveredCount}
          color="emerald"
          icon={<CheckCircle size={20} />}
          subtitle="Completed deliveries"
        />
      </div>

      {/* ── Bottom Grid: Recent Shipments + Quick Stats ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Recent Shipments Table */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#ffffff",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 2px 0",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Recent Shipments
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Latest tracking milestones
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={13} />}
              onClick={() => onNavigate("shipments")}
              style={{ flexDirection: "row-reverse", color: "#2563eb", fontWeight: 600 }}
            >
              View All
            </Button>
          </div>

          {recentShipments.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "#64748b",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                }}
              >
                <Package size={22} />
              </div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                No shipments created yet
              </p>
              <Button size="sm" icon={<Plus size={13} />} onClick={onOpenAddShipment}>
                Create First Shipment
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#f8fafc" }}>
                    {["TRACKING #", "CUSTOMER", "ROUTE", "STATUS", "DATE"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#475569",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((shipment, idx) => {
                    const isHovered = hoveredRowId === shipment.id;
                    return (
                      <tr
                        key={shipment.id}
                        onMouseEnter={() => setHoveredRowId(shipment.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        style={{
                          borderBottom:
                            idx < recentShipments.length - 1 ? "1px solid #E5E7EB" : "none",
                          backgroundColor: isHovered ? "#f8fafc" : "#ffffff",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#2563eb",
                            fontFamily: "monospace",
                          }}
                        >
                          {shipment.trackingNumber}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          {shipment.customer ? (
                            <div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#1e293b",
                                }}
                              >
                                {shipment.customer.name}
                              </div>
                              <div
                                style={{ fontSize: "11px", color: "#475569", fontWeight: 500 }}
                              >
                                {shipment.customer.company}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "#64748b", fontSize: "13px" }}>N/A</span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "12px",
                            color: "#334155",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {shipment.origin}
                            <ArrowRight size={11} color="#64748b" />
                            {shipment.destination}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <StatusBadge status={shipment.status} />
                        </td>
                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#374151",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(shipment.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar: Status Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Status breakdown card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
              padding: "20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <TrendingUp size={16} color="#2563eb" />
              Status Breakdown
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                {
                  label: "Delivered",
                  count: deliveredCount,
                  color: "#10b981",
                  trackBg: "#ecfdf5",
                },
                {
                  label: "In Transit",
                  count: inTransitCount,
                  color: "#3b82f6",
                  trackBg: "#eff6ff",
                },
                {
                  label: "Pending",
                  count: pendingCount,
                  color: "#f59e0b",
                  trackBg: "#fffbeb",
                },
                {
                  label: "Cancelled",
                  count: cancelledCount,
                  color: "#ef4444",
                  trackBg: "#fef2f2",
                },
              ].map(({ label, count, color, trackBg }) => {
                const pct =
                  shipments.length > 0
                    ? Math.round((count / shipments.length) * 100)
                    : 0;
                return (
                  <div key={label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#374151", fontWeight: 600 }}>
                        {label}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                        {count}{" "}
                        <span style={{ color: "#64748b", fontWeight: 500 }}>({pct}%)</span>
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div
                      style={{
                        height: "7px",
                        borderRadius: "9999px",
                        backgroundColor: trackBg,
                        border: `1px solid ${color}20`,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "9999px",
                          width: `${pct}%`,
                          backgroundColor: color,
                          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
              padding: "20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 14px 0",
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} color="#8b5cf6" />
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={onOpenAddCustomer}
                style={{ width: "100%", justifyContent: "flex-start", fontWeight: 600 }}
              >
                Register Customer
              </Button>
              <Button
                size="sm"
                icon={<Plus size={13} />}
                onClick={onOpenAddShipment}
                style={{ width: "100%", justifyContent: "flex-start", backgroundColor: "#2563eb", fontWeight: 600 }}
              >
                New Shipment
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Users size={13} />}
                onClick={() => onNavigate("customers")}
                style={{ width: "100%", justifyContent: "flex-start", fontWeight: 600 }}
              >
                View Customers
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

