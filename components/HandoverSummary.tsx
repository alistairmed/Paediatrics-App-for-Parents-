import React, { useState, useMemo } from 'react';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { generateHandoverData } from '../clinical/handover';
import { analyzeMedicalProfile, GeminiError } from '../services/gemini';

export const HandoverSummary: React.FC = () => {
  const { history, latestWeight } = useMedicalHistory();
  const { childProfile, childAge } = useChildProfile();
  const [reviewStep, setReviewStep] = useState<'review' | 'view'>('review');
  const [excludedLogs, setExcludedLogs] = useState<Set<string>>(new Set());
  const [isVerified, setIsVerified] = useState(false);

  // AI ISBAR Synthesis State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ text: string; sources: any[] } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [manualSummary, setManualSummary] = useState<string>('');
  const [showManualFallback, setShowManualFallback] = useState(false);

  const handover = useMemo(() => 
    generateHandoverData(childProfile, history, childAge, latestWeight),
  [childProfile, history, childAge, latestWeight]);

  const toggleLog = (id: string) => {
    setExcludedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinalize = () => {
    if (!isVerified) {
      alert("Please review and verify the clinical content before finalising.");
      return;
    }
    setReviewStep('view');
  };

  const handleGenerateAiISBAR = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await analyzeMedicalProfile({ childProfile, history, childAge, latestWeight });
      setAiSummary(res);
    } catch (err: any) {
      console.error(err);
      if (err instanceof GeminiError) {
        setAiError(err.message);
      } else {
        setAiError(err?.message || "Failed to generate AI ISBAR synthesis.");
      }
      setShowManualFallback(true);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 italic tracking-tighter">Clinical <span className="text-indigo-600">ISBAR</span> Handover</h2>
          <p className="text-slate-500 font-medium italic">Standard communication tool for medical professional handovers.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => reviewStep === 'review' ? handleFinalize() : setReviewStep('review')} 
            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all ${reviewStep === 'review' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white'}`}
          >
             {reviewStep === 'review' ? 'Finalize Handover' : 'Edit Selection'}
           </button>
        </div>
      </header>

      {reviewStep === 'review' ? (
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 animate-in fade-in">
             <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Review Data Before Export</h3>
             </div>
             <p className="text-slate-500 italic font-medium">Deselect any acute logs you do not wish to include in the formal handover.</p>
             <div className="space-y-3">
                {handover.situation.recentAcuteLogs.map(log => (
                  <button 
                    key={log.id} 
                    onClick={() => toggleLog(log.id)}
                    className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex justify-between items-center ${excludedLogs.has(log.id) ? 'bg-slate-50 border-slate-100 opacity-50 grayscale' : 'bg-indigo-50/30 border-indigo-100'}`}
                  >
                    <div>
                      <p className="font-black text-slate-800">{log.timestamp} - {log.type}</p>
                      <p className="text-sm font-bold text-slate-500">{log.value}</p>
                    </div>
                    <span className="text-xl">{excludedLogs.has(log.id) ? '⭕' : '✅'}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* AI ISBAR Narrative Generator */}
          <div className="bg-white p-10 rounded-[3.5rem] border border-indigo-100 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800 italic">AI Clinical ISBAR Synthesis</h3>
                <p className="text-slate-500 text-xs font-bold italic">Generate an automated clinical narrative powered by Gemini AI.</p>
              </div>
              <button
                onClick={handleGenerateAiISBAR}
                disabled={aiLoading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>✨ Generate AI Narrative</>
                )}
              </button>
            </div>

            {aiError && (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 space-y-3">
                <p className="font-black text-rose-800 text-sm">⚠️ {aiError}</p>
                <div className="flex gap-3">
                  <button onClick={handleGenerateAiISBAR} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all">
                    Try Again
                  </button>
                  <button onClick={() => setShowManualFallback(true)} className="px-5 py-2 bg-white border border-rose-200 text-rose-800 rounded-xl font-black text-xs uppercase tracking-widest">
                    Write Narrative Manually
                  </button>
                </div>
              </div>
            )}

            {aiSummary && (
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Synthesized ISBAR Narrative</p>
                <div className="text-slate-800 text-sm font-medium italic whitespace-pre-wrap leading-relaxed">
                  {aiSummary.text}
                </div>
              </div>
            )}

            {(showManualFallback || manualSummary) && (
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Manual Clinical Notes / Custom Handover Remarks</label>
                <textarea
                  value={manualSummary}
                  onChange={e => setManualSummary(e.target.value)}
                  placeholder="Enter custom clinical notes or additional handover details manually..."
                  className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 flex items-center gap-6">
             <input 
              type="checkbox" 
              id="verify-handover"
              checked={isVerified}
              onChange={e => setIsVerified(e.target.checked)}
              className="w-8 h-8 rounded-xl text-indigo-600 border-indigo-200 focus:ring-indigo-500" 
            />
             <label htmlFor="verify-handover" className="text-sm font-black text-indigo-900 italic leading-relaxed cursor-pointer">
               "I have reviewed the clinical details above and verify they are an accurate representation of my child's current health status."
             </label>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-12 animate-in slide-in-from-bottom-6">
           {/* IDENTIFICATION */}
           <section className="space-y-4">
              <h3 className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em] border-b border-indigo-50 pb-2">Identification (Demographics)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Name</p><p className="text-xl font-black">{handover.identification.name}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Age</p><p className="text-xl font-black">{handover.identification.age}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase">Weight</p><p className="text-xl font-black">{handover.identification.weight}</p></div>
              </div>
           </section>

           {aiSummary && (
             <section className="space-y-4">
                <h3 className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em] border-b border-indigo-50 pb-2">AI ISBAR Narrative Synthesis</h3>
                <div className="p-6 bg-indigo-50/40 rounded-3xl border border-indigo-100 text-slate-800 text-sm font-bold italic leading-relaxed whitespace-pre-wrap">
                  {aiSummary.text}
                </div>
             </section>
           )}

           {manualSummary && (
             <section className="space-y-4">
                <h3 className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100 pb-2">Caregiver Remarks</h3>
                <p className="p-6 bg-slate-50 rounded-3xl text-slate-800 text-sm font-bold italic">{manualSummary}</p>
             </section>
           )}

           {/* S - SITUATION */}
           <section className="space-y-4">
              <h3 className="text-rose-600 font-black uppercase text-[10px] tracking-[0.3em] border-b border-rose-50 pb-2">Situation (Current Issues)</h3>
              <div className="flex flex-wrap gap-2">
                 {handover.situation.activeIssues.map(i => (
                   <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-black border border-rose-100">{i}</span>
                 ))}
              </div>
              <div className="space-y-2 mt-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Recent Acute Logs</p>
                 {handover.situation.recentAcuteLogs.filter(l => !excludedLogs.has(l.id)).map(l => (
                   <div key={l.id} className="flex gap-4 text-sm font-bold text-slate-700 italic border-l-2 border-slate-100 pl-4">
                      <span className="w-16 shrink-0">{l.timestamp}</span>
                      <span>{l.type}: {l.value} {l.notes && `(${l.notes})`}</span>
                   </div>
                 ))}
              </div>
           </section>

           {/* B - BACKGROUND */}
           <section className="space-y-4">
              <h3 className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em] border-b border-indigo-50 pb-2">Background (PMHx & Meds)</h3>
              <p className="text-slate-700 italic font-bold leading-relaxed">{handover.background.pastMedicalHistory}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 {handover.background.medications.map(m => (
                   <div key={m} className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-800 font-black text-xs">💊 {m}</div>
                 ))}
              </div>
           </section>

           {/* A - ASSESSMENT & R - RECOMMENDATION */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section className="space-y-4">
                 <h3 className="text-teal-600 font-black uppercase text-[10px] tracking-[0.3em] border-b border-teal-50 pb-2">Assessment</h3>
                 <p className="text-slate-500 italic text-sm">Growth Record: {handover.assessment.latestGrowth ? `${handover.assessment.latestGrowth.weight}kg @ ${handover.assessment.latestGrowth.age}mo` : 'Not recorded'}</p>
                 <p className="text-rose-600 font-black text-xs uppercase tracking-widest">{handover.assessment.overdueVaccines.length > 0 ? '⚠️ Immunisations Overdue' : '✅ Immunisations Up to Date'}</p>
              </section>
              <section className="space-y-4">
                 <h3 className="text-amber-600 font-black uppercase text-[10px] tracking-[0.3em] border-b border-amber-50 pb-2">Recommendation</h3>
                 <p className="text-slate-700 font-bold italic border-l-4 border-slate-100 pl-4">Require clinical assessment of current symptoms and review of management plan given recent trends.</p>
              </section>
           </div>
           
           <div className="pt-8 border-t border-slate-100 flex justify-between items-center opacity-40">
              <p className="text-[9px] font-black uppercase tracking-widest">Verified by caregiver on {new Date().toLocaleDateString()}</p>
              <p className="text-[9px] font-black uppercase tracking-widest">Generated by PediPulse AI • ISBAR v1.0</p>
           </div>
        </div>
      )}
    </div>
  );
};
