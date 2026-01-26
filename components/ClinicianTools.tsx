
import React, { useState, useMemo } from 'react';
import { ConsultationNote, ClinicalFindings, AssignedTest, ReasoningLog } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { GoogleGenAI } from "@google/genai";

const SCREENING_MODS = [
  { id: 'snap4', name: 'SNAP-IV (ADHD)', domain: 'Focus' },
  { id: 'mchat', name: 'M-CHAT-R (Autism)', domain: 'Social' },
  { id: 'asq3', name: 'ASQ-3 (Development)', domain: 'Development' },
  { id: 'gad7', name: 'GAD-7 (Anxiety)', domain: 'Mood' },
  { id: 'phq9', name: 'PHQ-9 (Mood/Depression)', domain: 'Mood' },
  { id: 'sdq', name: 'SDQ (Behavior)', domain: 'Behavior' },
];

const REASONING_FRAMEWORKS = [
  { id: 'standard', name: 'Standard Clinical', desc: 'General differential ranking' },
  { id: 'vindicate', name: 'VINDICATE', desc: 'Vascular, Infectious, Neoplastic, etc.' },
  { id: 'vitamins', name: 'VITAMINS', desc: 'Vascular, Infectious, Traumatic, etc.' },
  { id: 'surgical_sieve', name: 'Surgical Sieve', desc: 'Anatomical vs Pathological mapping' },
];

const CLINICAL_SHORTHAND = {
  general: ['Alert/Active', 'Well Appearance', 'Mildly Unwell', 'NAD', 'Euvolaemic'],
  respiratory: ['Chest Clear', 'Symm Expansion', 'No Wheeze', 'AE + Bilat', 'No Recession'],
  cardiac: ['HS I+II+0', 'Fem Pulses +', 'CRT < 2s', 'Reg Rhythm'],
  abdominal: ['Soft/NT', 'No Masses', 'BS + Active', 'No Guarding'],
  neurological: ['Tone Normal', 'Pupils PERL', 'GCS 15', 'No Focal Deficits'],
  skin: ['No Rashes', 'Warm/Pink', 'Normal Turgor', 'No Petechiae']
};

export const ClinicianTools: React.FC<{ type: 'consults' | 'reasoning' | 'assignments' }> = ({ type }) => {
  const { history, updateHistory } = useMedicalHistory();
  const [loading, setLoading] = useState(false);
  const [reasoningResult, setReasoningResult] = useState<{text: string, sources: any[]} | null>(null);
  const [activeFramework, setActiveFramework] = useState('standard');
  const [activeInputTab, setActiveInputTab] = useState<'history' | 'exam' | 'investigations'>('history');
  const [showReasoningHistory, setShowReasoningHistory] = useState(false);

  // Assignment Bench States
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [configPanel, setConfigPanel] = useState<Partial<AssignedTest>>({
    priority: 'Routine', dueDate: '', clinicianNote: ''
  });

  const assignedTests = history.assignedTests || [];
  const reasoningLogs = history.reasoningLogs || [];

  const [newSoap, setNewSoap] = useState<Partial<ConsultationNote>>({
    clinicianName: '', subjective: '', objective: '', assessment: '', plan: ''
  });

  const [findings, setFindings] = useState<{
    history: string;
    exam: {
      general: string;
      respiratory: string;
      cardiac: string;
      abdominal: string;
      neurological: string;
      skin: string;
    };
    investigations: string;
    vitals: { hr?: string; rr?: string; temp?: string; o2?: string; bp?: string; glu?: string };
  }>({
    history: '',
    exam: { general: '', respiratory: '', cardiac: '', abdominal: '', neurological: '', skin: '' },
    investigations: '',
    vitals: {}
  });

  const injectShorthand = (section: keyof typeof findings.exam, term: string) => {
    setFindings(prev => {
      const current = prev.exam[section];
      const next = current ? (current.includes(term) ? current : `${current}, ${term}`) : term;
      return {
        ...prev,
        exam: { ...prev.exam, [section]: next }
      };
    });
  };

  const handleDispatchAssignment = () => {
    if (!selectedTestId) return;
    const existingIndex = assignedTests.findIndex(t => t.testId === selectedTestId);
    let next: AssignedTest[];
    
    const newEntry: AssignedTest = {
      testId: selectedTestId,
      assignedDate: new Date().toISOString(),
      status: 'pending',
      priority: configPanel.priority || 'Routine',
      dueDate: configPanel.dueDate,
      clinicianNote: configPanel.clinicianNote
    };

    if (existingIndex > -1) {
      next = [...assignedTests];
      next[existingIndex] = newEntry;
    } else {
      next = [...assignedTests, newEntry];
    }

    updateHistory({ assignedTests: next });
    setSelectedTestId(null);
    setConfigPanel({ priority: 'Routine', dueDate: '', clinicianNote: '' });
    alert("Assignment dispatched to caregiver hub.");
  };

  const revokeAssignment = (id: string) => {
    if (confirm("Revoke this assignment?")) {
      updateHistory({ assignedTests: assignedTests.filter(t => t.testId !== id) });
    }
  };

  const handleCommitReasoning = () => {
    if (!reasoningResult) return;
    const log: ReasoningLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      framework: activeFramework,
      inputContext: `HPI: ${findings.history.slice(0, 100)}...`,
      analysis: reasoningResult.text,
      sources: reasoningResult.sources
    };
    updateHistory({ reasoningLogs: [log, ...(history.reasoningLogs || [])] });
    alert("Reasoning analysis committed to patient's clinical history.");
  };

  const handleAddConsult = () => {
    if (!newSoap.assessment || !newSoap.plan) return;
    const consult: ConsultationNote = {
      ...newSoap,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    } as ConsultationNote;
    updateHistory({ formalConsults: [consult, ...(history.formalConsults || [])] });
    setNewSoap({ clinicianName: '', subjective: '', objective: '', assessment: '', plan: '' });
    alert("SOAP Note finalized and recorded to legal registry.");
  };

  const handleRunReasoning = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const frameworkInstruction = 
        activeFramework === 'vindicate' ? "Use the VINDICATE acronym to structure your differential." :
        activeFramework === 'vitamins' ? "Use the VITAMINS mnemonic to structure your differential." :
        activeFramework === 'surgical_sieve' ? "Apply a Surgical Sieve approach." : 
        "Provide a prioritized differential list.";

      const prompt = `Act as a senior pediatric consultant. Analyze this clinical presentation.
      FRAMEWORK: ${frameworkInstruction}
      PATIENT: PMHx: ${history.pastMedicalHistory}, Meds: ${history.currentMedications.map(m => m.name).join(', ')}
      HISTORY: ${findings.history}
      VITALS: HR: ${findings.vitals.hr}, RR: ${findings.vitals.rr}, SpO2: ${findings.vitals.o2}, Temp: ${findings.vitals.temp}, BP: ${findings.vitals.bp}, BSL: ${findings.vitals.glu}
      EXAM: Gen: ${findings.exam.general}, Resp: ${findings.exam.respiratory}, CVS: ${findings.exam.cardiac}, Abdo: ${findings.exam.abdominal}, CNS: ${findings.exam.neurological}, Skin: ${findings.exam.skin}
      TESTS: ${findings.investigations}
      REQUIREMENTS: 
      1. Differential Diagnosis (Prioritized)
      2. Red Flags / Critical Considerations
      3. Investigations & Management Plan
      4. EBM Evidence & Grounding.
      Always spell out "degree Celsius". Format with bold headers and bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      setReasoningResult({
        text: response.text || 'Synthesis failed.',
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      });
    } catch (e) {
      alert("Error generating reasoning.");
    } finally {
      setLoading(false);
    }
  };

  if (type === 'assignments') {
    return (
      <div className="space-y-12 pb-24 animate-in fade-in">
        <header className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Assignment <span className="text-indigo-600">Dispatch</span></h2>
            <p className="text-slate-500 font-medium italic">Configure and monitor patient screening workflows.</p>
          </div>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">+ Custom Task</button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <section className="lg:col-span-8 space-y-8">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-10">
                 <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Screening Library</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SCREENING_MODS.map(test => {
                      const assignment = assignedTests.find(t => t.testId === test.id);
                      const isAssigned = !!assignment;
                      const isCompleted = assignment?.status === 'completed';

                      return (
                        <button 
                          key={test.id}
                          onClick={() => setSelectedTestId(test.id)}
                          className={`p-6 rounded-[2.5rem] border-2 text-left transition-all relative group flex items-center gap-5 ${
                            selectedTestId === test.id ? 'border-indigo-600 bg-indigo-50/30' :
                            isCompleted ? 'bg-emerald-50 border-emerald-100' :
                            isAssigned ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 
                            'bg-slate-50 border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${isAssigned && !isCompleted ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                             {isCompleted ? '✅' : '🔍'}
                          </div>
                          <div className="flex-1">
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isAssigned && !isCompleted ? 'text-indigo-100' : 'text-slate-400'}`}>{test.domain}</p>
                            <h4 className={`text-base font-black tracking-tight leading-none ${isAssigned && !isCompleted ? 'text-white' : 'text-slate-900'}`}>{test.name}</h4>
                          </div>
                          {isAssigned && (
                             <div className="text-right">
                               <p className={`text-[8px] font-black uppercase ${isAssigned && !isCompleted ? 'text-indigo-200' : 'text-slate-400'}`}>
                                 {isCompleted ? 'Done' : 'Active'}
                               </p>
                             </div>
                          )}
                        </button>
                      );
                    })}
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Current Pipeline</h3>
                 <div className="space-y-3">
                    {assignedTests.length === 0 ? (
                      <p className="text-center py-10 text-slate-300 italic font-medium">No tests currently in the pipeline.</p>
                    ) : (
                      assignedTests.map(at => {
                        const mod = SCREENING_MODS.find(m => m.id === at.testId);
                        return (
                          <div key={at.testId} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                             <div className="flex items-center gap-6">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${at.priority === 'Urgent' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
                                  {at.priority?.[0]}
                               </div>
                               <div>
                                  <p className="font-black text-slate-800">{mod?.name || 'Custom Task'}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due: {at.dueDate || 'No Deadline'} • {at.status}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-3">
                                {at.status === 'completed' && <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">View Results</button>}
                                <button onClick={() => revokeAssignment(at.testId)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">✕</button>
                             </div>
                          </div>
                        );
                      })
                    )}
                 </div>
              </div>
           </section>

           <section className="lg:col-span-4">
              {selectedTestId ? (
                <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-8 sticky top-8 animate-in slide-in-from-right-4">
                   <h3 className="text-xl font-black italic tracking-tighter">Dispatch Panel</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Priority</label>
                        <select 
                          value={configPanel.priority} 
                          onChange={e => setConfigPanel({...configPanel, priority: e.target.value as any})}
                          className="w-full p-4 bg-white/10 rounded-2xl border border-white/10 font-black text-sm outline-none focus:bg-white/20"
                        >
                          <option className="bg-slate-900">Routine</option>
                          <option className="bg-slate-900">High</option>
                          <option className="bg-slate-900">Urgent</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Due Date</label>
                        <input 
                          type="date" 
                          value={configPanel.dueDate}
                          onChange={e => setConfigPanel({...configPanel, dueDate: e.target.value})}
                          className="w-full p-4 bg-white/10 rounded-2xl border border-white/10 font-black text-sm outline-none focus:bg-white/20 uppercase" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Clinician Instructions</label>
                        <textarea 
                          value={configPanel.clinicianNote}
                          onChange={e => setConfigPanel({...configPanel, clinicianNote: e.target.value})}
                          className="w-full h-32 p-5 bg-white/10 rounded-2xl border border-white/10 font-bold italic text-sm outline-none focus:bg-white/20" 
                          placeholder="e.g. Please complete this before our neurology follow-up on Tuesday..."
                        />
                      </div>
                      <div className="pt-4 space-y-3">
                         <button onClick={handleDispatchAssignment} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all">Authorize Assignment</button>
                         <button onClick={() => setSelectedTestId(null)} className="w-full py-3 text-slate-500 font-black uppercase text-[9px] tracking-widest hover:text-white">Cancel</button>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6 opacity-40 sticky top-8">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">📋</div>
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">Select a screening tool to configure its clinical dispatch.</p>
                </div>
              )}
           </section>
        </div>
      </div>
    );
  }

  if (type === 'consults') {
    return (
      <div className="space-y-12 pb-24 animate-in fade-in">
        <header>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">SOAP <span className="text-indigo-600">Consultations</span></h2>
          <p className="text-slate-500 font-medium italic">Clinical documentation workspace for legal records.</p>
        </header>

        <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Subjective (S)</label>
                <textarea value={newSoap.subjective} onChange={e => setNewSoap({...newSoap, subjective: e.target.value})} className="w-full h-32 p-6 rounded-[2rem] bg-slate-50 border border-slate-200 font-bold italic text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50" placeholder="Patient report, HPI..." />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Objective (O)</label>
                <textarea value={newSoap.objective} onChange={e => setNewSoap({...newSoap, objective: e.target.value})} className="w-full h-32 p-6 rounded-[2rem] bg-slate-50 border border-slate-200 font-bold italic text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50" placeholder="Exam findings, vitals..." />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Assessment (A)</label>
                <textarea value={newSoap.assessment} onChange={e => setNewSoap({...newSoap, assessment: e.target.value})} className="w-full h-32 p-6 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 font-bold italic text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100" placeholder="Clinical reasoning, primary Dx..." />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Plan (P)</label>
                <textarea value={newSoap.plan} onChange={e => setNewSoap({...newSoap, plan: e.target.value})} className="w-full h-32 p-6 rounded-[2rem] bg-emerald-50/30 border border-emerald-100 font-bold italic text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100" placeholder="Management, FU, investigations..." />
          </div>
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-slate-100">
             <input value={newSoap.clinicianName} onChange={e => setNewSoap({...newSoap, clinicianName: e.target.value})} placeholder="Clinician ID / Name" className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-slate-900 outline-none" />
             <button onClick={handleAddConsult} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">Finalize SOAP Note</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Reasoning <span className="text-indigo-600">Bench</span></h2>
          <p className="text-slate-500 font-medium italic">Diagnostic differential augmentation engine.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowReasoningHistory(!showReasoningHistory)} className="bg-white border border-slate-200 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
             {showReasoningHistory ? 'Hide Logs' : 'View Reasoning Logs'}
           </button>
           <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar max-w-full">
              {REASONING_FRAMEWORKS.map(fw => (
                <button 
                  key={fw.id} 
                  onClick={() => setActiveFramework(fw.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFramework === fw.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {fw.name}
                </button>
              ))}
           </div>
        </div>
      </header>

      {showReasoningHistory && (
        <section className="space-y-4 animate-in slide-in-from-top-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Diagnostic Audit Trail</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reasoningLogs.map(log => (
                <div key={log.id} onClick={() => setReasoningResult({ text: log.analysis, sources: log.sources })} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-600 transition-all cursor-pointer group">
                   <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{log.framework}</span>
                      <span className="text-[8px] font-bold text-slate-300">{new Date(log.date).toLocaleDateString()}</span>
                   </div>
                   <p className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2 italic">"{log.inputContext}"</p>
                </div>
              ))}
           </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-8 h-fit">
            <nav className="flex gap-4 border-b border-slate-50 pb-4">
               {['history', 'exam', 'investigations'].map(tab => (
                 <button 
                  key={tab} 
                  onClick={() => setActiveInputTab(tab as any)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-4 transition-all ${activeInputTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-300'}`}
                 >
                   {tab}
                 </button>
               ))}
            </nav>

            <div className="space-y-6">
               {activeInputTab === 'history' && (
                 <div className="space-y-6 animate-in slide-in-from-left-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Clinical Presentation / HPI</label>
                      <textarea value={findings.history} onChange={e => setFindings({...findings, history: e.target.value})} className="w-full h-32 p-5 rounded-2xl bg-slate-50 font-bold italic text-slate-900 outline-none border border-slate-200 focus:ring-2 focus:ring-indigo-50 shadow-inner" placeholder="Enter history of presenting illness..." />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {['hr', 'rr', 'o2', 'temp', 'bp', 'glu'].map(v => (
                         <div key={v} className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase ml-2">{v.toUpperCase()}</label>
                            <input placeholder="..." value={(findings.vitals as any)[v]} onChange={e => setFindings({...findings, vitals: {...findings.vitals, [v]: e.target.value}})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-slate-900 outline-none" />
                         </div>
                      ))}
                    </div>
                 </div>
               )}

               {activeInputTab === 'exam' && (
                 <div className="space-y-8 animate-in slide-in-from-left-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {(Object.keys(CLINICAL_SHORTHAND) as Array<keyof typeof findings.exam>).map(sysKey => (
                      <div key={sysKey} className="space-y-3">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block">{String(sysKey)} Systems</label>
                        <div className="flex flex-wrap gap-1 mb-2">
                           {CLINICAL_SHORTHAND[sysKey].map(term => (
                             <button 
                                key={term}
                                onClick={() => injectShorthand(sysKey, term)}
                                className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase border border-indigo-100 hover:bg-indigo-100 transition-colors"
                             >
                               + {term}
                             </button>
                           ))}
                        </div>
                        <input 
                          value={findings.exam[sysKey]} 
                          onChange={e => setFindings({...findings, exam: {...findings.exam, [sysKey]: e.target.value}})} 
                          className="w-full p-4 rounded-xl bg-slate-50 font-bold italic text-slate-900 outline-none border border-slate-200 focus:ring-2 focus:ring-indigo-50 text-sm shadow-inner" 
                        />
                      </div>
                    ))}
                 </div>
               )}

               {activeInputTab === 'investigations' && (
                 <div className="space-y-4 animate-in slide-in-from-left-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Recent Lab / Imaging Findings</label>
                    <textarea value={findings.investigations} onChange={e => setFindings({...findings, investigations: e.target.value})} className="w-full h-48 p-5 rounded-2xl bg-slate-50 font-bold italic text-slate-900 outline-none border border-slate-200 focus:ring-2 focus:ring-indigo-50 shadow-inner" placeholder="FBC, U&E, CXR results..." />
                 </div>
               )}

               <div className="pt-6 border-t border-slate-100">
                  <button onClick={handleRunReasoning} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing Clinical Data...
                      </>
                    ) : 'Run Clinical Differential ✨'}
                  </button>
               </div>
            </div>
         </section>

         <section className="space-y-8">
            {loading ? (
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm animate-pulse h-full flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">🧠</div>
                 <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Applying {activeFramework.toUpperCase()} sieve...</p>
              </div>
            ) : reasoningResult ? (
              <div className="bg-white p-10 sm:p-12 rounded-[4rem] border border-indigo-100 shadow-2xl animate-in zoom-in-95 relative overflow-hidden flex flex-col h-full">
                 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full opacity-5 blur-[100px]"></div>
                 
                 <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📄</div>
                       <div>
                          <h4 className="text-2xl font-black text-slate-800 italic uppercase leading-none">AI Reasoning Output</h4>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">Augmented Diagnostic Framework</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={handleCommitReasoning} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Commit to Record</button>
                       <button onClick={() => setReasoningResult(null)} className="text-slate-300 hover:text-rose-500 font-black text-xl ml-2">✕</button>
                    </div>
                 </div>

                 <div className="relative z-10 space-y-6 flex-1 overflow-y-auto pr-2 no-scrollbar max-h-[60vh]">
                    {reasoningResult.text.split('\n').map((line, i) => {
                        const isSection = line.match(/^\d\./) || line.includes('**');
                        return (
                          <p key={i} className={`text-base leading-relaxed ${isSection ? 'font-black text-indigo-900 mt-6 border-b border-indigo-50 pb-1' : 'font-bold italic text-slate-600 ml-4 border-l-2 border-slate-100 pl-4'}`}>
                            {line.replace(/\*\*/g, '')}
                          </p>
                        );
                    })}
                 </div>

                 {reasoningResult.sources.length > 0 && (
                   <div className="mt-8 pt-6 border-t border-slate-50 space-y-4 relative z-10">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evidence Grounding (EBM)</p>
                      <div className="flex flex-wrap gap-2">
                        {reasoningResult.sources.map((s: any, i: number) => (
                           <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-bold text-slate-500 hover:text-indigo-600 transition-all">
                             {s.web?.title || 'EBM Resource'} ↗
                           </a>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
            ) : (
              <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[4rem] h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-40">
                 <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-sm grayscale">🧠</div>
                 <div className="max-w-xs space-y-2">
                    <h4 className="font-black text-slate-800 uppercase text-lg italic">Diagnostic Assistant</h4>
                    <p className="text-slate-500 font-bold italic text-sm">Populate the clinical findings on the left and select a reasoning framework to begin synthesis.</p>
                 </div>
              </div>
            )}
         </section>
      </div>
    </div>
  );
};
