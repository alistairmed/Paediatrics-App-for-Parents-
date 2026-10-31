import React, { useEffect, useRef, useState } from 'react';
import { useChildProfile, describeAge } from '../context/ChildProfileContext';
import { useNavigation } from '../context/NavigationContext';

/** Shows whose records are open, and lets the parent switch, edit or add a child. */
export const ChildSwitcher: React.FC<{ onNavigate?: () => void; className?: string }> = ({ onNavigate, className = '' }) => {
  const { childProfile, children, switchChild, setIsAddingChild } = useChildProfile();
  const { navigateTo } = useNavigation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const go = (adding: boolean) => {
    setIsAddingChild(adding);
    navigateTo('setup');
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={childProfile ? `Showing ${childProfile.name}'s records. Change child` : 'Add a child'}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-left min-h-[48px]"
      >
        <span className="text-xl" aria-hidden="true">🧒</span>
        <span className="flex-1 min-w-0">
          <span className="block font-black text-slate-800 truncate">{childProfile?.name || 'No child added'}</span>
          {childProfile && <span className="block text-xs font-bold text-slate-600">{describeAge(childProfile.dob)}</span>}
        </span>
        <span aria-hidden="true" className="text-slate-600">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 right-0 mt-2 z-70 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl p-2 space-y-1">
          {children.map(child => (
            <button
              key={child.id}
              role="menuitemradio"
              aria-checked={child.id === childProfile?.id}
              onClick={() => { switchChild(child.id); setOpen(false); onNavigate?.(); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold min-h-[44px] ${child.id === childProfile?.id ? 'bg-indigo-600 text-white' : 'text-slate-800 hover:bg-slate-100'}`}
            >
              {child.name}
            </button>
          ))}
          {childProfile && (
            <button role="menuitem" onClick={() => go(false)} className="w-full text-left px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-100 min-h-[44px]">✏️ Edit {childProfile.name}'s profile</button>
          )}
          <button role="menuitem" onClick={() => go(true)} className="w-full text-left px-4 py-3 rounded-xl font-bold text-indigo-700 hover:bg-slate-100 min-h-[44px]">＋ Add a child</button>
        </div>
      )}
    </div>
  );
};
