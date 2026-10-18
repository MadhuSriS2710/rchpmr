import {
  isMachineAvailable,
  isPatientEligible,
  calculatePriority
} from "./schedulerRules";


// =========================================================
// GET ELIGIBLE PATIENTS
// =========================================================

export function getEligiblePatients(
  patients,
  machineId
) {

  if (!patients || !machineId) {
    return [];
  }


  return patients.filter(
    (patient) =>
      isPatientEligible(
        patient,
        machineId
      )
  );
}


// =========================================================
// SELECT BEST PATIENT
// =========================================================

export function selectBestPatient(
  patients,
  machineId
) {

  const eligiblePatients =
    getEligiblePatients(
      patients,
      machineId
    );


  if (
    eligiblePatients.length === 0
  ) {

    return null;

  }


  const rankedPatients =
    eligiblePatients.map(
      (
        patient,
        index
      ) => ({

        patient,

        priority:
          calculatePriority(
            patient,
            index
          )

      })
    );


  rankedPatients.sort(
    (a, b) =>
      b.priority -
      a.priority
  );


  return rankedPatients[0].patient;
}


// =========================================================
// ALLOCATE ONE MACHINE
// =========================================================

export function allocateMachine(
  patients,
  machines,
  machineId
) {

  const machine =
    machines.find(
      (item) =>
        item.id ===
        machineId
    );


  if (!machine) {
    return null;
  }


  // Machine must actually be available
  if (
    !isMachineAvailable(
      machine
    )
  ) {

    return null;

  }


  const selectedPatient =
    selectBestPatient(
      patients,
      machineId
    );


  if (!selectedPatient) {
    return null;
  }


  return {

    machineId:
      machine.id,

    machineName:
      machine.name,

    patientId:
      selectedPatient.id,

    patientCode:
      selectedPatient.patientCode,

    patientName:
      selectedPatient.name,

    duration:
      selectedPatient.trainingDuration || machine.defaultDuration || 30,

    status:
      "ALLOCATED"

  };
}


// =========================================================
// MAIN SCHEDULER
// =========================================================
//
// Important:
//
// A temporary patient list is maintained while
// this scheduler cycle is running.
//
// Once a patient is allocated to one machine,
// that patient is temporarily marked IN_THERAPY.
//
// Therefore:
//
// P001 → M-01
//
// prevents:
//
// P001 → M-03
//
// in the same scheduler cycle.
// =========================================================

export function runScheduler(
  patients,
  machines
) {

  const allocations = [];


  // -----------------------------------------------
  // Temporary copy
  // -----------------------------------------------

  let schedulerPatients =
    patients.map(
      (patient) => ({
        ...patient
      })
    );


  // -----------------------------------------------
  // Track machines already allocated
  // -----------------------------------------------

  const allocatedMachines =
    new Set();


  // -----------------------------------------------
  // Process machines
  // -----------------------------------------------

  machines.forEach(
    (machine) => {

      // ---------------------------------------------
      // Skip unavailable machines
      // ---------------------------------------------

      if (
        !isMachineAvailable(
          machine
        )
      ) {

        return;

      }


      // ---------------------------------------------
      // Prevent duplicate machine allocation
      // ---------------------------------------------

      if (
        allocatedMachines.has(
          machine.id
        )
      ) {

        return;

      }


      // ---------------------------------------------
      // Find best patient
      // ---------------------------------------------

      const allocation =
        allocateMachine(
          schedulerPatients,
          machines,
          machine.id
        );


      if (!allocation) {

        return;

      }


      // ---------------------------------------------
      // Save allocation
      // ---------------------------------------------

      allocations.push(
        allocation
      );


      allocatedMachines.add(
        machine.id
      );


      // ---------------------------------------------
      // Mark patient temporarily IN_THERAPY
      // ---------------------------------------------

      schedulerPatients =
        schedulerPatients.map(
          (patient) => {

            if (
              patient.patientCode !==
              allocation.patientCode
            ) {

              return patient;

            }


            return {

              ...patient,

              status:
                "IN_THERAPY",

              currentMachine:
                allocation.machineId

            };

          }
        );

    }
  );


  return allocations;
}