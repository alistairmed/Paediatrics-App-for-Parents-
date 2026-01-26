
import React, { useMemo } from 'react';
import { ViewType } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useRole } from '../context/RoleContext';
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
  const { role } = useRole();

  const pendingAssignments = (history.assignedTests || []).filter(t => t.status === 'pending');
  
  const acuteStats = useMemo(() => {
    const logs = history.acuteLogs || [];
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = logs.filter(l => new Date(l.timestamp) > last24h);
    
    return {
      totalRecent: recent.length,
      maxTemp: Math.max(...recent.filter(r => r.type === 'Temperature').map(r => parseFloat(r.value) || 0), 0),
      fluidIntake: recent.filter(r => r.type === 'Fluid').reduce((acc, curr) => acc + (parseInt(curr.value) || 0), 0),
      hasAlerts: recent.some(r => r.type === 'Triage' && r.value.includes('Urgent'))
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

  if (role === 'clinician') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
        <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-[100px]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center text-5xl border border-white/5 shadow-inner">🩺</div>
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter leading-none">{childProfile?.name || 'Inpatient (Guest)'}</h2>
                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Clinical Context: {childAge || 'No Profile'}</p>
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase border border-white/5">Wt: {latestWeight || '--'} kg</span>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase border border-white/5">BSA: {latestWeight ? (Math.sqrt((latestWeight * 100) / 3600)).toFixed(2) : '--'} m²</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
               <button onClick={() => navigateTo('handover')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">Review ISBAR Handover</button>
               <button onClick={() => navigateTo('setup')} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all text-slate-400">Update Baseline</button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-between h-44 ${acuteStats.maxTemp >= 38.5 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Temp (24h)</p>
            <p className={`text-4xl font-black italic ${acuteStats.maxTemp >= 38.5 ? 'text-rose-600' : 'text-slate-800'}`}>{acuteStats.maxTemp > 0 ? `${acuteStats.maxTemp}°` : '--'}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between h-44">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fluid Vol (24h)</p>
            <p className="text-4xl font-black italic text-teal-600">{acuteStats.fluidIntake} ml</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between h-44">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acute Events</p>
            <p className="text-4xl font-black italic text-slate-800">{acuteStats.totalRecent}</p>
          </div>
          <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-between h-44 ${acuteStats.hasAlerts ? 'bg-rose-600 text-white animate-pulse shadow-rose-200 shadow-2xl' : 'bg-slate-100 border-slate-200'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${acuteStats.hasAlerts ? 'text-rose-100' : 'text-slate-400'}`}>Safety Status</p>
            <p className="text-2xl font-black italic">{acuteStats.hasAlerts ? 'URGENT REVIEW' : 'STABLE'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div onClick={() => navigateTo('consults')} className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-100 hover:border-indigo-600 shadow-sm hover:shadow-2xl transition-all cursor-pointer group">
             <div className="flex items-center gap-6 mb-8">
               <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">✍️</div>
               <div>
                  <h3 className="text-2xl font-black italic tracking-tighter">SOAP Consult</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Direct Clinical Entry</p>
               </div>
             </div>
             <p className="text-slate-500 font-medium italic text-sm leading-relaxed">Fast-path documentation for current assessment and plan. Supports clinical shorthand chips.</p>
          </div>

          <div onClick={() => navigateTo('reasoning')} className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-100 hover:border-indigo-600 shadow-sm hover:shadow-2xl transition-all cursor-pointer group">
             <div className="flex items-center gap-6 mb-8">
               <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">🧠</div>
               <div>
                  <h3 className="text-2xl font-black italic tracking-tighter">Differential Bench</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">AI Diagnostic Assistant</p>
               </div>
             </div>
             <p className="text-slate-500 font-medium italic text-sm leading-relaxed">Synthesis of history, exam, and labs into a ranked differential list with EBM grounding.</p>
          </div>
        </div>

        <section className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Specialist Pipeline</h3>
              <button onClick={() => navigateTo('assignments')} className="text-[10px] font-black text-indigo-600 uppercase underline">Manage Library</button>
           </div>
           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">📋</div>
                 <div>
                    <p className="font-black text-slate-800">Pending Screener Submissions</p>
                    <p className="text-xs font-bold text-slate-400">{pendingAssignments.length} tests active with caregiver</p>
                 </div>
              </div>
              <div className="flex -space-x-2">
                 {pendingAssignments.map((a, i) => (
                   <div key={i} title={a.testId} className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center text-[10px] font-black uppercase">{a.testId.slice(0,2)}</div>
                 ))}
              </div>
           </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner border border-white/10 rotate-[-4deg]">🏠</div>
           <div className="text-center md:text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">{hasSkippedSetup ? 'GUEST REGISTRY ACTIVE' : 'PEDI-PULSE REGISTRY ACTIVE'}</p>
              <h2 className="text-4xl font-black italic tracking-tighter leading-none mb-4">Welcome Home, {childProfile?.name?.split(' ')[0] || 'Guest'}.</h2>
              <p className="text-indigo-100 font-medium italic opacity-90 max-w-lg">
                Your clinical workstation is initialized. Use the quick actions below to track wellness, or explore the Medical Hub for deeper history.
              </p>
              {hasSkippedSetup && (
                <button onClick={() => navigateTo('setup')} className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all">
                  ⚠️ Complete Setup for Personalized Insights
                </button>
              )}
           </div>
        </div>
      </div>

      {pendingAssignments.length > 0 && (
        <div 
          onClick={() => navigateTo('screening')}
          className="bg-rose-600 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl cursor-pointer hover:scale-[1.02] transition-all animate-bounce-subtle"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner">📋</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Clinician Request</p>
              <h3 className="text-2xl font-black italic tracking-tight">Assessments Ready ({pendingAssignments.length})</h3>
              <p className="text-rose-100 text-sm font-bold opacity-80">Please complete these screening tools before your next visit.</p>
            </div>
          </div>
          <button className="bg-white text-rose-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Start Now</button>
        </div>
      )}

      <section className="space-y-4">
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Vital Management</h4>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => navigateTo('acutelogs')} className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 hover:scale-105 transition-all group">
               <span className="text-4xl group-hover:rotate-12 transition-transform">🌡️</span>
               <span className="text-[10px] font-black uppercase text-slate-700">Track Fever</span>
            </button>
            <button onClick={() => navigateTo('acutelogs')} className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 hover:scale-105 transition-all group">
               <span className="text-4xl group-hover:rotate-12 transition-transform">💧</span>
               <span className="text-[10px] font-black uppercase text-slate-700">Track Fluid</span>
            </button>
            <button onClick={() => navigateTo('acutelogs')} className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 hover:scale-105 transition-all group">
               <span className="text-4xl group-hover:rotate-12 transition-transform">🤮</span>
               <span className="text-[10px] font-black uppercase text-slate-700">Track Vomit</span>
            </button>
            <button onClick={() => navigateTo('symptoms')} className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 hover:scale-105 transition-all group">
               <span className="text-4xl group-hover:rotate-12 transition-transform">✨</span>
               <span className="text-[10px] font-black uppercase text-slate-700">AI Triage</span>
            </button>
         </div>
      </section>

      <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-8">
         <div className="flex justify-between items-center px-4">
            <div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight italic leading-none">Health at a Glance</h3>
               <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Recent Activity Trend</p>
            </div>
            <button onClick={() => navigateTo('acutelogs')} className="text-[10px] font-black text-indigo-600 uppercase underline">Full Log View</button>
         </div>
         
         {trendPreview.length > 0 ? (
            <div className="h-[250px] w-full">
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
            <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center gap-4">
               <span className="text-6xl grayscale opacity-20">📉</span>
               <div className="max-w-xs">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Wellness Data Yet</p>
                  <p className="text-xs font-bold text-slate-300 italic mt-1">Log a fever or fluid intake to see your child's recovery trend here.</p>
               </div>
            </div>
         )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          onClick={() => navigateTo('profile')}
          className="bg-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden group"
        >
          <div className="absolute bottom-0 right-0 -mb-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 flex flex-col justify-between h-full space-y-20">
            <div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-8">📋</div>
              <h3 className="text-4xl font-black italic tracking-tighter leading-tight">Longitudinal <br/> Medical Hub</h3>
              <p className="text-indigo-200 font-medium text-lg mt-4 max-w-sm leading-relaxed italic opacity-80">Synthesis of the clinical story, MDT care team coordination, and specialist letters.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-indigo-400 group-hover:text-white transition-colors">
              Access Patient History <span>→</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div 
            onClick={() => navigateTo('milestones')}
            className="bg-teal-50 p-10 rounded-[3.5rem] border border-teal-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform">✨</div>
            <div>
              <h3 className="text-2xl font-black text-teal-900 tracking-tight">Milestone Sync</h3>
              <p className="text-[10px] font-black uppercase text-teal-600 mt-2 tracking-widest">Growth Tracking</p>
            </div>
          </div>
          
          <div 
            onClick={() => navigateTo('redbook')}
            className="bg-rose-50 p-10 rounded-[3.5rem] border border-rose-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform">📕</div>
            <div>
              <h3 className="text-2xl font-black text-rose-900 tracking-tight">Digital Red Book</h3>
              <p className="text-[10px] font-black uppercase text-rose-600 mt-2 tracking-widest">Immunisation Record</p>
            </div>
          </div>

          <div 
            onClick={() => navigateTo('parenting')}
            className="bg-amber-50 p-10 rounded-[3.5rem] border border-amber-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all sm:col-span-2"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">🌻</div>
              <span className="px-4 py-2 bg-amber-200/50 text-amber-800 rounded-xl text-[9px] font-black uppercase tracking-widest">Parenting Strategy</span>
            </div>
            <div className="mt-8">
              <h3 className="text-3xl font-black text-amber-900 tracking-tight">Parenting Strategy Hub</h3>
              <p className="text-sm font-medium text-amber-800/60 mt-2 leading-relaxed italic">Evidence-based guidance for behavior, anxiety, and development.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
