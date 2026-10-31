
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { MedicalHistory, ClinicalEvent, AcuteLogEntry, Appointment, SpecialistContact } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_HISTORY, withHistoryDefaults } from './historyDefaults';

interface MedicalHistoryContextType {
  history: MedicalHistory;
  updateHistory: (updates: Partial<MedicalHistory>) => void;
  addAcuteLog: (entry: Omit<AcuteLogEntry, 'id'>) => void;
  addClinicalEvent: (event: Omit<ClinicalEvent, 'id'>) => void;
  addAppointment: (apt: Appointment, addToCareTeam: boolean) => void;
  pendingEvents: ClinicalEvent[];
  latestWeight?: number;
  nextAppointment?: Appointment;
}

const MedicalHistoryContext = createContext<MedicalHistoryContextType | undefined>(undefined);

export const MedicalHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedHistory, setStoredHistory] = useLocalStorage<MedicalHistory>('pedipulse_history', DEFAULT_HISTORY);
  // Saved data from older versions can be missing fields that screens expect: fill them in.
  const history = useMemo(() => withHistoryDefaults(storedHistory), [storedHistory]);
  const setHistory = useCallback(
    (update: (prev: MedicalHistory) => MedicalHistory) => setStoredHistory(prev => update(withHistoryDefaults(prev))),
    [setStoredHistory]
  );
  const [pendingEvents, setPendingEvents] = useState<ClinicalEvent[]>([]);

  const updateHistory = useCallback((updates: Partial<MedicalHistory>) => {
    setHistory(prev => ({ ...prev, ...updates }));
  }, [setHistory]);

  const addAcuteLog = useCallback((entry: Omit<AcuteLogEntry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID() } as AcuteLogEntry;
    setHistory(prev => ({
      ...prev,
      acuteLogs: [newEntry, ...(prev.acuteLogs || [])]
    }));
  }, [setHistory]);

  const addClinicalEvent = useCallback((event: Omit<ClinicalEvent, 'id'>) => {
    const newEvent = { ...event, id: crypto.randomUUID() } as ClinicalEvent;
    setPendingEvents(prev => [newEvent, ...prev]);
  }, []);

  const addAppointment = useCallback((apt: Appointment, addToCareTeam: boolean) => {
    setHistory(prev => {
      const newAppointments = [...prev.appointments, apt];
      let newSpecialists = [...prev.specialists];

      if (addToCareTeam) {
        const exists = newSpecialists.some(s => s.name.toLowerCase() === apt.provider.toLowerCase());
        if (!exists) {
          const newSpecialist: SpecialistContact = {
            id: crypto.randomUUID(),
            name: apt.provider,
            specialty: apt.specialty,
            category: 'Medical'
          };
          newSpecialists.push(newSpecialist);
        }
      }

      return { ...prev, appointments: newAppointments, specialists: newSpecialists };
    });
  }, [setHistory]);

  const latestWeight = useMemo(() => {
    if (history.growthRecords && history.growthRecords.length > 0) {
      return history.growthRecords[history.growthRecords.length - 1].weight;
    }
    return undefined;
  }, [history.growthRecords]);

  const nextAppointment = useMemo(() => {
    const upcoming = (history.appointments || [])
      .filter(a => a.status === 'Upcoming' && new Date(a.dateTime) > new Date())
      .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    return upcoming[0];
  }, [history.appointments]);

  return (
    <MedicalHistoryContext.Provider value={{ 
      history, 
      updateHistory, 
      addAcuteLog, 
      addClinicalEvent, 
      addAppointment,
      pendingEvents,
      latestWeight,
      nextAppointment
    }}>
      {children}
    </MedicalHistoryContext.Provider>
  );
};

export const useMedicalHistory = () => {
  const context = useContext(MedicalHistoryContext);
  if (!context) {
    throw new Error('useMedicalHistory must be used within a NavigationProvider');
  }
  return context;
};
