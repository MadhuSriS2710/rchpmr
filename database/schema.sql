-- =========================================================
-- INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION (IPMR)
-- DATABASE SCHEMA (SQLite)
-- Database file: hospital.db
-- =========================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. USERS & STAFF AUTHENTICATION
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLINICIANS & THERAPISTS
CREATE TABLE IF NOT EXISTS therapists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  experience TEXT,
  room TEXT,
  specialty TEXT,
  status TEXT DEFAULT 'AVAILABLE',
  current_patient TEXT,
  current_machine TEXT,
  completed_sessions_today INTEGER DEFAULT 0,
  avatar_color TEXT
);

-- 3. MEDICAL & REHABILITATION MACHINES
CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  department TEXT NOT NULL,
  timing TEXT,
  default_duration INTEGER DEFAULT 30,
  min_duration INTEGER DEFAULT 20,
  max_duration INTEGER DEFAULT 40,
  description TEXT,
  status TEXT DEFAULT 'AVAILABLE',
  current_patient TEXT
);

-- 4. PATIENTS & CLINICAL PROTOCOLS
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  condition TEXT,
  priority INTEGER DEFAULT 10,
  required_machines TEXT NOT NULL,     -- JSON array of machine IDs
  completed_machines TEXT DEFAULT '[]', -- JSON array
  current_machine TEXT,
  assigned_therapist_id TEXT,
  status TEXT DEFAULT 'WAITING',       -- 'WAITING', 'IN_THERAPY', 'COMPLETED'
  care_setting TEXT DEFAULT 'DEPARTMENT', -- 'DEPARTMENT' (1:6 ratio) or 'WARD' (1:9 ratio)
  ward_info TEXT,                      -- Room / Bed Number / Floor for bedside sessions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. THERAPY SESSIONS & TIMERS
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  patient_code TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  machine_name TEXT NOT NULL,
  therapist_id TEXT,
  therapist_name TEXT,
  duration INTEGER NOT NULL,
  total_seconds INTEGER NOT NULL,
  remaining_seconds INTEGER NOT NULL,
  status TEXT DEFAULT 'RUNNING',       -- 'RUNNING', 'COMPLETED', 'EARLY_COMPLETED'
  reclaimed_minutes REAL DEFAULT 0,
  started_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- 6. SYSTEM SETTINGS & PARAMETERS
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
