import React, { useState, useMemo } from 'react';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { generateHandoverData } from '../clinical/handover';
import { analyzeMedicalProfile, AiError } from '../services/ai';
import { useToast } from '../context/ToastContext';
import { PREMIUM_ENABLED } from '../config/features';
import { PremiumComingSoon } from './PremiumNotice';

export const HandoverSummary: React.FC = () => {
  const { history, latestWeight } = useMedicalHistory();
  const { childProfile, childAge } = useChildProfile();
  const { showToast } = useToast();
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
      showToast("Please review and verify the content before finalising.", 'info');
      return;
    }
    setReviewStep('view');
  };

  const handleGenerateAiISBAR = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await analyzeMedicalProfile({ history, childName: childProfile?.name, age: childAge, sex: childProfile?.sex });
      setAiSummary(res);
    } catch (err: any) {
      console.error(err);
      if (err instanceof AiError) {
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
          <h2 className="text-4xl font-black text-ink-800 tracking-tighter">Clinical <span className="text-terracotta-600">ISBAR</span> Handover</h2>
          <p className="text-ink-500 font-medium">Standard communication tool for medical professional handovers.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => reviewStep === 'review' ? handleFinalize() : setReviewStep('review')} 
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl transition-all ${reviewStep === 'review' ? 'bg-terracotta-600 text-white hover:bg-terracotta-700' : 'bg-ink-900 text-white'}`}
          >
             {reviewStep === 'review' ? 'Finalize Handover' : 'Edit Selection'}
           </button>
        </div>
      </header>

      {reviewStep === 'review' ? (
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-ink-100 shadow-xl space-y-8 animate-in fade-in">
             <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-xl font-black text-ink-800 uppercase tracking-tight">Review Data Before Export</h3>
             </div>
             <p className="text-ink-500 font-medium">Deselect any acute logs you do not wish to include in the formal handover.</p>
             <div className="space-y-3">
                {handover.situation.recentAcuteLogs.map(log => (
                  <button 
                    key={log.id} 
                    onClick={() => toggleLog(log.id)}
                    className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex justify-between items-center ${excludedLogs.has(log.id) ? 'bg-ink-50 border-ink-100 opacity-50 grayscale' : 'bg-terracotta-50/30 border-terracotta-100'}`}
                  >
                    <div>
                      <p className="font-black text-ink-800">{log.timestamp} - {log.type}</p>
                      <p className="text-sm font-bold text-ink-500">{log.value}</p>
                    </div>
                    <span className="text-xl">{excludedLogs.has(log.id) ? '⭕' : '✅'}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* AI ISBAR Narrative Generator */}
          <div className="bg-white p-10 rounded-[3.5rem] border border-terracotta-100 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-ink-800">AI Clinical ISBAR Synthesis</h3>
                <p className="text-ink-600 text-xs font-bold">Premium: a de-identified summary (no name, date of birth or contact details) is sent to Anthropic's Claude to draft a handover or GP letter.</p>
              </div>
              {PREMIUM_ENABLED ? (
                  <button
                  onClick={handleGenerateAiISBAR}
                  disabled={aiLoading}
                  className="px-6 py-3 bg-terracotta-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-terracotta-700 transition-all flex items-center gap-2"
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
              ) : (
                <PremiumComingSoon feature="The handover and GP letter summary" />
              )}
            </div>

            {aiError && (
              <div className="bg-terracotta-50 border-2 border-terracotta-200 rounded-2xl p-6 space-y-3">
                <p className="font-black text-terracotta-800 text-sm">⚠️ {aiError}</p>
                <div className="flex gap-3">
                  <button onClick={handleGenerateAiISBAR} className="px-5 py-2 bg-terracotta-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-terracotta-700 transition-all">
                    Try Again
                  </button>
                  <button onClick={() => setShowManualFallback(true)} className="px-5 py-2 bg-white border border-terracotta-200 text-terracotta-800 rounded-xl font-black text-xs uppercase tracking-widest">
                    Write Narrative Manually
                  </button>
                </div>
              </div>
            )}

            {aiSummary && (
              <div className="bg-terracotta-50/50 p-6 rounded-2xl border border-terracotta-100 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-terracotta-700">Synthesized ISBAR Narrative</p>
                <div className="text-ink-800 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                  {aiSummary.text}
                </div>
              </div>
            )}

            {(showManualFallback || manualSummary) && (
              <div className="space-y-2 pt-2">
                <label htmlFor="handov-manual-clinical-notes-custom-h" className="text-xs font-black uppercase text-ink-600 tracking-widest ml-2">Manual Clinical Notes / Custom Handover Remarks</label>
                <textarea id="handov-manual-clinical-notes-custom-h"
                  value={manualSummary}
                  onChange={e => setManualSummary(e.target.value)}
                  placeholder="Enter custom clinical notes or additional handover details manually..."
                  className="w-full h-32 p-4 rounded-2xl border border-ink-200 bg-ink-50 text-ink-800 font-bold text-sm outline-hidden focus:ring-2 focus:ring-terracotta-500"
                />
              </div>
            )}
          </div>

          <div className="bg-terracotta-50 p-8 rounded-[3rem] border border-terracotta-100 flex items-center gap-6">
             <input 
              type="checkbox" 
              id="verify-handover"
              checked={isVerified}
              onChange={e => setIsVerified(e.target.checked)}
              className="w-8 h-8 rounded-xl text-terracotta-600 border-terracotta-200 focus:ring-terracotta-500" 
            />
             <label htmlFor="verify-handover" className="text-sm font-black text-terracotta-900 leading-relaxed cursor-pointer">
               "I have reviewed the clinical details above and verify they are an accurate representation of my child's current health status."
             </label>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[4rem] border border-ink-100 shadow-2xl space-y-12 animate-in slide-in-from-bottom-6">
           {/* IDENTIFICATION */}
           <section className="space-y-4">
              <h3 className="text-terracotta-600 font-black uppercase text-xs tracking-[0.3em] border-b border-terracotta-50 pb-2">Identification (Demographics)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                 <div><p className="text-xs font-black text-ink-600 uppercase">Name</p><p className="text-xl font-black">{handover.identification.name}</p></div>
                 <div><p className="text-xs font-black text-ink-600 uppercase">Age</p><p className="text-xl font-black">{handover.identification.age}</p></div>
                 <div><p className="text-xs font-black text-ink-600 uppercase">Weight</p><p className="text-xl font-black">{handover.identification.weight}</p></div>
              </div>
           </section>

           {aiSummary && (
             <section className="space-y-4">
                <h3 className="text-terracotta-600 font-black uppercase text-xs tracking-[0.3em] border-b border-terracotta-50 pb-2">AI ISBAR Narrative Synthesis</h3>
                <div className="p-6 bg-terracotta-50/40 rounded-3xl border border-terracotta-100 text-ink-800 text-sm font-bold leading-relaxed whitespace-pre-wrap">
                  {aiSummary.text}
                </div>
             </section>
           )}

           {manualSummary && (
             <section className="space-y-4">
                <h3 className="text-ink-600 font-black uppercase text-xs tracking-[0.3em] border-b border-ink-100 pb-2">Caregiver Remarks</h3>
                <p className="p-6 bg-ink-50 rounded-3xl text-ink-800 text-sm font-bold">{manualSummary}</p>
             </section>
           )}

           {/* S - SITUATION */}
           <section className="space-y-4">
              <h3 className="text-terracotta-700 font-black uppercase text-xs tracking-[0.3em] border-b border-terracotta-50 pb-2">Situation (Current Issues)</h3>
              <div className="flex flex-wrap gap-2">
                 {handover.situation.activeIssues.map(i => (
                   <span key={i} className="px-3 py-1 bg-terracotta-50 text-terracotta-700 rounded-lg text-xs font-black border border-terracotta-100">{i}</span>
                 ))}
              </div>
              <div className="space-y-2 mt-4">
                 <p className="text-xs font-black text-ink-600 uppercase">Recent Acute Logs</p>
                 {handover.situation.recentAcuteLogs.filter(l => !excludedLogs.has(l.id)).map(l => (
                   <div key={l.id} className="flex gap-4 text-sm font-bold text-ink-700 border-l-2 border-ink-100 pl-4">
                      <span className="w-16 shrink-0">{l.timestamp}</span>
                      <span>{l.type}: {l.value} {l.notes && `(${l.notes})`}</span>
                   </div>
                 ))}
              </div>
           </section>

           {/* B - BACKGROUND */}
           <section className="space-y-4">
              <h3 className="text-terracotta-600 font-black uppercase text-xs tracking-[0.3em] border-b border-terracotta-50 pb-2">Background (PMHx & Meds)</h3>
              <p className="text-ink-700 font-bold leading-relaxed">{handover.background.pastMedicalHistory}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 {handover.background.medications.map(m => (
                   <div key={m} className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-800 font-black text-xs">💊 {m}</div>
                 ))}
              </div>
           </section>

           {/* A - ASSESSMENT & R - RECOMMENDATION */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section className="space-y-4">
                 <h3 className="text-sky-700 font-black uppercase text-xs tracking-[0.3em] border-b border-sky-50 pb-2">Assessment</h3>
                 <p className="text-ink-500 text-sm">Growth Record: {handover.assessment.latestGrowth ? `${handover.assessment.latestGrowth.weight}kg @ ${handover.assessment.latestGrowth.age}mo` : 'Not recorded'}</p>
                 <p className="text-terracotta-700 font-black text-xs uppercase tracking-widest">{handover.assessment.overdueVaccines.length > 0 ? '⚠️ Immunisations Overdue' : '✅ Immunisations Up to Date'}</p>
              </section>
              <section className="space-y-4">
                 <h3 className="text-amber-700 font-black uppercase text-xs tracking-[0.3em] border-b border-amber-50 pb-2">Recommendation</h3>
                 <p className="text-ink-700 font-bold border-l-4 border-ink-100 pl-4">Require clinical assessment of current symptoms and review of management plan given recent trends.</p>
              </section>
           </div>
           
           <div className="pt-8 border-t border-ink-100 flex justify-between items-center opacity-40">
              <p className="text-xs font-black uppercase tracking-widest">Verified by caregiver on {new Date().toLocaleDateString('en-AU')}</p>
              <p className="text-xs font-black uppercase tracking-widest">Prepared in Paeds Pouch • ISBAR format</p>
           </div>
        </div>
      )}
    </div>
  );
};
