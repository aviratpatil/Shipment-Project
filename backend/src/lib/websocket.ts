import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ShipmentStatusEvent {
  event: "shipment_status_changed";
  shipmentId: string;
  status: string;
  trackingNumber?: string;
  customerName?: string;
  timestamp: string;
}

export interface TruckStatusEvent {
  event: "truck_status_changed";
  truckId: string;
  truckName: string;
  plateNumber: string;
  status: string;
  shipmentsUpdated?: number;
  timestamp: string;
}

export interface DriverShortageEvent {
  event: "driver_shortage_alert";
  shortageCount: number;
  readyTrucks: number;
  availableDrivers: number;
  timestamp: string;
}

export type WsEvent = ShipmentStatusEvent | TruckStatusEvent | DriverShortageEvent;

// ─────────────────────────────────────────────────────────────────────────────
// Singleton WS Server reference
// ─────────────────────────────────────────────────────────────────────────────

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: import("http").Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    console.log(`🔌 WebSocket client connected [${ip}] — total: ${wss!.clients.size}`);

    // Send a welcome ping
    ws.send(
      JSON.stringify({
        event: "connected",
        message: "Connected to ShipmentPro real-time notifications.",
        timestamp: new Date().toISOString(),
      })
    );

    ws.on("close", () => {
      console.log(`🔌 WebSocket client disconnected — remaining: ${wss!.clients.size}`);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
    });
  });

  console.log("🔌 WebSocket server attached at /ws");
  return wss;
}

/**
 * Broadcast a typed event to ALL connected WebSocket clients.
 */
export function broadcast(payload: WsEvent): void {
  if (!wss) return;

  const data = JSON.stringify(payload);
  let sent = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`📡 Broadcasted '${payload.event}' to ${sent} client(s)`);
  }
}

export function getConnectedClientsCount(): number {
  return wss?.clients.size ?? 0;
}
