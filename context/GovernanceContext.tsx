
import React, { createContext, useContext, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GovernanceEntry } from '../clinical/governance';

const STORAGE_KEY = "pedipulse_governance_log";
const DISCLAIMER_KEY = "pedipulse_disclaimer_accepted";

interface GovernanceContextType {
  log: GovernanceEntry[];
  addEntry: (entry: Omit<GovernanceEntry, "id" | "timestamp">) => void;
  clearLog: () => void;
  hasAcceptedDisclaimer: boolean;
  acceptDisclaimer: () => void;
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [log, setLog] = useLocalStorage<GovernanceEntry[]>(STORAGE_KEY, []);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => 
    localStorage.getItem(DISCLAIMER_KEY) === 'true'
  );

  const addEntry = (entry: Omit<GovernanceEntry, "id" | "timestamp">) => {
    const newEntry: GovernanceEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setLog(prev => [newEntry, ...prev]);
  };

  const clearLog = () => setLog([]);

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
    setHasAcceptedDisclaimer(true);
  };

  return (
    <GovernanceContext.Provider value={{ log, addEntry, clearLog, hasAcceptedDisclaimer, acceptDisclaimer }}>
      {children}
    </GovernanceContext.Provider>
  );
};

export const useGovernance = () => {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
};
