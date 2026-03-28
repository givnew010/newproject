# المُنسق - إدارة الأصناف (Inventory Management System)

## Overview
A professional Arabic-language inventory management system built with React, Vite, TypeScript, and Tailwind CSS. Features a modern, animated UI for managing inventory items with barcode support.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **Animations**: Framer Motion (via `motion` package)
- **Icons**: Lucide React
- **AI Integration**: @google/genai (Gemini API key via `GEMINI_API_KEY` env var)

## Project Structure
- `src/App.tsx` — Main application component with full inventory UI
- `src/types.ts` — TypeScript type definitions (InventoryItem, ItemStatus)
- `src/main.tsx` — React entry point
- `src/index.css` — Global styles
- `index.html` — HTML entry point
- `vite.config.ts` — Vite configuration (port 5000, host 0.0.0.0, allowedHosts: true)

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
- `GEMINI_API_KEY` — Google Gemini API key (optional, for AI features)
- `DISABLE_HMR` — Set to `"true"` to disable hot module replacement
