
import React, { useState, useEffect, useMemo } from 'react';
import { AcuteLogEntry } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { SearchFilterBar } from './SearchFilterBar';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

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
  Medication: 'amount, e.g. 7.5 mL'
};

// Values outside these ranges are almost certainly typing errors (or Fahrenheit).
const VALID_RANGES: Record<string, { min: number; max: number; message: string }> = {
  Temperature: { min: 34, max: 43, message: 'Please enter a temperature in degrees Celsius between 34 and 43.' },
  Fluid: { min: 1, max: 3000, message: 'Please enter an amount in mL between 1 and 3000.' },
  Output: { min: 1, max: 3000, message: 'Please enter an amount in mL between 1 and 3000.' },
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
  const [selectedMed, setSelectedMed] = useState<'Paracetamol' | 'Ibuprofen' | 'Other'>('Paracetamol');
  const [otherMedName, setOtherMedName] = useState('');
  const { showToast } = useToast();
  const confirm = useConfirm();

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

  const deleteEntry = async (id: string) => {
    if (await confirm({ title: 'Delete this entry?', message: 'It will be removed from the log.', confirmLabel: 'Delete', danger: true })) {
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
    if (!value.trim()) return;
    const range = VALID_RANGES[type];
    if (range) {
      const n = Number(value.trim().replace(',', '.'));
      if (!Number.isFinite(n) || n < range.min || n > range.max) {
        showToast(range.message, 'error');
        return;
      }
    }

    addAcuteLog({
      timestamp: new Date().toISOString(),
      type,
      value: type === 'Temperature' ? `${value.trim()} degree Celsius` : type === 'Medication' ? value.trim() : `${value.trim()} ${units[type] || ''}`.trim(),
      notes: notes.trim(),
      medicationName: type === 'Medication' ? (selectedMed === 'Other' ? otherMedName.trim() || 'Other medicine' : selectedMed) : undefined
    });
    setValue('');
    setNotes('');
  };

  const inputBaseClass = "w-full p-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-900 outline-hidden focus:border-indigo-600 transition-all placeholder:text-slate-200 text-sm shadow-xs";
  const labelBaseClass = "text-xs font-black text-slate-600 uppercase tracking-widest ml-2 mb-1 block";

  return (
    <div className="space-y-10 pb-24 animate-in fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Acute <span className="text-rose-700">Surveillance</span></h2>
          <p className="text-slate-500 font-bold mt-2">Track recovery and comfort.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xs">
                <span className="text-indigo-600 font-black text-xs uppercase tracking-widest">Net Balance</span>
                <span className={`font-black text-lg ${balanceStats.balance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
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
                    onClick={() => setType(t as any)} aria-pressed={type === t}
                    className={`flex-1 py-5 px-2 rounded-2xl text-3xl transition-all min-w-[75px] ${type === t ? 'bg-white shadow-lg text-indigo-700 scale-105 z-10' : 'text-slate-700 hover:bg-white/60'}`}
                  >
                    <span className="block">{(icons as any)[t]}</span>
                    <span className="text-xs font-black uppercase mt-2 block tracking-tight">{t}</span>
                  </button>
               ))}
            </div>
            
            <div className="space-y-8">
               {type === 'Medication' && (
                 <div className="space-y-2">
                   <label className={labelBaseClass} htmlFor="acute-med">Medicine</label>
                   <select id="acute-med" value={selectedMed} onChange={e => setSelectedMed(e.target.value as typeof selectedMed)} className={inputBaseClass}>
                     <option>Paracetamol</option>
                     <option>Ibuprofen</option>
                     <option>Other</option>
                   </select>
                   {selectedMed === 'Other' && (
                     <input aria-label="Medicine name" value={otherMedName} onChange={e => setOtherMedName(e.target.value)} placeholder="Medicine name" className={inputBaseClass} />
                   )}
                 </div>
               )}
               <div className="space-y-2">
                 <label className={labelBaseClass}>{type} Entry ({units[type] || 'Value'})</label>
                 <input value={value} onChange={e => setValue(e.target.value)} placeholder="..." className={inputBaseClass + " text-2xl py-6"} />
               </div>

               <div className="space-y-2">
                  <label className={labelBaseClass}>Notes / Observations</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How is your child feeling?" className={inputBaseClass + " h-28 resize-none  font-bold text-base leading-relaxed"} />
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
                        <p className="text-xs font-black uppercase tracking-widest">Hydration Balance</p>
                        <p className="text-2xl font-black">{balanceStats.balance} ml</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-black uppercase">Status</p>
                     <p className={`text-xs font-black uppercase ${balanceStats.balance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {balanceStats.balance < 0 ? 'Monitoring' : 'Well Hydrated'}
                     </p>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xs space-y-8">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter ml-4 leading-none">Recovery Timeline</h3>

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
                    <div key={entry.id} className={`p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group bg-white border-slate-100 shadow-xs`}>
                       <div className="flex items-center gap-8">
                          <span className={`text-xs font-black w-14 shrink-0 uppercase text-slate-600`}>{formatLogTime(entry.timestamp)}</span>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-slate-50`}>{(icons as any)[entry.type]}</div>
                          <div className="max-w-[200px] sm:max-w-md">
                             <p className="text-base font-black leading-tight tracking-tight">{entry.value}</p>
                             {entry.notes && <p className={`text-xs font-bold  mt-3 leading-relaxed text-slate-500 border-l-2 border-slate-100 pl-4`}>{entry.notes}</p>}
                          </div>
                       </div>
                       <button aria-label="Delete entry" onClick={() => deleteEntry(entry.id)} className="sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 text-rose-700 p-4 font-black text-sm transition-all hover:scale-125">✕</button>
                    </div>
                 )) : (
                    <div className="py-24 text-center text-slate-500 font-black uppercase text-xs">
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
