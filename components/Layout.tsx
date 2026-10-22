
import React, { useState } from 'react';
import { ViewType } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useEnvironment } from '../context/EnvironmentContext';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { mode } = useEnvironment();

  const groups = [
    {
      title: 'Acute Care',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      items: [
        { id: 'symptoms', label: 'Triage AI', icon: '🩺', highContrast: true },
        { id: 'sickday', label: 'Sick Day Plan', icon: '🚨', highContrast: true },
        { id: 'acutelogs', label: 'Acute Log Review', icon: '📈' },
        { id: 'dosage', label: 'Dosage Verification', icon: '💊' },
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
      ]
    },
    {
      title: 'Diagnostics & Reports',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: [
        { id: 'diagnostics', label: 'Investigation Results', icon: '🧪' },
        { id: 'reports', label: 'Specialist Letters', icon: '✉️' },
        { id: 'handover', label: 'ISBAR Handover', icon: '📄' },
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
      items: [
        { id: 'governance', label: 'Audit Trail', icon: '🛡️' },
        { id: 'regulatory', label: 'TGA Compliance', icon: '⚖️' },
      ]
    },
    {
      title: 'Caregiver Support',
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      items: [
        { id: 'parenting', label: 'Parenting Hub', icon: '🌻' },
        { id: 'bonding', label: 'Bonding Journal', icon: '🫂' },
        { id: 'stories', label: 'Calm Stories', icon: '🌙' },
      ]
    }
  ];

  const bottomNavItems = [
    { id: 'symptoms', label: 'Triage', icon: '🌡️' },
    { id: 'sickday', label: 'Plan', icon: '🚨' },
    { id: 'profile', label: 'Hub', icon: '🏥' },
    { id: 'parenting', label: 'Learn', icon: '🌻' },
  ];

  const handleNav = (view: ViewType) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

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
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Parent Assistant</p>
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
    <div className={`min-h-screen flex flex-col md:flex-row bg-[#FBFBFE]`}>
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white/95 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3" onClick={() => handleNav('dashboard')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg border-2 border-white">👶</div>
          <h1 className="text-lg font-black text-slate-800 italic tracking-tighter">PediPulse AI</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-600 border border-slate-200">
            {isMobileMenuOpen ? <span className="text-xl">✕</span> : <span className="text-2xl">☰</span>}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-white p-6 overflow-y-auto animate-in slide-in-from-right duration-500">
           <div className="flex justify-end mb-4">
             <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center font-black text-xl">×</button>
           </div>
          <NavContent />
        </div>
      )}

      <nav className="hidden md:flex w-72 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl z-50">
        <NavContent />
      </nav>

      <main className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-24">{children}</div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-6 flex items-center justify-between z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {bottomNavItems.map(item => (
          <button key={item.id} onClick={() => handleNav(item.id as ViewType)} className={`flex flex-col items-center gap-1 transition-all ${activeView === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400 grayscale opacity-60'}`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
