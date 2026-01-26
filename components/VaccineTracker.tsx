
import React, { useState, useEffect } from 'react';
import { Vaccination } from '../types';
import { getVaccineAdvice } from '../services/gemini';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';

/**
 * Australian National Immunisation Program (NIP) Schedule
 * Based on health.gov.au childhood requirements
 */
const NIP_SCHEDULE = (dob: Date): Vaccination[] => {
  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };
  
  const addYears = (date: Date, years: number) => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  return [
    { 
      id: 'nip-birth', 
      name: 'Hepatitis B (Birth)', 
      ageMilestone: 0, 
      dueDate: addMonths(dob, 0), 
      status: 'pending', 
      description: 'Hepatitis B: Protects against the Hep B virus which can cause serious liver damage. Administered within 24 hours of birth.' 
    },
    { 
      id: 'nip-2mo', 
      name: '2-Month Milestone', 
      ageMilestone: 2, 
      dueDate: addMonths(dob, 2), 
      status: 'pending', 
      description: 'Combined 6-in-1 (Diphtheria, Tetanus, Pertussis, Hep B, Polio, Hib), Pneumococcal (13vPCV), and Oral Rotavirus.' 
    },
    { 
      id: 'nip-4mo', 
      name: '4-Month Milestone', 
      ageMilestone: 4, 
      dueDate: addMonths(dob, 4), 
      status: 'pending', 
      description: 'Second dose of the 6-in-1, Pneumococcal, and Rotavirus vaccines to build immunity.' 
    },
    { 
      id: 'nip-6mo', 
      name: '6-Month Milestone', 
      ageMilestone: 6, 
      dueDate: addMonths(dob, 6), 
      status: 'pending', 
      description: 'Third dose of the 6-in-1 vaccine. Note: Rotavirus and Pneumococcal schedules may vary for high-risk groups.' 
    },
    { 
      id: 'nip-12mo', 
      name: '12-Month Milestone', 
      ageMilestone: 12, 
      dueDate: addMonths(dob, 12), 
      status: 'pending', 
      description: 'Measles, Mumps, Rubella (MMR); Meningococcal ACWY; and a Pneumococcal booster.' 
    },
    { 
      id: 'nip-18mo', 
      name: '18-Month Milestone', 
      ageMilestone: 18, 
      dueDate: addMonths(dob, 18), 
      status: 'pending', 
      description: 'MMRV (Measles, Mumps, Rubella, Chickenpox); DTPa booster; and Haemophilus influenzae type b (Hib) booster.' 
    },
    { 
      id: 'nip-4yr', 
      name: '4-Year Milestone', 
      ageMilestone: 48, 
      dueDate: addYears(dob, 4), 
      status: 'pending', 
      description: 'Pre-school boosters for Diphtheria, Tetanus, Pertussis, and Polio (DTPa-IPV).' 
    },
  ];
};

export const VaccineTracker: React.FC = () => {
  const { history, updateHistory, addClinicalEvent } = useMedicalHistory();
  const { childProfile } = useChildProfile();
  
  const [info, setInfo] = useState<{ name: string; text: string; sources: any[] } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customVax, setCustomVax] = useState<Partial<Vaccination>>({ name: '', dueDate: new Date() });

  useEffect(() => {
    if (childProfile?.dob && (!history.vaccinations || history.vaccinations.length === 0)) {
      updateHistory({ vaccinations: NIP_SCHEDULE(new Date(childProfile.dob)) });
    }
  }, [childProfile?.dob]);

  const schedule = history.vaccinations || [];

  const toggleStatus = (id: string) => {
    const next = schedule.map(v => 
      v.id === id ? { 
        ...v, 
        status: (v.status === 'completed' ? 'pending' : 'completed') as any,
        receivedDate: v.status === 'completed' ? undefined : new Date()
      } : v
    );
    updateHistory({ vaccinations: next });
    
    const targetVax = next.find(x => x.id === id);
    if (targetVax?.status === 'completed') {
      setEditingId(id);
    }
  };

  const handleSyncToHistory = (vaccine: Vaccination) => {
    addClinicalEvent({
      source: 'Vaccines',
      description: `Immunisation Recorded: ${vaccine.name}. Batch: ${vaccine.lotNumber || 'N/A'}. Provider: ${vaccine.clinic || 'N/A'}.`,
      date: new Date().toLocaleDateString(),
      severity: 'Low'
    });
    setSyncedIds(prev => new Set(prev).add(vaccine.id));
    alert(`${vaccine.name} synced to the medical timeline.`);
  };

  const updateDetails = (id: string, field: keyof Vaccination, value: any) => {
    const next = schedule.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    );
    updateHistory({ vaccinations: next });
  };

  const handleAddCustom = () => {
    if (!customVax.name) return;
    const newV: Vaccination = {
      id: crypto.randomUUID(),
      name: customVax.name,
      dueDate: customVax.dueDate || new Date(),
      status: 'pending',
      description: 'Non-routine or additional vaccination (e.g. Influenza, Travel).',
      ageMilestone: 99
    };
    updateHistory({ vaccinations: [...schedule, newV] });
    setCustomVax({ name: '', dueDate: new Date() });
    setShowAddCustom(false);
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
    return new Date() > new Date(dueDate);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Immunisation <span className="text-indigo-600">Sync</span></h2>
          <p className="text-slate-500 font-medium italic">Australian National Immunisation Program (NIP) tracker.</p>
        </div>
        <button 
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="bg-white border-2 border-indigo-100 text-indigo-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm"
        >
          {showAddCustom ? 'Cancel' : '+ Record Other Vaccine'}
        </button>
      </header>

      {showAddCustom && (
        <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 animate-in zoom-in-95 space-y-6">
           <h3 className="text-lg font-black text-indigo-900 italic">Add Custom / Annual Vaccine</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                placeholder="Vaccine Name (e.g. Flu, Meningococcal B)" 
                value={customVax.name}
                onChange={e => setCustomVax({...customVax, name: e.target.value})}
                className="p-4 rounded-2xl bg-white border border-indigo-200 font-black text-slate-900 outline-none"
              />
              <input 
                type="date"
                value={customVax.dueDate ? new Date(customVax.dueDate).toISOString().split('T')[0] : ''}
                onChange={e => setCustomVax({...customVax, dueDate: new Date(e.target.value)})}
                className="p-4 rounded-2xl bg-white border border-indigo-200 font-black text-slate-900 outline-none uppercase"
              />
           </div>
           <button onClick={handleAddCustom} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Add to Record</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {schedule.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((vaccine) => {
            const overdue = vaccine.status === 'pending' && isOverdue(vaccine.dueDate);
            const isEditing = editingId === vaccine.id;
            const isSynced = syncedIds.has(vaccine.id);
            
            return (
              <div 
                key={vaccine.id}
                className={`group rounded-[3rem] border-2 transition-all overflow-hidden ${
                  vaccine.status === 'completed' 
                    ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' 
                    : overdue 
                      ? 'bg-rose-50 border-rose-200 shadow-lg scale-[1.02]'
                      : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm'
                }`}
              >
                <div className="p-8 flex items-start gap-6">
                  {/* Tick Box UI */}
                  <div className="relative shrink-0 mt-1">
                    <input 
                      type="checkbox"
                      checked={vaccine.status === 'completed'}
                      onChange={() => toggleStatus(vaccine.id)}
                      className="w-14 h-14 rounded-[1.5rem] border-4 border-slate-100 text-emerald-600 focus:ring-emerald-500 cursor-pointer appearance-none checked:bg-emerald-600 checked:border-emerald-600 transition-all shadow-md active:scale-90"
                    />
                    {vaccine.status === 'completed' && (
                      <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none text-3xl font-black">✓</span>
                    )}
                    {vaccine.status !== 'completed' && overdue && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 rounded-full animate-pulse border-4 border-white shadow-lg"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h4 className={`text-2xl font-black tracking-tight leading-none ${vaccine.status === 'completed' ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {vaccine.name}
                        </h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${overdue ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                          {vaccine.status === 'completed' ? 'Received' : overdue ? 'OVERDUE' : 'Due Soon'}
                        </span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                        {vaccine.status === 'completed' 
                          ? <span>📅 Administered: {vaccine.receivedDate ? new Date(vaccine.receivedDate).toLocaleDateString() : '--'}</span> 
                          : <span>🎯 Milestone Date: {new Date(vaccine.dueDate).toLocaleDateString()}</span>
                        }
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                       <p className="text-xs font-bold text-slate-500 italic leading-relaxed">
                          {vaccine.description}
                       </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <button 
                        onClick={() => handleFetchInfo(vaccine.name)}
                        className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <span>🧠</span> Deep Dive (AI)
                      </button>
                      <button 
                        onClick={() => setEditingId(isEditing ? null : vaccine.id)}
                        className={`text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'text-rose-500' : 'text-slate-400 hover:text-indigo-600'}`}
                      >
                        {isEditing ? 'Close Logistics' : 'Input Details 📝'}
                      </button>
                      {vaccine.status === 'completed' && !isSynced && (
                         <button 
                          onClick={() => handleSyncToHistory(vaccine)}
                          className="text-[10px] text-emerald-600 font-black hover:underline uppercase tracking-widest animate-bounce"
                        >
                          Sync to Hub
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-10 pb-10 pt-4 bg-white/60 border-t border-slate-100 animate-in slide-in-from-top-4 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Date Administered</label>
                        <input 
                          type="date" 
                          value={vaccine.receivedDate ? new Date(vaccine.receivedDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateDetails(vaccine.id, 'receivedDate', new Date(e.target.value))}
                          className="w-full p-5 rounded-2xl border-2 border-slate-50 bg-white font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-inner uppercase text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Clinic / Pharmacy</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Melbourne Children's GP"
                          value={vaccine.clinic || ''}
                          onChange={(e) => updateDetails(vaccine.id, 'clinic', e.target.value)}
                          className="w-full p-5 rounded-2xl border-2 border-slate-50 bg-white font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Manufacturer / Brand</label>
                        <input 
                          type="text" 
                          placeholder="e.g. GSK (Infanrix Hexa)"
                          value={vaccine.manufacturer || ''}
                          onChange={(e) => updateDetails(vaccine.id, 'manufacturer', e.target.value)}
                          className="w-full p-5 rounded-2xl border-2 border-slate-50 bg-white font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Batch / Lot Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lot #99X21"
                          value={vaccine.lotNumber || ''}
                          onChange={(e) => updateDetails(vaccine.id, 'lotNumber', e.target.value)}
                          className="w-full p-5 rounded-2xl border-2 border-slate-50 bg-white font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Reactions or Side Effects</label>
                       <textarea 
                        placeholder="Fever, localized redness, irritability..."
                        value={vaccine.sideEffects || ''}
                        onChange={(e) => updateDetails(vaccine.id, 'sideEffects', e.target.value)}
                        className="w-full h-32 p-6 rounded-3xl border-2 border-slate-50 bg-white font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-inner resize-none italic text-base"
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
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm sticky top-8 animate-pulse text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-4xl">🔬</div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Analyzing National Guidelines...</p>
            </div>
          ) : info ? (
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl sticky top-8 animate-in slide-in-from-right-4 max-h-[85vh] overflow-y-auto border-l-[20px] border-l-indigo-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full opacity-5 blur-[100px]"></div>
              <button onClick={() => setInfo(null)} className="absolute top-8 right-8 text-slate-300 font-black text-2xl hover:text-rose-500 transition-colors">×</button>
              <h3 className="text-3xl font-black text-slate-800 italic mb-8 leading-tight">{info.name}</h3>
              <div className="prose prose-slate prose-sm leading-relaxed whitespace-pre-wrap font-bold italic text-slate-600 border-l-4 border-slate-50 pl-8 mb-8">
                {info.text}
              </div>
              
              {/* Fix: Display mandatory grounding sources when Google Search is used */}
              {info.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-50 space-y-4 relative z-10">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Grounding Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {info.sources.map((s: any, i: number) => (
                      <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 transition-all">
                        {s.web?.title || 'Health Resource'} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-indigo-900 p-12 rounded-[4rem] shadow-2xl sticky top-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="relative z-10">
                <span className="text-6xl mb-8 block">🛡️</span>
                <h4 className="text-2xl font-black italic mb-6">Why Batch Tracking?</h4>
                <p className="text-indigo-100 font-bold text-lg leading-relaxed italic">
                  Digital record keeping of lot numbers and clinic providers is critical. It enables rapid clinical action if a vaccine batch is recalled or if your child experiences an adverse reaction.
                </p>
                <div className="mt-12 pt-10 border-t border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Standard Source</p>
                   <p className="text-sm font-medium italic opacity-80 mt-2">Aligned with health.gov.au Australian Childhood Schedule.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
