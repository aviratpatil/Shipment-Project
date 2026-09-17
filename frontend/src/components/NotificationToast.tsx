import React, { useEffect, useRef, useState } from "react";
import { Bell, X, Package, CheckCircle, Truck, Clock, XCircle, BellOff } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ShipmentEvent {
  id: string;
  event: string;
  shipmentId: string;
  status: string;
  trackingNumber?: string;
  customerName?: string;
  timestamp: string;
}

const WS_URL = "ws://localhost:5000/ws";
const MAX_HISTORY = 20;
const TOAST_DURATION = 5000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStatusIcon(status: string) {
  switch (status) {
    case "DELIVERED": return <CheckCircle size={15} color="#059669" />;
    case "IN_TRANSIT": return <Truck size={15} color="#2563eb" />;
    case "OUT_FOR_DELIVERY": return <Truck size={15} color="#7c3aed" />;
    case "PENDING": return <Clock size={15} color="#d97706" />;
    case "CANCELLED": return <XCircle size={15} color="#dc2626" />;
    default: return <Package size={15} color="#6366f1" />;
  }
}

function getStatusColors(status: string): { bg: string; border: string; text: string } {
  switch (status) {
    case "DELIVERED": return { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" };
    case "IN_TRANSIT": return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
    case "OUT_FOR_DELIVERY": return { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" };
    case "PENDING": return { bg: "#fffbeb", border: "#fde68a", text: "#b45309" };
    case "CANCELLED": return { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" };
    default: return { bg: "#f8faff", border: "#bfdbfe", text: "#1e40af" };
  }
}

function formatStatus(s: string): string {
  return s.replace(/_/g, " ");
}

function formatRelativeTime(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast Item
// ─────────────────────────────────────────────────────────────────────────────

interface ToastProps {
  event: ShipmentEvent;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ event, onDismiss }) => {
  const colors = getStatusColors(event.status);

  return (
    <div
      id={`toast-${event.id}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 14px",
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        border: `1px solid ${colors.border}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05)",
        animation: "slideInFromRight 0.3s ease both",
        position: "relative",
        overflow: "hidden",
        minWidth: "300px",
        maxWidth: "340px",
      }}
    >
      {/* Status color strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          backgroundColor: colors.border,
          borderRadius: "14px 0 0 14px",
        }}
      />

      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "9px",
          backgroundColor: colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {getStatusIcon(event.status)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
          Shipment Update
        </div>
        <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.4 }}>
          {event.customerName ? <><strong>{event.customerName}</strong> · </> : ""}
          Status changed to{" "}
          <span
            style={{
              fontWeight: 700,
              color: colors.text,
              backgroundColor: colors.bg,
              padding: "1px 6px",
              borderRadius: "4px",
              fontSize: "11px",
            }}
          >
            {formatStatus(event.status)}
          </span>
        </div>
        {event.trackingNumber && (
          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", fontFamily: "monospace" }}>
            #{event.trackingNumber}
          </div>
        )}
      </div>

      <button
        onClick={() => onDismiss(event.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          padding: "2px",
          borderRadius: "4px",
          display: "flex",
          flexShrink: 0,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification History Panel
// ─────────────────────────────────────────────────────────────────────────────

interface HistoryPanelProps {
  events: ShipmentEvent[];
  onClose: () => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ events, onClose, onClear }) => (
  <div
    id="notification-history"
    style={{
      position: "fixed",
      top: "80px",
      right: "20px",
      zIndex: 999,
      width: "360px",
      maxHeight: "480px",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#ffffff",
      borderRadius: "18px",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
      animation: "modalIn 0.25s ease both",
      overflow: "hidden",
    }}
  >
    {/* Header */}
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#fafbff",
      }}
    >
      <Bell size={16} color="#6366f1" />
      <span style={{ flex: 1, fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
        Notifications
      </span>
      {events.length > 0 && (
        <button
          onClick={onClear}
          style={{
            fontSize: "11px",
            color: "#6366f1",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
          }}
        >
          Clear all
        </button>
      )}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
        <X size={15} />
      </button>
    </div>

    {/* List */}
    <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
      {events.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            gap: "10px",
            color: "#94a3b8",
          }}
        >
          <BellOff size={32} strokeWidth={1.5} />
          <span style={{ fontSize: "13px" }}>No notifications yet</span>
        </div>
      ) : (
        [...events].reverse().map((evt) => {
          const colors = getStatusColors(evt.status);
          return (
            <div
              key={evt.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "12px",
                marginBottom: "4px",
                backgroundColor: "#fafbff",
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: colors.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {getStatusIcon(evt.status)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                  {evt.customerName ?? `Shipment #${evt.shipmentId.slice(0, 8)}`}
                </div>
                <div style={{ fontSize: "11px", color: colors.text, fontWeight: 600 }}>
                  {formatStatus(evt.status)}
                </div>
              </div>
              <div style={{ fontSize: "10px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                {formatRelativeTime(evt.timestamp)}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main NotificationToast Component
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ShipmentEvent[]>([]);
  const [history, setHistory] = useState<ShipmentEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  };

  const addToast = (evt: ShipmentEvent) => {
    setToasts((prev) => [...prev.slice(-3), evt]); // max 4 toasts at once
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), evt]);
    setUnreadCount((n) => n + 1);

    const timer = setTimeout(() => dismissToast(evt.id), TOAST_DURATION);
    timersRef.current.set(evt.id, timer);
  };

  // WebSocket connection
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === "shipment_status_changed") {
              const evt: ShipmentEvent = {
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                ...data,
              };
              addToast(evt);
            }
          } catch { /* ignore malformed frames */ }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 5000); // reconnect after 5s
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch { /* WebSocket not available */ }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleBellClick = () => {
    setShowHistory((v) => !v);
    setUnreadCount(0);
  };

  return (
    <>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell"
        onClick={handleBellClick}
        style={{
          position: "fixed",
          top: "16px",
          right: "20px",
          zIndex: 1001,
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#ffffff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.15s ease",
        }}
        title="Notifications"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f8faff";
          e.currentTarget.style.borderColor = "#bfdbfe";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
        }}
      >
        <Bell size={16} color={unreadCount > 0 ? "#6366f1" : "#64748b"} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Toast Stack ── */}
      <div
        style={{
          position: "fixed",
          top: "70px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: "all" }}>
            <Toast event={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>

      {/* ── History Panel ── */}
      {showHistory && (
        <HistoryPanel
          events={history}
          onClose={() => setShowHistory(false)}
          onClear={() => { setHistory([]); setUnreadCount(0); }}
        />
      )}
    </>
  );
};

export default NotificationToast;
