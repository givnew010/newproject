# Backend API Reference

This document lists all HTTP endpoints implemented in the backend (Express + SQLite).

Notes:
- Base path: `/api/v1`
- Authentication: all endpoints require `Authorization: Bearer <token>` except `POST /auth/login` and `GET /health`.
- Success responses: `{ success: true, data: ... , message?: '...' }`.
- Error responses: `{ success: false, error: '...' }` or validation shape including `details`.

---

**Health**
- GET /api/v1/health — basic health check. Response: `{ status:'ok', timestamp }`.

**Auth** (server/routes/auth.ts)
- POST /api/v1/auth/login — body: `{ username, password }` → returns `{ data: { token, user }, message }`.
- GET /api/v1/auth/me — returns current user `{ data: { user } }`.
- POST /api/v1/auth/logout — simple logout message.

**Users** (admin only) (server/routes/users.ts)
- GET /api/v1/users — list users (query: `role`, `is_active`, `search`).
- GET /api/v1/users/:id — get user details.
- POST /api/v1/users — create user. Body: `{ username, password, full_name, role }`.
- PUT /api/v1/users/:id — update user fields (`full_name`, `role`, `is_active`).
- PUT /api/v1/users/:id/password — change password. Body: `{ new_password, confirm_password }`.
- DELETE /api/v1/users/:id — soft-disable user.

**Customers** (server/routes/customers.ts)
- GET /api/v1/customers — list customers (query: `search`, `has_balance`, `is_active`).
- GET /api/v1/customers/:id — customer details with balance stats.
- POST /api/v1/customers — create customer. Body: `{ name, phone?, email?, address?, tax_number?, credit_limit?, notes? }`.
- PUT /api/v1/customers/:id — update customer.
- DELETE /api/v1/customers/:id — soft-delete (prevents deletion if active invoices exist).
- GET /api/v1/customers/:id/invoices — list customer's sales invoices.
- GET /api/v1/customers/:id/payments — list customer's payments.
- GET /api/v1/customers/:id/statement — account statement (invoices + payments).

**Suppliers** (server/routes/suppliers.ts)
- GET /api/v1/suppliers — list suppliers (query: `search`, `has_balance`, `is_active`).
- GET /api/v1/suppliers/:id — supplier details with balance stats.
- POST /api/v1/suppliers — create supplier. Body includes `payment_terms` (Arabic enum: فوري, أسبوعي, شهري, ثلاثة أشهر).
- PUT /api/v1/suppliers/:id — update supplier.
- DELETE /api/v1/suppliers/:id — soft-delete (prevents deletion if active invoices exist).
- GET /api/v1/suppliers/:id/invoices — list supplier's purchase invoices.
- GET /api/v1/suppliers/:id/payments — list supplier's payments.
- GET /api/v1/suppliers/:id/statement — account statement (invoices + payments).

**Warehouses** (server/routes/warehouses.ts)
- GET /api/v1/warehouses — list warehouses with occupancy stats.
- GET /api/v1/warehouses/:id — warehouse details and items list.
- POST /api/v1/warehouses — create warehouse.
- PUT /api/v1/warehouses/:id — update warehouse.
- DELETE /api/v1/warehouses/:id — soft-disable warehouse (blocked if contains active items).

**Inventory** (server/routes/inventory.ts)
- GET /api/v1/inventory — list items (filters: `search`, `warehouse_id`, `category`, `status`, `min_stock`, `max_stock`, `limit`, `offset`).
- GET /api/v1/inventory/:id — item details and stock info.
- POST /api/v1/inventory — create item. Body: `{ name, sku, barcode?, category?, unit?, quantity?, cost_price?, selling_price?, warehouse_id? }`.
- PUT /api/v1/inventory/:id — update item.
- DELETE /api/v1/inventory/:id — soft-delete item.
- POST /api/v1/inventory/:id/adjust-stock — adjust stock manually. Body: `{ quantity, movement_type: 'in'|'out', note? }`.

**Sales** (server/routes/sales.ts)
- GET /api/v1/sales — list sales invoices (filters: `customer_id`, `status`, `payment_type`, `date_from`, `date_to`, `search`, `page`, `limit`).
- GET /api/v1/sales/:id — sale invoice details with items.
- POST /api/v1/sales — create sale invoice (transactional). Body: `{ customer_id?, payment_type, items: [{ item_id, quantity, unit_price, discount }], discount_amount?, notes? }`.
- PUT /api/v1/sales/:id — update sale invoice (restores stock then reapplies changes).
- DELETE /api/v1/sales/:id — cancel sale invoice (restores stock).
- POST /api/v1/sales/:id/payments — register payment for invoice. Body: `{ amount, payment_date?, payment_method?, reference_number?, notes? }`.
- GET /api/v1/sales/:id/payments — list payments for invoice.

**Purchases** (server/routes/purchases.ts)
- GET /api/v1/purchases — list purchase invoices (filters like sales).
- GET /api/v1/purchases/:id — purchase invoice details with items.
- POST /api/v1/purchases — create purchase invoice (adds stock). Body similar to sales but `supplier_id`.
- PUT /api/v1/purchases/:id — update purchase invoice (rolls back stock then reapplies).
- DELETE /api/v1/purchases/:id — cancel purchase invoice (removes stock additions).
- POST /api/v1/purchases/:id/payments — register payment for purchase (admin/accountant).
- GET /api/v1/purchases/:id/payments — list payments for purchase invoice.

**Reports** (server/routes/reports.ts)
- GET /api/v1/reports/dashboard — KPI summary (sales, purchases, low stock, recent invoices).
- GET /api/v1/reports/sales — sales report (grouping, top customers, top items).
- GET /api/v1/reports/purchases — purchases report.
- GET /api/v1/reports/receivables — customer aging/receivables.
- GET /api/v1/reports/payables — supplier aging/payables.
- GET /api/v1/reports/inventory — inventory valuation, low stock, slow moving.

**Settings** (server/routes/settings.ts)
- GET /api/v1/settings — read app settings.
- PUT /api/v1/settings — update settings (admin).
- POST /api/v1/settings/backup — returns full DB snapshot (admin).
- POST /api/v1/settings/restore — restore from snapshot (admin).

---

Where to find implementations:
- server routes: [server/routes](server/routes)
- key route files:
  - [server/routes/auth.ts](server/routes/auth.ts)
  - [server/routes/users.ts](server/routes/users.ts)
  - [server/routes/customers.ts](server/routes/customers.ts)
  - [server/routes/suppliers.ts](server/routes/suppliers.ts)
  - [server/routes/warehouses.ts](server/routes/warehouses.ts)
  - [server/routes/inventory.ts](server/routes/inventory.ts)
  - [server/routes/sales.ts](server/routes/sales.ts)
  - [server/routes/purchases.ts](server/routes/purchases.ts)
  - [server/routes/reports.ts](server/routes/reports.ts)
  - [server/routes/settings.ts](server/routes/settings.ts)

If you want a machine-readable OpenAPI/Swagger specification or a Postman collection, I can generate it next. Which format do you prefer?
