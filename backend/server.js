const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("node:fs");
const path = require("node:path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "ipmr-super-secret-jwt-key-2026";

app.use(cors());
app.use(express.json());

// =========================================================
// HEALTH CHECK
// =========================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "Institute of Physical Medicine and Rehabilitation (IPMR)",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

// =========================================================
// AUTHENTICATION & STAFF ID CREATION
// =========================================================

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = db.prepare(
    "SELECT * FROM users WHERE LOWER(username) = LOWER(?)"
  ).get(username.trim());

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials. Staff ID not recognized." });
  }

  const isMatch = bcrypt.compareSync(password.trim(), user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid password for this Staff ID." });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, department: user.department },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      avatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
      phone: user.phone
    }
  });
});

// POST /api/auth/create-staff (Admin creates new real-time Staff ID)
app.post("/api/auth/create-staff", (req, res) => {
  const {
    staffId,
    name,
    password,
    role,
    department,
    room,
    phone,
    experience,
    specialty
  } = req.body;

  if (!staffId || !name || !password || !department) {
    return res.status(400).json({
      error: "Staff ID, Name, Password, and Department are mandatory fields."
    });
  }

  const cleanStaffId = staffId.trim().toLowerCase();
  const existingUser = db.prepare(
    "SELECT id FROM users WHERE LOWER(username) = ?"
  ).get(cleanStaffId);

  if (existingUser) {
    return res.status(409).json({ error: `Staff ID '${staffId}' already exists in system.` });
  }

  const passwordHash = bcrypt.hashSync(password.trim(), 10);
  const initials = name
    .replace(/^M[rs]\.?\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // 1. Insert into users table
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, name, role, department, avatar, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(
    cleanStaffId,
    passwordHash,
    name.trim(),
    role || "Physiotherapist",
    department,
    initials || "ST",
    phone || ""
  );

  // 2. Register as active clinician in therapists table ONLY IF it is a therapy/rehab department or therapist role
  const therapyDepartments = [
    "Physiotherapy",
    "Occupational Therapy",
    "Psychology",
    "Speech & Audiology"
  ];
  const isTherapyDept = therapyDepartments.includes(department);
  const isTherapistRole = /therapist|physiotherapist|psychologist|audiologist/i.test(role || "");

  // Non-clinical staff (Nursing & Triage, Front Desk, Billing, Admin) only receive user login credentials, NOT clinician assignment cards
  if (isTherapyDept || isTherapistRole) {
    const existingTherapist = db.prepare(
      "SELECT id FROM therapists WHERE LOWER(id) = ?"
    ).get(cleanStaffId.toUpperCase());

    if (!existingTherapist) {
      const insertTherapist = db.prepare(`
        INSERT INTO therapists (id, name, designation, department, category, phone, experience, room, specialty, status, completed_sessions_today, avatar_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', 0, ?)
      `);

      const colorPalette = ["#059669", "#2563eb", "#7c3aed", "#0891b2", "#d97706", "#dc2626"];
      const avatarColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      insertTherapist.run(
        cleanStaffId.toUpperCase(),
        name.trim(),
        role || "Physiotherapist",
        department,
        role?.includes("Senior") ? "Senior" : "Staff",
        phone || "+91 98401 00000",
        experience || "3+ Years",
        room || "General PMR Ward",
        specialty || "General Physical Medicine & Rehabilitation",
        avatarColor
      );
    }
  }

  res.status(201).json({
    success: true,
    message: `Real-time Staff ID '${cleanStaffId}' created successfully!`,
    staff: {
      staffId: cleanStaffId,
      name,
      role,
      department,
      phone
    }
  });
});

// =========================================================
// THERAPISTS / CLINICIANS API
// =========================================================

// GET /api/therapists
app.get("/api/therapists", (req, res) => {
  const rows = db.prepare("SELECT * FROM therapists ORDER BY id ASC").all();
  // Map snake_case to camelCase for frontend compatibility
  const therapists = rows.map((r) => ({
    id: r.id,
    name: r.name,
    designation: r.designation,
    department: r.department,
    category: r.category,
    phone: r.phone,
    experience: r.experience,
    room: r.room,
    specialty: r.specialty,
    status: r.status,
    currentPatient: r.current_patient,
    currentMachine: r.current_machine,
    completedSessionsToday: r.completed_sessions_today,
    avatarColor: r.avatar_color
  }));
  res.json(therapists);
});

// PUT /api/therapists/:id
app.put("/api/therapists/:id", (req, res) => {
  const { id } = req.params;
  const { status, currentPatient, currentMachine, completedSessionsToday } = req.body;

  const updates = [];
  const params = [];

  if (status !== undefined) {
    updates.push("status = ?");
    params.push(status);
  }
  if (currentPatient !== undefined) {
    updates.push("current_patient = ?");
    params.push(currentPatient);
  }
  if (currentMachine !== undefined) {
    updates.push("current_machine = ?");
    params.push(currentMachine);
  }
  if (completedSessionsToday !== undefined) {
    updates.push("completed_sessions_today = ?");
    params.push(completedSessionsToday);
  }

  if (updates.length > 0) {
    params.push(id.toUpperCase());
    db.prepare(`UPDATE therapists SET ${updates.join(", ")} WHERE UPPER(id) = ?`).run(...params);
  }

  res.json({ success: true, id });
});

// =========================================================
// MACHINES & PROTOCOLS API
// =========================================================

// GET /api/machines
app.get("/api/machines", (req, res) => {
  const rows = db.prepare("SELECT * FROM machines ORDER BY id ASC").all();
  const machines = rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    department: r.department,
    timing: r.timing,
    defaultDuration: r.default_duration,
    minDuration: r.min_duration,
    maxDuration: r.max_duration,
    description: r.description,
    status: r.status,
    currentPatient: r.current_patient
  }));
  res.json(machines);
});

// PUT /api/machines/:id
app.put("/api/machines/:id", (req, res) => {
  const { id } = req.params;
  const { status, currentPatient } = req.body;

  const updates = [];
  const params = [];

  if (status !== undefined) {
    updates.push("status = ?");
    params.push(status);
  }
  if (currentPatient !== undefined) {
    updates.push("current_patient = ?");
    params.push(currentPatient);
  }

  if (updates.length > 0) {
    params.push(id.toUpperCase());
    db.prepare(`UPDATE machines SET ${updates.join(", ")} WHERE UPPER(id) = ?`).run(...params);
  }

  res.json({ success: true, id });
});

// =========================================================
// PATIENTS QUEUE API
// =========================================================

// GET /api/patients (Default: active queue; ?scope=all includes archived history)
app.get("/api/patients", (req, res) => {
  const scope = req.query.scope || "active";
  let query = "SELECT * FROM patients WHERE status != 'ARCHIVED' ORDER BY priority DESC, id ASC";
  if (scope === "all") {
    query = "SELECT * FROM patients ORDER BY id DESC";
  } else if (scope === "archive") {
    query = "SELECT * FROM patients WHERE status = 'ARCHIVED' ORDER BY id DESC";
  }

  const rows = db.prepare(query).all();
  const patients = rows.map((r) => ({
    id: r.id,
    patientCode: r.patient_code,
    name: r.name,
    age: r.age,
    condition: r.condition,
    priority: r.priority,
    routingMode: r.routing_mode || (r.id % 3 === 0 ? "STRICT" : "FLEXIBLE"),
    trainingDuration: r.training_duration || (20 + ((r.id % 4) * 5)),
    requiredMachines: JSON.parse(r.required_machines || "[]"),
    completedMachines: JSON.parse(r.completed_machines || "[]"),
    currentMachine: r.current_machine,
    assignedTherapistId: r.assigned_therapist_id,
    careSetting: r.care_setting || "DEPARTMENT",
    wardInfo: r.ward_info || "",
    status: r.status,
    createdAt: r.created_at
  }));
  res.json(patients);
});

// POST /api/patients (Add new real-time patient)
app.post("/api/patients", (req, res) => {
  const {
    patientCode,
    name,
    age,
    condition,
    priority,
    requiredMachines,
    assignedTherapistId,
    routingMode,
    trainingDuration,
    careSetting,
    wardInfo
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Patient name is required." });
  }

  // Auto-generate MRN / patientCode based on active intake
  let finalCode = patientCode?.trim();
  const existing = finalCode
    ? db.prepare("SELECT id FROM patients WHERE LOWER(patient_code) = LOWER(?)").get(finalCode)
    : true;

  if (!finalCode || existing) {
    const activeCount = db.prepare("SELECT COUNT(*) as count FROM patients WHERE status != 'ARCHIVED'").get().count;
    let nextNum = activeCount + 1;
    while (db.prepare("SELECT id FROM patients WHERE LOWER(patient_code) = LOWER(?)").get(`P${String(nextNum).padStart(3, "0")}`)) {
      nextNum++;
    }
    finalCode = `P${String(nextNum).padStart(3, "0")}`;
  }

  const reqJson = JSON.stringify(requiredMachines || ["M-01"]);
  const cleanRoutingMode = routingMode === "FLEXIBLE" ? "FLEXIBLE" : "STRICT";
  const cleanDuration = Number(trainingDuration) || (careSetting === "WARD" ? 35 : 60);
  const cleanPriority = Number(priority) || 15;
  const cleanCareSetting = careSetting === "WARD" ? "WARD" : "DEPARTMENT";
  const cleanWardInfo = wardInfo ? String(wardInfo).trim() : "";

  const insert = db.prepare(`
    INSERT INTO patients (
      patient_code,
      name,
      age,
      condition,
      priority,
      required_machines,
      completed_machines,
      current_machine,
      assigned_therapist_id,
      status,
      routing_mode,
      training_duration,
      care_setting,
      ward_info
    )
    VALUES (?, ?, ?, ?, ?, ?, '[]', NULL, ?, 'WAITING', ?, ?, ?, ?)
  `);

  const result = insert.run(
    finalCode,
    name.trim(),
    Number(age) || 35,
    condition || "General Rehabilitation",
    cleanPriority,
    reqJson,
    assignedTherapistId || null,
    cleanRoutingMode,
    cleanDuration,
    cleanCareSetting,
    cleanWardInfo
  );

  res.status(201).json({
    success: true,
    message: `Patient ${finalCode} added to active clinic queue.`,
    patient: {
      id: Number(result.lastInsertRowid),
      patientCode: finalCode,
      name: name.trim(),
      age: Number(age) || 35,
      condition: condition || "General Rehabilitation",
      priority: cleanPriority,
      routingMode: cleanRoutingMode,
      trainingDuration: cleanDuration,
      requiredMachines: JSON.parse(reqJson),
      completedMachines: [],
      currentMachine: null,
      status: "WAITING",
      assignedTherapistId: assignedTherapistId || null,
      careSetting: cleanCareSetting,
      wardInfo: cleanWardInfo
    }
  });
});


// PUT /api/patients/:patientCode
app.put("/api/patients/:patientCode", (req, res) => {
  const { patientCode } = req.params;
  const {
    completedMachines,
    currentMachine,
    status,
    priority,
    assignedTherapistId,
    careSetting,
    wardInfo
  } = req.body;

  const updates = [];
  const params = [];

  if (completedMachines !== undefined) {
    updates.push("completed_machines = ?");
    params.push(JSON.stringify(completedMachines));
  }
  if (currentMachine !== undefined) {
    updates.push("current_machine = ?");
    params.push(currentMachine);
  }
  if (status !== undefined) {
    updates.push("status = ?");
    params.push(status);
  }
  if (priority !== undefined) {
    updates.push("priority = ?");
    params.push(priority);
  }
  if (assignedTherapistId !== undefined) {
    updates.push("assigned_therapist_id = ?");
    params.push(assignedTherapistId);
  }
  if (careSetting !== undefined) {
    updates.push("care_setting = ?");
    params.push(careSetting);
  }
  if (wardInfo !== undefined) {
    updates.push("ward_info = ?");
    params.push(wardInfo);
  }

  if (updates.length > 0) {
    params.push(patientCode.toUpperCase());
    db.prepare(`UPDATE patients SET ${updates.join(", ")} WHERE UPPER(patient_code) = ?`).run(...params);
  }

  res.json({ success: true, patientCode });
});

// DELETE /api/patients (Clear all patients for fresh queue)
app.delete("/api/patients", (req, res) => {
  db.prepare("DELETE FROM patients").run();
  db.prepare("DELETE FROM sessions").run();
  db.prepare("UPDATE machines SET status = 'AVAILABLE', current_patient = NULL").run();
  db.prepare("UPDATE therapists SET status = 'AVAILABLE', current_patient = NULL, current_machine = NULL, completed_sessions_today = 0").run();
  res.json({ success: true, message: "All patients and active sessions cleared successfully." });
});

// DELETE /api/patients/:patientCode
app.delete("/api/patients/:patientCode", (req, res) => {
  const { patientCode } = req.params;
  db.prepare("DELETE FROM patients WHERE UPPER(patient_code) = ?").run(patientCode.toUpperCase());
  res.json({ success: true, message: `Patient ${patientCode} deleted.` });
});

// =========================================================
// LIVE THERAPY SESSIONS API
// =========================================================

// GET /api/sessions
app.get("/api/sessions", (req, res) => {
  const rows = db.prepare("SELECT * FROM sessions WHERE status = 'RUNNING' ORDER BY started_at DESC").all();
  const sessions = rows.map((r) => ({
    id: r.id,
    patientCode: r.patient_code,
    patientName: r.patient_name,
    machineId: r.machine_id,
    machineName: r.machine_name,
    therapistId: r.therapist_id,
    therapistName: r.therapist_name,
    duration: r.duration,
    totalSeconds: r.total_seconds,
    remainingSeconds: r.remaining_seconds,
    status: r.status,
    reclaimedMinutes: r.reclaimed_minutes,
    startedAt: r.started_at
  }));
  res.json(sessions);
});

// POST /api/sessions/start
app.post("/api/sessions/start", (req, res) => {
  const {
    id,
    patientCode,
    patientName,
    machineId,
    machineName,
    therapistId,
    therapistName,
    duration
  } = req.body;

  const totalSeconds = (duration || 30) * 60;
  const startedAt = Date.now();
  const sessionId = id || `${patientCode}-${machineId}-${startedAt}`;

  const insert = db.prepare(`
    INSERT INTO sessions (id, patient_code, patient_name, machine_id, machine_name, therapist_id, therapist_name, duration, total_seconds, remaining_seconds, status, started_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RUNNING', ?)
  `);

  insert.run(
    sessionId,
    patientCode,
    patientName,
    machineId,
    machineName,
    therapistId || null,
    therapistName || null,
    duration,
    totalSeconds,
    totalSeconds,
    startedAt
  );

  // Update Machine to BUSY
  db.prepare("UPDATE machines SET status = 'BUSY', current_patient = ? WHERE id = ?").run(patientCode, machineId);

  // Update Patient to IN_THERAPY
  db.prepare("UPDATE patients SET status = 'IN_THERAPY', current_machine = ? WHERE patient_code = ?").run(machineId, patientCode);

  // Update Therapist to IN_SESSION
  if (therapistId) {
    db.prepare("UPDATE therapists SET status = 'IN_SESSION', current_patient = ?, current_machine = ? WHERE id = ?").run(patientCode, machineId, therapistId);
  }

  res.status(201).json({ success: true, sessionId });
});

// POST /api/sessions/complete
app.post("/api/sessions/complete", (req, res) => {
  const { sessionId, early, reclaimedMinutes } = req.body;

  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  const completedAt = Date.now();
  const status = early ? "EARLY_COMPLETED" : "COMPLETED";

  db.prepare(`
    UPDATE sessions
    SET status = ?, completed_at = ?, remaining_seconds = 0, reclaimed_minutes = ?
    WHERE id = ?
  `).run(status, completedAt, reclaimedMinutes || 0, sessionId);

  // Free machine
  db.prepare("UPDATE machines SET status = 'AVAILABLE', current_patient = NULL WHERE id = ?").run(session.machine_id);

  // Free therapist
  if (session.therapist_id) {
    db.prepare(`
      UPDATE therapists
      SET status = 'AVAILABLE', current_patient = NULL, current_machine = NULL,
          completed_sessions_today = completed_sessions_today + 1
      WHERE id = ?
    `).run(session.therapist_id);
  }

  // Update patient progress
  const patient = db.prepare("SELECT * FROM patients WHERE patient_code = ?").get(session.patient_code);
  if (patient) {
    const completed = JSON.parse(patient.completed_machines || "[]");
    if (!completed.includes(session.machine_id)) {
      completed.push(session.machine_id);
    }
    const required = JSON.parse(patient.required_machines || "[]");
    const hasNext = required.some((m) => !completed.includes(m));

    db.prepare(`
      UPDATE patients
      SET completed_machines = ?, current_machine = NULL, status = ?
      WHERE patient_code = ?
    `).run(JSON.stringify(completed), hasNext ? "WAITING" : "COMPLETED", session.patient_code);
  }

  res.json({ success: true, message: `Session on ${session.machine_id} completed successfully.` });
});

// =========================================================
// SETTINGS API
// =========================================================

// GET /api/settings
app.get("/api/settings", (req, res) => {
  const rows = db.prepare("SELECT * FROM settings").all();
  const config = {};
  for (const r of rows) {
    config[r.key] = r.value === "true" ? true : r.value === "false" ? false : r.value;
  }
  res.json(config);
});

// POST /api/settings
app.post("/api/settings", (req, res) => {
  const insertOrUpdate = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  for (const [key, value] of Object.entries(req.body)) {
    insertOrUpdate.run(key, String(value));
  }

  res.json({ success: true, message: "Settings saved to database." });
});

// =========================================================
// SYSTEM RESET / MAINTENANCE
// =========================================================

// POST /api/reset-data
app.post("/api/reset-data", (req, res) => {
  // Clear active sessions
  db.prepare("DELETE FROM sessions").run();

  // Reset machines to AVAILABLE
  db.prepare("UPDATE machines SET status = 'AVAILABLE', current_patient = NULL").run();

  // Reset therapists to AVAILABLE and clear daily session counts for new morning shift
  db.prepare("UPDATE therapists SET status = 'AVAILABLE', current_patient = NULL, current_machine = NULL, completed_sessions_today = 0").run();

  // Reset patients to WAITING and clear completed_machines
  db.prepare("UPDATE patients SET status = 'WAITING', completed_machines = '[]', current_machine = NULL").run();

  res.json({ success: true, message: "System queues, machines, and staff states reset successfully for new morning shift." });
});

// POST /api/shift/start-new-day (Archives finished day & starts clean queue for new day)
app.post("/api/shift/start-new-day", (req, res) => {
  // 1. Move all completed and current patients into ARCHIVED status
  const archiveResult = db.prepare(`
    UPDATE patients
    SET status = 'ARCHIVED'
    WHERE status != 'ARCHIVED'
  `).run();

  // 2. Mark any unfinished running sessions as COMPLETED
  db.prepare(`
    UPDATE sessions
    SET status = 'COMPLETED', completed_at = ?
    WHERE status = 'RUNNING'
  `).run(Date.now());

  // 3. Reset all machines to AVAILABLE
  db.prepare("UPDATE machines SET status = 'AVAILABLE', current_patient = NULL").run();

  // 4. Reset all therapists to AVAILABLE and reset completed_sessions_today to 0
  db.prepare("UPDATE therapists SET status = 'AVAILABLE', current_patient = NULL, current_machine = NULL, completed_sessions_today = 0").run();

  res.json({
    success: true,
    message: "Today's shift archived into history! Fresh clean queue ready for new day intake.",
    archivedCount: archiveResult.changes
  });
});

// GET /api/reports/history (Comprehensive historical audit log)
app.get("/api/reports/history", (req, res) => {
  const allPatients = db.prepare("SELECT * FROM patients ORDER BY id DESC").all();
  const allSessions = db.prepare("SELECT * FROM sessions ORDER BY started_at DESC").all();

  const dateMap = {};
  for (const p of allPatients) {
    const dateStr = (p.created_at || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = { date: dateStr, patientCount: 0, completedSessions: 0, reclaimedMinutes: 0 };
    }
    dateMap[dateStr].patientCount++;
  }

  for (const s of allSessions) {
    const dateStr = s.started_at ? new Date(s.started_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = { date: dateStr, patientCount: 0, completedSessions: 0, reclaimedMinutes: 0 };
    }
    if (s.status === "COMPLETED" || s.status === "EARLY_COMPLETED") {
      dateMap[dateStr].completedSessions++;
      dateMap[dateStr].reclaimedMinutes += Number(s.reclaimed_minutes || 0);
    }
  }

  const dailyStats = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));

  res.json({
    summary: {
      totalPatients: allPatients.length,
      archivedPatients: allPatients.filter(p => p.status === "ARCHIVED").length,
      activePatients: allPatients.filter(p => p.status !== "ARCHIVED").length,
      totalSessions: allSessions.length,
      completedSessions: allSessions.filter(s => s.status === "COMPLETED" || s.status === "EARLY_COMPLETED").length,
      totalReclaimedMinutes: allSessions.reduce((acc, s) => acc + (Number(s.reclaimed_minutes) || 0), 0)
    },
    dailyStats,
    patients: allPatients.map(r => ({
      id: r.id,
      patientCode: r.patient_code,
      name: r.name,
      age: r.age,
      condition: r.condition,
      priority: r.priority,
      requiredMachines: JSON.parse(r.required_machines || "[]"),
      completedMachines: JSON.parse(r.completed_machines || "[]"),
      careSetting: r.care_setting || "DEPARTMENT",
      wardInfo: r.ward_info || "",
      status: r.status,
      createdAt: r.created_at
    })),
    sessions: allSessions
  });
});

// =========================================================
// DATA DOWNLOAD & BACKUP EXPORTS
// =========================================================

// GET /api/database/backup (Download raw SQLite database file)
app.get("/api/database/backup", (req, res) => {
  const dbFile = path.resolve(__dirname, "..", "database", "hospital.db");
  if (fs.existsSync(dbFile)) {
    const today = new Date().toISOString().slice(0, 10);
    res.download(dbFile, `ipmr_hospital_backup_${today}.db`);
  } else {
    res.status(404).json({ error: "Database file not found." });
  }
});

// GET /api/export/patients (Download patients queue as Excel-compatible CSV)
app.get("/api/export/patients", (req, res) => {
  const rows = db.prepare("SELECT * FROM patients ORDER BY id ASC").all();
  const headers = "ID,PatientCode,Name,Age,Condition,CareSetting,WardInfo,Priority,RoutingMode,RequiredMachines,CompletedMachines,Status,CreatedAt\n";
  const csvRows = rows.map((r) => [
    r.id,
    `"${r.patient_code || ""}"`,
    `"${r.name || ""}"`,
    r.age || "",
    `"${r.condition || ""}"`,
    `"${r.care_setting || "DEPARTMENT"}"`,
    `"${r.ward_info || ""}"`,
    r.priority || "",
    `"${r.routing_mode || "STRICT"}"`,
    `"${(r.required_machines || "").replace(/"/g, '""')}"`,
    `"${(r.completed_machines || "").replace(/"/g, '""')}"`,
    `"${r.status || "WAITING"}"`,
    `"${r.created_at || ""}"`
  ].join(","));

  const csv = headers + csvRows.join("\n");
  const today = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=ipmr_patients_${today}.csv`);
  res.send(csv);
});

// GET /api/export/sessions (Download therapy session history as CSV)
app.get("/api/export/sessions", (req, res) => {
  const rows = db.prepare("SELECT * FROM sessions ORDER BY started_at DESC").all();
  const headers = "SessionID,PatientCode,PatientName,MachineID,MachineName,TherapistID,TherapistName,DurationMin,Status,ReclaimedMinutes,StartedAt,CompletedAt\n";
  const csvRows = rows.map((r) => [
    `"${r.id || ""}"`,
    `"${r.patient_code || ""}"`,
    `"${r.patient_name || ""}"`,
    `"${r.machine_id || ""}"`,
    `"${r.machine_name || ""}"`,
    `"${r.therapist_id || ""}"`,
    `"${r.therapist_name || ""}"`,
    r.duration || 0,
    `"${r.status || ""}"`,
    r.reclaimed_minutes || 0,
    r.started_at ? `"${new Date(r.started_at).toISOString()}"` : '""',
    r.completed_at ? `"${new Date(r.completed_at).toISOString()}"` : '""'
  ].join(","));

  const csv = headers + csvRows.join("\n");
  const today = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=ipmr_sessions_${today}.csv`);
  res.send(csv);
});

// =========================================================
// START SERVER
// =========================================================
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 IPMR Hospital Backend Server running on port ${PORT}`);
  console.log(`📡 REST API Endpoint: http://localhost:${PORT}/api`);
  console.log(`🗄️ Database: SQLite (hospital.db) initialized`);
  console.log(`=======================================================`);
});
