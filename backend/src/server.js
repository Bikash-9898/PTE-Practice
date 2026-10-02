import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import mockTestRoutes from "./routes/mockTestRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import savedQuestionRoutes from "./routes/savedQuestionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / curl / server-to-server calls (no Origin header).
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// Serve uploaded files (audio / images) statically.
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    fallthrough: true,
    dotfiles: "deny",
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

// Light request log in development.
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    // eslint-disable-next-line no-console
    console.log(`→ ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ---------------------------------------------------------------------------
// Health + API routes
// ---------------------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PTE Master API is running",
    data: {
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      env: process.env.NODE_ENV || "development",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/saved-questions", savedQuestionRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/ai", aiRoutes);

// Root hint so curling http://localhost:5000/ returns something useful.
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PTE Master API",
    data: {
      health: "/api/health",
      docs: "See README.md for the full endpoint list.",
    },
  });
});

// ---------------------------------------------------------------------------
// Error handlers — last
// ---------------------------------------------------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT) || 5000;

async function boot() {
  await connectDB();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀  PTE Master API listening on http://localhost:${PORT}`);
  });
}

boot().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
