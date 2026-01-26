
import React, { useState, useRef, useMemo } from 'react';
import { analyzeSymptoms } from '../services/gemini';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useConnectivity } from '../hooks/useConnectivity';
import { useGovernance } from '../context/GovernanceContext';
import { useEnvironment } from '../context/EnvironmentContext';
import { useRole } from '../context/RoleContext';
import { evaluateRedFlags } from '../clinical/redFlags';

const RED_FLAGS_LIST = [
  { text: "Difficulty Breathing", sub: "Grunting, wheezing, or chest sucking in", icon: "🫁" },
  { text: "Infant Fever", sub: "Any fever in a baby under 3 months old", icon: "🌡️" },
  { text: "Altered Level of Consciousness", sub: "Unusually sleepy, floppy, or unresponsive", icon: "😴" },
  { text: "Non-Blanching Rash", sub: "Purple/red spots that don't fade when pressed", icon: "🟣" },
  { text: "Severe Pain", sub: "Inconsolable crying or extreme localized pain", icon: "😫" },
  { text: "Eye Injury/Swelling", sub: "Chemical splash, trauma, or sudden swelling", icon: "👁️" }
];

export const SymptomChecker: React.FC = () => {
  const { addAcuteLog } = useMedicalHistory();
  const { childProfile } = useChildProfile();
  const { addEntry } = useGovernance();
  const { mode } = useEnvironment();
  const { role } = useRole();
  const isOnline = useConnectivity();
  
  const [description, setDescription] = useState('');
  const [temp, setTemp] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: any[] } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ageMonths = useMemo(() => {
    if (!childProfile?.dob) return undefined;
    const birth = new Date(childProfile.dob);
    const now = new Date();
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months--;
    return months;
  }, [childProfile]);

  const activeRedFlags = useMemo(() => {
    const input = {
      ageMonths,
      temperature: temp ? parseFloat(temp) : undefined,
      symptoms: [description],
      durationDays: duration ? parseInt(duration) : undefined,
      environment: mode
    };
    // Unified engine now handles IMCI danger signs internally based on mode
    return evaluateRedFlags(input);
  }, [ageMonths, temp, description, duration, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim() && !image) return;
    if (!isOnline) {
      alert("Offline Mode: AI Triage requires an internet connection for detailed synthesis.");
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const res = await analyzeSymptoms(
        description || "Visual symptom provided in image", 
        image || undefined, 
        activeRedFlags.map(rf => rf.message)
      );
      setResult(res);
      addEntry({
        eventType: "symptom_evaluation",
        userRole: role,
        environment: mode,
        online: isOnline,
        inputSummary: `Desc: ${description.slice(0, 50)}... Temp: ${temp || 'N/A'}`,
        outputSummary: `AI triage completed.`,
        redFlags: activeRedFlags.map(rf => rf.id),
        disclaimerShown: true
      });
    } catch (error) {
      console.error(error);
      alert("Error reviewing symptoms.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLogs = () => {
    if (result) {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      addAcuteLog({
        timestamp,
        type: 'Triage',
        value: activeRedFlags.length > 0 ? 'Urgent Review Indicated' : 'Standard Home Care',
        notes: `SYMPTOMS: ${description}\n\nAI SYNTHESIS:\n${result.text}`,
        media: image || undefined
      });
      setSaved(true);
      alert("Triage result successfully synced to Medical Hub logs.");
    }
  };

  const triageLevel = useMemo(() => {
    if (activeRedFlags.some(f => f.severity === 'Urgent')) return { color: 'bg-rose-600', text: 'Emergency Action', width: 'w-full', icon: '🚨' };
    if (activeRedFlags.length > 0) return { color: 'bg-amber-500', text: 'Clinical Review Needed', width: 'w-2/3', icon: '⚠️' };
    return { color: 'bg-emerald-500', text: 'Supportive Care / Home', width: 'w-1/3', icon: '✅' };
  }, [activeRedFlags]);

  const inputClass = "w-full p-5 rounded-2xl border-2 border-slate-300 bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-slate-900 shadow-sm transition-all placeholder:text-slate-500";
  const labelClass = "text-[11px] font-black text-slate-700 uppercase tracking-widest ml-2 mb-1 block";

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic">Symptom <span className="text-indigo-600">AI Triage</span></h2>
          <p className="text-slate-600 font-bold italic">Capture signs and receive guideline-based analysis.</p>
        </div>
        <div className="flex gap-2">
          {!isOnline && (
            <div className="bg-amber-100 text-amber-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border-2 border-amber-300 shadow-sm">
              <span>📡</span> Low-Resource Mode Active
            </div>
          )}
        </div>
      </header>

      {activeRedFlags.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
          {activeRedFlags.map(flag => (
            <div key={flag.id} className={`p-8 rounded-[3rem] border-4 shadow-2xl flex items-start gap-8 transition-all ${flag.severity === 'Urgent' ? 'bg-rose-50 border-rose-600' : 'bg-amber-50 border-amber-500'}`}>
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner shrink-0 ${flag.severity === 'Urgent' ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-white'}`}>
                {flag.severity === 'Urgent' ? '🚨' : '⚠️'}
              </div>
              <div className="space-y-2">
                <h4 className={`text-3xl font-black italic tracking-tight ${flag.severity === 'Urgent' ? 'text-rose-950' : 'text-amber-950'}`}>
                  {flag.message}
                </h4>
                <p className={`text-base font-bold leading-relaxed ${flag.severity === 'Urgent' ? 'text-rose-900/80' : 'text-amber-900/80'}`}>
                  {flag.subtext}
                </p>
                <div className="pt-4">
                  <a href="tel:000" className={`inline-flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 ${flag.severity === 'Urgent' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                    📞 Call 000 / Emergency
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-xl space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-1">
                 <label className={labelClass}>Temperature (°C)</label>
                 <input 
                   type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} placeholder="37.0"
                   className={inputClass}
                 />
               </div>
               <div className="space-y-1">
                 <label className={labelClass}>Duration (Days)</label>
                 <input 
                   type="number" min="0" value={duration} onChange={e => setDuration(e.target.value)} placeholder="0"
                   className={inputClass}
                 />
               </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Patient Symptoms / Report</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Barking cough, lethargy, persistent vomiting, unable to drink..."
                className={`${inputClass} h-40 resize-none italic font-bold leading-relaxed`}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black border-2 text-xs uppercase tracking-widest w-full sm:w-auto transition-all bg-white border-slate-400 text-slate-900 hover:bg-slate-50 shadow-sm">
                {image ? '📷 Retake Photo' : '📷 Take Triage Photo'}
              </button>
              <button 
                onClick={handleAnalyze} 
                disabled={loading || (!description.trim() && !image)} 
                className={`flex-1 py-5 rounded-2xl font-black text-white shadow-2xl transition-all uppercase tracking-widest text-sm w-full flex items-center justify-center gap-3 ${loading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Synthesizing Guidelines...
                  </>
                ) : 'Analyze Symptoms ✨'}
              </button>
            </div>

            {image && (
              <div className="relative w-full max-w-md mx-auto animate-in zoom-in-95 pt-4">
                <img src={image} alt="Symptom" className="w-full h-80 object-cover rounded-[2.5rem] border-4 border-white shadow-2xl" />
                <button onClick={() => setImage(null)} className="absolute top-8 right-4 bg-white text-rose-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl font-black text-xl border-2 border-rose-100 hover:bg-rose-50 transition-colors">✕</button>
              </div>
            )}

            {/* AI Result & Grounding Sources Display */}
            {result && (
              <div className="bg-indigo-50/50 p-10 rounded-[3rem] border-2 border-indigo-100 shadow-inner space-y-8 animate-in zoom-in-95 mt-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-md border-2 border-indigo-100">✨</div>
                    <div>
                      <h3 className="text-2xl font-black text-indigo-900 tracking-tight italic">AI Triage Synthesis</h3>
                      <p className="text-[11px] font-black text-indigo-700/80 uppercase tracking-widest">Clinical Decision Support Output</p>
                    </div>
                  </div>
                  <button onClick={handleSaveToLogs} disabled={saved} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {saved ? '✓ Synced' : 'Sync to Medical Hub'}
                  </button>
                </div>
                <div className="prose prose-slate prose-sm leading-relaxed whitespace-pre-wrap font-bold italic text-slate-700 border-l-4 border-indigo-200 pl-8">
                  {result.text}
                </div>
                
                {result.sources.length > 0 && (
                  <div className="pt-6 border-t border-indigo-100 space-y-4">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Grounding Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {result.sources.map((s: any, i: number) => (
                        <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 bg-white px-3 py-1 rounded-full border border-slate-100 transition-all">
                          {s.web?.title || 'Health Resource'} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-rose-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-b-[16px] border-rose-800 group hover:-translate-y-1 transition-transform">
             <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
             <h3 className="text-3xl font-black italic mb-10 uppercase tracking-tighter relative z-10">Emergency Signs</h3>
             <div className="space-y-6 relative z-10">
                {RED_FLAGS_LIST.map((f, i) => (
                  <div key={i} className="bg-white/15 p-6 rounded-[2rem] flex items-start gap-5 border border-white/10 shadow-inner group/item hover:bg-white/20 transition-colors cursor-default">
                    <span className="text-5xl group-hover/item:scale-110 transition-transform">{f.icon}</span>
                    <div>
                      <span className="text-lg font-black leading-tight block">{f.text}</span>
                      <span className="text-xs font-bold text-rose-100 block mt-2 italic leading-snug">{f.sub}</span>
                    </div>
                  </div>
                ))}
             </div>
             <div className="mt-12 relative z-10">
                <a href="tel:000" className="block w-full py-7 bg-white text-rose-600 rounded-[2.5rem] text-center font-black text-5xl shadow-2xl active:scale-95 transition-all hover:bg-rose-50 border-4 border-rose-200">
                  📞 000
                </a>
                <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] mt-6 opacity-60">National Emergency Line</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
