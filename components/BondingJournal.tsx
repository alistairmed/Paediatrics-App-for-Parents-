
import React, { useState, useCallback } from 'react';
import { useChildProfile } from '../context/ChildProfileContext';
import { useMedicalHistory } from '../context/MedicalHistoryContext';

const ATTACHMENT_PROMPTS = [
  { category: "Delight", prompt: "Describe a moment today where you felt pure delight in watching your child just 'be' themselves." },
  { category: "Need", prompt: "When your child was upset today, how did they signal they needed you? How did you respond?" },
  { category: "Exploration", prompt: "How did your child use you as a 'safe base' while exploring a new toy or environment today?" },
  { category: "Reunion", prompt: "Describe the expression on your child's face when you first saw them after a period of separation." }
];

const OBSERVATION_CHECKLIST = [
  { id: 'sb', category: 'Safe Base', label: 'Explores freely but checks back with me frequently.', icon: '⚓' },
  { id: 'ps', category: 'Proximity', label: 'Moves toward me or reaches out when feeling unsure or tired.', icon: '🫂' },
  { id: 'cr', category: 'Co-regulation', label: 'Calms down relatively quickly when I hold or soothe them.', icon: '🌊' },
  { id: 'sr', category: 'Reunion', label: 'Greets me with joy or immediate seeking of comfort after being away.', icon: '✨' },
];

export const BondingJournal: React.FC = () => {
  const { childProfile } = useChildProfile();
  const { history, updateHistory } = useMedicalHistory();
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(new Set());

  const handleUpdate = useCallback((val: string) => {
    updateHistory({ bondingNotes: val });
  }, [updateHistory]);

  const observations = history.bondingNotes || '';

  const toggleObservation = (id: string) => {
    const next = new Set(selectedObservations);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedObservations(next);
    
    const obs = OBSERVATION_CHECKLIST.find(o => o.id === id);
    if (obs && !observations.includes(obs.label)) {
      handleUpdate(`${observations}\n\n[Observation: ${obs.category}] ${obs.label}`.trim());
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Bonding <span className="text-rose-600">& Attachment</span></h2>
          <p className="text-slate-500 font-medium max-w-2xl mt-2 italic">
            Documenting the "Invisible" work of connection. These insights help clinicians understand your child's social-emotional health.
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-100 px-6 py-3 rounded-2xl flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest leading-tight">Secure Base<br/>Monitoring</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Attachment Behaviors</h4>
            <div className="space-y-3">
              {OBSERVATION_CHECKLIST.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleObservation(item.id)}
                  className={`w-full p-5 rounded-2xl text-left border-2 transition-all flex items-start gap-4 group ${
                    selectedObservations.has(item.id)
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xl scale-[1.02]'
                      : 'bg-white border-slate-50 text-slate-500 hover:border-rose-100'
                  }`}
                >
                  <span className={`text-2xl transition-transform group-hover:scale-110 ${selectedObservations.has(item.id) ? 'rotate-12' : ''}`}>
                    {item.icon}
                  </span>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedObservations.has(item.id) ? 'text-rose-100' : 'text-rose-400'}`}>
                      {item.category}
                    </p>
                    <p className="text-xs font-bold leading-snug">{item.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <span>🧠</span> Clinical Context
            </h4>
            <p className="text-indigo-100 text-sm font-medium italic leading-relaxed">
              "Attachment is the 'biological insurance' child uses to survive and thrive. Noticing how they seek comfort (Proximity) and go out to play (Exploration) provides a blueprint of their development."
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-10 rounded-[4rem] border border-rose-100 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-rose-500 rounded-full opacity-5 blur-[100px] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-rose-100">✍️</div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 italic">Daily Reflection</h3>
                   <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Guide: {ATTACHMENT_PROMPTS[activePromptIdx].category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setActivePromptIdx(prev => (prev - 1 + ATTACHMENT_PROMPTS.length) % ATTACHMENT_PROMPTS.length)}
                  className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                 >
                   ←
                 </button>
                 <button 
                  onClick={() => setActivePromptIdx(prev => (prev + 1) % ATTACHMENT_PROMPTS.length)}
                  className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                 >
                   →
                 </button>
              </div>
            </div>

            <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 mb-8 relative z-10 animate-in fade-in zoom-in-95" key={activePromptIdx}>
               <p className="text-rose-900 font-bold italic text-lg leading-relaxed">
                 "{ATTACHMENT_PROMPTS[activePromptIdx].prompt}"
               </p>
            </div>

            <textarea 
              value={observations} 
              onChange={e => handleUpdate(e.target.value)} 
              className="w-full min-h-[400px] p-8 rounded-[3rem] border-2 border-slate-50 outline-none bg-slate-50/20 font-bold text-slate-700 text-xl leading-relaxed shadow-inner italic focus:ring-4 focus:ring-rose-100 focus:border-rose-100 transition-all z-10"
              placeholder={`Share your thoughts about ${childProfile?.name || 'your child'} here...`}
            />

            <div className="mt-8 flex items-center justify-between relative z-10 pt-4 border-t border-slate-50">
               <div className="flex items-center gap-2 text-rose-400">
                  <span className="text-xl">✨</span>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]">Synchronized to Clinical Hub</p>
               </div>
               <button 
                onClick={() => handleUpdate('')}
                className="text-[10px] font-black text-slate-300 uppercase hover:text-rose-500 transition-colors"
               >
                 Clear Journal
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
