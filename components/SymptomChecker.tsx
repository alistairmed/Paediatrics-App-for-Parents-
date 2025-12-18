
import React, { useState, useRef } from 'react';
import { analyzeSymptoms } from '../services/gemini';
import { ClinicalEvent } from '../types';

interface SymptomCheckerProps {
  onSaveEvent?: (event: Omit<ClinicalEvent, 'id'>) => void;
}

const RED_FLAGS = [
  { text: "Difficulty breathing / Abnormal noises (Wheezing, Grunting)", icon: "🫁" },
  { text: "High fever >38°C in infants under 3 months", icon: "🌡️" },
  { text: "Lethargy - Child is unusually floppy or hard to wake", icon: "😴" },
  { text: "Non-blanching rash (Purple spots that don't fade under a glass)", icon: "🟣" },
  { text: "Persistent vomiting or signs of severe dehydration", icon: "🤮" },
  { text: "Extreme pain / Unconsolable high-pitched crying", icon: "😫" },
  { text: "Seizures or fitting for the first time", icon: "🧠" },
  { text: "Eye Discharge: Sticky yellow/green discharge, swollen or red eyelids", icon: "👁️" }
];

export const SymptomChecker: React.FC<SymptomCheckerProps> = ({ onSaveEvent }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: any[] } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);
    setSaved(false);
    try {
      const res = await analyzeSymptoms(description || "Visual symptom provided in image", image || undefined);
      setResult(res);
    } catch (error) {
      console.error(error);
      alert("Error reviewing symptoms. Please ensure you have an active connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (result && onSaveEvent) {
      const event: Omit<ClinicalEvent, 'id'> = {
        source: 'Symptoms',
        description: description || 'Visual symptom documentation',
        date: new Date().toLocaleDateString(),
        severity: result.text.toLowerCase().includes('red') ? 'High' : result.text.toLowerCase().includes('yellow') ? 'Medium' : 'Low',
        media: image || undefined
      };
      onSaveEvent(event);
      setSaved(true);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight italic">Symptom <span className="text-indigo-600">AI Triage</span></h2>
        <p className="text-slate-500 font-medium italic">Australian guideline-based analysis for home care and clinical red flags.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <span>📝</span> Symptom Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you're seeing (e.g. barky cough, noisy breathing, sticky eye discharge)..."
                className="w-full h-44 p-6 rounded-3xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all text-lg font-bold leading-relaxed shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl transition-all font-black border-2 text-[10px] uppercase tracking-widest w-full sm:w-auto ${
                  image ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100'
                }`}
              >
                {image ? '📷 Update Symptom Photo' : '📷 Add Visual Evidence'}
              </button>
              
              <button
                onClick={handleAnalyze}
                disabled={loading || (!description.trim() && !image)}
                className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest text-sm w-full ${
                  loading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Consulting Protocols...' : image ? 'Analyze Photo & Text ✨' : 'Review Symptoms ✨'}
              </button>
            </div>

            {image && (
              <div className="relative w-full max-w-sm mx-auto group animate-in zoom-in-95 mt-4">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-3xl pointer-events-none"></div>
                <img src={image} alt="Symptom Evidence" className="w-full h-64 object-cover rounded-3xl border-2 border-indigo-100 shadow-lg" />
                <button 
                  onClick={() => setImage(null)} 
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-800 w-10 h-10 rounded-full flex items-center justify-center shadow-2xl font-black text-xl hover:bg-rose-500 hover:text-white transition-colors"
                  title="Remove Image"
                >
                  ×
                </button>
                <div className="absolute bottom-4 left-6">
                   <p className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md">Attached Sign for AI Review</p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-indigo-50 animate-in fade-in slide-in-from-bottom-6 border-l-[16px] border-l-indigo-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full opacity-5 blur-3xl"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner">👨‍⚕️</div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">AI Synthesis</h3>
                    <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Guideline-Aligned Analysis</p>
                  </div>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={saved}
                  className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                    saved ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  {saved ? '✓ Logged to History' : '📋 Link to Medical Hub'}
                </button>
              </div>

              <div className="prose prose-slate max-w-none prose-lg relative z-10">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-bold italic border-l-4 border-slate-100 pl-8 mb-10">
                  {result.text}
                </div>
              </div>
              
              {result.sources.length > 0 && (
                <div className="mt-10 pt-10 border-t border-slate-100 relative z-10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Referenced Clinical Frameworks</h4>
                  <div className="flex flex-wrap gap-3">
                    {result.sources.map((source: any, i: number) => (
                      <a key={i} href={source.web?.uri} target="_blank" rel="noreferrer" className="px-6 py-4 bg-slate-50 text-slate-600 rounded-3xl text-xs font-black hover:bg-slate-100 transition-all border border-slate-100 shadow-sm flex items-center gap-2">
                        🔗 {source.web?.title || 'Guideline'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-rose-600 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-2xl animate-pulse"><span className="text-4xl">🚑</span></div>
                <h3 className="text-3xl font-black text-white tracking-tighter italic">Red Flags</h3>
              </div>
              <div className="space-y-3">
                {RED_FLAGS.map((flag, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 flex items-start gap-4 transition-all hover:bg-white/20">
                    <span className="text-2xl shrink-0">{flag.icon}</span>
                    <span className="text-white text-sm font-bold leading-tight pt-1">{flag.text}</span>
                  </div>
                ))}
              </div>
              <a href="tel:000" className="block bg-white p-6 rounded-[2rem] text-center shadow-2xl transform active:scale-95 transition-transform hover:bg-slate-50">
                <p className="text-rose-600 font-black text-3xl uppercase tracking-tighter mb-1">CALL 000</p>
                <p className="text-rose-900/40 text-[10px] font-black uppercase tracking-widest">Emergency Services</p>
              </a>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 space-y-4">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">💡</div>
             <p className="text-indigo-900 text-sm font-bold leading-relaxed italic">
               Visual evidence like photos of rashes, eye discharge, or breathing mechanics significantly helps clinicians during later reviews.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
