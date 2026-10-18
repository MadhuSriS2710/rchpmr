// =========================================================
// PMR SCHEDULER RULES
// =========================================================

// =========================================================
// CLINICAL STAFFING RATIOS & WORKLOAD QUOTAS
// Department Ratio: 1 Therapist to 6 Patients (60 min sessions)
// Ward Ratio: 1 Therapist to 9 Patients (30 - 45 min bedside sessions)
// =========================================================

export const CLINICAL_RATIOS = {
  DEPARTMENT: {
    ratio: "1:6",
    maxPatientsPerDay: 6,
    defaultSessionMinutes: 60,
    label: "In-Department"
  },
  WARD: {
    ratio: "1:9",
    maxPatientsPerDay: 9,
    defaultSessionMinutes: 40,
    label: "In-Ward"
  }
};

export function getTherapistSetting(therapist) {
  if (!therapist) return "DEPARTMENT";
  const room = (therapist.room || "").toLowerCase();
  const specialty = (therapist.specialty || "").toLowerCase();
  if (room.includes("ward") || room.includes("icu") || specialty.includes("ward") || specialty.includes("bedside")) {
    return "WARD";
  }
  return "DEPARTMENT";
}

export function getTherapistQuota(therapist) {
  const setting = getTherapistSetting(therapist);
  return CLINICAL_RATIOS[setting].maxPatientsPerDay;
}

export function isTherapistQuotaReached(therapist, currentOrActiveSessions = 0) {
  const quota = getTherapistQuota(therapist);
  const completed = therapist?.completedSessionsToday || 0;
  return (completed + currentOrActiveSessions) >= quota;
}

export function getPatientSetting(patient) {
  if (!patient) return "DEPARTMENT";
  if (patient.careSetting === "WARD" || (patient.wardInfo && patient.wardInfo.trim().length > 0)) {
    return "WARD";
  }
  return "DEPARTMENT";
}



// =========================================================
// MACHINE AVAILABILITY
// =========================================================

export function isMachineAvailable(machine) {

  if (!machine) {
    return false;
  }

  return machine.status === "AVAILABLE";
}


// =========================================================
// GET NEXT REQUIRED MACHINE
//
// STRICT ROUTING:
//
// Example:
// requiredMachines = [M-01, M-03, M-05]
//
// completedMachines = []
// → M-01
//
// completedMachines = [M-01]
// → M-03
//
// completedMachines = [M-01, M-03]
// → M-05
//
// completedMachines = [M-01, M-03, M-05]
// → null
// =========================================================

export function getNextRequiredMachine(patient) {

  if (!patient) {
    return null;
  }


  const requiredMachines =
    patient.requiredMachines || [];


  const completedMachines =
    patient.completedMachines || [];


  const nextMachine =
    requiredMachines.find(
      (machineId) =>
        !completedMachines.includes(
          machineId
        )
    );


  return nextMachine || null;
}


// =========================================================
// STRICT ROUTING VALIDATION
// =========================================================

export function isStrictRouteValid(
  patient,
  machineId
) {

  const nextMachine =
    getNextRequiredMachine(
      patient
    );


  return (
    nextMachine ===
    machineId
  );
}


// =========================================================
// FLEXIBLE ROUTING VALIDATION
//
// Any required machine is acceptable,
// as long as it has not already been completed.
// =========================================================

export function isFlexibleRouteValid(
  patient,
  machineId
) {

  const requiredMachines =
    patient.requiredMachines || [];


  const completedMachines =
    patient.completedMachines || [];


  const isRequired =
    requiredMachines.includes(
      machineId
    );


  const alreadyCompleted =
    completedMachines.includes(
      machineId
    );


  return (
    isRequired &&
    !alreadyCompleted
  );
}


// =========================================================
// PATIENT ELIGIBILITY
// =========================================================

export function isPatientEligible(
  patient,
  machineId
) {

  if (!patient) {
    return false;
  }


  // -----------------------------------------------
  // Patient already receiving therapy
  // -----------------------------------------------

  if (
    patient.status ===
    "IN_THERAPY"
  ) {

    return false;

  }


  // -----------------------------------------------
  // Patient has already completed treatment
  // -----------------------------------------------

  if (
    patient.status ===
    "COMPLETED"
  ) {

    return false;

  }


  // -----------------------------------------------
  // Machine must be part of treatment plan
  // -----------------------------------------------

  if (
    !patient.requiredMachines ||
    !patient.requiredMachines.includes(
      machineId
    )
  ) {

    return false;

  }


  // -----------------------------------------------
  // ROUTING VALIDATION (Default to STRICT)
  // -----------------------------------------------
  if (patient.routingMode === "FLEXIBLE") {
    return isFlexibleRouteValid(
      patient,
      machineId
    );
  }

  return isStrictRouteValid(
    patient,
    machineId
  );
}


// =========================================================
// PRIORITY CALCULATION
// =========================================================
//
// Higher score = scheduler considers patient earlier.
//
// This is intentionally deterministic for now.
// Later, AI duration prediction and severity_score
// can be incorporated here.
// =========================================================

export function calculatePriority(
  patient,
  queueIndex = 0
) {

  if (!patient) {
    return 0;
  }


  let priority = 100;


  // -----------------------------------------------
  // Waiting position
  // -----------------------------------------------

  priority -=
    queueIndex * 2;


  // -----------------------------------------------
  // STRICT routing
  //
// Strict patients have a sequencing dependency,
// so give them additional operational priority.
// -----------------------------------------------

  if (
    patient.routingMode ===
    "STRICT"
  ) {

    priority += 20;

  }


  // -----------------------------------------------
  // Multiple machines
  // -----------------------------------------------

  if (
    patient.requiredMachines &&
    patient.requiredMachines.length >= 3
  ) {

    priority += 10;

  }


  // -----------------------------------------------
  // Older patients
  // -----------------------------------------------

  if (
    patient.age >= 60
  ) {

    priority += 5;

  }


  // -----------------------------------------------
  // Patient already progressed through route
  // -----------------------------------------------

  const completedCount =
    (
      patient.completedMachines ||
      []
    ).length;


  priority +=
    completedCount * 5;


  return priority;
}


// =========================================================
// GET ROUTING STATUS
//
// Useful for UI / debugging.
// =========================================================

export function getRoutingStatus(
  patient
) {

  if (!patient) {

    return {
      current: null,
      next: null,
      completed: [],
      remaining: []
    };

  }


  const required =
    patient.requiredMachines || [];


  const completed =
    patient.completedMachines || [];


  const remaining =
    required.filter(
      (machineId) =>
        !completed.includes(
          machineId
        )
    );


  return {

    current:
      patient.currentMachine ||
      null,

    next:
      getNextRequiredMachine(
        patient
      ),

    completed,

    remaining

  };
}