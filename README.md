# FabricTrace • Textile Quality Management & Traceability System

FabricTrace is a complete, enterprise-grade textile manufacturing quality inspection, executive intelligence, and shipping safety gate platform.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Lucide Icons**, and a lightweight **Node.js/Express** backend API.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested with Node 20 and Node 24)
- npm 9+

### 1. Install Dependencies
Run the following command in the project root to install dependencies for both the backend and frontend:
```bash
npm run install:all
```
*(Or navigate to `/backend` and run `npm install`, then `/frontend` and run `npm install`)*

### 2. Start the Application

Open two terminal windows:

**Terminal 1 — Start the Backend API (Port 5000):**
```bash
npm run backend
```

**Terminal 2 — Start the Frontend Platform (Port 3000):**
```bash
npm run frontend
```

Now open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🏛️ System Features & User Roles

### 1. Floor Quality Inspector (`/quality-inspector`)
- **Inspection Dashboard (`/quality-inspector`)**: Review pending rolls awaiting first check, rolls requiring reinspection, and real-time floor activity.
- **1D Linear Barcode Scanner (`/quality-inspector/scan`)**: Industrial Code 128 / Code 39 barcode scanner with camera support, permission fallbacks, scan debounce, manual roll ID lookup, and 1-tap floor test tags.
- **Fabric Passport (`/quality-inspector/rolls/[rollCode]`)**: Comprehensive fabric passport detailing specifications, customer order, previous inspections, and server-side shipping safety gate eligibility.
- **Defect Recording & Inspection Form (`/quality-inspector/rolls/[rollCode]/inspect`)**: Record defect types (stains, tears, selvedge faults), affected meter quantities, severity ratings, notes, and decisions (`PASS`, `REWORK`, `REJECT`) with pre-submission confirmation and instant inspection receipts.
- **Reinspection Queue (`/quality-inspector/reinspection`)**: Track rolls repaired on the floor (washing, spot scouring) needing a second sign-off.

### 2. Mill Owner & Accounts Manager (`/owner`)
- **Executive Control Room (`/owner`)**: High-priority alert counts, orders at risk, scrap meters on hold, logged repair costs, and overall factory pass rate.
- **Actionable Alerts (`/owner/alerts`)**: Prioritized issues needing owner decisions with severity and status filters, suggested solutions, and "Mark Solved" workflow.
- **Order Progress Table (`/owner/orders`)**: Real-time order fulfillment progress, ordered vs produced meters, scrap rate, and delivery deadlines.
- **Quality Analytics & Trends (`/owner/quality-trends`)**: Interactive Recharts visualizations with defect breakdown, pass/rework/reject pie charts, and monthly quality trends.
- **Costs & Bills (`/owner/costs`)**: Confirmed bills vs estimated repair expenses, category filters, and an interactive "Add Expense Record" modal.
- **Audit Ledger (`/owner/audit`)**: Permanent immutable factory ledger tracking every inspection, alert, and status update with before/after state diffs.

### 3. Shipping Safety Gate (`/dispatch`)
- Server-enforced safety barrier that strictly blocks damaged or uninspected rolls from ever being loaded onto delivery trucks.

---

## 📂 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── audit/            # Audit trail controller & repository
│   │   ├── costs/            # Quality expenses & financial controllers
│   │   ├── dispatch/         # Server-enforced shipping safety gate
│   │   ├── inspection/       # Inspection recording & reinspection queue
│   │   ├── orders/           # Customer orders & fulfillment progress
│   │   ├── owner/            # Executive summary & trend analytics
│   │   ├── rolls/            # Roll registry & fabric passport
│   │   └── server.js         # Express app entry & routing
│   └── tests/                # Automated backend test suites
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── quality-inspector/   # Quality Inspector routes
│   │   │   └── owner/               # Owner executive routes
│   │   ├── components/
│   │   │   ├── quality-inspector/   # Floor inspection components
│   │   │   ├── owner/               # Executive & financial components
│   │   │   └── shared/              # Reusable modal, states & headers
│   │   ├── services/                # Typed API service abstractions
│   │   ├── hooks/                   # Custom React state & data hooks
│   │   ├── lib/                     # API client, formatters & validations
│   │   └── types/                   # TypeScript interfaces
│   ├── postcss.config.mjs
│   └── next.config.ts
└── package.json                     # Monorepo root scripts
```

---

## 🧪 Testing & Verification

- **Run Backend Unit Tests:**
  ```bash
  npm run test:backend
  ```
- **Build Frontend for Production:**
  ```bash
  npm run build:frontend
  ```