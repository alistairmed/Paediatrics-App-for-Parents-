
export interface ClinicalEvent {
  id: string;
  source: string;
  description: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High';
  media?: string;
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
  timestamp: string;
  type: 'Fluid' | 'Temperature' | 'Output' | 'Medication' | 'Vomit';
  value: string;
  notes?: string;
  isChallengeEntry?: boolean;
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
  ceasedDate: string;
  ceaseReason: string;
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

export interface FamilyHistory {
  maternal: string;
  paternal: string;
  siblings: string;
  other: string;
}

export interface SickDayPlan {
  instructions: string;
  emergencyMeds: string;
  fluidRequirements: string;
  triggers: string;
  emergencyContact: string;
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
}

export interface MedicalHistory {
  pastMedicalHistory: string;
  surgicalHistory: string;
  currentMedications: Medication[];
  previousMedications: PreviousMedication[];
  allergies: string[];
  familyHistory: FamilyHistory;
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
}

/**
 * ChildProfile represents the child's basic health information.
 * Updated to include account and setup-specific fields.
 */
export interface ChildProfile {
  name: string;
  dob: string;
  sex: 'Male' | 'Female' | 'Other';
  weight?: number;
  height?: number;
  pastMedicalHistory?: string;
  medications?: Medication[];
  previousMedications?: PreviousMedication[];
  allergies?: string[];
  complexNeeds?: boolean;
  // Account security and application state fields used in ChildProfileSetup.tsx
  email?: string;
  password?: string;
  stayLoggedIn?: boolean;
}

export type ViewType = 'dashboard' | 'symptoms' | 'growth' | 'dosage' | 'milestones' | 'stories' | 'vaccines' | 'screening' | 'profile' | 'redbook' | 'parenting' | 'setup' | 'bonding' | 'acutelogs' | 'appointments';
