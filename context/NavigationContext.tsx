
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ViewType } from '../types';

interface NavigationContextType {
  activeView: ViewType;
  navigateTo: (view: ViewType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  const navigateTo = useCallback((view: ViewType) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <NavigationContext.Provider value={{ activeView, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
