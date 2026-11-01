
import React, { useMemo } from 'react';
import { ViewType } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { nipStatuses, formatNipDate, NIP_FOOTNOTE } from '../clinical/vaccineSchedule';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Line
} from 'recharts';

const formatLogTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { childProfile, childAge, hasSkippedSetup } = useChildProfile();
  const { latestWeight, history } = useMedicalHistory();

  // NIP status from the date of birth and the doses recorded as given.
  const vaccines = useMemo(() => {
    if (!childProfile?.dob) return null;
    const statuses = nipStatuses(childProfile.dob, history.vaccinations || []);
    return {
      overdue: statuses.filter(s => s.status === 'overdue'),
      dueNow: statuses.filter(s => s.status === 'due'),
      next: statuses.find(s => s.status === 'upcoming'),
      allGiven: statuses.every(s => s.status === 'given'),
    };
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
      <div className="bg-linear-to-r from-terracotta-600 to-terracotta-800 p-5 sm:p-10 rounded-4xl sm:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
           <div className="hidden sm:flex w-24 h-24 bg-white/20 rounded-[2.5rem] items-center justify-center text-4xl sm:text-5xl shadow-inner border border-white/10 rotate-[-4deg] shrink-0">🏠</div>
           <div className="text-center md:text-left">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">{childProfile ? (childAge || 'Health records') : 'Guest mode'}</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none mb-3 sm:mb-4">{childProfile ? `${childProfile.name.split(' ')[0]}'s records` : 'Welcome to Paeds Pouch'}</h2>
              <p className="hidden sm:block text-terracotta-100 font-medium opacity-90 max-w-lg text-base">
                Log how your child is going today with the buttons below, or open their records from the menu.
              </p>
              {hasSkippedSetup && (
                <button onClick={() => navigateTo('setup')} className="mt-4 sm:mt-6 min-h-[44px] px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center mx-auto md:mx-0">
                  ⚠️ Complete Setup for Personalized Insights
                </button>
              )}
           </div>
        </div>
      </div>

      {vaccines && (
        <section aria-labelledby="vaccine-reminder-title" className="bg-white border-2 border-sky-200 rounded-4xl p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0" aria-hidden="true">💉</span>
            <div className="space-y-1">
              <h3 id="vaccine-reminder-title" className="text-lg font-black text-ink-800">Vaccines</h3>
              {vaccines.overdue.length > 0 && (
                <p className="text-base font-bold text-terracotta-700">
                  Overdue: {vaccines.overdue.map(s => s.visit.name).join(', ')}
                </p>
              )}
              {vaccines.dueNow.length > 0 && (
                <p className="text-base font-bold text-amber-800">
                  Due now: {vaccines.dueNow.map(s => s.visit.name).join(', ')}
                </p>
              )}
              {vaccines.next && (
                <p className="text-base font-bold text-ink-800">
                  Next due: {vaccines.next.visit.name}, {formatNipDate(vaccines.next.dueDate)}
                </p>
              )}
              {vaccines.allGiven && <p className="text-base font-bold text-sky-800">All scheduled vaccines are recorded as given.</p>}
              <p className="text-sm font-medium text-ink-600">{NIP_FOOTNOTE}</p>
            </div>
          </div>
          <button onClick={() => navigateTo('vaccines')} className="shrink-0 min-h-[44px] px-6 py-3 bg-sky-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Open Vaccines</button>
        </section>
      )}

      <section className="space-y-3 sm:space-y-4">
         <h4 className="text-xs font-black text-ink-600 uppercase tracking-widest ml-2 sm:ml-4">Quick log</h4>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button onClick={() => navigateTo('acutelogs')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-ink-200 rounded-4xl sm:rounded-[2.5rem] shadow-xs flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-ink-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">🌡️</span>
               <span className="text-xs font-black uppercase text-ink-700">Track Fever</span>
            </button>
            <button onClick={() => navigateTo('acutelogs')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-ink-200 rounded-4xl sm:rounded-[2.5rem] shadow-xs flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-ink-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">💧</span>
               <span className="text-xs font-black uppercase text-ink-700">Track Fluid</span>
            </button>
            <button onClick={() => navigateTo('acutelogs')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-ink-200 rounded-4xl sm:rounded-[2.5rem] shadow-xs flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-ink-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">🤮</span>
               <span className="text-xs font-black uppercase text-ink-700">Track Vomit</span>
            </button>
            <button onClick={() => navigateTo('symptoms')} className="p-4 sm:p-6 min-h-[90px] bg-white border border-ink-200 rounded-4xl sm:rounded-[2.5rem] shadow-xs flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all group active:bg-ink-50">
               <span className="text-3xl sm:text-4xl group-hover:rotate-12 transition-transform">🩺</span>
               <span className="text-xs font-black uppercase text-ink-700">When to Get Help</span>
            </button>
         </div>
      </section>

      <section className="bg-white p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-ink-100 shadow-xl space-y-6 sm:space-y-8">
         <div className="flex justify-between items-center px-2 sm:px-4">
            <div>
               <h3 className="text-xl sm:text-2xl font-black text-ink-800 tracking-tight leading-none">Health at a Glance</h3>
               <p className="text-xs font-black uppercase text-ink-600 mt-1.5 tracking-widest">Recent Activity Trend</p>
            </div>
            <button onClick={() => navigateTo('acutelogs')} className="text-xs font-black text-terracotta-600 uppercase underline min-h-[44px] flex items-center">Full Log View</button>
         </div>
         
         {trendPreview.length > 0 ? (
            <div className="h-[220px] sm:h-[250px] w-full min-w-0">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendPreview}>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" vertical={false} />
                     <XAxis dataKey="time" hide />
                     <YAxis yAxisId="temp" domain={[35, 41]} hide />
                     <YAxis yAxisId="bal" hide />
                     <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                     <Area yAxisId="bal" type="monotone" dataKey="balance" fill="var(--color-sky-brand)" fillOpacity={0.05} stroke="var(--color-sky-brand)" strokeWidth={2} name="Hydration Balance" />
                     <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="var(--color-brand-dark)" strokeWidth={4} dot={{ r: 5, fill: 'var(--color-brand-dark)', stroke: '#fff', strokeWidth: 2 }} name="Temperature" connectNulls />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         ) : (
            <div className="py-12 sm:py-16 text-center border-2 border-dashed border-ink-100 rounded-4xl sm:rounded-[3rem] flex flex-col items-center gap-3 sm:gap-4 p-4">
               <span className="text-5xl sm:text-6xl grayscale opacity-20">📉</span>
               <div className="max-w-xs">
                  <p className="text-xs sm:text-sm font-black text-ink-600 uppercase tracking-widest">No Wellness Data Yet</p>
                  <p className="text-xs font-bold text-ink-600 mt-1">Log a fever or fluid intake to see your child's recovery trend here.</p>
               </div>
            </div>
         )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div 
          onClick={() => navigateTo('profile')}
          className="bg-terracotta-900 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] text-white shadow-2xl cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden group min-h-[44px]"
        >
          <div className="absolute bottom-0 right-0 -mb-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 flex flex-col justify-between h-full space-y-12 sm:space-y-20">
            <div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-6 sm:mb-8">📋</div>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight">Your child's <br/> health records</h3>
              <p className="text-terracotta-200 font-medium text-sm sm:text-lg mt-3 sm:mt-4 max-w-sm leading-relaxed opacity-80">Synthesis of the clinical story, MDT care team coordination, and specialist letters.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-terracotta-300 group-hover:text-white transition-colors">
              Access Patient History <span>→</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div 
            onClick={() => navigateTo('milestones')}
            className="bg-sky-50 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-sky-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all min-h-[44px]"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xs mb-4 sm:mb-6 group-hover:scale-110 transition-transform">✨</div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-sky-900 tracking-tight">Milestone Sync</h3>
              <p className="text-xs font-black uppercase text-sky-700 mt-1.5 tracking-widest">Growth Tracking</p>
            </div>
          </div>
          
          <div 
            onClick={() => navigateTo('redbook')}
            className="bg-terracotta-50 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-terracotta-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all min-h-[44px]"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xs mb-4 sm:mb-6 group-hover:scale-110 transition-transform">📕</div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-terracotta-900 tracking-tight">Digital Red Book</h3>
              <p className="text-xs font-black uppercase text-terracotta-700 mt-1.5 tracking-widest">Immunisation Record</p>
            </div>
          </div>

          <div 
            onClick={() => navigateTo('parenting')}
            className="bg-amber-50 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100 flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all sm:col-span-2 min-h-[44px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:scale-110 transition-transform shrink-0">🌻</div>
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
