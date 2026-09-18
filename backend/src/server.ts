import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";

import { prisma } from "./lib/prisma";
import { initWebSocketServer } from "./lib/websocket";
import { errorMiddleware } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import shipmentRoutes from "./routes/shipment.routes";
import truckRoutes from "./routes/truck.routes";
import driverRoutes from "./routes/driver.routes";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

// ──────────────────────────────────────────────────────────────────────────────
// Global Middleware
// ──────────────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "🚀 Shipment Management System API is running!" });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "error",
      database: "disconnected",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Module 1 – Customer & Shipment APIs
app.use("/api/customers", customerRoutes);
app.use("/api/shipments", shipmentRoutes);

// Fleet & Driver Management
app.use("/api/trucks", truckRoutes);
app.use("/api/drivers", driverRoutes);

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ──────────────────────────────────────────────────────────────────────────────
// Global Error Handler  ← must be last
// ──────────────────────────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ──────────────────────────────────────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Create HTTP server from Express app so we can attach WebSocket
    const httpServer = createServer(app);

    // Module 5 – Real-time WebSocket notifications
    initWebSocketServer(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth:         http://localhost:${PORT}/api/auth`);
      console.log(`👥 Customers:    http://localhost:${PORT}/api/customers`);
      console.log(`📦 Shipments:    http://localhost:${PORT}/api/shipments`);
      console.log(`🚚 Trucks:       http://localhost:${PORT}/api/trucks`);
      console.log(`🧑‍✈️ Drivers:      http://localhost:${PORT}/api/drivers`);
      console.log(`🔌 WebSocket:    ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
