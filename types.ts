
export type UserRole = 'parent' | 'clinician';
export type EnvironmentMode = 'standard' | 'low-resource';

export interface ClinicalEvent {
  id: string;
  source: string;
  description: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High';
  media?: string;
}

export interface ConsultationNote {
  id: string;
  date: string;
  clinicianName: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ClinicalFindings {
  history: string;
  examination: string;
  vitals: {
    hr?: string;
    rr?: string;
    temp?: string;
    o2?: string;
    bp?: string;
  };
}

export interface AssignedTest {
  testId: string;
  assignedDate: string;
  status: 'pending' | 'completed';
  priority?: 'Routine' | 'High' | 'Urgent';
  dueDate?: string;
  clinicianNote?: string;
  isCustom?: boolean;
  customTitle?: string;
}

export interface ReasoningLog {
  id: string;
  date: string;
  framework: string;
  inputContext: string;
  analysis: string;
  sources: any[];
}

export interface AttachmentAnalysis {
  caregiverObservations?: string;
}

export interface Appointment {
  id: string;
  provider: string;
  specialty: string;
  dateTime: string;
  location: string;
  purpose: string;
  reminderSent: boolean;
  preVisitNotes: string;
  postVisitSummary: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

export interface SymptomLog {
  id: string;
  timestamp: Date;
  description: string;
  aiResponse: string;
  media?: string;
}

export interface HydrationChallenge {
  isActive: boolean;
  startTime?: string;
  targetVolume: number;
  intervalVolume: number;
  intervalMinutes: number;
  totalConsumed: number;
  vomitCount: number;
}

export interface AcuteLogEntry {
  id: string;
  timestamp: string; // ISO String for accurate comparison
  type: 'Fluid' | 'Temperature' | 'Output' | 'Medication' | 'Vomit' | 'Vitals' | 'Physical Exam' | 'Triage';
  value: string;
  notes?: string;
  media?: string;
  isChallengeEntry?: boolean;
  clinicianLogged?: boolean;
  medicationName?: string; // New: Tracks specific drug for interval checks
}

export interface MedicalReport {
  id: string;
  date: string;
  specialist: string;
  summary: string;
  actionItems: string[];
  photoUrl?: string;
}

export interface GrowthRecord {
  age: number;
  weight: number;
  height: number;
  headCircumference?: number;
  date: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  instructions: string;
  indication: string;
  startDate: string;
}

export interface PreviousMedication {
  id: string;
  name: string;
  dose: string;
  indication: string;
  startDate?: string;
  ceasedDate: string;
  ceaseReason: string;
}

// Added ChildProfile interface to resolve missing exported member error
export interface ChildProfile {
  name: string;
  dob: string;
  sex: 'Male' | 'Female' | 'Other';
  weight?: number;
  height?: number;
  pastMedicalHistory?: string;
  medications: Medication[];
  previousMedications: PreviousMedication[];
  allergies: string[];
  email: string;
  password?: string;
  stayLoggedIn?: boolean;
}

export interface Vaccination {
  id: string;
  name: string;
  dueDate: Date;
  receivedDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  description: string;
  ageMilestone: number;
  manufacturer?: string;
  lotNumber?: string;
  clinic?: string;
  sideEffects?: string;
}

export interface Milestone {
  id: string;
  ageRange: string;
  category: 'Motor' | 'Cognitive' | 'Social' | 'Language';
  description: string;
  completed: boolean;
  isRedFlag: boolean;
  notes?: string;
}

export interface HealthCheck {
  id: string;
  ageMilestone: string;
  date?: string;
  completed: boolean;
  notes: string;
  professionalName?: string;
}

export interface SpecialistContact {
  id: string;
  name: string;
  specialty: string;
  category: 'Medical' | 'Allied Health' | 'Support';
  hospital?: string;
  contact?: string;
  lastSeen?: string;
  nextReview?: string;
  goals?: string;
  notes?: string;
}

export interface MedicalDevice {
  id: string;
  type: string;
  model?: string;
  size?: string;
  lastChanged?: string;
  nextChangeDue?: string;
  notes?: string;
}

export interface GenogramMember {
  id: string;
  relation: string;
  sex: 'Male' | 'Female' | 'Other' | 'Pregnancy';
  condition?: string;
  isAlive: boolean;
  isIndex?: boolean;
}

export interface FamilyHistory {
  maternal: string;
  paternal: string;
  siblings: string;
  other: string;
  members: GenogramMember[];
}

export interface DevelopmentalHistory {
  prenatal: {
    maternalAge?: number;
    complications: string;
    scansNormal: boolean;
    medications: string;
  };
  perinatal: {
    gestation: string;
    deliveryType: string;
    birthWeight: string;
    apgars: string;
  };
  neonatal: {
    nicuStay: boolean;
    jaundice: boolean;
    feedingIssues: string;
    earlyConcerns: string;
  };
}

export interface SickDayPlan {
  greenZone: string;
  yellowZone: string;
  redZone: string;
  backgroundForED: string;
  emergencyMeds: string;
  fluidRequirements: string;
  triggers: string;
  emergencyContact: string;
  ambulanceTriggers: string;
  dangerSigns: string;
  carerActions: string;
  planPhoto?: string;
}

export interface Recommendation {
  id: string;
  source: string;
  date: string;
  action: string;
}

export interface Condition {
  id: string;
  name: string;
  dateDiagnosed?: string;
  status: 'Active' | 'Resolved' | 'Under Investigation';
  notes?: string;
  clinicianVerified?: boolean;
}

export interface Investigation {
  id: string;
  date: string;
  name: string;
  result: string;
  location?: string;
}

export interface MedicalHistory {
  pastMedicalHistory: string;
  surgicalHistory: string;
  bondingNotes: string;
  consultationNotes: string;
  currentMedications: Medication[];
  previousMedications: PreviousMedication[];
  allergies: string[];
  familyHistory: FamilyHistory;
  developmentalHistory: DevelopmentalHistory;
  specialists: SpecialistContact[];
  appointments: Appointment[];
  devices: MedicalDevice[];
  sickDayPlan: SickDayPlan;
  activeRecommendations?: Recommendation[];
  medicalReports?: MedicalReport[];
  acuteLogs?: AcuteLogEntry[];
  growthRecords?: GrowthRecord[];
  vaccinations?: Vaccination[];
  milestones?: Milestone[];
  conditions?: Condition[];
  investigations?: Investigation[];
  formalConsults?: ConsultationNote[];
  assignedTests?: AssignedTest[];
  reasoningLogs?: ReasoningLog[];
}

export type ViewType = 
  | 'dashboard' 
  | 'symptoms' 
  | 'growth' 
  | 'dosage' 
  | 'milestones' 
  | 'stories' 
  | 'vaccines' 
  | 'screening' 
  | 'profile' 
  | 'history'
  | 'medications'
  | 'careteam'
  | 'diagnostics'
  | 'reports' 
  | 'devices'
  | 'familyhistory'
  | 'developmental'
  | 'redbook' 
  | 'parenting' 
  | 'setup' 
  | 'bonding' 
  | 'acutelogs' 
  | 'appointments' 
  | 'handover' 
  | 'governance' 
  | 'ethics' 
  | 'regulatory' 
  | 'sickday'
  | 'consults'
  | 'assignments'
  | 'reasoning';
