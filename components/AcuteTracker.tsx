
import React, { useState, useEffect, useMemo } from 'react';
import { AcuteLogEntry } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { SearchFilterBar } from './SearchFilterBar';

const icons = { 
  Fluid: '🥤', 
  Temperature: '🌡️', 
  Output: '🚽', 
  Medication: '💊', 
  Vomit: '🤮', 
  Triage: '✨', 
  'Physical Exam': '👨‍⚕️' 
};

const units: Record<string, string> = {
  Fluid: 'ml',
  Temperature: '°C',
  Output: 'ml',
  Vomit: 'ml',
  Medication: 'mg/ml'
};

const formatLogTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoString;
  }
};

export const AcuteTracker: React.FC = () => {
  const { history, addAcuteLog, updateHistory } = useMedicalHistory();
  
  const [type, setType] = useState<AcuteLogEntry['type']>('Fluid');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMed, setSelectedMed] = useState<'Paracetamol' | 'Ibuprofen'>('Paracetamol');

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'All Types' },
    { value: 'Fluid', label: '🥤 Fluid' },
    { value: 'Temperature', label: '🌡️ Temperature' },
    { value: 'Output', label: '🚽 Output' },
    { value: 'Medication', label: '💊 Medication' }
  ], []);

  // Vitals entries were only logged by the removed clinician mode.
  const rawLogs = useMemo(() => (history.acuteLogs || []).filter(e => e.type !== 'Vitals'), [history.acuteLogs]);

  const filteredAcuteLogs = useMemo(() => {
    return rawLogs.filter(entry => {
      if (selectedCategory && selectedCategory !== 'all' && entry.type !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchValue = entry.value?.toLowerCase().includes(q);
        const matchNotes = entry.notes?.toLowerCase().includes(q);
        const matchMed = entry.medicationName?.toLowerCase().includes(q);
        const matchType = entry.type?.toLowerCase().includes(q);
        if (!matchValue && !matchNotes && !matchMed && !matchType) return false;
      }

      if (startDate || endDate) {
        const entryDate = new Date(entry.timestamp);
        if (!isNaN(entryDate.getTime())) {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (entryDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (entryDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [rawLogs, selectedCategory, searchQuery, startDate, endDate]);

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

  const handleAdd = () => {
    if (!value) return;

    addAcuteLog({
      timestamp: new Date().toISOString(),
      type,
      value: type === 'Temperature' ? `${value} degree Celsius` : `${value} ${units[type] || ''}`,
      notes: notes.trim(),
      medicationName: type === 'Medication' ? selectedMed : undefined
    });
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
          <p className="text-slate-500 font-bold italic mt-2">Track recovery and comfort.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Net Balance</span>
                <span className={`font-black text-lg ${balanceStats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {balanceStats.balance > 0 ? '+' : ''}{balanceStats.balance} ml
                </span>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 sticky top-8">
            <div className="flex bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
               {['Fluid', 'Temperature', 'Output', 'Medication'].map((t) => (
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
               <div className="space-y-2">
                 <label className={labelBaseClass}>{type} Entry ({units[type] || 'Value'})</label>
                 <input value={value} onChange={e => setValue(e.target.value)} placeholder="..." className={inputBaseClass + " text-2xl py-6"} />
               </div>

               <div className="space-y-2">
                  <label className={labelBaseClass}>Notes / Observations</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How is your child feeling?" className={inputBaseClass + " h-28 resize-none italic font-bold text-base leading-relaxed"} />
               </div>
               
               <button onClick={handleAdd} className="w-full py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl text-xs uppercase tracking-[0.2em] active:scale-95 transition-all hover:bg-indigo-700">
                 Record Entry
               </button>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full space-y-10">
          {balanceTrend.length > 0 && (
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

              <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                totalCount={rawLogs.length}
                filteredCount={filteredAcuteLogs.length}
                placeholder="Search logs by keyword, value, notes..."
                categories={categoryOptions}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                 {filteredAcuteLogs.length ? filteredAcuteLogs.map(entry => (
                    <div key={entry.id} className={`p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group bg-white border-slate-100 shadow-sm`}>
                       <div className="flex items-center gap-8">
                          <span className={`text-[10px] font-black w-14 shrink-0 uppercase text-slate-400`}>{formatLogTime(entry.timestamp)}</span>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-slate-50`}>{(icons as any)[entry.type]}</div>
                          <div className="max-w-[200px] sm:max-w-md">
                             <p className="text-base font-black leading-tight tracking-tight italic">{entry.value}</p>
                             {entry.notes && <p className={`text-[11px] font-bold italic mt-3 leading-relaxed text-slate-500 border-l-2 border-slate-100 pl-4`}>{entry.notes}</p>}
                          </div>
                       </div>
                       <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-4 font-black text-sm transition-all hover:scale-125">✕</button>
                    </div>
                 )) : (
                    <div className="py-24 text-center text-slate-300 font-black uppercase text-xs italic">
                      {rawLogs.length ? 'No acute log entries match your filter criteria.' : 'No entries on record.'}
                    </div>
                 )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
