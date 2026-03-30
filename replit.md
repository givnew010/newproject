# المُنسق - نظام إدارة المخزون والمبيعات

## Overview
A professional Arabic-language sales, purchasing, and inventory management system built with React 19, Vite 6, TypeScript, and Tailwind CSS v4. Features full RTL layout, animated UI, persistent localStorage data, and complete buy/sell/inventory cycle.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **Animations**: Framer Motion (via `motion` package)
- **Icons**: Lucide React
- **Utilities**: clsx + tailwind-merge (cn helper)
- **Data Persistence**: localStorage (no backend required)

## Design System
- **Primary color**: #1a56db (bright blue)
- **Sidebar**: Deep navy gradient (blue-950 → blue-900)
- **Font**: Cairo (Arabic + Latin), JetBrains Mono for numbers
- **Cards**: Full gradient backgrounds per section theme
- **Status badges**: Emerald (in-stock), Amber (low-stock), Red (out-of-stock)
- **Section themes**: Blue (inventory), Emerald (sales), Violet (purchases), Amber (reports)

## Project Structure
- `src/App.tsx` — Main app shell: sidebar with grouped nav, header with search, inventory management page with table/filter/sort
- `src/Dashboard.tsx` — لوحة التحكم: welcome banner, gradient KPI cards, quick links, recent activity, stock alerts
- `src/SalesInvoices.tsx` — فواتير المبيعات: emerald theme, create/edit/delete/view sales invoices, auto-decreases inventory
- `src/PurchaseInvoices.tsx` — فواتير المشتريات: violet theme, create/edit/delete/view purchase invoices, auto-increases inventory
- `src/Reports.tsx` — التقارير: gradient KPI cards, monthly bar chart, top selling/purchased items, inventory breakdown table
- `src/Warehouses.tsx` — المخازن: colorful warehouse cards, capacity utilization bars, CRUD modals
- `src/Settings.tsx` — الإعدادات: company info, inventory config, invoice settings, notifications, data backup/restore
- `src/types.ts` — TypeScript types: InventoryItem, PurchaseInvoice, SalesInvoice, InvoiceLineItem, Warehouse, etc.
- `src/main.tsx` — React entry point (sets RTL direction)
- `src/index.css` — Global styles + Tailwind CSS + design tokens + utility classes
- `vite.config.ts` — Vite configuration (port 5000, host 0.0.0.0, allowedHosts: true)

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
