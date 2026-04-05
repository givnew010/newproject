// ══════════════════════════════════════════════════════════════════════════════
// server/index.ts
// نقطة دخول Express — يُشغَّل بشكل مستقل عن Vite
//
// التشغيل:
//   npm run server          ← تشغيل عادي
//   npm run server:dev      ← مع tsx watch (يُعيد التشغيل عند التغيير)
//
// المنفذ: 3001 (Vite يعمل على 5000 ويُوجِّه /api إلى هنا عبر proxy)
// ══════════════════════════════════════════════════════════════════════════════

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createTables, seedData } from "./db.js";

// ─── Routes ──────────────────────────────────────────────────────────────────
import authRouter       from "./routes/auth.js";
import usersRouter      from "./routes/users.js";
import inventoryRouter  from "./routes/inventory.js";
import warehousesRouter from "./routes/warehouses.js";
import customersRouter  from "./routes/customers.js";
import suppliersRouter  from "./routes/suppliers.js";
import salesRouter      from "./routes/sales.js";
import purchasesRouter  from "./routes/purchases.js";
import reportsRouter    from "./routes/reports.js";
import settingsRouter   from "./routes/settings.js";

// ─── إعداد المسارات ───────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// إنشاء مجلد data/ إذا لم يكن موجوداً
const dataDir = path.resolve(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ─── تهيئة قاعدة البيانات ────────────────────────────────────────────────────
createTables();
seedData();

// ─── إنشاء تطبيق Express ─────────────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ══════════════════════════════════════════════════════════════════════════════
// Middlewares
// ══════════════════════════════════════════════════════════════════════════════

// CORS: يسمح لـ Vite dev server بالتواصل مع الـ API
app.use(
  cors({
    origin: [
      "http://localhost:5000",  // Vite dev server
      "http://127.0.0.1:5000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// تحليل JSON و URL-encoded bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ──  Logging بسيط لكل طلب (للتطوير) ─────────────────────────────────────────
app.use((req, _res, next) => {
  const timestamp = new Date().toLocaleTimeString("ar-SA");
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ══════════════════════════════════════════════════════════════════════════════
// Routes
// ══════════════════════════════════════════════════════════════════════════════

// Health check — للتحقق من أن السيرفر يعمل
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status:  "ok",
      version: "1.0.0",
      time:    new Date().toISOString(),
    },
  });
});

// المرحلة 3: Auth + Users
app.use("/api/v1/auth",  authRouter);
app.use("/api/v1/users", usersRouter);

// المرحلة 4: Inventory + Warehouses
app.use("/api/v1/inventory",  inventoryRouter);
app.use("/api/v1/warehouses", warehousesRouter);

// المرحلة 5: Customers + Suppliers
app.use("/api/v1/customers", customersRouter);
app.use("/api/v1/suppliers", suppliersRouter);

// المرحلة 6: Sales Invoices
app.use("/api/v1/sales", salesRouter);

// المرحلة 7: Purchase Invoices
app.use("/api/v1/purchases", purchasesRouter);

// المرحلة 8: Reports + Settings
app.use("/api/v1/reports", reportsRouter);
app.use("/api/v1/settings", settingsRouter);

// ══════════════════════════════════════════════════════════════════════════════
// Error Handlers
// ══════════════════════════════════════════════════════════════════════════════

// 404 — route غير موجود
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "المسار غير موجود",
  });
});

// 500 — خطأ داخلي غير متوقع
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ خطأ غير متوقع:", err.message);
  res.status(500).json({
    success: false,
    error: "خطأ داخلي في السيرفر",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// تشغيل السيرفر
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 السيرفر يعمل على: http://localhost:${PORT}`);
  console.log(`📡 Health check:      http://localhost:${PORT}/api/v1/health`);
  console.log(`🔐 Auth endpoints:    http://localhost:${PORT}/api/v1/auth`);
  console.log(`👥 Users endpoints:   http://localhost:${PORT}/api/v1/users`);
  console.log(`📦 Inventory:         http://localhost:${PORT}/api/v1/inventory`);
  console.log(`🏭 Warehouses:        http://localhost:${PORT}/api/v1/warehouses`);
  console.log(`👥 Customers:         http://localhost:${PORT}/api/v1/customers`);
  console.log(`🏢 Suppliers:         http://localhost:${PORT}/api/v1/suppliers`);
  console.log(`🛒 Sales:             http://localhost:${PORT}/api/v1/sales`);
  console.log(`📄 Purchases:         http://localhost:${PORT}/api/v1/purchases`);
  console.log(`\n⚠️  تذكر: أضف proxy في vite.config.ts لتوجيه /api إلى هذا السيرفر\n`);
});

export default app;
