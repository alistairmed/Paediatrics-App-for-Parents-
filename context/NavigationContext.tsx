import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ViewType, VIEW_TYPES } from '../types';

interface NavigationContextType {
  activeView: ViewType;
  /** replace: swap the current history entry instead of adding one (for redirects). */
  navigateTo: (view: ViewType, options?: { replace?: boolean }) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Each screen has its own URL (#/dosage) so the phone's back gesture and a
// page refresh behave as expected instead of leaving the app or resetting it.
const viewFromHash = (): ViewType => {
  const view = window.location.hash.replace(/^#\/?/, '');
  return (VIEW_TYPES as readonly string[]).includes(view) ? (view as ViewType) : 'dashboard';
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>(viewFromHash);

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(viewFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((view: ViewType, options?: { replace?: boolean }) => {
    if (view !== viewFromHash()) {
      const url = `#/${view}`;
      if (options?.replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
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
