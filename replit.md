# المُنسق - نظام إدارة المخزون والمبيعات

## Overview
A professional Arabic-language sales, purchasing, and inventory management system built with React 19, Vite 6, TypeScript, and Tailwind CSS v4. Features full RTL layout, animated UI, persistent localStorage data, and complete buy/sell/inventory cycle.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **Animations**: Framer Motion (via `motion` package)
- **Icons**: Lucide React
- **Data Persistence**: localStorage (no backend required)

## Project Structure
- `src/App.tsx` — Main application shell: sidebar, header, routing between pages, inventory management page
- `src/Dashboard.tsx` — لوحة التحكم: KPI cards, recent activity feed, quick navigation, stock alerts
- `src/SalesInvoices.tsx` — فواتير المبيعات: create/edit/delete/view sales invoices, auto-decreases inventory
- `src/PurchaseInvoices.tsx` — فواتير المشتريات: create/edit/delete/view purchase invoices, auto-increases inventory
- `src/Reports.tsx` — التقارير: monthly performance chart, top selling/purchased items, inventory breakdown table
- `src/types.ts` — TypeScript types: InventoryItem, PurchaseInvoice, SalesInvoice, InvoiceLineItem
- `src/main.tsx` — React entry point (sets RTL direction)
- `src/index.css` — Global styles + Tailwind CSS
- `vite.config.ts` — Vite configuration (port 5000, host 0.0.0.0, allowedHosts: true)

## Pages
| Page | Route Key | Description |
|------|-----------|-------------|
| لوحة التحكم | `dashboard` | KPIs, recent invoices, stock alerts |
| الأصناف | `inventory` | Inventory CRUD with search/filter/sort |
| فواتير المبيعات | `sales` | Sales invoices → decrease inventory |
| فواتير المشتريات | `purchases` | Purchase invoices → increase inventory |
| التقارير | `reports` | Monthly charts, top items, inventory table |
| المخازن | `warehouses` | Warehouse CRUD with capacity and utilization |

## localStorage Keys
- `inventory_items` — Array of InventoryItem
- `purchase_invoices` — Array of PurchaseInvoice
- `sales_invoices` — Array of SalesInvoice
- `warehouses` — Array of Warehouse

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

## Environment Variables
- `GEMINI_API_KEY` — Google Gemini API key (optional)
