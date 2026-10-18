const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");
const bcrypt = require("bcryptjs");

// Database directory in dedicated database/ folder
const dbDir = path.resolve(__dirname, "..", "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, "hospital.db");
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for concurrency & data integrity
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// =========================================================
// TABLE CREATION
// =========================================================

db.exec(`
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

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    condition TEXT,
    priority INTEGER DEFAULT 10,
    required_machines TEXT NOT NULL, -- JSON array of machine IDs
    completed_machines TEXT DEFAULT '[]', -- JSON array
    current_machine TEXT,
    assigned_therapist_id TEXT,
    status TEXT DEFAULT 'WAITING', -- 'WAITING', 'IN_THERAPY', 'COMPLETED'
    care_setting TEXT DEFAULT 'DEPARTMENT', -- 'DEPARTMENT' (1:6) or 'WARD' (1:9)
    ward_info TEXT, -- Room / Bed Number / Floor for bedside sessions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
    status TEXT DEFAULT 'RUNNING', -- 'RUNNING', 'COMPLETED', 'EARLY_COMPLETED'
    reclaimed_minutes REAL DEFAULT 0,
    started_at INTEGER NOT NULL,
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Safe migrations for existing SQLite databases
try {
  const patientCols = db.prepare("PRAGMA table_info(patients)").all().map(c => c.name);
  if (!patientCols.includes("care_setting")) {
    db.exec("ALTER TABLE patients ADD COLUMN care_setting TEXT DEFAULT 'DEPARTMENT'");
  }
  if (!patientCols.includes("ward_info")) {
    db.exec("ALTER TABLE patients ADD COLUMN ward_info TEXT");
  }
} catch (e) {
  console.warn("Migration warning:", e.message);
}

// =========================================================
// SEED INITIAL DATA (IF EMPTY)
// =========================================================

function seedDatabase() {
  // 1. Seed Default Admin & Staff Accounts
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, name, role, department, avatar, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const adminHash = bcrypt.hashSync("admin123", 10);
    const staffHash = bcrypt.hashSync("pmr2026", 10);

    insertUser.run("admin", adminHash, "System Administrator", "Chief Clinical Admin", "PMR Directorate", "AD", "+91 98401 00000");
    insertUser.run("karthikeyan", staffHash, "Mr. Karthikeyan.S", "Senior Physiotherapist", "Physiotherapy", "KS", "+91 98401 23401");
    insertUser.run("arul", staffHash, "Mrs. Arul Abirami.G", "Lead Occupational Therapist", "Occupational Therapy", "AA", "+91 98401 23442");
    insertUser.run("yazhini", staffHash, "Ms. Yazhini", "Clinical Psychologist", "Psychology", "YZ", "+91 98401 23447");
    insertUser.run("rithika", staffHash, "Ms. Rithika.R", "Audiologist & SLP", "Speech & Audiology", "RR", "+91 98401 23449");

    console.log("✓ Initial users seeded with encrypted passwords.");
  }

  // 2. Seed 14 Institute Machines
  const machineCount = db.prepare("SELECT COUNT(*) as count FROM machines").get().count;
  if (machineCount === 0) {
    const insertMachine = db.prepare(`
      INSERT INTO machines (id, name, type, department, timing, default_duration, min_duration, max_duration, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialMachines = [
      ["M-01", "Moto-med", "Robotic Movement Therapy", "Physiotherapy", "20 - 40 Mints", 30, 20, 40, "Motor-assisted movement therapy for legs and arms with biofeedback and spasticity detection.", "AVAILABLE"],
      ["M-02", "Amadeo", "Robotic Hand Rehabilitation", "Occupational Therapy", "20 - 40 Mints", 30, 20, 40, "Advanced robotic-assisted finger and hand rehabilitation device for active, passive, and assisted motion.", "AVAILABLE"],
      ["M-03", "Diego", "Robotic Upper Limb Rehab", "Occupational Therapy", "20 - 40 Mints", 30, 20, 40, "Intelligent arm-robotics with overhead suspension for shoulder, elbow, and whole-arm therapy.", "AVAILABLE"],
      ["M-04", "Pablo", "Multifunctional Sensor Rehab", "Occupational Therapy", "20 - 40 Mints", 30, 20, 40, "Wireless sensor-based motion and force evaluation system for upper and lower extremities.", "AVAILABLE"],
      ["M-05", "Tymo", "Sensor Static/Dynamic Posture", "Physiotherapy", "20 - 40 Mints", 30, 20, 40, "Static and dynamic balance assessment and therapy board with visual gaming biofeedback.", "AVAILABLE"],
      ["M-06", "Sara comblizer", "Critical Care Mobilizer", "Physiotherapy", "30 - Mints", 30, 30, 30, "Early mobilization chair for critically ill or acute rehabilitation patients.", "AVAILABLE"],
      ["M-07", "Sara Plus", "Active Standing & Gait Transfer", "Physiotherapy", "30 - Mints", 30, 30, 30, "Powered standing and raising aid providing trunk support for functional gait retraining.", "AVAILABLE"],
      ["M-08", "Sara Steady", "Manual Standing Aid", "Physiotherapy", "30 - Mints", 30, 30, 30, "Non-powered standing aid encouraging active sit-to-stand transitions and posture stabilization.", "AVAILABLE"],
      ["M-09", "Tilt Table", "Passive Orthostatic Verticalizer", "Physiotherapy", "30 - Mints", 30, 30, 30, "Controlled orthostatic tilting platform with angle adjustments for circulatory and weight-bearing adaptation.", "AVAILABLE"],
      ["M-10", "Maxi Move", "Passive Transfer & Sling Hoist", "Physiotherapy", "20 - Mints", 20, 20, 20, "Battery-powered mobile sling hoist for safe, comfortable transfer of non-ambulatory patients.", "AVAILABLE"],
      ["M-11", "Maxi Sky", "Ceiling Hoist Tracking System", "Physiotherapy", "20 - Mints", 20, 20, 20, "Overhead ceiling track hoist delivering full room coverage for secure patient lifting.", "AVAILABLE"],
      ["M-12", "rPMS", "Peripheral Magnetic Stimulation", "Physiotherapy", "15 - 30 Mints", 25, 15, 30, "Repetitive peripheral magnetic stimulation for neuromuscular pain management and motor recovery.", "AVAILABLE"],
      ["M-13", "rTMS", "Transcranial Magnetic Neuro-Rehab", "Physiotherapy", "30 Mints", 30, 30, 30, "Non-invasive repetitive transcranial magnetic stimulation for neuroplasticity cortical conditioning.", "AVAILABLE"],
      ["M-14", "Robo-Walk", "Robotic Gait & Harness Trainer", "Physiotherapy", "40 - Mints", 40, 40, 40, "Robotic bodyweight-supported treadmill gait retraining system with dynamic kinetic cable guidance.", "AVAILABLE"]
    ];

    for (const m of initialMachines) {
      insertMachine.run(...m);
    }
    console.log("✓ 14 Official Machines seeded.");
  }

  // 3. Seed 50 Clinicians
  const therapistCount = db.prepare("SELECT COUNT(*) as count FROM therapists").get().count;
  if (therapistCount === 0) {
    const insertTherapist = db.prepare(`
      INSERT INTO therapists (id, name, designation, department, category, phone, experience, room, specialty, status, completed_sessions_today, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seniorPT = [
      ["TH-001", "Mr. Karthikeyan.S", "Senior Physiotherapist", "Physiotherapy", "Senior", "+91 98401 23401", "12+ Years", "Room 101 - Neuro PMR", "Neurological & Musculoskeletal Rehab, Robotic Systems", "AVAILABLE", 4, "#059669"],
      ["TH-002", "Mr. Mujammil.A.F", "Senior Physiotherapist", "Physiotherapy", "Senior", "+91 98401 23402", "11+ Years", "Room 102 - Advanced Tech", "Spinal Cord & Gait Rehabilitation, rTMS / rPMS", "AVAILABLE", 3, "#059669"],
      ["TH-003", "Mr. Prakash.P", "Senior Physiotherapist", "Physiotherapy", "Senior", "+91 98401 23403", "10+ Years", "Room 103 - Orthopedic PMR", "Advanced Orthopedic Rehab & Biomechanics", "AVAILABLE", 5, "#059669"]
    ];

    const ptStaff = [
      "Mr. Kaviarasu.M", "Mr. Dilipan.J", "Mr. Jagadeesh.S", "Mrs. Kalaivani.P", "Mr. Selvaraman.S.M",
      "Mr. Victor Joshuva.V.A", "Mr. Vishnu Pradeep.K", "Mr. Santhosh kumar.T.K", "Mr. Rahul Ram.K.M",
      "Mrs. Keerthi Priya.P", "Mrs. Nivyaa.R V", "Mr. Srigowtham.V", "Mr. Remokson.A", "Ms. Rizwana Parveen.M",
      "Mr. Arun Das.S", "Ms. Dhaksha Devi.M", "Mr. Mohamed Halith", "Ms. Monica.S", "Mr. Harish kumar.S",
      "Mr. Saravanakumar.S", "Mr. Shriyansh Shukla", "Mrs. Divya.P.S", "Mr. Karthick Raja", "Ms. Deepa",
      "R. Lokesh", "Ms. Snehadharshini", "Mr. Karthik.S", "Mr. Sudhakaran.V", "Mr. Joel.S",
      "Mr. Akash Kumar.P", "Mrs. Vidhya Prasadh", "Mr. Prithviraj.S", "Mrs. Sumithra.K", "Mr. Devanand.P.G",
      "Mr. Thariq Moideen", "Mr. Sanjay.M", "Ms. Suruthika.A", "Mr. Tamilarasan Madhan"
    ];

    const otStaff = [
      ["TH-042", "Mrs. Arul Abirami.G", "Occupational Therapist", "Occupational Therapy", "Occupational Therapist", "+91 98401 23442", "9+ Years", "OT Suite 201 - Hand Rehab", "Hand Function (45-60 min) & Coma Stimulation", "AVAILABLE", 4, "#0d9488"],
      ["TH-043", "Ms. Bavana.P", "Occupational Therapist", "Occupational Therapy", "Occupational Therapist", "+91 98401 23443", "5+ Years", "Robotic Hand Lab", "Amadeo Robotic Hand Rehab & Finger Extension", "AVAILABLE", 3, "#0d9488"],
      ["TH-044", "Ms. Kaviya Shree.S", "Occupational Therapist", "Occupational Therapy", "Occupational Therapist", "+91 98401 23444", "4+ Years", "Robotic Arm Lab", "Diego Upper Limb Robotic Arm & Shoulder Assist", "AVAILABLE", 3, "#0d9488"],
      ["TH-045", "Ms. Anushya Ravikumar", "Occupational Therapist", "Occupational Therapy", "Occupational Therapist", "+91 98401 23445", "4+ Years", "OT Sensor Suite", "Pablo Multifunctional Sensor & Cognitive Retraining", "AVAILABLE", 2, "#0d9488"],
      ["TH-046", "Ms. Pradeepa", "Occupational Therapist", "Occupational Therapy", "Occupational Therapist", "+91 98401 23446", "6+ Years", "Pediatric OT Wing", "Pediatric / Child Psychiatry (40-45 min) & Sensory", "AVAILABLE", 4, "#0d9488"],
      ["TH-047", "Ms. Priyadharshini.C", "Occupational Therapist", "Occupational Therapy", "Occupational Therapist", "+91 98401 23447", "5+ Years", "OT Suite 202 - Neuro", "Coma Stimulation (20-30 min) & Hand Function", "AVAILABLE", 3, "#0d9488"]
    ];

    const psychologyStaff = [
      ["TH-048", "Ms. Yazhini", "Psychologist", "Psychology", "Psychologist", "+91 98401 23448", "7+ Years", "Psychology Consultation 301", "Cognitive Retraining (30-45 min), Counselling (45 min) & Assessments", "AVAILABLE", 4, "#8b5cf6"]
    ];

    const speechStaff = [
      ["TH-049", "Ms. Rithika.R", "Audiologist & Speech Language pathologist", "Speech & Audiology", "Speech & Audiology", "+91 98401 23449", "6+ Years", "Speech Lab 302", "Speechtherapy Adult (30-40 min) & Dysphagia Rehab", "AVAILABLE", 3, "#ec4899"],
      ["TH-050", "Mr. Subburaja.G", "Audiologist & Speech Language pathologist", "Speech & Audiology", "Speech & Audiology", "+91 98401 23450", "5+ Years", "Speech Lab 303", "Speechtherapy (40-45 min) & Language Pathology", "AVAILABLE", 4, "#ec4899"]
    ];

    // Insert Seniors
    for (const s of seniorPT) insertTherapist.run(...s);

    // Insert 38 PTs
    ptStaff.forEach((name, idx) => {
      const num = idx + 4;
      const id = `TH-${String(num).padStart(3, "0")}`;
      const bay = String.fromCharCode(65 + (idx % 6));
      insertTherapist.run(
        id,
        name,
        "Physiotherapist",
        "Physiotherapy",
        "Physiotherapist",
        `+91 98401 234${String(num).padStart(2, "0")}`,
        `${3 + (idx % 6)}+ Years`,
        `Main PT Hall - Bay ${bay}`,
        "Musculoskeletal Mobilization, Post-surgical Gait Retraining",
        "AVAILABLE",
        1 + (idx % 4),
        "#0284c7"
      );
    });

    // Insert OT, Psych, Speech
    for (const o of otStaff) insertTherapist.run(...o);
    for (const p of psychologyStaff) insertTherapist.run(...p);
    for (const s of speechStaff) insertTherapist.run(...s);

    console.log("✓ 50 Therapists seeded.");
  }

  // 4. Patients table starts empty for real hospital registrations
  // (Sample patients removed so user can register real patients)

  // 5. Seed Default Settings
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    insertSetting.run("instituteName", "Institute of Physical Medicine and Rehabilitation (IPMR)");
    insertSetting.run("facilityCode", "IPMR-CH-01");
    insertSetting.run("operatingHoursStart", "08:00");
    insertSetting.run("operatingHoursEnd", "20:00");
    insertSetting.run("bufferTimeMinutes", "5");
    insertSetting.run("autonomousScheduler", "true");
    insertSetting.run("strictPriorityBoost", "true");
    insertSetting.run("earlyReclaimEngine", "true");
    insertSetting.run("autoAssignTherapist", "true");
    console.log("✓ Settings seeded.");
  }
}

seedDatabase();

module.exports = db;
