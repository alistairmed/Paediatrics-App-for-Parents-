import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button for destructive actions. */
  danger?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | undefined>(undefined);

/** An accessible replacement for window.confirm(): `if (await confirm({...})) ...` */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const confirm = useCallback<Confirm>(options => new Promise(resolve => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setRequest({ ...options, resolve });
  }), []);

  const close = useCallback((ok: boolean) => {
    setRequest(current => {
      current?.resolve(ok);
      return null;
    });
    returnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!request) return;
    cancelRef.current?.focus(); // safest default for destructive actions
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => close(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5"
          >
            <h2 id="confirm-title" className="text-xl font-black text-slate-800">{request.title}</h2>
            <p id="confirm-message" className="text-base font-medium text-slate-700 leading-relaxed">{request.message}</p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button ref={cancelRef} onClick={() => close(false)} className="min-h-[48px] px-6 rounded-2xl border-2 border-slate-300 font-black text-slate-800">
                {request.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => close(true)}
                className={`min-h-[48px] px-6 rounded-2xl font-black text-white ${request.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {request.confirmLabel || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
};
