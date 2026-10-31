import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ChildProfile } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  ChildRecord, ChildrenState, CHILDREN_KEY, EMPTY_CHILDREN, GUEST_ID,
  migrateLegacyRecords, addChild as addChildRecord, updateChild, removeChild as removeChildRecord,
} from './children';

interface ChildProfileContextType {
  /** The child whose records are being shown. */
  childProfile?: ChildRecord;
  /** Saves the active child's profile, or adds the first child. */
  setChildProfile: (profile: ChildProfile) => void;
  childAge: string | null;
  hasSkippedSetup: boolean;
  setHasSkippedSetup: (val: boolean) => void;
  children: ChildRecord[];
  /** Id used to key the active child's records ("guest" before any child exists). */
  activeChildId: string;
  switchChild: (id: string) => void;
  addChild: (profile: ChildProfile) => void;
  removeChild: (id: string) => void;
  /** True while the setup screen is adding another child rather than editing. */
  isAddingChild: boolean;
  setIsAddingChild: (val: boolean) => void;
}

const ChildProfileContext = createContext<ChildProfileContextType | undefined>(undefined);

export const describeAge = (dob?: string): string | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (years === 0) return `${months} months old`;
  return `${years} years, ${months % 12} months`;
};

export const ChildProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children: content }) => {
  // Move single-child records to the multi-child layout before anything reads them.
  useState(() => { migrateLegacyRecords(); return true; });

  const [state, setState] = useLocalStorage<ChildrenState>(CHILDREN_KEY, EMPTY_CHILDREN);
  const [hasSkippedSetup, setHasSkippedSetup] = useLocalStorage<boolean>('pedipulse_setup_skipped', false);
  const [isAddingChild, setIsAddingChild] = useState(false);

  const childProfile = state.children.find(c => c.id === state.activeId);
  const activeChildId = childProfile?.id ?? GUEST_ID;

  const addChild = useCallback((profile: ChildProfile) => {
    setState(prev => addChildRecord(prev, profile, crypto.randomUUID()));
  }, [setState]);

  const setChildProfile = useCallback((profile: ChildProfile) => {
    setState(prev => {
      const active = prev.children.find(c => c.id === prev.activeId);
      return active ? updateChild(prev, active.id, profile) : addChildRecord(prev, profile, crypto.randomUUID());
    });
  }, [setState]);

  const switchChild = useCallback((id: string) => {
    setState(prev => (prev.children.some(c => c.id === id) ? { ...prev, activeId: id } : prev));
  }, [setState]);

  const removeChild = useCallback((id: string) => {
    setState(prev => removeChildRecord(prev, id));
  }, [setState]);

  const childAge = useMemo(() => describeAge(childProfile?.dob), [childProfile]);

  return (
    <ChildProfileContext.Provider value={{
      childProfile, setChildProfile, childAge, hasSkippedSetup, setHasSkippedSetup,
      children: state.children, activeChildId, switchChild, addChild, removeChild,
      isAddingChild, setIsAddingChild,
    }}>
      {content}
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
