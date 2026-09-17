import React from "react";
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
  const inTransitCount = shipments.filter((s) => s.status === "IN_TRANSIT").length;
  const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;
  const pendingCount = shipments.filter((s) => s.status === "PENDING").length;
  const cancelledCount = shipments.filter((s) => s.status === "CANCELLED").length;
  const activeCustomers = customers.filter((c) => !c.isDeleted && c.status === "Active").length;

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
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
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: isDbConnected ? "#10b981" : "#ef4444",
                  animation: isDbConnected ? "pulse-dot 2s infinite" : "none",
                }}
              />
              <Activity size={11} />
              {isDbConnected ? "Live" : "Offline"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
            Real-time shipment monitoring and customer logistics dashboard
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={onOpenAddCustomer}>
            New Customer
          </Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={onOpenAddShipment}>
            Create Shipment
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
          gridTemplateColumns: "1fr 300px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Recent Shipments Table */}
        <div
          className="glass-card"
          style={{ overflow: "hidden" }}
        >
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 2px 0",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Recent Shipments
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                Latest tracking milestones
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={13} />}
              onClick={() => onNavigate("shipments")}
              style={{ flexDirection: "row-reverse" }}
            >
              View All
            </Button>
          </div>

          {recentShipments.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--text-muted)",
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
                  color: "#60a5fa",
                }}
              >
                <Package size={22} />
              </div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>
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
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["TRACKING #", "CUSTOMER", "ROUTE", "STATUS", "DATE"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 20px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          backgroundColor: "#f8fafc",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((shipment, idx) => (
                    <tr
                      key={shipment.id}
                      style={{
                        borderBottom:
                          idx < recentShipments.length - 1 ? "1px solid var(--border)" : "none",
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
                                color: "var(--text-primary)",
                              }}
                            >
                              {shipment.customer.name}
                            </div>
                            <div
                              style={{ fontSize: "11px", color: "var(--text-muted)" }}
                            >
                              {shipment.customer.company}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>N/A</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {shipment.origin}
                          <ArrowRight size={11} color="var(--text-muted)" />
                          {shipment.destination}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar: Status Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Status breakdown card */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <TrendingUp size={14} color="#60a5fa" />
              Status Breakdown
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  label: "Delivered",
                  count: deliveredCount,
                  color: "#10b981",
                  bg: "rgba(16,185,129,0.15)",
                },
                {
                  label: "In Transit",
                  count: inTransitCount,
                  color: "#3b82f6",
                  bg: "rgba(59,130,246,0.15)",
                },
                {
                  label: "Pending",
                  count: pendingCount,
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.15)",
                },
                {
                  label: "Cancelled",
                  count: cancelledCount,
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.15)",
                },
              ].map(({ label, count, color, bg }) => {
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
                        marginBottom: "5px",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {label}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: "5px",
                        borderRadius: "9999px",
                        backgroundColor: "#e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "9999px",
                          width: `${pct}%`,
                          background: bg,
                          border: `1px solid ${color}40`,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <h3
              style={{
                margin: "0 0 14px 0",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <AlertCircle size={14} color="#a78bfa" />
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={onOpenAddCustomer}
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                Register Customer
              </Button>
              <Button
                size="sm"
                icon={<Plus size={13} />}
                onClick={onOpenAddShipment}
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                New Shipment
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Users size={13} />}
                onClick={() => onNavigate("customers")}
                style={{ width: "100%", justifyContent: "flex-start" }}
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
