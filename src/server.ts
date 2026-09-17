import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { prisma } from "./lib/prisma";
import { errorMiddleware } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import shipmentRoutes from "./routes/shipment.routes";

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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth:         http://localhost:${PORT}/api/auth`);
      console.log(`👥 Customers:    http://localhost:${PORT}/api/customers`);
      console.log(`📦 Shipments:    http://localhost:${PORT}/api/shipments`);
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
