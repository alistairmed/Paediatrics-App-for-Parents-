import { Vaccination } from '../types';

/**
 * Australian National Immunisation Program (NIP) Schedule
 * Based on health.gov.au childhood requirements
 */
export const NIP_SCHEDULE = (dob: Date): Vaccination[] => {
  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };
  
  const addYears = (date: Date, years: number) => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  return [
    { 
      id: 'nip-birth', 
      name: 'Hepatitis B (Birth)', 
      ageMilestone: 0, 
      dueDate: addMonths(dob, 0), 
      status: 'pending', 
      description: 'Hepatitis B: Protects against the Hep B virus which can cause serious liver damage. Administered within 24 hours of birth.' 
    },
    { 
      id: 'nip-2mo', 
      name: '2-Month Milestone', 
      ageMilestone: 2, 
      dueDate: addMonths(dob, 2), 
      status: 'pending', 
      description: 'Combined 6-in-1 (Diphtheria, Tetanus, Pertussis, Hep B, Polio, Hib), Pneumococcal, and Oral Rotavirus.' 
    },
    { 
      id: 'nip-4mo', 
      name: '4-Month Milestone', 
      ageMilestone: 4, 
      dueDate: addMonths(dob, 4), 
      status: 'pending', 
      description: 'Second dose of the 6-in-1, Pneumococcal, and Rotavirus vaccines to build immunity.' 
    },
    { 
      id: 'nip-6mo', 
      name: '6-Month Milestone', 
      ageMilestone: 6, 
      dueDate: addMonths(dob, 6), 
      status: 'pending', 
      description: 'Third dose of the 6-in-1 vaccine. Note: Rotavirus and Pneumococcal schedules may vary for high-risk groups.' 
    },
    { 
      id: 'nip-12mo', 
      name: '12-Month Milestone', 
      ageMilestone: 12, 
      dueDate: addMonths(dob, 12), 
      status: 'pending', 
      description: 'Measles, Mumps, Rubella (MMR); Meningococcal ACWY; and a Pneumococcal booster.' 
    },
    { 
      id: 'nip-18mo', 
      name: '18-Month Milestone', 
      ageMilestone: 18, 
      dueDate: addMonths(dob, 18), 
      status: 'pending', 
      description: 'MMRV (Measles, Mumps, Rubella, Chickenpox); DTPa booster; and Haemophilus influenzae type b (Hib) booster.' 
    },
    { 
      id: 'nip-4yr', 
      name: '4-Year Milestone', 
      ageMilestone: 48, 
      dueDate: addYears(dob, 4), 
      status: 'pending', 
      description: 'Pre-school boosters for Diphtheria, Tetanus, Pertussis, and Polio (DTPa-IPV).' 
    },
  ];
};

const DAY = 24 * 60 * 60 * 1000;

export interface VaccineReminders {
  overdue: Vaccination[];
  dueSoon: Vaccination[];
}

/**
 * Vaccines not yet recorded as given that are overdue, or due within the
 * next `withinDays` days. Dates may be Date objects or ISO strings (as stored).
 */
export function vaccineReminders(vaccinations: Vaccination[], now = new Date(), withinDays = 30): VaccineReminders {
  const pending = vaccinations
    .filter(v => v.status !== 'completed')
    .map(v => ({ v, due: new Date(v.dueDate) }))
    .filter(({ due }) => !isNaN(due.getTime()))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  return {
    overdue: pending.filter(({ due }) => due < now).map(({ v }) => v),
    dueSoon: pending.filter(({ due }) => due >= now && due.getTime() - now.getTime() <= withinDays * DAY).map(({ v }) => v),
  };
}
