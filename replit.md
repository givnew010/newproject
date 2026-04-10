# المُنسق - نظام إدارة المخزون والمبيعات

## Overview
A professional Arabic-language sales, purchasing, and inventory management system built with React 19, Vite 6, TypeScript, and Tailwind CSS v4. Features full RTL layout, animated UI, persistent localStorage data, and complete buy/sell/inventory cycle.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite 8
- **Backend**: Node.js + Express (port 3001)
- **Database**: SQLite via better-sqlite3
- **Auth**: JWT + bcryptjs
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **Animations**: Framer Motion (via `motion` package)
- **Icons**: Lucide React
- **Utilities**: clsx + tailwind-merge (cn helper)
- **Dev**: concurrently runs both Vite (5000) and Express (3001) together

## Design System
- **Primary color**: #1a56db (bright blue)
- **Sidebar**: Deep navy gradient (blue-950 → blue-900)
- **Font**: Cairo (Arabic + Latin), JetBrains Mono for numbers
- **Cards**: Full gradient backgrounds per section theme
- **Status badges**: Emerald (in-stock), Amber (low-stock), Red (out-of-stock)
- **Section themes**: Blue (inventory), Emerald (sales), Violet (purchases), Amber (reports)

## Project Structure
- `src/App.tsx` — Main app shell: sidebar with grouped nav, header with search, routing to pages
- `src/Inventory.tsx` — Orchestrates all inventory state and delegates rendering to sub-components
- `src/Dashboard.tsx` — لوحة التحكم: welcome banner, gradient KPI cards, quick links, recent activity, stock alerts
- `src/SalesInvoices.tsx` — فواتير المبيعات: emerald theme, create/edit/delete/view sales invoices
- `src/PurchaseInvoices.tsx` — فواتير المشتريات: violet theme, create/edit/delete/view purchase invoices
- `src/Reports.tsx` — التقارير: gradient KPI cards, monthly bar chart, top selling/purchased items
- `src/Warehouses.tsx` — المخازن: colorful warehouse cards, capacity utilization bars, CRUD modals
- `src/Settings.tsx` — الإعدادات: company info, inventory config, invoice settings, notifications
- `src/types.ts` — TypeScript types: InventoryItem, PurchaseInvoice, SalesInvoice, etc.
- `src/main.tsx` — React entry point (sets RTL direction)
- `src/index.css` — Global styles + Tailwind CSS + design tokens + utility classes
- `vite.config.ts` — Vite configuration (port 5000, proxy /api → 3001)
- `server/index.ts` — Express entry point (port 3001), mounts all API routes
- `server/db.ts` — SQLite database init, table creation, seed data

### Inventory Sub-components (`src/components/inventory/`)
- `InventoryStatsRow.tsx` — 4 KPI stat cards (total, in-stock, low-stock, out-of-stock); clickable to filter
- `InventoryToolbar.tsx` — Filter/sort dropdowns + export + add button action bar
- `InventoryTable.tsx` — Full data table with sortable headers, status badges, row actions
- `ItemViewModal.tsx` — Animated modal to view item details with edit/delete actions
- `ItemFormModal.tsx` — Animated modal form for adding or editing inventory items
- `index.ts` — Barrel export for all inventory components

### Reusable UI Components (`src/components/ui/`)
- `Button.tsx`, `Input.tsx`, `Badge.tsx`, `KPICard.tsx`, `Modal.tsx`, `PageHeader.tsx`, `Select.tsx`, `Textarea.tsx`

### Hooks & Context
- `src/hooks/useApi.ts` — useQuery + useMutation + specialized hooks (useInventory, useSales, etc.)
- `src/lib/api.ts` — Centralized API client with typed wrappers per endpoint
- `src/context/AuthContext.tsx` — JWT auth state (login, logout, user)
- `src/context/ToastContext.tsx` — Global toast notifications

## Pages
| Page | Route Key | Description |
|------|-----------|-------------|
| لوحة التحكم | `dashboard` | Welcome banner, KPIs, recent invoices, stock alerts, quick links |
| الأصناف | `inventory` | Inventory CRUD with search/filter/sort, stat cards, item details modal |
| فواتير المبيعات | `sales` | Emerald-themed sales invoices → decrease inventory |
| فواتير المشتريات | `purchases` | Violet-themed purchase invoices → increase inventory |
| التقارير | `reports` | Gradient KPI cards, monthly charts, top items, inventory table |
| المخازن | `warehouses` | Warehouse CRUD with capacity tracking and colorful cards |
| الإعدادات | `settings` | Company info, invoice config, notifications, data backup |

## localStorage Keys
- `inventory_items` — Array of InventoryItem
- `purchase_invoices` — Array of PurchaseInvoice
- `sales_invoices` — Array of SalesInvoice
- `warehouses` — Array of Warehouse
- `app_settings` — AppSettings object

## Key Business Logic
- **Inventory Status**: auto-calculated: 0 → out-of-stock, ≤5 → low-stock, >5 → in-stock
- **Sales Invoice Save**: decreases inventory quantities for linked items
- **Purchase Invoice Save**: increases inventory quantities for linked items
- **Reports**: reads all three localStorage keys to compute sales/purchases/profit metrics

## Development
```bash
npm install
npm run dev   # Runs on http://0.0.0.0:5000
```

## Deployment
Configured as a **static** site deployment:
- Build: `npm run build`
- Public directory: `dist`
