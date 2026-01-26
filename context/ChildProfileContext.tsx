
import React, { createContext, useContext, useMemo } from 'react';
import { ChildProfile } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ChildProfileContextType {
  childProfile?: ChildProfile;
  setChildProfile: (profile: ChildProfile) => void;
  childAge: string | null;
  hasSkippedSetup: boolean;
  setHasSkippedSetup: (val: boolean) => void;
}

const ChildProfileContext = createContext<ChildProfileContextType | undefined>(undefined);

export const ChildProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [childProfile, setChildProfile] = useLocalStorage<ChildProfile | undefined>('pedipulse_profile', undefined);
  const [hasSkippedSetup, setHasSkippedSetup] = useLocalStorage<boolean>('pedipulse_setup_skipped', false);

  const childAge = useMemo(() => {
    if (!childProfile?.dob) return null;
    const birth = new Date(childProfile.dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (years === 0) return `${months} months old`;
    return `${years} years, ${months % 12} months`;
  }, [childProfile]);

  return (
    <ChildProfileContext.Provider value={{ childProfile, setChildProfile, childAge, hasSkippedSetup, setHasSkippedSetup }}>
      {children}
    </ChildProfileContext.Provider>
  );
};

export const useChildProfile = () => {
  const context = useContext(ChildProfileContext);
  if (!context) {
    throw new Error('useChildProfile must be used within a ChildProfileProvider');
  }
  return context;
};
