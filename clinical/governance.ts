
import { EnvironmentMode, UserRole } from "../types";

export type GovernanceEventType =
  | "symptom_evaluation"
  | "dose_calculation"
  | "screening_result"
  | "handover_generated";

export interface GovernanceEntry {
  id: string;
  timestamp: string;
  eventType: GovernanceEventType;
  userRole: UserRole;
  environment: EnvironmentMode;
  online: boolean;
  inputSummary: string;
  outputSummary: string;
  redFlags?: string[];
  disclaimerShown: boolean;
}
