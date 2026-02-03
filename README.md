# Budgeto

A tiny, offline-first expense tracker built as a lightweight PWA.

## What it is
Budgeto is a simple personal budgeting / expense logging app.
It stores everything **locally in your browser** (IndexedDB) and works offline.

## Features
- Offline-first (local storage via IndexedDB)
- Fast add flow (one-hand friendly)
- Dashboard with quick insights:
  - Monthly total
  - Avg/day + biggest expense
  - Trend sparkline + weekly bars + category share
- Bottom navigation (Dashboard / Add / Settings)
- Category management (defaults + custom categories)
- Delete with undo (toast)
- i18n: Danish / English
- Demo mode (seeded data)

## Tech
- React + TypeScript
- Vite
- Dexie (IndexedDB)
- `vite-plugin-pwa` (installable PWA)

## Getting started
Requirements: Node.js (recommended: latest LTS)

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Useful scripts
- `npm run dev` – start dev server
- `npm run build` – typecheck + production build
- `npm run preview` – serve production build locally
- `npm run pwa:icons` – generate PWA icons (see `scripts/generate-icons.mjs`)

## URLs / navigation
The app uses hash navigation:
- `#dashboard`
- `#add`
- `#settings`

## Demo mode
To run with seeded demo data:

```
/?demo=true
```

## Data & privacy
All entries are stored locally on the device in the browser’s IndexedDB.
There is no backend.

## Notes
This is a small, pragmatic project—built to be pleasant to use and easy to maintain.
