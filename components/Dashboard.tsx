
import React, { useMemo } from 'react';
import { ViewType } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { NIP_SCHEDULE, vaccineReminders } from '../clinical/vaccineSchedule';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Line
} from 'recharts';

const formatLogTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { childProfile, childAge, hasSkippedSetup } = useChildProfile();
  const { latestWeight, history } = useMedicalHistory();

  // Saved vaccine records, or the standard schedule if the vaccine screen hasn't been opened yet.
  const vaccines = useMemo(() => {
    const saved = history.vaccinations || [];
    const list = saved.length ? saved : childProfile?.dob ? NIP_SCHEDULE(new Date(childProfile.dob)) : [];
    return vaccineReminders(list);
  }, [history.vaccinations, childProfile?.dob]);

  const acuteStats = useMemo(() => {
    const logs = history.acuteLogs || [];
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = logs.filter(l => new Date(l.timestamp) > last24h);
    
    return {
      totalRecent: recent.length,
      maxTemp: Math.max(...recent.filter(r => r.type === 'Temperature').map(r => parseFloat(r.value) || 0), 0),
      fluidIntake: recent.filter(r => r.type === 'Fluid').reduce((acc, curr) => acc + (parseInt(curr.value) || 0), 0)
    };
  }, [history.acuteLogs]);

  const trendPreview = useMemo(() => {
    const logs = [...(history.acuteLogs || [])].reverse();
    let balance = 0;
    return logs.slice(-10).map(log => {
      if (log.type === 'Fluid') balance += (parseInt(log.value) || 0);
      if (log.type === 'Output' || log.type === 'Vomit') balance -= (parseInt(log.value) || 0);
      let temp;
      if (log.type === 'Temperature') temp = parseFloat(log.value);
      return { time: formatLogTime(log.timestamp), temp, balance };
    });
  }, [history.acuteLogs]);

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-28">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-5 sm:p-10 rounded-[2rem] sm:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
           <div className="hidden sm:flex w-24 h-24 bg-white/20 rounded-[2.5rem] items-center justify-center text-4xl sm:text-5xl shadow-inner border border-white/10 rotate-[-4deg] shrink-0">🏠</div>
           <div className="text-center md:text-left">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">{hasSkippedSetup ? 'GUEST REGISTRY ACTIVE' : 'PEDI-PULSE REGISTRY ACTIVE'}</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none mb-3 sm:mb-4">Welcome Home, {childProfile?.name?.split(' ')[0] || 'Guest'}.</h2>
              <p className="hidden sm:block text-indigo-100 font-medium opacity-90 max-w-lg text-base">
                Your clinical workstation is initialized. Use the quick actions below to track wellness, or explore the Medical Hub for deeper history.
              </p>
              {hasSkippedSetup && (
                <button onClick={() => navigateTo('setup')} className="mt-4 sm:mt-6 min-h-[44px] px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center mx-auto md:mx-0">
                  ⚠️ Complete Setup for Personalized Insights
                </button>
              )}
           </div>
        </div>
      </div>

      {(vaccines.overdue.length > 0 || vaccines.dueSoon.length > 0) && (
        <section aria-labelledby="vaccine-reminder-title" className="bg-white border-2 border-teal-200 rounded-[2rem] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0" aria-hidden="true">💉</span>
            <div className="space-y-1">
              <h3 id="vaccine-reminder-title" className="text-lg font-black text-slate-800">Vaccines</h3>
              {vaccines.overdue.length > 0 && (
                <p className="text-base font-bold text-rose-700">Not yet recorded: {vaccines.overdue.map(v => v.name).join(', ')}</p>
              )}
              {vaccines.dueSoon.length > 0 && (
                <p className="text-base font-bold text-slate-700">
                  Due soon: {vaccines.dueSoon.map(v => `${v.name} (${new Date(v.dueDate).toLocaleDateString([], { day: 'numeric', month: 'short' })})`).join(', ')}
                </p>
              )}
              <p className="text-sm font-medium text-slate-600">Book with your GP or immunisation provider, or mark them as given if they're done.</p>
            </div>
          </div>
          <button onClick={() => navigateTo('vaccines')} className="shrink-0 min-h-[44px] px-6 py-3 bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Open Vaccines</button>
        </section>
      )}

      <section className="space-y-3 sm:space-y-4">
         <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest ml-2 sm:ml-4">Vital Management</h4>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button onClick={() => navigateTo('acutelogs')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-slate-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">🌡️</span>
               <span className="text-xs font-black uppercase text-slate-700">Track Fever</span>
            </button>
            <button onClick={() => navigateTo('acutelogs')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-slate-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">💧</span>
               <span className="text-xs font-black uppercase text-slate-700">Track Fluid</span>
            </button>
            <button onClick={() => navigateTo('acutelogs')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-slate-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">🤮</span>
               <span className="text-xs font-black uppercase text-slate-700">Track Vomit</span>
            </button>
            <button onClick={() => navigateTo('symptoms')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-slate-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">🩺</span>
               <span className="text-xs font-black uppercase text-slate-700">When to Get Help</span>
            </button>
         </div>
      </section>

      <section className="bg-white p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-xl space-y-6 sm:space-y-8">
         <div className="flex justify-between items-center px-2 sm:px-4">
            <div>
               <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">Health at a Glance</h3>
               <p className="text-xs font-black uppercase text-slate-600 mt-1.5 tracking-widest">Recent Activity Trend</p>
            </div>
            <button onClick={() => navigateTo('acutelogs')} className="text-xs font-black text-indigo-600 uppercase underline min-h-[44px] flex items-center">Full Log View</button>
         </div>
         
         {trendPreview.length > 0 ? (
            <div className="h-[220px] sm:h-[250px] w-full min-w-0">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendPreview}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                     <XAxis dataKey="time" hide />
                     <YAxis yAxisId="temp" domain={[35, 41]} hide />
                     <YAxis yAxisId="bal" hide />
                     <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                     <Area yAxisId="bal" type="monotone" dataKey="balance" fill="#14b8a6" fillOpacity={0.05} stroke="#14b8a6" strokeWidth={2} name="Hydration Balance" />
                     <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#e11d48" strokeWidth={4} dot={{ r: 5, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }} name="Temperature" connectNulls />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         ) : (
            <div className="py-12 sm:py-16 text-center border-2 border-dashed border-slate-100 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center gap-3 sm:gap-4 p-4">
               <span className="text-5xl sm:text-6xl grayscale opacity-20">📉</span>
               <div className="max-w-xs">
                  <p className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest">No Wellness Data Yet</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Log a fever or fluid intake to see your child's recovery trend here.</p>
               </div>
            </div>
         )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div 
          onClick={() => navigateTo('profile')}
          className="bg-indigo-900 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] text-white shadow-2xl cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden group min-h-[44px]"
        >
          <div className="absolute bottom-0 right-0 -mb-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 flex flex-col justify-between h-full space-y-12 sm:space-y-20">
            <div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-6 sm:mb-8">📋</div>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight">Longitudinal <br/> Medical Hub</h3>
              <p className="text-indigo-200 font-medium text-sm sm:text-lg mt-3 sm:mt-4 max-w-sm leading-relaxed opacity-80">Synthesis of the clinical story, MDT care team coordination, and specialist letters.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-indigo-300 group-hover:text-white transition-colors">
              Access Patient History <span>→</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div 
            onClick={() => navigateTo('milestones')}
            className="bg-teal-50 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-teal-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all min-h-[44px]"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm mb-4 sm:mb-6 group-hover:scale-110 transition-transform">✨</div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-teal-900 tracking-tight">Milestone Sync</h3>
              <p className="text-xs font-black uppercase text-teal-700 mt-1.5 tracking-widest">Growth Tracking</p>
            </div>
          </div>
          
          <div 
            onClick={() => navigateTo('redbook')}
            className="bg-rose-50 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-rose-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all min-h-[44px]"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm mb-4 sm:mb-6 group-hover:scale-110 transition-transform">📕</div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-rose-900 tracking-tight">Digital Red Book</h3>
              <p className="text-xs font-black uppercase text-rose-700 mt-1.5 tracking-widest">Immunisation Record</p>
            </div>
          </div>

          <div 
            onClick={() => navigateTo('parenting')}
            className="bg-amber-50 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all sm:col-span-2 min-h-[44px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm group-hover:scale-110 transition-transform shrink-0">🌻</div>
              <span className="px-3 py-1.5 bg-amber-200/50 text-amber-800 rounded-xl text-xs font-black uppercase tracking-widest">Parenting Strategy</span>
            </div>
            <div className="mt-6 sm:mt-8">
              <h3 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">Parenting Strategy Hub</h3>
              <p className="text-xs sm:text-sm font-medium text-amber-800 mt-2 leading-relaxed">Evidence-based guidance for behavior, anxiety, and development.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
