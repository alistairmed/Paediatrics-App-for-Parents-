import React, { useMemo } from 'react';
import { ViewType, ChildProfile } from '../types';

interface DashboardProps {
  onNavigate: (v: ViewType) => void;
  latestWeight?: number;
  childProfile?: ChildProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, latestWeight, childProfile }) => {
  const childAge = useMemo(() => {
    if (!childProfile?.dob) return null;
    const birth = new Date(childProfile.dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (years === 0) return `${months} months old`;
    return `${years} years, ${months % 12} months`;
  }, [childProfile]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      
      {/* CHILD HEADER CARD */}
      <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-500 rounded-full opacity-5 blur-[120px] group-hover:opacity-10 transition-opacity"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-10">
            <div className="w-28 h-28 bg-indigo-100 text-indigo-600 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner border-4 border-white rotate-[-3deg] group-hover:rotate-0 transition-transform">
              {childProfile?.sex === 'Female' ? '👧' : childProfile?.sex === 'Male' ? '👦' : '👶'}
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic leading-none">
                {childProfile?.name || 'Child Profile'}
              </h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-indigo-100">
                  {childAge || 'Setup Required'}
                </span>
                <span className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-emerald-100">
                  {latestWeight ? `${latestWeight} kg` : '-- kg'}
                </span>
                {childProfile?.allergies && childProfile.allergies.length > 0 && (
                  <span className="px-5 py-2 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-rose-100">
                    ⚠️ {childProfile.allergies.length} Allergies
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('setup')}
            className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          >
            {childProfile ? 'Update Health Baseline' : 'Initialize Profile'}
          </button>
        </div>
      </section>

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 'symptoms', label: 'Analyze Symptoms', sub: 'Triage with AI Triage', icon: '🌡️', color: 'bg-rose-50 text-rose-600' },
          { id: 'acutelogs', label: 'Sick Day Log', sub: 'Track Intake & Fever', icon: '🚨', color: 'bg-orange-50 text-orange-600' },
          { id: 'dosage', label: 'Verify Dosage', sub: 'Safe Weight-Based OTC', icon: '💊', color: 'bg-emerald-50 text-emerald-600' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id as ViewType)}
            className="bg-white p-8 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex items-start gap-6 group"
          >
            <div className={`w-16 h-16 ${item.color} rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">{item.label}</h3>
               <p className="text-xs font-bold text-slate-400 mt-1">{item.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* CORE CLINICAL BENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Longitudinal Hub */}
        <div 
          onClick={() => onNavigate('profile')}
          className="lg:col-span-2 bg-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden group"
        >
          <div className="absolute bottom-0 right-0 -mb-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 flex flex-col justify-between h-full space-y-20">
            <div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-8">📋</div>
              <h3 className="text-4xl font-black italic tracking-tighter leading-tight">Longitudinal <br/> Medical Hub</h3>
              <p className="text-indigo-200 font-medium text-lg mt-4 max-w-sm leading-relaxed">Synthesis of the clinical story, MDT care team coordination, and specialist letter repository.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-indigo-400 group-hover:text-white transition-colors">
              Access History <span>→</span>
            </div>
          </div>
        </div>

        {/* Development & Growth */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div 
            onClick={() => onNavigate('milestones')}
            className="bg-teal-50 p-10 rounded-[3.5rem] border border-teal-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform">✨</div>
            <div>
              <h3 className="text-2xl font-black text-teal-900 tracking-tight">Milestone Tracker</h3>
              <p className="text-[10px] font-black uppercase text-teal-600 mt-2 tracking-widest">Growth Tracking</p>
            </div>
          </div>
          
          <div 
            onClick={() => onNavigate('redbook')}
            className="bg-rose-50 p-10 rounded-[3.5rem] border border-rose-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform">📕</div>
            <div>
              <h3 className="text-2xl font-black text-rose-900 tracking-tight">Digital Red Book</h3>
              <p className="text-[10px] font-black uppercase text-rose-600 mt-2 tracking-widest">Immunisation & Checks</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('parenting')}
            className="bg-amber-50 p-10 rounded-[3.5rem] border border-amber-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all sm:col-span-2"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">🌻</div>
              <span className="px-4 py-2 bg-amber-200/50 text-amber-800 rounded-xl text-[9px] font-black uppercase tracking-widest">Clinical Psychology Hub</span>
            </div>
            <div className="mt-8">
              <h3 className="text-3xl font-black text-amber-900 tracking-tight">Parenting Strategy Hub</h3>
              <p className="text-sm font-medium text-amber-800/60 mt-2 leading-relaxed italic">Evidence-based modules for anxiety, resilience, and behavioral challenges.</p>
            </div>
          </div>
        </div>

      </div>

      {/* AI STORY SHORTCUT */}
      <section 
        onClick={() => onNavigate('stories')}
        className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl cursor-pointer hover:brightness-110 transition-all relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="flex items-center gap-10 relative z-10">
          <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner border border-white/10">🌙</div>
          <div>
            <h3 className="text-4xl font-black italic tracking-tighter mb-2">Instant Calm Story</h3>
            <p className="text-indigo-100 font-medium text-lg italic opacity-80">Generate a soothing, AI-narrated tale for stressful visits or sleep time.</p>
          </div>
        </div>
        <button className="px-10 py-5 bg-white text-indigo-700 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl whitespace-nowrap">Play CalmCast ✨</button>
      </section>

    </div>
  );
};