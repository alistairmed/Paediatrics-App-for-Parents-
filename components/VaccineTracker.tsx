
import React, { useState, useEffect } from 'react';
import { Vaccination, ClinicalEvent } from '../types';
import { getVaccineAdvice } from '../services/gemini';

interface VaccineTrackerProps {
  onSaveEvent?: (event: Omit<ClinicalEvent, 'id'>) => void;
}

const INITIAL_SCHEDULE = (dob: Date): Vaccination[] => {
  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  return [
    { id: '1', name: 'HepB (1st dose)', ageMilestone: 0, dueDate: addMonths(dob, 0), status: 'pending', description: 'Hepatitis B' },
    { id: '2', name: 'RV, DTaP, Hib, PCV, IPV', ageMilestone: 2, dueDate: addMonths(dob, 2), status: 'pending', description: 'Rotavirus, Diphtheria, Tetanus, Pertussis, Polio' },
    { id: '3', name: 'RV, DTaP, Hib, PCV, IPV (2nd)', ageMilestone: 4, dueDate: addMonths(dob, 4), status: 'pending', description: 'Second round of boosters' },
    { id: '4', name: 'RV, DTaP, Hib, PCV, IPV (3rd)', ageMilestone: 6, dueDate: addMonths(dob, 6), status: 'pending', description: 'Third round of boosters' },
    { id: '5', name: 'MMR, Varicella, HepA', ageMilestone: 12, dueDate: addMonths(dob, 12), status: 'pending', description: 'Measles, Mumps, Rubella, Chickenpox' },
  ];
};

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({ onSaveEvent }) => {
  const [dob, setDob] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [schedule, setSchedule] = useState<Vaccination[]>([]);
  const [info, setInfo] = useState<{ name: string; text: string; sources: any[] } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (dob) {
      setSchedule(INITIAL_SCHEDULE(new Date(dob)));
    }
  }, [dob]);

  const toggleStatus = (id: string) => {
    setSchedule(prev => prev.map(v => 
      v.id === id ? { 
        ...v, 
        status: v.status === 'completed' ? 'pending' : 'completed',
        receivedDate: v.status === 'completed' ? undefined : new Date()
      } : v
    ));
    // If marking as completed, auto-expand details for easier additional entry
    const current = schedule.find(x => x.id === id);
    if (current && current.status !== 'completed') {
      setEditingId(id);
    }
  };

  const handleSyncToHistory = (vaccine: Vaccination) => {
    if (onSaveEvent) {
      onSaveEvent({
        source: 'Vaccines',
        description: `Immunisation Administered: ${vaccine.name}. Date: ${vaccine.receivedDate?.toLocaleDateString() || 'N/A'}. Side Effects: ${vaccine.sideEffects || 'None'}. Clinic: ${vaccine.clinic || 'N/A'}.`,
        date: new Date().toLocaleDateString(),
        severity: 'Low'
      });
      setSyncedIds(prev => new Set(prev).add(vaccine.id));
    }
  };

  const updateDetails = (id: string, field: keyof Vaccination, value: any) => {
    setSchedule(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const handleFetchInfo = async (name: string) => {
    setLoadingInfo(true);
    try {
      const advice = await getVaccineAdvice(name);
      setInfo({ name, text: advice.text, sources: advice.sources });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInfo(false);
    }
  };

  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Vaccination Record</h2>
          <p className="text-slate-500 font-medium">Log immunisations and track follow-up side effects.</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Child's Birthday</label>
          <input 
            type="date" 
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="text-slate-700 font-bold focus:outline-none bg-transparent"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {schedule.map((vaccine) => {
            const overdue = vaccine.status === 'pending' && isOverdue(vaccine.dueDate);
            const isEditing = editingId === vaccine.id;
            const isSynced = syncedIds.has(vaccine.id);
            
            return (
              <div 
                key={vaccine.id}
                className={`group rounded-[2.5rem] border-2 transition-all overflow-hidden ${
                  vaccine.status === 'completed' 
                    ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' 
                    : overdue 
                      ? 'bg-rose-50 border-rose-100'
                      : 'bg-white border-slate-100 hover:border-indigo-100'
                }`}
              >
                <div className="p-6 md:p-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={() => toggleStatus(vaccine.id)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                        vaccine.status === 'completed' 
                          ? 'bg-emerald-600 text-white border-emerald-500' 
                          : overdue 
                            ? 'bg-white border-2 border-rose-200 text-rose-500' 
                            : 'bg-white border-2 border-slate-100 text-slate-300'
                      }`}
                    >
                      {vaccine.status === 'completed' ? <span className="text-xl font-black">✓</span> : <span className="text-xl font-black">○</span>}
                    </button>
                    <div>
                      <h4 className={`text-lg font-black tracking-tight ${vaccine.status === 'completed' ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {vaccine.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Target: {vaccine.dueDate.toLocaleDateString()} ({vaccine.ageMilestone} mo)
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <button 
                          onClick={() => handleFetchInfo(vaccine.name)}
                          className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:underline"
                        >
                          Clinical Guidance
                        </button>
                        <button 
                          onClick={() => setEditingId(isEditing ? null : vaccine.id)}
                          className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-indigo-600"
                        >
                          {isEditing ? 'Hide Details' : 'Detailed Log'}
                        </button>
                        {vaccine.status === 'completed' && !isSynced && (
                           <button 
                            onClick={() => handleSyncToHistory(vaccine)}
                            className="text-[10px] text-emerald-600 font-black hover:underline uppercase tracking-[0.2em] animate-pulse"
                          >
                            Sync to Hub
                          </button>
                        )}
                        {isSynced && <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 uppercase tracking-widest">✨ Linked</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {overdue && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        Overdue
                      </span>
                    )}
                    {vaccine.status === 'completed' && (
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200">
                        Logged
                      </span>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="px-8 pb-8 pt-2 bg-white/50 border-t border-slate-50 animate-in slide-in-from-top-4 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date Administered</label>
                        <input 
                          type="date" 
                          value={vaccine.receivedDate ? new Date(vaccine.receivedDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateDetails(vaccine.id, 'receivedDate', new Date(e.target.value))}
                          className="w-full p-4 rounded-2xl border border-slate-100 bg-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Manufacturer / Lot</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Pfizer #AB1234"
                          value={vaccine.lotNumber || ''}
                          onChange={(e) => updateDetails(vaccine.id, 'lotNumber', e.target.value)}
                          className="w-full p-4 rounded-2xl border border-slate-100 bg-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Observed Side Effects</label>
                      <textarea 
                        placeholder="e.g. Mild fever, redness at site, fussy for 24h..."
                        value={vaccine.sideEffects || ''}
                        onChange={(e) => updateDetails(vaccine.id, 'sideEffects', e.target.value)}
                        className="w-full p-4 h-24 rounded-2xl border border-slate-100 bg-white font-medium italic outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Clinic / Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. City Health Center"
                        value={vaccine.clinic || ''}
                        onChange={(e) => updateDetails(vaccine.id, 'clinic', e.target.value)}
                        className="w-full p-4 rounded-2xl border border-slate-100 bg-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          {loadingInfo ? (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm sticky top-8 animate-pulse text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Consulting Frameworks...</p>
            </div>
          ) : info ? (
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl sticky top-8 animate-in slide-in-from-right-4 max-h-[80vh] overflow-y-auto border-l-[16px] border-l-indigo-600 relative">
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full opacity-5 blur-3xl pointer-events-none"></div>
              <button 
                onClick={() => setInfo(null)} 
                className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl"
              >
                ×
              </button>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight italic mb-6">{info.name}</h3>
              <div className="prose prose-slate prose-sm leading-relaxed whitespace-pre-wrap font-bold italic text-slate-600 border-l-4 border-slate-100 pl-6">
                {info.text}
              </div>
            </div>
          ) : (
            <div className="bg-indigo-900 p-10 rounded-[3.5rem] shadow-2xl sticky top-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
              <span className="text-4xl mb-6 block">🛡️</span>
              <p className="text-indigo-100 font-bold text-lg leading-relaxed italic mb-8">
                Detailed logging helps your GP or clinic track specific batches and reaction histories, ensuring safer immunisation pathways for your child.
              </p>
              <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-2">Pro-Tip</p>
                <p className="text-sm font-medium italic opacity-80">Syncing to the Medical Hub automatically includes these records in your next clinical ISBAR handover.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
