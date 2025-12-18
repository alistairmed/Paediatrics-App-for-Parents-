
import React, { useState } from 'react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categories = [
    {
      title: 'Acute Triage',
      color: 'text-rose-500',
      items: [
        { id: 'symptoms', label: 'Symptom Guide', icon: '🌡️' },
        { id: 'acutelogs', label: 'Sick Day Log', icon: '🚨' },
        { id: 'dosage', label: 'Safe Dosing', icon: '💊' },
      ]
    },
    {
      title: 'Health Records',
      color: 'text-indigo-500',
      items: [
        { id: 'profile', label: 'Medical Hub', icon: '📋' },
        { id: 'redbook', label: 'Digital Red Book', icon: '📕' },
        { id: 'appointments', label: 'Care Schedule', icon: '🗓️' },
      ]
    },
    {
      title: 'Growth & Development',
      color: 'text-teal-500',
      items: [
        { id: 'milestones', label: 'Milestones', icon: '✨' },
        { id: 'screening', label: 'Check-ups', icon: '🔍' },
        { id: 'bonding', label: 'Bonding Journal', icon: '🫂' },
        { id: 'parenting', label: 'Parenting Hub', icon: '🌻' },
        { id: 'stories', label: 'Calm Stories', icon: '🌙' },
      ]
    }
  ];

  const handleNav = (view: ViewType) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full justify-between pb-8">
      <div className="space-y-8">
        <div 
          className="flex items-center gap-3 mb-10 px-2 cursor-pointer group" 
          onClick={() => handleNav('dashboard')}
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
            👶
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter italic leading-none">PediPulse <span className="text-indigo-600">AI</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Clinical Companion</p>
          </div>
        </div>
        
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.title} className="space-y-1">
              <h3 className={`text-[9px] font-black ${cat.color} uppercase tracking-[0.2em] px-4 mb-3 flex items-center gap-2`}>
                {cat.title}
              </h3>
              <div className="flex flex-col gap-1">
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id as ViewType)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                      activeView === item.id 
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="whitespace-nowrap text-sm font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
         <button
          onClick={() => handleNav('setup')}
          className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
            activeView === 'setup' 
              ? 'bg-slate-900 text-white shadow-xl' 
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FBFBFE]">
      {/* Mobile Top Header - Slimmer for more space */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2" onClick={() => handleNav('dashboard')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg shadow-sm">👶</div>
          <h1 className="text-lg font-black text-slate-800 italic">PediPulse <span className="text-indigo-600">AI</span></h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-xl text-slate-600 border border-slate-200"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white p-6 overflow-y-auto pt-20 animate-in slide-in-from-right duration-300">
          <NavContent />
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex w-72 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen flex-col justify-between overflow-y-auto no-scrollbar">
        <NavContent />
      </nav>

      {/* Main Content Area - Reduced padding for Mobile */}
      <main className="flex-1 p-3 sm:p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
