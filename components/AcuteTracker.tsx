
import React, { useState, useEffect } from 'react';
import { AcuteLogEntry, HydrationChallenge } from '../types';

interface AcuteTrackerProps {
  onLogEntry: (entry: Omit<AcuteLogEntry, 'id'>) => void;
  entries: AcuteLogEntry[];
  childWeight?: number;
}

export const AcuteTracker: React.FC<AcuteTrackerProps> = ({ onLogEntry, entries, childWeight }) => {
  const [type, setType] = useState<AcuteLogEntry['type']>('Fluid');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  
  const [challenge, setChallenge] = useState<HydrationChallenge>({
    isActive: false,
    targetVolume: 500,
    intervalVolume: 5,
    intervalMinutes: 5,
    totalConsumed: 0,
    vomitCount: 0
  });

  useEffect(() => {
    if (childWeight && !challenge.isActive) {
      const recommendedInterval = Math.round(childWeight); 
      setChallenge(prev => ({
        ...prev,
        intervalVolume: recommendedInterval,
        targetVolume: recommendedInterval * 12 
      }));
    }
  }, [childWeight, challenge.isActive]);

  const handleAdd = () => {
    if (!value) return;
    onLogEntry({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      value,
      notes
    });
    setValue('');
    setNotes('');
  };

  const handleStartChallenge = () => {
    setChallenge(prev => ({ 
      ...prev, 
      isActive: true, 
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalConsumed: 0,
      vomitCount: 0
    }));
  };

  const logChallengeFluid = (amount: number) => {
    onLogEntry({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Fluid',
      value: `${amount}ml`,
      notes: 'Part of Rehydration Challenge',
      isChallengeEntry: true
    });
    setChallenge(prev => ({ ...prev, totalConsumed: prev.totalConsumed + amount }));
  };

  const logChallengeVomit = () => {
    onLogEntry({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Vomit',
      value: 'Vomit recorded',
      notes: 'Loss during rehydration challenge',
      isChallengeEntry: true
    });
    setChallenge(prev => ({ ...prev, vomitCount: prev.vomitCount + 1 }));
  };

  const icons = { Fluid: '🥤', Temperature: '🌡️', Output: '🚽', Medication: '💊', Vomit: '🤮' };

  const successRate = Math.min(Math.round((challenge.totalConsumed / challenge.targetVolume) * 100), 100);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Acute <span className="text-rose-600">Sync Log</span></h2>
          <p className="text-slate-500 text-xs font-medium italic mt-1">Track fluids, fever, and output for clinical review.</p>
        </div>
        
        {!challenge.isActive ? (
          <button 
            onClick={handleStartChallenge}
            className="w-full sm:w-auto bg-teal-600 text-white px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
          >
            <span>💧</span> Fluids Challenge
          </button>
        ) : (
          <button 
            onClick={() => setChallenge(prev => ({ ...prev, isActive: false }))}
            className="w-full sm:w-auto bg-slate-900 text-white px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl"
          >
            End Challenge
          </button>
        )}
      </header>

      {challenge.isActive && (
        <div className="bg-white rounded-[2.5rem] border-4 border-teal-500 shadow-2xl overflow-hidden animate-in zoom-in-95">
           <div className="bg-teal-500 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl animate-pulse">🧪</div>
                 <div>
                    <h3 className="text-lg font-black italic leading-none">Hydration Challenge</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-1">Target: {challenge.intervalVolume}ml / {challenge.intervalMinutes}m</p>
                 </div>
              </div>
           </div>
           
           <div className="p-6 space-y-8">
              <div className="flex flex-col items-center">
                 <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="#14b8a6" 
                        strokeWidth="10" fill="transparent" 
                        strokeDasharray={`${successRate * 2.512}, 251.2`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-3xl font-black text-slate-800 leading-none">{challenge.totalConsumed}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ml Intake</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="overflow-x-auto no-scrollbar pb-2">
                    <div className="flex gap-2 min-w-max">
                       {[5, 10, 20, 50].map(amt => (
                         <button 
                          key={amt} 
                          onClick={() => logChallengeFluid(amt)}
                          className="px-6 py-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 font-black text-xs hover:bg-teal-100 transition-all active:scale-95 shadow-sm"
                         >
                            +{amt}ml
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={logChallengeVomit}
                      className="p-4 rounded-3xl bg-rose-50 border border-rose-100 text-rose-700 flex flex-col items-center gap-1 group"
                    >
                       <span className="text-3xl group-active:scale-125 transition-transform">🤮</span>
                       <span className="text-[10px] font-black uppercase">Record Vomit</span>
                       <span className="text-[8px] font-bold opacity-60">Total: {challenge.vomitCount}</span>
                    </button>

                    <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex flex-col items-center gap-1">
                       <span className="text-3xl">⏱️</span>
                       <span className="text-[10px] font-black uppercase">Next Dose</span>
                       <span className="text-[8px] font-bold opacity-60">Guidelines: 5m Wait</span>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed text-center">
                 Persistence vomiting (2+ times) indicates failure; consider hospital presentation if child is lethargic.
              </p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
               {['Fluid', 'Temperature', 'Output', 'Medication'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t as any)}
                    className={`flex-1 py-3 rounded-xl text-xl transition-all ${type === t ? 'bg-white shadow-sm' : 'opacity-40'}`}
                  >
                    {icons[t as keyof typeof icons]}
                  </button>
               ))}
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">Value</label>
                  <input 
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                    placeholder={type === 'Fluid' ? '50ml' : type === 'Temperature' ? '38.5C' : 'Wet Nappy'}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-black text-base"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">Note</label>
                  <input 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="e.g. refused half..."
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-xs font-bold"
                  />
               </div>
               <button onClick={handleAdd} className="w-full py-5 bg-rose-600 text-white font-black rounded-[1.5rem] shadow-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all">Log Event</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
           <div className="bg-white p-5 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Timeline (24h)</h3>
                 <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-100 px-3 py-1 rounded-full">Wt: {childWeight || '--'}kg</span>
              </div>
              <div className="space-y-3">
                 {entries.length > 0 ? entries.map(entry => (
                    <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${entry.isChallengeEntry ? 'bg-teal-50 border-teal-50' : 'bg-slate-50/20 border-slate-50 shadow-sm'}`}>
                       <span className="text-[10px] font-black text-slate-400 w-12">{entry.timestamp}</span>
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-50 shrink-0">{icons[entry.type]}</div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-black text-slate-800 truncate">
                             {entry.value} 
                             <span className="text-[8px] text-slate-400 uppercase tracking-widest ml-1.5">{entry.type}</span>
                          </p>
                          {entry.notes && <p className="text-[10px] font-bold text-slate-400 italic truncate leading-tight mt-0.5">{entry.notes}</p>}
                       </div>
                    </div>
                 )) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                       <span className="text-6xl mb-4">📉</span>
                       <p className="font-black text-sm uppercase tracking-widest">No entries yet</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
