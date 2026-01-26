
import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnvironmentMode } from '../types';

interface EnvironmentContextType {
  mode: EnvironmentMode;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize based on current browser state
  const [mode, setMode] = useState<EnvironmentMode>(
    navigator.onLine ? 'standard' : 'low-resource'
  );

  useEffect(() => {
    const handleOnline = () => setMode('standard');
    const handleOffline = () => setMode('low-resource');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <EnvironmentContext.Provider value={{ mode }}>
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};
