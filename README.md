# Vacation_2026 — Canas de Senhorim 🌿

**Fim de semana · 3–5 Julho 2026**

A collaborative trip planner for a weekend getaway to Quinta dos Manteiros, Canas de Senhorim.

---

## What this is

An interactive HTML page that acts as a shared trip dashboard for 7 friends. It handles:

- **House info** — address, check-in/out times, host contacts, GPS warning
- **Carpooling** — two cars, departure times, pickup order
- **Checklists** — who brings what (food, drinks, gear, games), with assignment dropdowns
- **Decisions** — open items to settle before the trip
- **Meal plan** — Friday through Sunday, all meals

State is shared in real time across devices via **Google Sheets** (JSONP), with localStorage as a fallback for offline use.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The full trip planner UI |
| `support.js` | DC runtime (React-based template engine, auto-generated) |
| `image-slot.js` | Drag-and-drop image placeholder web component |
| `google-sheets-apps-script.gs` | Google Apps Script backend for shared state |
| `.image-slots.state.json` | Persisted house photo (auto-managed) |

---

## Setup

### Google Sheets sync

1. Create a Google Sheet and open **Extensions → Apps Script**
2. Paste the contents of `google-sheets-apps-script.gs` and deploy as a **Web App** (access: anyone)
3. Copy the deployment URL into `index.html` at:
   ```js
   SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_ID/exec'
   ```

The script maintains two sheets: `Assignments` (who brings what) and `Checks` (ticked items). All reads/writes are JSONP so no CORS configuration is needed.

### Running locally

Serve from any static file server — the page fetches its own source and the image sidecar via `fetch()`, so `file://` won't work.

```bash
npx serve .
# or
python3 -m http.server
```

---

## How state works

| Layer | What it stores | Scope |
|---|---|---|
| `localStorage` | Checkbox state + assignments | Per device |
| Google Sheets | Checkbox state + assignments | Shared across all devices |
| `.image-slots.state.json` | House photo (base64 WebP) | Project file |

On load, localStorage is read first (instant), then Sheets is fetched and merged (Sheets wins on conflicts).

---

## People

Joana · João P. · Diogo · Maria · David · Rodrigo · João

https://docs.google.com/spreadsheets/d/1UlZr1ynGipLd33xHF4ET2rgJTBoszwD0AqvIxHMSgLg/edit?usp=drivesdk
