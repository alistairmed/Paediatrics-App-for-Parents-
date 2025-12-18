
import React, { useState, useRef, useMemo } from 'react';
import { MedicalHistory, Medication, PreviousMedication, SpecialistContact, MedicalDevice, SickDayPlan, AttachmentAnalysis, ClinicalEvent, MedicalReport, Condition } from '../types';
import { analyzeMedicalProfile, analyzeMedicalReport } from '../services/gemini';

interface MedicalProfileProps {
  history: MedicalHistory;
  updateHistory: (updates: Partial<MedicalHistory>) => void;
  pendingEvents?: ClinicalEvent[];
  attachmentData?: AttachmentAnalysis;
}

const SICK_DAY_TEMPLATES: Record<string, Partial<SickDayPlan>> = {
  asthma: {
    instructions: "AUSTRALIAN 4x4 PROTOCOL:\n1. Give 4 puffs of blue reliever (Salbutamol) via spacer.\n2. 1 puff at a time with 4 breaths each.\n3. Wait 4 minutes.\n4. If no improvement, repeat 4x4.\n\nCALL 000 IF:\n- Child is distressed or can't talk in sentences.\n- Skin is sucking in at ribs/neck.\n- Lips are blue.",
    triggers: "Viral colds, exercise, smoke, dust mites, weather changes.",
    emergencyMeds: "Salbutamol 100mcg (Ventolin/Asmol) via spacer.",
    fluidRequirements: "Encourage small, frequent sips. Monitor hydration if work of breathing is high.",
    emergencyContact: "GP Clinic or 000"
  },
  seizure: {
    instructions: "1. Stay calm and time the seizure.\n2. Protect from injury (move hard objects).\n3. Place on side once jerking stops.\n\nCALL 000 IF:\n- Seizure lasts > 5 mins.\n- First ever seizure.\n- Child is injured or having trouble breathing.",
    triggers: "Fever, illness, fatigue, missed medication.",
    emergencyMeds: "Midazolam (as per specialist protocol) / Buccal dosage as prescribed.",
    fluidRequirements: "No fluids until child is fully alert and awake.",
    emergencyContact: "Neurology Liaison / 000"
  },
  metabolic: {
    instructions: "SICK DAY REGIMEN:\n- Stop high-protein foods (if instructed).\n- Start 10% Glucose (SOS) drinks immediately at scheduled intervals.\n\nPRESENT TO EMERGENCY IF:\n- Vomiting or unable to take oral fluids.\n- Lethargic or 'smell of ketones'.",
    triggers: "Fever, diarrhea, vomiting, fasting.",
    emergencyMeds: "Glucose polymers (Poly-Joule/SOS-10).",
    fluidRequirements: "Strict 10% glucose regimen every 2 hours, including overnight.",
    emergencyContact: "Metabolic Consultant / 000"
  }
};

export const MedicalProfile: React.FC<MedicalProfileProps> = ({ 
  history, 
  updateHistory, 
  pendingEvents = [], 
  attachmentData 
}) => {
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'meds' | 'reports' | 'mdt' | 'gear' | 'sickday'>('history');
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; sources: any[] } | null>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);
  const sickPlanPhotoRef = useRef<HTMLInputElement>(null);

  // Manual input form states
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [showActiveMedForm, setShowActiveMedForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showGearForm, setShowGearForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const [newCondition, setNewCondition] = useState<Partial<Condition>>({ name: '', status: 'Active', dateDiagnosed: '' });
  const [newMed, setNewMed] = useState<Partial<Medication>>({ name: '', dose: '', instructions: '', indication: '' });
  const [newSpecialist, setNewSpecialist] = useState<Partial<SpecialistContact>>({ name: '', specialty: '', category: 'Medical', hospital: '', goals: '' });
  const [newDevice, setNewDevice] = useState<Partial<MedicalDevice>>({ type: '', model: '', nextChangeDue: '', notes: '' });
  const [newManualReport, setNewManualReport] = useState<Partial<MedicalReport>>({ specialist: '', date: new Date().toISOString().split('T')[0], summary: '', actionItems: [] });

  const medicalSpecialists = useMemo(() => history.specialists.filter(s => s.category === 'Medical'), [history.specialists]);
  const alliedHealthTeam = useMemo(() => history.specialists.filter(s => s.category === 'Allied Health'), [history.specialists]);

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = await analyzeMedicalReport(reader.result as string);
          
          // 1. Prepare the new report entry
          const newReport: MedicalReport = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString(),
            specialist: result.specialist.name,
            summary: result.summary,
            actionItems: result.actionItems,
            photoUrl: reader.result as string
          };

          // 2. Extract and auto-update Care Team if specialist is new
          const teamExists = history.specialists.some(s => 
            s.name.toLowerCase().includes(result.specialist.name.toLowerCase()) || 
            result.specialist.name.toLowerCase().includes(s.name.toLowerCase())
          );
          
          let updatedSpecialists = [...history.specialists];
          if (!teamExists && result.specialist.name) {
            updatedSpecialists.push({
              id: Math.random().toString(36).substr(2, 9),
              name: result.specialist.name,
              specialty: result.specialist.specialty,
              category: 'Medical',
              hospital: result.specialist.hospital
            });
          }

          // 3. Extract and auto-update Diagnoses/Conditions
          const existingConditions = (history.conditions || []).map(c => c.name.toLowerCase());
          const newFoundConditions: Condition[] = (result.foundDiagnoses || [])
            .filter((d: string) => !existingConditions.includes(d.toLowerCase()))
            .map((d: string) => ({
              id: Math.random().toString(36).substr(2, 9),
              name: d,
              status: 'Active',
              dateDiagnosed: new Date().toLocaleDateString()
            }));

          // 4. Handle Medications (Prompt for confirmation in a real app, here we auto-suggest adding)
          const existingMedNames = history.currentMedications.map(m => m.name.toLowerCase());
          const newFoundMeds: Medication[] = (result.foundMedications || [])
            .filter((m: any) => !existingMedNames.includes(m.name.toLowerCase()))
            .map((m: any) => ({
              ...m,
              id: Math.random().toString(36).substr(2, 9),
              startDate: new Date().toISOString().split('T')[0]
            }));

          // Apply all updates
          updateHistory({ 
            medicalReports: [...(history.medicalReports || []), newReport],
            specialists: updatedSpecialists,
            conditions: [...(history.conditions || []), ...newFoundConditions],
            currentMedications: [...history.currentMedications, ...newFoundMeds]
          });

          alert(`AI Sync Complete!\n- Report from ${result.specialist.name} logged.\n- ${newFoundConditions.length} new conditions identified.\n- ${newFoundMeds.length} new medications added to regimen.`);
          setActiveTab('reports');
        } catch (err) {
          console.error(err);
          alert("Error analyzing report. Please try a clearer photo.");
        } finally {
          setReportLoading(false);
          if (reportInputRef.current) reportInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSickDayPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateHistory({
          sickDayPlan: { ...history.sickDayPlan, planPhoto: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateHandover = async () => {
    setLoading(true);
    try {
      const result = await analyzeMedicalProfile({ history, linkedEvents: pendingEvents, attachment: attachmentData });
      setAiAnalysis(result);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      alert("Error generating ISBAR handover.");
    } finally {
      setLoading(false);
    }
  };

  const applySickDayTemplate = (type: string) => {
    const template = SICK_DAY_TEMPLATES[type];
    if (template) {
      updateHistory({ 
        sickDayPlan: { ...history.sickDayPlan, ...template } 
      });
    }
  };

  const handleAddMed = () => {
    if (newMed.name) {
      updateHistory({
        currentMedications: [...history.currentMedications, { ...newMed, id: Math.random().toString(36).substr(2, 9), startDate: new Date().toISOString().split('T')[0] } as Medication]
      });
      setNewMed({ name: '', dose: '', instructions: '', indication: '' });
      setShowActiveMedForm(false);
    }
  };

  const handleCeaseMed = (med: Medication) => {
    const reason = prompt(`Reason for ceasing ${med.name}?`);
    const date = prompt(`Date ceased? (YYYY-MM-DD)`, new Date().toISOString().split('T')[0]);
    if (reason && date) {
      updateHistory({
        currentMedications: history.currentMedications.filter(m => m.id !== med.id),
        previousMedications: [...(history.previousMedications || []), {
          id: med.id,
          name: med.name,
          dose: med.dose,
          indication: med.indication,
          ceasedDate: date,
          ceaseReason: reason
        }]
      });
    }
  };

  const tabs = [
    { id: 'history', label: 'History', icon: '📜', color: 'text-indigo-600' },
    { id: 'meds', label: 'Meds', icon: '💊', color: 'text-rose-600' },
    { id: 'reports', label: 'Letters', icon: '✉️', color: 'text-amber-600' },
    { id: 'mdt', label: 'Team', icon: '🫂', color: 'text-emerald-600' },
    { id: 'gear', label: 'Gear', icon: '⚙️', color: 'text-slate-600' },
    { id: 'sickday', label: 'Sick Day Plan', icon: '🚨', color: 'text-rose-700' }
  ];

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Medical <span className="text-indigo-600">Hub</span></h2>
          <p className="text-slate-500 font-medium italic">Comprehensive clinical coordination and ISBAR synthesis.</p>
        </div>
        <button 
          onClick={handleGenerateHandover}
          disabled={loading}
          className="w-full lg:w-auto px-8 py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest active:scale-95"
        >
          {loading ? 'Synthesizing...' : 'Generate Clinical Handover'}
          {!loading && <span className="text-lg">✨</span>}
        </button>
      </header>

      {/* Adaptive Sticky Navigation */}
      <nav className="sticky top-[64px] md:top-0 z-40 py-2 md:py-4 bg-[#FBFBFE]/80 backdrop-blur-md">
        <div className="bg-white p-1.5 rounded-[2.5rem] md:rounded-full border border-slate-200 shadow-lg md:shadow-sm">
          {/* Mobile Grid View */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:hidden gap-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`py-3 px-2 rounded-2xl font-black transition-all text-[9px] uppercase tracking-widest flex flex-col items-center justify-center gap-1 border ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                    : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Desktop Horizontal View */}
          <div className="hidden md:flex items-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 rounded-full font-black transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab Content Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
        
        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="p-6 md:p-12 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">📜</div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">Clinical Narrative</h3>
              </div>
              <textarea 
                value={history.pastMedicalHistory}
                onChange={e => updateHistory({ pastMedicalHistory: e.target.value })}
                className="w-full h-80 p-8 rounded-[3rem] border border-slate-100 bg-slate-50/30 outline-none text-slate-700 font-bold italic leading-relaxed shadow-inner focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                placeholder="Document the clinical story, birth history, and chronic evolution..."
              />
            </section>

            {/* Observations optimized for mobile reading */}
            {pendingEvents.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl">📷</div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Clinical Observations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingEvents.map(event => (
                    <div key={event.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">{event.source} • {event.date}</p>
                          <p className="text-sm font-bold text-slate-800 mt-2">{event.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                          event.severity === 'High' ? 'bg-rose-100 text-rose-600' : 
                          event.severity === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>{event.severity}</span>
                      </div>
                      {event.media && (
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                          <img src={event.media} alt="Observation" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4 border-slate-50">
                 <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest">Diagnoses</h3>
                 <button onClick={() => setShowConditionForm(!showConditionForm)} className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1">+ <span>Add</span></button>
              </div>

              {showConditionForm && (
                <div className="bg-amber-50 p-8 rounded-[3rem] grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                  <input placeholder="Diagnosis Name" value={newCondition.name} onChange={e => setNewCondition({...newCondition, name: e.target.value})} className="p-5 rounded-2xl border border-amber-100 shadow-inner outline-none focus:ring-2 focus:ring-amber-500 font-bold" />
                  <input type="date" value={newCondition.dateDiagnosed} onChange={e => setNewCondition({...newCondition, dateDiagnosed: e.target.value})} className="p-5 rounded-2xl border border-amber-100 uppercase text-xs font-black shadow-inner" />
                  <button 
                    onClick={() => { if(newCondition.name) { updateHistory({ conditions: [...(history.conditions || []), { ...newCondition, id: Math.random().toString(36).substr(2, 9) } as Condition] }); setNewCondition({name: '', status: 'Active'}); setShowConditionForm(false); } }} 
                    className="md:col-span-2 py-5 bg-amber-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                  >
                    Confirm Diagnosis
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {history.conditions?.map(c => (
                  <div key={c.id} className="px-6 py-4 bg-white border border-amber-100 rounded-[2rem] shadow-sm flex flex-col">
                    <span className="text-base font-black text-slate-800 tracking-tight">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">EST: {c.dateDiagnosed || 'TBD'}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* MEDICATIONS TAB - Optimized Lists */}
        {activeTab === 'meds' && (
          <div className="p-6 md:p-12 space-y-12">
             <section className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4 border-slate-50">
                   <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Active Regimen</h3>
                   <button onClick={() => setShowActiveMedForm(!showActiveMedForm)} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">+ <span>Add</span></button>
                </div>

                {showActiveMedForm && (
                  <div className="bg-indigo-50/50 p-8 rounded-[3rem] border border-indigo-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                     <input placeholder="Drug Name" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="p-5 rounded-2xl border border-slate-200 bg-white font-bold" />
                     <input placeholder="Dose (e.g. 5mL)" value={newMed.dose} onChange={e => setNewMed({...newMed, dose: e.target.value})} className="p-5 rounded-2xl border border-slate-200 bg-white font-bold" />
                     <input placeholder="Instructions (e.g. BD)" value={newMed.instructions} onChange={e => setNewMed({...newMed, instructions: e.target.value})} className="p-5 rounded-2xl border border-slate-200 bg-white font-bold" />
                     <input placeholder="Indication" value={newMed.indication} onChange={e => setNewMed({...newMed, indication: e.target.value})} className="p-5 rounded-2xl border border-slate-200 bg-white font-bold" />
                     <button onClick={handleAddMed} className="md:col-span-2 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">Save Medication</button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {history.currentMedications.map(m => (
                    <div key={m.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">💊</div>
                          <div>
                             <h5 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{m.name}</h5>
                             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{m.dose} • {m.instructions}</p>
                          </div>
                       </div>
                       <button onClick={() => handleCeaseMed(m)} className="md:opacity-0 md:group-hover:opacity-100 px-4 py-3 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-xl hover:bg-rose-100 transition-all">Cease</button>
                    </div>
                  ))}
                  {history.currentMedications.length === 0 && <p className="text-slate-400 italic text-center py-10">No active medications logged.</p>}
                </div>
             </section>

             <section className="space-y-6">
                <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest border-b pb-4 border-slate-50">Allergies</h3>
                <div className="flex flex-wrap gap-3">
                  {history.allergies.map((a, i) => (
                    <div key={i} className="px-6 py-4 bg-rose-50 text-rose-700 rounded-[2rem] text-xs font-black border border-rose-100 uppercase tracking-widest flex items-center gap-2">🚫 {a}</div>
                  ))}
                  <button onClick={() => { const a = prompt("New Allergy?"); if(a) updateHistory({ allergies: [...history.allergies, a] }); }} className="px-6 py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 transition-all">+ Add Allergy</button>
                </div>
             </section>
          </div>
        )}

        {/* REPORTS/LETTERS TAB - AI SCANNING FEATURE */}
        {activeTab === 'reports' && (
          <div className="p-6 md:p-12 space-y-10 animate-in slide-in-from-right-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-indigo-50/50 p-8 rounded-[3rem] border border-indigo-100">
                <div className="space-y-1">
                   <h3 className="text-2xl font-black text-slate-800">Clinic Letters</h3>
                   <p className="text-sm font-medium text-slate-500 italic">Scan a document to automatically update Care Team, Meds, and History.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <button 
                    onClick={() => reportInputRef.current?.click()} 
                    disabled={reportLoading} 
                    className="flex-1 sm:flex-none px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                   >
                     {reportLoading ? 'Analyzing...' : '📸 Scan & Auto-Sync'}
                     {!reportLoading && <span className="text-lg">✨</span>}
                   </button>
                   <input type="file" ref={reportInputRef} onChange={handleReportUpload} className="hidden" accept="image/*" />
                   <button 
                    onClick={() => setShowReportForm(!showReportForm)} 
                    className="px-6 py-4 bg-white text-slate-500 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-slate-200"
                   >
                    Manual
                   </button>
                </div>
             </div>

             {showReportForm && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input placeholder="Specialist Name" value={newManualReport.specialist} onChange={e => setNewManualReport({...newManualReport, specialist: e.target.value})} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 font-bold" />
                    <input type="date" value={newManualReport.date} onChange={e => setNewManualReport({...newManualReport, date: e.target.value})} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 font-black uppercase text-xs" />
                  </div>
                  <textarea placeholder="Visit Summary / Outcome" value={newManualReport.summary} onChange={e => setNewManualReport({...newManualReport, summary: e.target.value})} className="w-full h-40 p-6 rounded-2xl border border-slate-100 bg-slate-50/50 resize-none font-bold italic shadow-inner" />
                  <button onClick={() => { if(newManualReport.specialist && newManualReport.summary) { updateHistory({ medicalReports: [...(history.medicalReports || []), { ...newManualReport, id: Math.random().toString(36).substr(2, 9) } as MedicalReport] }); setShowReportForm(false); setNewManualReport({specialist: '', summary: ''}); } }} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl tracking-widest">Add Report Entry</button>
                </div>
             )}

             <div className="grid grid-cols-1 gap-6">
                {history.medicalReports?.slice().reverse().map(report => (
                  <div key={report.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                     <div className="flex gap-5">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl border border-indigo-100">✉️</div>
                        <div>
                           <h5 className="text-xl font-black text-slate-800 tracking-tight">{report.specialist}</h5>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documented {report.date}</p>
                        </div>
                     </div>
                     <div className="bg-slate-50/50 p-8 rounded-[2.5rem] space-y-6 border border-slate-50">
                        <p className="text-lg text-slate-700 leading-relaxed font-bold italic border-l-4 border-indigo-200 pl-8">{report.summary}</p>
                        {report.actionItems && report.actionItems.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                             {report.actionItems.map((item, i) => <span key={i} className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-50 shadow-sm">✓ {item}</span>)}
                          </div>
                        )}
                        {report.photoUrl && (
                          <button 
                            onClick={() => window.open(report.photoUrl)} 
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest underline hover:text-indigo-800"
                          >
                            View Scanned Attachment
                          </button>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* CARE TEAM TAB */}
        {activeTab === 'mdt' && (
          <div className="p-6 md:p-12 space-y-12">
             <div className="flex justify-between items-center border-b pb-6 border-slate-50">
                <h3 className="text-2xl font-black text-slate-800">Care Team</h3>
                <button onClick={() => setShowTeamForm(!showTeamForm)} className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest">{showTeamForm ? 'Cancel' : '+ Add Specialist'}</button>
             </div>

             {showTeamForm && (
                <div className="bg-emerald-50/50 p-10 rounded-[3rem] border border-emerald-100 space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input placeholder="Provider Name" value={newSpecialist.name} onChange={e => setNewSpecialist({...newSpecialist, name: e.target.value})} className="p-5 rounded-2xl border border-emerald-200 font-bold" />
                    <input placeholder="Specialty" value={newSpecialist.specialty} onChange={e => setNewSpecialist({...newSpecialist, specialty: e.target.value})} className="p-5 rounded-2xl border border-emerald-200 font-bold" />
                    <input placeholder="Hospital / Clinic" value={newSpecialist.hospital} onChange={e => setNewSpecialist({...newSpecialist, hospital: e.target.value})} className="p-5 rounded-2xl border border-emerald-200 font-bold" />
                    <select value={newSpecialist.category} onChange={e => setNewSpecialist({...newSpecialist, category: e.target.value as any})} className="p-5 rounded-2xl border border-emerald-200 font-black">
                      <option value="Medical">Medical Specialist</option>
                      <option value="Allied Health">Allied Health / Therapy</option>
                    </select>
                  </div>
                  <button onClick={() => { if(newSpecialist.name) { updateHistory({ specialists: [...history.specialists, { ...newSpecialist, id: Math.random().toString(36).substr(2, 9) } as SpecialistContact] }); setShowTeamForm(false); setNewSpecialist({name: '', specialty: '', category: 'Medical'}); } }} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">Add Member to Hub</button>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.specialists.map(s => (
                  <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-100 transition-all">
                     <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner ${s.category === 'Medical' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                        {s.category === 'Medical' ? '👨‍⚕️' : '🫂'}
                     </div>
                     <div>
                        <h5 className="text-xl font-black text-slate-800 tracking-tight">{s.name}</h5>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{s.specialty}</p>
                        {s.hospital && <p className="text-xs text-slate-400 font-bold mt-1">📍 {s.hospital}</p>}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* GEAR/DEVICES TAB */}
        {activeTab === 'gear' && (
          <div className="p-6 md:p-12 space-y-10 animate-in slide-in-from-right-4">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Medical Equipment</h3>
                <button onClick={() => setShowGearForm(!showGearForm)} className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest">{showGearForm ? 'Cancel' : '+ Add Device'}</button>
             </div>

             {showGearForm && (
                <div className="bg-indigo-50/50 p-10 rounded-[3rem] border border-indigo-100 space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input placeholder="Device (e.g. CPAP, Gastrostomy)" value={newDevice.type} onChange={e => setNewDevice({...newDevice, type: e.target.value})} className="p-5 rounded-2xl border border-indigo-200 font-bold" />
                    <input placeholder="Size / Serial / Notes" value={newDevice.model} onChange={e => setNewDevice({...newDevice, model: e.target.value})} className="p-5 rounded-2xl border border-indigo-200 font-bold" />
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Next Change Date</label>
                       <input type="date" value={newDevice.nextChangeDue} onChange={e => setNewDevice({...newDevice, nextChangeDue: e.target.value})} className="w-full p-5 rounded-2xl border border-indigo-200 uppercase text-xs font-black" />
                    </div>
                  </div>
                  <button onClick={() => { if(newDevice.type) { updateHistory({ devices: [...(history.devices || []), { ...newDevice, id: Math.random().toString(36).substr(2, 9) } as MedicalDevice] }); setShowGearForm(false); setNewDevice({type: ''}); } }} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl tracking-widest">Register Equipment</button>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.devices?.map(device => (
                  <div key={device.id} className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 flex flex-col justify-between h-full hover:border-indigo-100 transition-all">
                     <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">⚙️</div>
                        <div>
                           <h5 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{device.type}</h5>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{device.model || 'Standard Size'}</p>
                        </div>
                     </div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Maintenance Schedule</p>
                        <p className="text-sm font-bold text-slate-700">Next Change: {device.nextChangeDue || 'Not Set'}</p>
                     </div>
                  </div>
                ))}
                {history.devices?.length === 0 && <p className="col-span-2 text-center text-slate-400 italic py-10">No specialized equipment logged.</p>}
             </div>
          </div>
        )}

        {/* SICK DAY PLAN TAB */}
        {activeTab === 'sickday' && (
          <div className="p-6 md:p-12 space-y-12">
             <div className="bg-rose-600 p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl pointer-events-none">🚨</div>
                <div className="relative z-10 space-y-10">
                   <div className="flex flex-col gap-6">
                      <div className="space-y-2">
                        <h4 className="text-4xl font-black italic tracking-tighter leading-none">Sick Day Protocol</h4>
                        <p className="text-rose-100 text-sm font-medium italic">Validated clinical instructions for managing common complex conditions.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(SICK_DAY_TEMPLATES).map(key => (
                          <button key={key} onClick={() => applySickDayTemplate(key)} className="px-5 py-3 bg-white/20 rounded-2xl text-[10px] font-black uppercase hover:bg-white/40 transition-all border border-white/20 shadow-lg">Apply {key} Plan</button>
                        ))}
                      </div>
                   </div>
                   <textarea 
                    value={history.sickDayPlan.instructions}
                    onChange={e => updateHistory({ sickDayPlan: { ...history.sickDayPlan, instructions: e.target.value } })}
                    className="w-full h-[400px] p-8 md:p-12 rounded-[3.5rem] bg-white text-slate-800 font-black text-lg md:text-2xl leading-relaxed italic shadow-2xl outline-none focus:ring-4 focus:ring-white/20 resize-none"
                    placeholder="Urgent clinical instructions (e.g., 4x4 Asthma)..."
                   />
                </div>
             </div>

             <section className="space-y-6">
                <div className="flex flex-col gap-4">
                  <h5 className="text-2xl font-black text-slate-800 tracking-tight">Physical Sick Day Plan Backup</h5>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={sickPlanPhotoRef} onChange={handleSickDayPhotoUpload} />
                    <button 
                      onClick={() => sickPlanPhotoRef.current?.click()}
                      className="flex-1 px-10 py-5 bg-indigo-50 text-indigo-700 rounded-[2rem] text-xs font-black uppercase tracking-widest border-2 border-dashed border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center gap-3"
                    >
                      📸 {history.sickDayPlan.planPhoto ? 'Update Document' : 'Photograph Official Plan'}
                    </button>
                    {history.sickDayPlan.planPhoto && (
                      <button 
                        onClick={() => updateHistory({ sickDayPlan: { ...history.sickDayPlan, planPhoto: undefined } })}
                        className="px-10 py-5 bg-rose-50 text-rose-600 rounded-[2rem] text-xs font-black uppercase border border-rose-100 tracking-widest"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {history.sickDayPlan.planPhoto && (
                  <div className="relative group animate-in zoom-in-95">
                    <img src={history.sickDayPlan.planPhoto} alt="Physical Plan" className="w-full h-auto rounded-[4rem] border-8 border-white shadow-2xl" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[4rem] pointer-events-none flex items-center justify-center font-black text-white text-lg">Click to Inspect</div>
                  </div>
                )}
             </section>
          </div>
        )}
      </div>

      {/* ISBAR HANDOVER DISPLAY */}
      {aiAnalysis && (
        <div className="bg-slate-900 p-10 md:p-16 rounded-[4rem] text-white shadow-2xl mt-12 animate-in zoom-in-95 border-l-[20px] md:border-l-[30px] border-l-indigo-600 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full opacity-10 blur-[100px]"></div>
           <div className="flex flex-col md:flex-row items-center justify-between mb-12 relative z-10 gap-8">
              <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter text-indigo-100">ISBAR <span className="text-indigo-500">Handover</span></h3>
              <button onClick={() => {navigator.clipboard.writeText(aiAnalysis.text); alert("ISBAR Handover copied to clipboard!");}} className="w-full md:w-auto px-12 py-6 bg-indigo-600 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl border border-indigo-400 active:scale-95 transition-all">Copy Handover for Clinician</button>
           </div>
           <div className="relative z-10 whitespace-pre-wrap text-xl md:text-3xl font-bold italic leading-relaxed text-indigo-50 border-l-8 border-white/5 pl-8 md:pl-16">
            {aiAnalysis.text}
           </div>
        </div>
      )}
    </div>
  );
};
