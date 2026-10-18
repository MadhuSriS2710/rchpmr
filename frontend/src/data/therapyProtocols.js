// =========================================================
// INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION (IPMR)
// CLINICAL THERAPY PROTOCOLS & TIMINGS
// =========================================================

export const therapyProtocols = [
  {
    id: "physiotherapy",
    category: "Physiotherapy",
    department: "Physiotherapy",
    title: "Physiotherapy Services",
    lead: "Mr. Karthikeyan.S, Senior PT",
    color: "#0284c7",
    services: [
      {
        id: "PT-01",
        name: "In Department Therapy",
        timing: "60 - Mints",
        duration: 60,
        unit: "Minutes",
        description: "Comprehensive 1-on-1 department physical therapy program including mobilization, therapeutic exercises, and gait training.",
        typicalConditions: ["Post-op Knee", "Stroke Rehabilitation", "Sports Injury", "Spinal Cord Injury"]
      },
      {
        id: "PT-02",
        name: "In Ward Therapy",
        timing: "30 - 45 - Mints",
        duration: 40,
        unit: "Minutes",
        description: "Bedside physical therapy for inpatients, chest physiotherapy, early mobilization, and bed-to-chair transfer re-education.",
        typicalConditions: ["Acute Post-op", "ICU Step-down", "Post-Stroke Acute", "Joint Replacement"]
      },
      {
        id: "PT-03",
        name: "MAT Activities",
        timing: "30 - 45 - Mints",
        duration: 35,
        unit: "Minutes",
        description: "Targeted large-mat therapeutic exercises for core stability, segmental trunk control, bridge drills, kneeling, and rolling recovery.",
        typicalConditions: ["Hemiplegia", "Paraplegia", "Balance Impairment", "Cervical Spondylosis"]
      }
    ]
  },
  {
    id: "occupationaltherapy",
    category: "Occupationaltherapy",
    department: "Occupational Therapy",
    title: "Occupational Therapy Services",
    lead: "Mrs. Arul Abirami.G, Lead OT",
    color: "#0d9488",
    services: [
      {
        id: "OT-01",
        name: "Hand function",
        timing: "45 - 60 Mints",
        duration: 50,
        unit: "Minutes",
        description: "Intensive upper extremity neuromuscular facilitation, fine motor precision, grasp strength, pincer grasp, and functional ADL practice.",
        typicalConditions: ["Hand Trauma", "Stroke Hand Paresis", "Carpal Tunnel", "Tendon Repair"]
      },
      {
        id: "OT-02",
        name: "Coma Stimulation",
        timing: "20 - 30 Mints",
        duration: 25,
        unit: "Minutes",
        description: "Multi-sensory protocol providing structured auditory, visual, olfactory, gustatory, and tactile stimuli for patients with altered consciousness.",
        typicalConditions: ["Severe Traumatic Brain Injury", "Anoxic Brain Damage", "Coma Recovery", "Low-Response State"]
      },
      {
        id: "OT-03",
        name: "Pediatric / Child Psychiatry",
        timing: "40 to 45 Mints",
        duration: 45,
        unit: "Minutes",
        description: "Sensory integration therapy, developmental milestone promotion, emotional regulation, and neuro-developmental pediatric interventions.",
        typicalConditions: ["Cerebral Palsy", "ADHD / Autism", "Developmental Delay", "Sensory Processing Disorder"]
      },
      {
        id: "OT-04",
        name: "Cognitive retraining",
        timing: "30 to 40 Mints",
        duration: 35,
        unit: "Minutes",
        description: "Structured computer and table-top cognitive exercises targeting attention, short-term recall, mental flexibility, and executive functioning.",
        typicalConditions: ["Post-Stroke Cognitive Deficit", "Mild Cognitive Impairment", "Post-Concussion", "Brain Injury"]
      }
    ]
  },
  {
    id: "speechtherapy",
    category: "Speechtherapy",
    department: "Speech & Audiology",
    title: "Speech & Language Pathology",
    lead: "Ms. Rithika.R, Audiologist & SLP",
    color: "#ec4899",
    services: [
      {
        id: "ST-01",
        name: "Speechtherapy Adult",
        timing: "30 to 40 Mints",
        duration: 35,
        unit: "Minutes",
        description: "Adult therapy addressing expressive/receptive aphasia, dysarthria, apraxia of speech, and clinical swallowing/dysphagia retraining.",
        typicalConditions: ["Stroke Aphasia", "Motor Neuron Disease", "Parkinsonian Dysarthria", "Dysphagia"]
      },
      {
        id: "ST-02",
        name: "Speechtherapy",
        timing: "40 to 45 Mints",
        duration: 45,
        unit: "Minutes",
        description: "Broad spectrum speech and language intervention covering phonology, voice resonance modulation, stuttering/fluency, and auditory processing.",
        typicalConditions: ["Voice Disorders", "Language Delay", "Stuttering", "Post-Traumatic Speech Deficits"]
      }
    ]
  },
  {
    id: "psychology",
    category: "Psychology",
    department: "Psychology",
    title: "Clinical Psychology Services",
    lead: "Ms. Yazhini, Clinical Psychologist",
    color: "#8b5cf6",
    services: [
      {
        id: "PSY-01",
        name: "Cognitive retraining",
        timing: "30 to 45 -Mints",
        duration: 40,
        unit: "Minutes",
        description: "Specialized clinical psychological neurocognitive retraining focused on problem-solving, cognitive strategies, and compensatory techniques.",
        typicalConditions: ["Cognitive Decline", "Traumatic Brain Injury", "Stroke Recovery", "Executive Dysfunction"]
      },
      {
        id: "PSY-02",
        name: "Counselling",
        timing: "45 - Mints",
        duration: 45,
        unit: "Minutes",
        description: "Individual psychological counselling, coping with disability/chronic illness, stress management, anxiety relief, and caregiver support.",
        typicalConditions: ["Post-Trauma Anxiety", "Depression with Disability", "Chronic Pain", "Caregiver Burnout"]
      },
      {
        id: "PSY-03",
        name: "Psychology Assessment",
        timing: "20 - Mints",
        duration: 20,
        unit: "Minutes",
        description: "Psychometric profiling, neuro-behavioral evaluation, mood screening, and cognitive disability grading for rehabilitation planning.",
        typicalConditions: ["Initial Intake Evaluation", "Cognitive Assessment", "Behavioral Scoring", "Disability Certification"]
      }
    ]
  }
];
