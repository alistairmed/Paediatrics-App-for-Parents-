
import React, { useState, useEffect, useMemo } from 'react';
import { AcuteLogEntry } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useRole } from '../context/RoleContext';
import { calculateCEWT, getAgeGroup, CEWTRow } from '../clinical/cewt';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Line, Bar, ReferenceLine, ReferenceArea, Legend
} from 'recharts';

const icons = { 
  Fluid: '🥤', 
  Temperature: '🌡️', 
  Output: '🚽', 
  Medication: '💊', 
  Vomit: '🤮', 
  Triage: '✨', 
  Vitals: '🩺', 
  'Physical Exam': '👨‍⚕️' 
};

const units: Record<string, string> = {
  Fluid: 'ml',
  Temperature: '°C',
  Output: 'ml',
  Vomit: 'ml',
  Medication: 'mg/ml',
  Vitals: ''
};

const formatLogTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoString;
  }
};

/**
 * Professional EMR-style Vital Trends Chart
 * Displays HR and RR on separate axes to monitor physiological stability.
 */
const VitalTrendsChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (data.length < 2) return null;
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vital Trends (Physiology)</h4>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className="text-[8px] font-black text-slate-400 uppercase">HR</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="text-[8px] font-black text-slate-400 uppercase">RR</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
          <YAxis yAxisId="hr" domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} hide />
          <YAxis yAxisId="rr" domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} hide />
          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }} />
          <Line yAxisId="hr" type="monotone" dataKey="hr" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48' }} name="Heart Rate" connectNulls />
          <Line yAxisId="rr" type="monotone" dataKey="rr" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} name="Resp Rate" connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const CEWTEscalationChart: React.FC<{ data: CEWTRow[] }> = ({ data }) => {
  const chartData = useMemo(() => 
    [...data].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(row => ({
      time: formatLogTime(row.timestamp),
      score: row.totalScore,
      hr: parseInt(row.scores['HR']?.value as string) || null,
      rr: parseInt(row.scores['RR']?.value as string) || null,
      rawTimestamp: row.timestamp
    }))
  , [data]);

  if (data.length < 1) return null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl h-[320px] relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">CEWT Velocity</h4>
              <p className="text-white/40 text-[9px] font-bold italic">Safety Zone Monitoring</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-[9px] font-black text-rose-100 uppercase">Emergency (4+)</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <ReferenceArea y1={0} y2={1} fill="rgba(255,255,255,0.02)" />
                <ReferenceArea y1={1} y2={4} fill="rgba(251, 191, 36, 0.05)" label={{ position: 'insideTopLeft', value: 'Yellow Zone', fill: '#fbbf24', fontSize: 8, fontWeight: 900 }} />
                <ReferenceArea y1={4} y2={12} fill="rgba(225, 29, 72, 0.08)" label={{ position: 'insideTopLeft', value: 'Red Zone', fill: '#e11d48', fontSize: 8, fontWeight: 900 }} />
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900 }} />
                
                <Area type="monotone" dataKey="score" fill="rgba(79, 70, 229, 0.15)" stroke="none" />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366f1" 
                  strokeWidth={5} 
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isHigh = payload.score >= 4;
                    return <circle cx={cx} cy={cy} r={isHigh ? 7 : 5} fill={isHigh ? '#e11d48' : '#fff'} stroke={isHigh ? '#fff' : '#6366f1'} strokeWidth={3} />;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <VitalTrendsChart data={chartData} />
    </div>
  );
};

const FluidBalanceChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (data.length < 1) return null;
  return (
    <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center px-4">
          <h3 className="text-xl font-black text-slate-800 tracking-tight italic leading-none">Fluid Balance Chart</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span><span className="text-[9px] font-black uppercase text-slate-400">In</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span className="text-[9px] font-black uppercase text-slate-400">Out</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span className="text-[9px] font-black uppercase text-slate-400">Net</span></div>
          </div>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
           <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} />
              <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }} />
              <Bar dataKey="in" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Input" />
              <Bar dataKey="out" fill="#e11d48" radius={[4, 4, 0, 0]} name="Output" />
              <Line type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={4} dot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} name="Cumulative" />
           </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CEWTGrid: React.FC<{ data: CEWTRow[] }> = ({ data }) => {
  const parameters = ['RR', 'Effort', 'SpO2', 'HR', 'BP', 'CRT', 'Temp', 'CNS'];
  
  if (data.length === 0) return (
    <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] italic border-2 border-dashed border-slate-100 rounded-[3rem]">
      No clinical observations recorded.
    </div>
  );

  const getCellColor = (score: number) => {
    if (score >= 3) return 'bg-rose-500 text-white';
    if (score >= 1) return 'bg-amber-400 text-slate-900';
    return 'bg-white text-slate-600';
  };

  return (
    <div className="overflow-x-auto no-scrollbar rounded-[2.5rem] border border-slate-200 bg-white shadow-xl">
      <table className="w-full text-center border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-left sticky left-0 bg-slate-50 z-10 w-32 border-r border-slate-100">Parameter</th>
            {data.map((col, i) => (
              <th key={i} className="p-5 text-[10px] font-black uppercase text-slate-600 border-l border-slate-100 min-w-[90px]">
                {formatLogTime(col.timestamp)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parameters.map(param => (
            <tr key={param} className="border-b border-slate-100">
              <td className="p-5 text-[11px] font-black text-slate-800 text-left sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{param}</td>
              {data.map((col, i) => {
                const cell = col.scores[param];
                return (
                  <td key={i} className={`p-5 text-[11px] font-bold border-l border-slate-50 transition-colors ${getCellColor(cell?.score || 0)}`}>
                    {cell?.value || '--'}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-slate-900 text-white font-black">
            <td className="p-5 text-[10px] uppercase tracking-widest text-left sticky left-0 bg-slate-900 z-10 border-r border-white/5">Total Score</td>
            {data.map((col, i) => (
              <td key={i} className={`p-5 text-sm border-l border-white/10 ${col.totalScore >= 4 ? 'bg-rose-600 animate-pulse' : ''}`}>
                {col.totalScore}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const AcuteTracker: React.FC = () => {
  const { history, addAcuteLog, updateHistory } = useMedicalHistory();
  const { childProfile } = useChildProfile();
  const { role } = useRole();
  
  const [type, setType] = useState<AcuteLogEntry['type']>('Fluid');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMed, setSelectedMed] = useState<'Paracetamol' | 'Ibuprofen'>('Paracetamol');

  const [obs, setObs] = useState({
    rr: '', effort: 'Normal', o2: '', hr: '', bp: '', crt: 'Normal', temp: '', avpu: 'A'
  });

  const deleteEntry = (id: string) => {
    if (confirm("Void this entry?")) {
      updateHistory({
        acuteLogs: history.acuteLogs?.filter(log => log.id !== id)
      });
    }
  };

  const balanceStats = useMemo(() => {
    const logs = history.acuteLogs || [];
    const input = logs.filter(l => l.type === 'Fluid').reduce((sum, l) => sum + (parseInt(l.value) || 0), 0);
    const output = logs.filter(l => l.type === 'Output' || l.type === 'Vomit').reduce((sum, l) => sum + (parseInt(l.value) || 0), 0);
    return { input, output, balance: input - output };
  }, [history.acuteLogs]);

  const balanceTrend = useMemo(() => {
    const logs = [...(history.acuteLogs || [])].reverse();
    let cumulative = 0;
    return logs.map(l => {
      if (l.type === 'Fluid') cumulative += (parseInt(l.value) || 0);
      if (l.type === 'Output' || l.type === 'Vomit') cumulative -= (parseInt(l.value) || 0);
      return {
        time: formatLogTime(l.timestamp),
        in: l.type === 'Fluid' ? parseInt(l.value) : 0,
        out: (l.type === 'Output' || l.type === 'Vomit') ? parseInt(l.value) : 0,
        balance: cumulative
      };
    });
  }, [history.acuteLogs]);

  const cewtData = useMemo(() => {
    const logs = history.acuteLogs || [];
    const birth = childProfile?.dob ? new Date(childProfile.dob) : new Date();
    const ageMonths = Math.floor((new Date().getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const ageGroup = getAgeGroup(ageMonths);
    
    return logs
      .filter(l => l.type === 'Vitals' || (l.type === 'Temperature' && !isNaN(parseFloat(l.value))))
      .map(l => {
        let v: any = { timestamp: l.timestamp };
        if (l.type === 'Vitals') {
          const hrM = l.value.match(/HR:\s*(\d+)/);
          const rrM = l.value.match(/RR:\s*(\d+)/);
          const o2M = l.value.match(/O2:\s*(\d+)/);
          const tM = l.value.match(/T:\s*([\d.]+)/);
          const bpM = l.value.match(/BP:\s*([\d/]+)/);
          const crtM = l.value.match(/CRT:\s*([\w><-]+)/);
          const cnsM = l.value.match(/CNS:\s*(\w+)/);
          const efM = l.value.match(/Effort:\s*(\w+)/);
          
          v.hr = hrM ? hrM[1] : '';
          v.rr = rrM ? rrM[1] : '';
          v.o2 = o2M ? o2M[1] : '';
          v.temp = tM ? tM[1] : '';
          v.bp = bpM ? bpM[1] : '';
          v.crt = crtM ? crtM[1] : 'Normal';
          v.avpu = cnsM ? cnsM[1] : 'A';
          v.effort = efM ? efM[1] : 'Normal';
        } else {
          v.temp = l.value.split(' ')[0];
          v.avpu = 'A'; v.effort = 'Normal'; v.crt = 'Normal';
        }
        return calculateCEWT(v, ageGroup);
      })
      .reverse();
  }, [history.acuteLogs, childProfile]);

  const lastCewt = cewtData[cewtData.length - 1];

  const handleAdd = () => {
    if (!value && type !== 'Vitals') return;
    
    if (type === 'Vitals') {
      const vStr = `HR: ${obs.hr}, RR: ${obs.rr}, Effort: ${obs.effort}, O2: ${obs.o2}%, T: ${obs.temp}C, BP: ${obs.bp || '--'}, CRT: ${obs.crt}, CNS: ${obs.avpu}`;
      addAcuteLog({
        timestamp: new Date().toISOString(),
        type: 'Vitals',
        value: vStr,
        notes: notes.trim(),
        clinicianLogged: role === 'clinician'
      });
      setObs({ rr: '', effort: 'Normal', o2: '', hr: '', bp: '', crt: 'Normal', temp: '', avpu: 'A' });
    } else {
      addAcuteLog({
        timestamp: new Date().toISOString(),
        type,
        value: type === 'Temperature' ? `${value} degree Celsius` : `${value} ${units[type] || ''}`,
        notes: notes.trim(),
        medicationName: type === 'Medication' ? selectedMed : undefined,
        clinicianLogged: role === 'clinician'
      });
    }
    setValue('');
    setNotes('');
  };

  const inputBaseClass = "w-full p-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-900 outline-none focus:border-indigo-600 transition-all placeholder:text-slate-200 text-sm shadow-sm";
  const labelBaseClass = "text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block";

  return (
    <div className="space-y-10 pb-24 animate-in fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic leading-none">Acute <span className="text-rose-600">Surveillance</span></h2>
          <p className="text-slate-500 font-bold italic mt-2">{role === 'clinician' ? 'Clinical Registry & CEWT Dashboard' : 'Track recovery and comfort.'}</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Net Balance</span>
                <span className={`font-black text-lg ${balanceStats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {balanceStats.balance > 0 ? '+' : ''}{balanceStats.balance} ml
                </span>
            </div>
            {role === 'clinician' && lastCewt && (
              <div className={`px-6 py-3 rounded-2xl text-white font-black text-lg flex items-center gap-2 shadow-xl transition-all ${lastCewt.totalScore >= 4 ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'}`}>
                CEWT: {lastCewt.totalScore}
              </div>
            )}
        </div>
      </header>

      {role === 'clinician' && (
        <section className="space-y-10 animate-in slide-in-from-top-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Professional Observation Chart (EMR)</h3>
              {lastCewt && (
                <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${lastCewt.totalScore >= 4 ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                   Status: {lastCewt.totalScore >= 4 ? '🚨 MET Call Threshold' : '⚠️ Clinical Review Required'}
                </div>
              )}
           </div>
           <CEWTEscalationChart data={cewtData} />
           <CEWTGrid data={cewtData} />
           <FluidBalanceChart data={balanceTrend} />
        </section>
      )}

      <div className={`grid grid-cols-1 gap-10 ${role === 'clinician' ? 'lg:grid-cols-12' : ''}`}>
        <div className={role === 'clinician' ? 'lg:col-span-5' : 'max-w-xl mx-auto w-full'}>
          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 sticky top-8">
            <div className="flex bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
               {['Fluid', 'Temperature', 'Output', 'Medication', 'Vitals'].filter(t => role === 'clinician' || t !== 'Vitals').map((t) => (
                  <button 
                    key={t} 
                    onClick={() => setType(t as any)} 
                    className={`flex-1 py-5 px-2 rounded-2xl text-3xl transition-all min-w-[75px] ${type === t ? 'bg-white shadow-lg text-indigo-600 scale-105 z-10' : 'opacity-30 grayscale hover:opacity-100'}`}
                  >
                    <span className="block">{(icons as any)[t]}</span>
                    <span className="text-[8px] font-black uppercase mt-2 block tracking-tight">{t}</span>
                  </button>
               ))}
            </div>
            
            <div className="space-y-8">
               {type === 'Vitals' ? (
                 <div className="space-y-6 animate-in slide-in-from-left-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className={labelBaseClass}>RR (bpm)</label>
                            <input value={obs.rr} onChange={e => setObs({...obs, rr: e.target.value})} placeholder="e.g. 24" className={inputBaseClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelBaseClass}>Effort</label>
                            <select value={obs.effort} onChange={e => setObs({...obs, effort: e.target.value})} className={inputBaseClass}>
                                <option>Normal</option>
                                <option>Mild</option>
                                <option>Moderate</option>
                                <option>Severe</option>
                                <option>Exhausted</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={labelBaseClass}>SpO2 (%)</label>
                            <input value={obs.o2} onChange={e => setObs({...obs, o2: e.target.value})} placeholder="98" className={inputBaseClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelBaseClass}>HR (bpm)</label>
                            <input value={obs.hr} onChange={e => setObs({...obs, hr: e.target.value})} placeholder="110" className={inputBaseClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelBaseClass}>BP (S/D)</label>
                            <input value={obs.bp} onChange={e => setObs({...obs, bp: e.target.value})} placeholder="95/60" className={inputBaseClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelBaseClass}>CRT (sec)</label>
                            <select value={obs.crt} onChange={e => setObs({...obs, crt: e.target.value})} className={inputBaseClass}>
                                <option>Normal</option>
                                <option>Sluggish</option>
                                <option>Slow</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className={labelBaseClass}>Temp (C)</label>
                            <input value={obs.temp} onChange={e => setObs({...obs, temp: e.target.value})} placeholder="37.0" className={inputBaseClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelBaseClass}>CNS (AVPU)</label>
                            <div className="flex gap-1.5">
                               {['A', 'V', 'P', 'U'].map(v => (
                                 <button key={v} onClick={() => setObs({...obs, avpu: v})} className={`flex-1 py-3.5 rounded-xl font-black text-xs transition-all border-2 ${obs.avpu === v ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                   {v}
                                 </button>
                               ))}
                            </div>
                        </div>
                    </div>
                 </div>
               ) : (
                  <div className="space-y-2">
                    <label className={labelBaseClass}>{type} Entry ({units[type] || 'Value'})</label>
                    <input value={value} onChange={e => setValue(e.target.value)} placeholder="..." className={inputBaseClass + " text-2xl py-6"} />
                  </div>
               )}

               <div className="space-y-2">
                  <label className={labelBaseClass}>Notes / Observations</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How is your child feeling?" className={inputBaseClass + " h-28 resize-none italic font-bold text-base leading-relaxed"} />
               </div>
               
               <button onClick={handleAdd} className="w-full py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl text-xs uppercase tracking-[0.2em] active:scale-95 transition-all hover:bg-indigo-700">
                 {type === 'Vitals' ? 'Commit Observation Bundle' : 'Record Entry'}
               </button>
            </div>
          </div>
        </div>

        <div className={role === 'clinician' ? 'lg:col-span-7 space-y-10' : 'max-w-xl mx-auto w-full space-y-10'}>
          {role === 'parent' && balanceTrend.length > 0 && (
            <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
               <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                     <span className="text-3xl">💧</span>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Hydration Balance</p>
                        <p className="text-2xl font-black italic">{balanceStats.balance} ml</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black uppercase opacity-60">Status</p>
                     <p className={`text-xs font-black uppercase ${balanceStats.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {balanceStats.balance < 0 ? 'Monitoring' : 'Well Hydrated'}
                     </p>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic ml-4 leading-none">Recovery Timeline</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                 {history.acuteLogs?.length ? history.acuteLogs.filter(e => role === 'clinician' || e.type !== 'Vitals').map(entry => (
                    <div key={entry.id} className={`p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group ${entry.clinicianLogged ? 'bg-slate-900 text-white border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}>
                       <div className="flex items-center gap-8">
                          <span className={`text-[10px] font-black w-14 shrink-0 uppercase ${entry.clinicianLogged ? 'text-indigo-400' : 'text-slate-400'}`}>{formatLogTime(entry.timestamp)}</span>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${entry.clinicianLogged ? 'bg-white/10' : 'bg-slate-50'}`}>{(icons as any)[entry.type]}</div>
                          <div className="max-w-[200px] sm:max-w-md">
                             <p className="text-base font-black leading-tight tracking-tight italic">{entry.value}</p>
                             {entry.notes && <p className={`text-[11px] font-bold italic mt-3 leading-relaxed ${entry.clinicianLogged ? 'text-slate-400 border-l-2 border-white/10 pl-4' : 'text-slate-500 border-l-2 border-slate-100 pl-4'}`}>{entry.notes}</p>}
                          </div>
                       </div>
                       <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-4 font-black text-sm transition-all hover:scale-125">✕</button>
                    </div>
                 )) : (
                    <div className="py-24 text-center text-slate-200 font-black uppercase text-xs italic">No entries on record.</div>
                 )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
