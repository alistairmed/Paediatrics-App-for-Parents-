
import React, { useState, useEffect } from 'react';
import { ViewType } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useEnvironment } from '../context/EnvironmentContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { ChildSwitcher } from './ChildSwitcher';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { mode } = useEnvironment();
  const { childProfile } = useChildProfile();

  const groups = [
    {
      title: 'Today',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      items: [
        { id: 'symptoms', label: 'When to Get Help', icon: '🩺', highContrast: true },
        { id: 'sickday', label: 'Sick Day Plan', icon: '🚨', highContrast: true },
        { id: 'dosage', label: 'Medicines', icon: '💊' },
        { id: 'acutelogs', label: 'Sick Day Log', icon: '📈' },
        { id: 'appointments', label: 'Appointments', icon: '🗓️' },
      ]
    },
    {
      title: 'Records',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      items: [
        { id: 'profile', label: 'Health Overview', icon: '🏥' },
        { id: 'history', label: 'Medical History', icon: '📜' },
        { id: 'familyhistory', label: 'Family History', icon: '🧬' },
        { id: 'devices', label: 'Medical Equipment', icon: '⚙️' },
        { id: 'diagnostics', label: 'Test Results', icon: '🧪' },
        { id: 'reports', label: 'Letters', icon: '✉️' },
        { id: 'summary', label: 'Summary for Doctor', icon: '🖨️' },
        { id: 'handover', label: 'Handover Summary', icon: '📄' },
      ]
    },
    {
      title: 'Growth & Development',
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
      items: [
        { id: 'growth', label: 'Growth Charts', icon: '📏' },
        { id: 'vaccines', label: 'Vaccines', icon: '💉' },
        { id: 'redbook', label: 'Red Book', icon: '📕' },
        { id: 'milestones', label: 'Milestones', icon: '✨' },
        { id: 'developmental', label: 'Developmental History', icon: '👣' },
        { id: 'screening', label: 'Conversation Starters', icon: '💬' },
      ]
    },
    {
      title: 'Support',
      color: 'text-amber-800',
      bgColor: 'bg-amber-50',
      items: [
        { id: 'parenting', label: 'Parenting Hub', icon: '🌻' },
        { id: 'bonding', label: 'Bonding Journal', icon: '🫂' },
        { id: 'stories', label: 'Calm Stories', icon: '🌙' },
      ]
    },
    {
      title: 'Settings & Safety',
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      items: [
        { id: 'setup', label: 'Children', icon: '👶' },
        { id: 'ethics', label: 'Privacy, Backup & Lock', icon: '🛡️' },
        { id: 'governance', label: 'Activity Log', icon: '🗂️' },
        { id: 'regulatory', label: 'About Regulation', icon: '⚖️' },
      ]
    }
  ];

  const bottomNavItems: { id: ViewType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'symptoms', label: 'Get Help', icon: '🩺' },
    { id: 'sickday', label: 'Sick Plan', icon: '🚨' },
    { id: 'dosage', label: 'Medicines', icon: '💊' },
  ];

  const screenTitles: Partial<Record<ViewType, string>> = {
    dashboard: 'Home',
    setup: 'Child Profile',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
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
        <button
          type="button"
          aria-label="PediPulse home"
          className="flex items-center gap-3 mb-4 px-4 cursor-pointer group text-left"
          onClick={() => handleNav('dashboard')}
        >
          <span aria-hidden="true" className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform border-4 border-white">👶</span>
          <span>
            <span className="block text-xl font-black text-slate-800 tracking-tighter leading-none">PediPulse <span className="text-indigo-600">AI</span></span>
            <span className="block text-xs font-black text-slate-600 uppercase tracking-widest mt-1">Parent Assistant</span>
          </span>
        </button>

        <ChildSwitcher className="px-2" />

        <div className="space-y-8 pb-10">
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className={`text-xs font-black ${group.color} uppercase tracking-[0.2em] px-5 flex items-center gap-2`}>
                {group.title}
              </h3>
              <div className="flex flex-col gap-1 px-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id as ViewType)}
                    aria-current={activeView === item.id ? 'page' : undefined}
                    className={`flex items-center gap-4 px-5 py-2.5 rounded-2xl transition-all border-2 ${
                      activeView === item.id 
                        ? `${group.bgColor} ${group.color} font-black border-white shadow-lg` 
                        : 'text-slate-700 hover:bg-slate-50 border-transparent'
                    }`}
                  >
                    <span aria-hidden="true" className={`text-xl ${item.highContrast ? 'filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]' : ''}`}>{item.icon}</span>
                    <span className="whitespace-nowrap text-xs font-black tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 px-4">
        <div className="flex justify-center gap-4 text-sm font-bold text-slate-600">
          <button onClick={() => handleNav('privacy')} className="underline">Privacy</button>
          <button onClick={() => handleNav('terms')} className="underline">Terms</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen print:min-h-0 flex flex-col md:flex-row bg-[#FBFBFE] print:bg-white`}>
      <header className="md:hidden print:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <button onClick={() => handleNav('dashboard')} aria-label="PediPulse home" className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">👶</span>
          <span className="min-w-0 text-left">
            <span className="block text-xs font-black text-indigo-600 uppercase tracking-widest leading-none truncate">{childProfile ? `PediPulse · ${childProfile.name}` : 'PediPulse AI'}</span>
            <span className="block text-lg font-black text-slate-800 tracking-tight truncate">{currentTitle}</span>
          </span>
        </button>
        <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" className="w-12 h-12 shrink-0 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-700 border border-slate-200 text-2xl">☰</button>
      </header>

      {isMobileMenuOpen && (
        <div role="dialog" aria-modal="true" aria-label="All sections" className="md:hidden fixed inset-0 z-60 bg-slate-50 overflow-y-auto overscroll-contain">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-800">All sections</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu" className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-700">×</button>
          </div>
          <div className="px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-6">
            <ChildSwitcher onNavigate={() => setIsMobileMenuOpen(false)} />
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
                      <span aria-hidden="true" className="text-2xl shrink-0">{item.icon}</span>
                      <span className="text-sm font-black leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <div className="flex justify-center gap-6 text-sm font-bold text-slate-600">
              <button onClick={() => handleNav('privacy')} className="underline min-h-[44px]">Privacy Policy</button>
              <button onClick={() => handleNav('terms')} className="underline min-h-[44px]">Terms of Use</button>
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Sections" className="hidden md:flex print:hidden w-72 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl z-50">
        <NavContent />
      </nav>

      <main className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 print:p-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-24 print:pb-0">{children}</div>
      </main>

      <nav aria-label="Main" className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom)]">
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
                <span aria-hidden="true" className="text-2xl leading-none">{item.icon}</span>
                <span className="text-xs font-black">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="More sections"
            className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors ${isMobileMenuOpen || !isOnBottomTab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 active:bg-slate-100'}`}
          >
            <span className="text-2xl leading-none">☰</span>
            <span className="text-xs font-black">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
