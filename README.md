# IPMR AI — Rehabilitation Resource Scheduling System

An autonomous clinical resource and scheduling platform designed for the **Institute of Physical Medicine and Rehabilitation (IPMR)**.

---

## 🌟 Key Architecture

The project is structured into three clear tiers:

```
rch/
├── 📁 frontend/          # React + Vite client (UI, scheduling engine, clinical dashboards)
├── 📁 backend/           # Node.js + Express REST API server (Authentication, API endpoints)
└── 📁 database/          # SQLite database (hospital.db) & standalone schema (schema.sql)
```

---

## 🚀 Features

- **Autonomous 3-Way Scheduling**: Matches eligible patients with 14 specialized robotic/electrotherapy machines and 51 clinicians across Physiotherapy, OT, Psychology, and Speech.
- **Clinical Sequencing**: Supports both `STRICT` sequential workflows and `FLEXIBLE` alternative machine routing.
- **Workload Quotas**: Enforces clinical staffing ratios:
  - **In-Department**: 1 Therapist : 6 Patients (60 min standard sessions)
  - **In-Ward**: 1 Therapist : 9 Patients (30–45 min bedside sessions)
- **Early Time Reclaim**: Dynamically reclaims machine minutes upon early completion and auto-allocates to waiting patients.
- **Permanent SQLite Storage & History**: Tracks daily shifts, session timers, and patient intake records with CSV & SQLite backup exports.

---

## 🛠️ Setup & Running Locally

### 1. Backend Server
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` (REST API at `http://localhost:5000/api`).*

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` or `http://localhost:5174` (proxies `/api` to backend).*
