import React, { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Building,
  Mail,
  Package,
  Users,
  UserCheck,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Input } from "./Input";
import type { Customer, User } from "../types";
import { apiRequest } from "../api/client";

interface CustomersViewProps {
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

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  currentUser,
  onRefresh,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onOpenAuth(); return; }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify({ name, email, company }),
      });
      setIsAddModalOpen(false);
      setName(""); setEmail(""); setCompany("");
      onRefresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async (id: string, customerName: string) => {
    if (!currentUser) { onOpenAuth(); return; }
    if (!window.confirm(`Soft-delete "${customerName}"? Their shipment history will be preserved.`)) return;

    setIsDeleting(id);
    try {
      await apiRequest(`/customers/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setIsDeleting(null);
    }
  };

  const activeCount = customers.filter((c) => !c.isDeleted && c.status === "Active").length;
  const inactiveCount = customers.filter((c) => c.isDeleted || c.status === "Inactive").length;

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
            Customer Directory
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
            Manage client profiles, shipping accounts, and freight records
          </p>
        </div>
        <Button
          icon={<Plus size={15} />}
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setIsAddModalOpen(true);
          }}
        >
          Add Customer
        </Button>
      </div>

      {/* ── Summary chips ── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { icon: <Users size={13} />, label: "Total", value: customers.length, color: "#2563eb" },
          { icon: <UserCheck size={13} />, label: "Active", value: activeCount, color: "#059669" },
          { icon: <Building size={13} />, label: "Inactive", value: inactiveCount, color: "#dc2626" },
        ].map(({ icon, label, value, color }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
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

      {/* ── Search ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "1px solid var(--border-strong)",
          backgroundColor: "var(--bg-card)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={() => {}}
      >
        <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by name, company, or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: "14px",
            color: "var(--text-primary)",
            backgroundColor: "transparent",
            fontFamily: "inherit",
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "inherit",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        {filteredCustomers.length === 0 ? (
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
              <Building size={24} />
            </div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)" }}>
              {searchTerm ? "No customers match your search" : "No customers registered yet"}
            </p>
            {!searchTerm && (
              <Button size="sm" icon={<Plus size={13} />} onClick={() => { if (!currentUser) onOpenAuth(); else setIsAddModalOpen(true); }}>
                Register First Customer
              </Button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Client Name & Company", "Email Address", "Status", "Shipments", "Joined", "Actions"].map(
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
                {filteredCustomers.map((customer, idx) => (
                  <tr
                    key={customer.id}
                    className="slide-in"
                    style={{
                      borderBottom:
                        idx < filteredCustomers.length - 1 ? "1px solid var(--border)" : "none",
                      opacity: customer.isDeleted ? 0.5 : 1,
                      transition: "background-color 0.15s ease",
                      animationDelay: `${idx * 0.03}s`,
                    }}
                  >
                    {/* Name & Company */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: `hsl(${(customer.name.charCodeAt(0) * 17) % 360}, 60%, 35%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                            }}
                          >
                            {customer.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "2px",
                            }}
                          >
                            <Building size={11} />
                            {customer.company}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Mail size={13} color="var(--text-muted)" />
                        {customer.email}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "16px 20px" }}>
                      <StatusBadge status={customer.isDeleted ? "Inactive" : customer.status} />
                    </td>

                    {/* Shipments count */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: "#ede9fe",
                          color: "#4f46e5",
                          border: "1px solid #ddd6fe",
                        }}
                      >
                        <Package size={11} />
                        {customer._count?.shipments ?? 0}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(customer.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      {!customer.isDeleted && (
                        <button
                          onClick={() => handleSoftDelete(customer.id, customer.name)}
                          disabled={isDeleting === customer.id}
                          title="Soft delete customer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            border: "1px solid #fecaca",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            opacity: isDeleting === customer.id ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fee2e2";
                            e.currentTarget.style.borderColor = "#f87171";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredCustomers.length > 0 && (
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textAlign: "right" }}>
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      )}

      {/* ── Add Customer Modal ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setFormError(null); }}
        title="Register New Customer"
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
          onSubmit={handleCreateCustomer}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Input
            label="Customer Contact Name"
            placeholder="Alice Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Official Company Email"
            type="email"
            placeholder="alice@acme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Company Name"
            placeholder="Acme Logistics Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
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
              Status
            </label>
            <select style={SELECT_STYLE}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            style={{ width: "100%", marginTop: "4px", padding: "12px" }}
          >
            Create Customer Profile
          </Button>
        </form>
      </Modal>
    </div>
  );
};
