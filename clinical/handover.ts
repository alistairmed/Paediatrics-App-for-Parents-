
import { MedicalHistory, ChildProfile, AcuteLogEntry, Vaccination, GrowthRecord, Investigation } from "../types";

export interface HandoverData {
  identification: {
    name: string;
    dob: string;
    age: string;
    weight: string;
  };
  situation: {
    activeIssues: string[];
    recentAcuteLogs: AcuteLogEntry[];
  };
  background: {
    pastMedicalHistory: string;
    surgicalHistory: string;
    investigations: Investigation[];
    allergies: string[];
    medications: string[];
    careTeam: string[];
  };
  assessment: {
    latestGrowth?: GrowthRecord;
    overdueVaccines: Vaccination[];
  };
}

export function generateHandoverData(
  profile: ChildProfile | undefined,
  history: MedicalHistory,
  childAge: string | null,
  latestWeight?: number
): HandoverData {
  return {
    identification: {
      name: profile?.name ?? 'Unknown',
      dob: profile?.dob ?? 'Unknown',
      age: childAge ?? 'Not provided',
      weight: latestWeight ? `${latestWeight} kg` : 'Not provided'
    },
    situation: {
      activeIssues: history.conditions?.filter(c => c.status === 'Active').map(c => c.name) ?? [],
      recentAcuteLogs: (history.acuteLogs ?? []).slice(0, 5)
    },
    background: {
      pastMedicalHistory: history.pastMedicalHistory || 'None recorded',
      surgicalHistory: history.surgicalHistory || 'None recorded',
      investigations: history.investigations || [],
      allergies: history.allergies ?? [],
      medications: history.currentMedications.map(m => `${m.name} (${m.dose})`) ?? [],
      careTeam: history.specialists.map(s => `${s.specialty}: ${s.name}`) ?? []
    },
    assessment: {
      latestGrowth: history.growthRecords?.[history.growthRecords?.length - 1],
      overdueVaccines: (history.vaccinations ?? []).filter(v => v.status === 'pending' && new Date() > new Date(v.dueDate))
    }
  };
}
