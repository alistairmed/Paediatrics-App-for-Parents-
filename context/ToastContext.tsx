import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { STORAGE_ERROR_EVENT } from '../hooks/useLocalStorage';

export type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextType {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION_MS = 4000;

const toneStyles: Record<ToastTone, { box: string; icon: string }> = {
  success: { box: 'bg-emerald-600 text-white', icon: '✓' },
  error: { box: 'bg-rose-600 text-white', icon: '⚠️' },
  info: { box: 'bg-slate-900 text-white', icon: 'ℹ️' },
};

/**
 * Non-blocking notifications that replace window.alert().
 * Errors are announced immediately to screen readers; other tones politely.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, tone }]);
    timers.current.set(id, setTimeout(() => dismiss(id), TOAST_DURATION_MS));
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Saving failed (useLocalStorage keeps the last saved data): tell the user.
  useEffect(() => {
    const onStorageError = () => showToast(
      "Couldn't save: this device's storage for PediPulse is full. Remove some photos or old entries, then try again.",
      'error'
    );
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-x-4 bottom-24 md:bottom-8 md:left-auto md:right-8 md:w-96 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl font-bold text-sm leading-snug ${toneStyles[toast.tone].box}`}
          >
            <span aria-hidden="true">{toneStyles[toast.tone].icon}</span>
            <p className="flex-1">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 -my-1 -mr-1 w-8 h-8 rounded-full hover:bg-white/20 font-black"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
