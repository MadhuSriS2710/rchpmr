import { useState } from "react";
import {
  UserRound,
  Clock3,
  Activity,
  UserCheck,
  Save,
  X,
  Check,
  Building2,
  BedDouble
} from "lucide-react";

import { machines } from "../data/machines";
import { therapists } from "../data/therapists";
import { apiService } from "../api/apiService";

function AddPatient({ patients, setPatients, setActivePage }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    condition: "",
    careSetting: "DEPARTMENT", // "DEPARTMENT" (1:6 ratio, 60m) or "WARD" (1:9 ratio, 30-45m)
    wardBlock: "Ward Block - 3rd Floor",
    bedNumber: "",
    trainingDuration: "60",
    routingMode: "STRICT",
    requiredMachines: [],
    preferredTime: "",
    assignedTherapistId: ""
  });

  const [error, setError] = useState("");

  const conditions = [
    "Post-op Knee",
    "Cervical Spondylosis",
    "Stroke Rehabilitation",
    "Muscle Tear",
    "Low Back Pain",
    "Shoulder Injury",
    "Sports Injury",
    "Joint Stiffness",
    "Spinal Cord Injury",
    "Traumatic Brain Injury",
    "Parkinsonian Gait Deficit",
    "Pediatric Developmental Delay"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setError("");
  };

  const handleMachineChange = (machineId) => {
    setFormData((prev) => {
      const alreadySelected = prev.requiredMachines.includes(machineId);

      return {
        ...prev,
        requiredMachines: alreadySelected
          ? prev.requiredMachines.filter((id) => id !== machineId)
          : [...prev.requiredMachines, machineId]
      };
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter the patient name.");
      return;
    }

    if (
      !formData.age ||
      Number(formData.age) < 1 ||
      Number(formData.age) > 120
    ) {
      setError("Please enter a valid age.");
      return;
    }

    if (!formData.condition) {
      setError("Please select the patient's condition.");
      return;
    }

    if (formData.requiredMachines.length === 0) {
      setError("Please select at least one required machine.");
      return;
    }

    const nextId = patients.length + 1;

    const isWard = formData.careSetting === "WARD";
    const wardInfo = isWard
      ? `${formData.wardBlock || "Ward Block"} · Bed ${formData.bedNumber?.trim() || "01"}`
      : null;

    const newPatientData = {
      name: formData.name.trim(),
      age: Number(formData.age),
      condition: formData.condition,
      careSetting: formData.careSetting,
      wardInfo,
      routingMode: formData.routingMode,
      trainingDuration: Number(formData.trainingDuration),
      requiredMachines: formData.requiredMachines,
      preferredTime: formData.preferredTime,
      assignedTherapistId: formData.assignedTherapistId || null,
      status: "WAITING",
      priority: 25,
      completedMachines: [],
      currentMachine: null,
      waitingSince: 0,
      sessionNumber: 1
    };

    try {
      const resp = await apiService.addPatient(newPatientData);
      const saved = resp?.patient || {
        ...newPatientData,
        id: nextId,
        patientCode: `P${String(nextId).padStart(3, "0")}`
      };
      setPatients((prev) => [saved, ...prev]);
    } catch (err) {
      console.warn("Backend patient sync notice:", err);
      const fallback = {
        ...newPatientData,
        id: nextId,
        patientCode: `P${String(nextId).padStart(3, "0")}`
      };
      setPatients((prev) => [fallback, ...prev]);
    }

    setActivePage("Patients");
  };

  return (
    <div className="add-patient-page">
      <div className="add-patient-header">
        <div>
          <span className="page-label">
            INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION
          </span>
          <h1>Patient Registration & Treatment Protocol</h1>
          <p>
            Register a patient, specify rehabilitation requirements, and link specialized clinicians.
          </p>
        </div>

        <div className="registration-id">
          <span>NEW PATIENT ID</span>
          <strong>P{String(patients.length + 1).padStart(3, "0")}</strong>
        </div>
      </div>

      <form className="patient-registration-card" onSubmit={handleSubmit}>
        {/* SECTION 1: PATIENT INFO */}
        <div className="form-section">
          <div className="form-section-title">
            <div className="form-icon">
              <UserRound size={18} />
            </div>

            <div>
              <h2>Patient Information</h2>
              <p>Enter the patient's basic clinical information.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Patient Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Age *</label>
              <input
                type="number"
                name="age"
                placeholder="Enter age"
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Primary Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="">Select clinical condition</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Preferred Therapy Time</label>
              <div className="input-with-icon">
                <Clock3 size={17} />
                <input
                  type="time"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* CARE SETTING & RATIO SELECTION */}
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px dashed var(--border-color)" }}>
            <label style={{ display: "block", marginBottom: "0.6rem", fontWeight: "600", fontSize: "0.88rem" }}>
              Clinical Care Setting *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div
                style={{
                  border: formData.careSetting === "DEPARTMENT" ? "2px solid #0284c7" : "1px solid var(--border-color)",
                  backgroundColor: formData.careSetting === "DEPARTMENT" ? "rgba(2, 132, 199, 0.08)" : "var(--card-bg)",
                  borderRadius: "10px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => setFormData((prev) => ({ ...prev, careSetting: "DEPARTMENT", trainingDuration: "60" }))}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Building2 size={18} color="#0284c7" />
                  <strong style={{ fontSize: "0.95rem" }}>🏢 In Department Therapy</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  • <strong>60 Minutes</strong> comprehensive rehabilitation<br/>
                  • Main PT Hall, Robotics Labs & Neuromodulation
                </div>
              </div>

              <div
                style={{
                  border: formData.careSetting === "WARD" ? "2px solid #059669" : "1px solid var(--border-color)",
                  backgroundColor: formData.careSetting === "WARD" ? "rgba(5, 150, 105, 0.08)" : "var(--card-bg)",
                  borderRadius: "10px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => setFormData((prev) => ({ ...prev, careSetting: "WARD", trainingDuration: "40" }))}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <BedDouble size={18} color="#059669" />
                  <strong style={{ fontSize: "0.95rem" }}>🛏️ In Ward Bedside Therapy</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  • <strong>30 – 45 Minutes</strong> bedside functional therapy<br/>
                  • Inpatient Ward Blocks & ICU Mobilization
                </div>
              </div>
            </div>

            {formData.careSetting === "WARD" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-field">
                  <label>Ward Block / Floor *</label>
                  <select
                    name="wardBlock"
                    value={formData.wardBlock}
                    onChange={handleChange}
                  >
                    <option value="Ward Block - 1st Floor">Ward Block - 1st Floor (General Medicine)</option>
                    <option value="Ward Block - 2nd Floor">Ward Block - 2nd Floor (Neuro Inpatient)</option>
                    <option value="Ward Block - 3rd Floor">Ward Block - 3rd Floor (Post-Surgical)</option>
                    <option value="Ward Block - 4th Floor">Ward Block - 4th Floor (Orthopedic Care)</option>
                    <option value="Ward Block - 5th Floor">Ward Block - 5th Floor (Special Rehab)</option>
                    <option value="ICU & Acute Mobilization">ICU & Critical Care Mobilization</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Bed / Room Number *</label>
                  <input
                    type="text"
                    name="bedNumber"
                    placeholder="e.g. Bed 304, ICU-02"
                    value={formData.bedNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: CLINICAL CONFIG & THERAPIST */}
        <div className="form-section">
          <div className="form-section-title">
            <div className="form-icon">
              <UserCheck size={18} />
            </div>

            <div>
              <h2>Therapy Configuration & Assigned Clinician</h2>
              <p>Select routing protocol, timing, and assign a specialized therapist.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Prescribed Session Duration *</label>
              <select
                name="trainingDuration"
                value={formData.trainingDuration}
                onChange={handleChange}
              >
                <option value="20">20 minutes (Short/Hoist)</option>
                <option value="30">30 minutes (Standard Rehab)</option>
                <option value="40">40 minutes (Intensive Gait)</option>
                <option value="60">60 minutes (Comprehensive In-Dept)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Assigned / Preferred Clinician</label>
              <select
                name="assignedTherapistId"
                value={formData.assignedTherapistId}
                onChange={handleChange}
              >
                <option value="">-- Dynamic Auto-Assign by Department --</option>
                <optgroup label="Senior Physiotherapists">
                  {therapists
                    .filter((t) => t.category === "Senior")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.designation})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Physiotherapists">
                  {therapists
                    .filter((t) => t.category === "Physiotherapist")
                    .slice(0, 15)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.room || "PT Dept"})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Occupational Therapists">
                  {therapists
                    .filter((t) => t.department === "Occupational Therapy")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (OT - {t.specialty.substring(0, 30)}...)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Psychology & Speech">
                  {therapists
                    .filter(
                      (t) =>
                        t.department === "Psychology" ||
                        t.department === "Speech & Audiology"
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.department})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div className="form-field full-width">
              <label>Routing Mode *</label>
              <div className="routing-options">
                <label
                  className={
                    formData.routingMode === "STRICT"
                      ? "routing-option selected"
                      : "routing-option"
                  }
                >
                  <input
                    type="radio"
                    name="routingMode"
                    value="STRICT"
                    checked={formData.routingMode === "STRICT"}
                    onChange={handleChange}
                  />
                  <div>
                    <strong>Strict Sequential Routing</strong>
                    <span>Machines must strictly follow the prescribed order.</span>
                  </div>
                </label>

                <label
                  className={
                    formData.routingMode === "FLEXIBLE"
                      ? "routing-option selected"
                      : "routing-option"
                  }
                >
                  <input
                    type="radio"
                    name="routingMode"
                    value="FLEXIBLE"
                    checked={formData.routingMode === "FLEXIBLE"}
                    onChange={handleChange}
                  />
                  <div>
                    <strong>Flexible Dynamic Routing</strong>
                    <span>Any eligible required machine can be assigned when free.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: 14 REHABILITATION EQUIPMENTS */}
        <div className="form-section">
          <div className="form-section-title">
            <div className="form-icon">
              <Activity size={18} />
            </div>

            <div>
              <h2>Required Rehabilitation Equipments (14 Systems Available)</h2>
              <p>
                Select all equipments needed from the official Institute equipment catalog.
              </p>
            </div>
          </div>

          <div className="machine-selection-grid">
            {machines.map((machine) => {
              const selected = formData.requiredMachines.includes(machine.id);

              return (
                <button
                  type="button"
                  key={machine.id}
                  className={
                    selected
                      ? "machine-select-card selected"
                      : "machine-select-card"
                  }
                  onClick={() => handleMachineChange(machine.id)}
                >
                  <div className="machine-select-check">
                    {selected && <Check size={14} />}
                  </div>

                  <div className="machine-select-info">
                    <div className="machine-select-badge-row">
                      <strong>{machine.id}</strong>
                      <span className="timing-spec">{machine.timing}</span>
                    </div>
                    <span className="machine-select-name">{machine.name}</span>
                    <small>{machine.type}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="registration-footer">
          <button
            type="button"
            className="cancel-registration"
            onClick={() => setActivePage("Patients")}
          >
            <X size={17} />
            Cancel
          </button>

          <button type="submit" className="save-patient-button">
            <Save size={17} />
            Register Patient & Route
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPatient;