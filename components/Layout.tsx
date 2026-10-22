
import React, { useState, useEffect } from 'react';
import { ViewType, UserRole } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useRole } from '../context/RoleContext';
import { useEnvironment } from '../context/EnvironmentContext';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { role, setRole } = useRole();
  const { mode } = useEnvironment();

  const groups = [
    {
      title: role === 'clinician' ? 'Clinical Action' : 'Acute Care',
      color: role === 'clinician' ? 'text-slate-800' : 'text-rose-600',
      bgColor: role === 'clinician' ? 'bg-slate-100' : 'bg-rose-50',
      items: [
        { id: 'symptoms', label: role === 'clinician' ? 'Clinical Triage' : 'Triage AI', icon: '🩺', highContrast: true },
        { id: 'sickday', label: 'Sick Day Plan', icon: '🚨', highContrast: true },
        { id: 'acutelogs', label: 'Acute Log Review', icon: '📈' },
        { id: 'dosage', label: 'Dosage Verification', icon: '💊' },
      ]
    },
    {
      title: 'Professional Bench',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      role: 'clinician',
      items: [
        { id: 'consults', label: 'SOAP Documentation', icon: '✍️' },
        { id: 'reasoning', label: 'Reasoning Engine', icon: '🧠' },
        { id: 'assignments', label: 'Assignment Bench', icon: '📋' },
        { id: 'handover', label: 'ISBAR Handover', icon: '📄' },
      ]
    },
    {
      title: 'Medical Record',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      items: [
        { id: 'profile', label: 'Patient Overview', icon: '🏥' },
        { id: 'history', label: 'Clinical History', icon: '📜' },
        { id: 'developmental', label: 'Developmental History', icon: '👣' },
        { id: 'familyhistory', label: 'Family History', icon: '🧬' },
        { id: 'devices', label: 'Medical Gear', icon: '⚙️' },
        { id: 'appointments', label: 'Appointments', icon: '🗓️' },
      ]
    },
    {
      title: 'Diagnostics & Reports',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: [
        { id: 'diagnostics', label: 'Investigation Results', icon: '🧪' },
        { id: 'reports', label: 'Specialist Letters', icon: '✉️' },
      ]
    },
    {
      title: 'Development & Routine',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      items: [
        { id: 'redbook', label: 'Digital Red Book', icon: '📕' },
        { id: 'milestones', label: 'Milestone Sync', icon: '✨' },
        { id: 'screening', label: 'Clinical Screeners', icon: '🔍' },
      ]
    },
    {
      title: 'Governance & Risk',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      role: 'clinician',
      items: [
        { id: 'governance', label: 'Audit Trail', icon: '🛡️' },
        { id: 'regulatory', label: 'TGA Compliance', icon: '⚖️' },
      ]
    },
    {
      title: 'Caregiver Support',
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      role: 'parent',
      items: [
        { id: 'parenting', label: 'Parenting Hub', icon: '🌻' },
        { id: 'bonding', label: 'Bonding Journal', icon: '🫂' },
        { id: 'stories', label: 'Calm Stories', icon: '🌙' },
      ]
    }
  ].filter(group => !group.role || group.role === role);

  const bottomNavItems: { id: ViewType; label: string; icon: string }[] = role === 'clinician' ? [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'consults', label: 'SOAP', icon: '✍️' },
    { id: 'reasoning', label: 'Reason', icon: '🧠' },
    { id: 'handover', label: 'ISBAR', icon: '📄' },
  ] : [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'symptoms', label: 'Triage', icon: '🩺' },
    { id: 'sickday', label: 'Sick Plan', icon: '🚨' },
    { id: 'dosage', label: 'Dose', icon: '💊' },
  ];

  const screenTitles: Partial<Record<ViewType, string>> = {
    dashboard: 'Home',
    setup: 'Child Profile',
    ethics: 'Ethics & SOP',
    growth: 'Growth',
    vaccines: 'Vaccines',
    medications: 'Medications',
    careteam: 'Care Team',
    ...Object.fromEntries(groups.flatMap(g => g.items.map(i => [i.id, i.label]))),
  };
  const currentTitle = screenTitles[activeView] || 'PediPulse AI';
  const isOnBottomTab = bottomNavItems.some(item => item.id === activeView);

  const handleNav = (view: ViewType) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  // While the phone menu is open: stop the page behind it scrolling, close it
  // with Escape, and close it if the back gesture changes screen.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = () => setIsMobileMenuOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', close);
    };
  }, [isMobileMenuOpen]);

  const NavContent = () => (
    <div className="flex flex-col h-full justify-between pb-8 pt-4">
      <div className="space-y-8">
        <div 
          className="flex items-center gap-3 mb-4 px-4 cursor-pointer group" 
          onClick={() => handleNav('dashboard')}
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform border-4 border-white">👶</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter italic leading-none">PediPulse <span className="text-indigo-600">AI</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{role === 'clinician' ? 'Clinical Workstation' : 'Parent Assistant'}</p>
          </div>
        </div>

        <div className="px-4 space-y-4">
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Session Identity</p>
              <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100 flex items-center shadow-inner">
                <button 
                  onClick={() => setRole('parent')}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'parent' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}
                >Parent</button>
                <button 
                  onClick={() => setRole('clinician')}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'clinician' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}
                >Clinician</button>
              </div>
           </div>
        </div>
        
        <div className="space-y-8 pb-10">
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className={`text-[10px] font-black ${group.color} uppercase tracking-[0.25em] px-5 flex items-center gap-2 opacity-80`}>
                {group.title}
              </h3>
              <div className="flex flex-col gap-1 px-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id as ViewType)}
                    className={`flex items-center gap-4 px-5 py-2.5 rounded-2xl transition-all border-2 ${
                      activeView === item.id 
                        ? `${group.bgColor} ${group.color} font-black border-white shadow-lg` 
                        : 'text-slate-500 hover:bg-slate-50 border-transparent'
                    }`}
                  >
                    <span className={`text-xl ${item.highContrast ? 'filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]' : ''}`}>{item.icon}</span>
                    <span className="whitespace-nowrap text-xs font-black tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 px-4">
         <button onClick={() => handleNav('ethics')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all ${activeView === 'ethics' ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}>
          <span className="text-xl">🛡️</span>
          <span className="text-[11px] font-black uppercase tracking-widest">Ethics & SOP</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${role === 'clinician' ? 'bg-slate-50' : 'bg-[#FBFBFE]'}`}>
      <header className="md:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <button onClick={() => handleNav('dashboard')} aria-label="PediPulse home" className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">👶</span>
          <span className="min-w-0 text-left">
            <span className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest leading-none">PediPulse AI</span>
            <span className="block text-lg font-black text-slate-800 tracking-tight truncate">{currentTitle}</span>
          </span>
        </button>
        <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" className="w-12 h-12 shrink-0 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-700 border border-slate-200 text-2xl">☰</button>
      </header>

      {isMobileMenuOpen && (
        <div role="dialog" aria-modal="true" aria-label="All sections" className="md:hidden fixed inset-0 z-[60] bg-slate-50 overflow-y-auto overscroll-contain">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-800">All sections</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu" className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-700">×</button>
          </div>
          <div className="px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-6">
            <div className="bg-white p-1 rounded-2xl border border-slate-200 flex" role="group" aria-label="Session identity">
              {(['parent', 'clinician'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  aria-pressed={role === r}
                  className={`flex-1 min-h-[44px] rounded-xl text-sm font-black capitalize ${role === r ? (r === 'clinician' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white') : 'text-slate-600'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            {groups.map(group => (
              <section key={group.title} className="space-y-2">
                <h3 className={`text-xs font-black ${group.color} uppercase tracking-widest px-1`}>{group.title}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id as ViewType)}
                      aria-current={activeView === item.id ? 'page' : undefined}
                      className={`min-h-[64px] flex items-center gap-3 px-3 py-3 rounded-2xl border-2 text-left transition-colors ${
                        activeView === item.id ? `${group.bgColor} ${group.color} border-current` : 'bg-white border-slate-200 text-slate-700 active:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <span className="text-sm font-black leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <button
              onClick={() => handleNav('ethics')}
              aria-current={activeView === 'ethics' ? 'page' : undefined}
              className={`w-full min-h-[56px] flex items-center gap-3 px-4 rounded-2xl border-2 ${activeView === 'ethics' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'}`}
            >
              <span className="text-2xl">🛡️</span>
              <span className="text-sm font-black">Ethics & SOP</span>
            </button>
          </div>
        </div>
      )}

      <nav className="hidden md:flex w-72 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl z-50">
        <NavContent />
      </nav>

      <main className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-24">{children}</div>
      </main>

      <nav aria-label="Main" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
          {bottomNavItems.map(item => {
            const isActive = activeView === item.id && !isMobileMenuOpen;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 active:bg-slate-100'}`}
              >
                <span className="text-2xl leading-none">{item.icon}</span>
                <span className="text-[11px] font-black">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="More sections"
            className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors ${isMobileMenuOpen || !isOnBottomTab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 active:bg-slate-100'}`}
          >
            <span className="text-2xl leading-none">☰</span>
            <span className="text-[11px] font-black">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
