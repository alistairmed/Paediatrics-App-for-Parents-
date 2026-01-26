
import React, { useRef, useState } from 'react';
import { SickDayPlan } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useRole } from '../context/RoleContext';

const SICK_DAY_TEMPLATES: Record<string, Partial<SickDayPlan>> = {
  asthma: {
    greenZone: "Child is well. No symptoms. Continue regular preventer if prescribed.",
    yellowZone: "Symptoms: Coughing, wheezing, or tight chest.\n1. Administer 4 puffs of blue reliever via spacer.\n2. Wait 4 minutes.\n3. Repeat if no improvement.\n4. Call GP for review.",
    redZone: "EMERGENCY: Struggling to breathe, sucking in at throat, or reliever not working for >2 hours.",
    backgroundForED: "Child has persistent asthma requiring secondary prevention.",
    triggers: "Viral colds, exercise, smoke, weather changes.",
    emergencyMeds: "Salbutamol 100mcg via spacer.",
    ambulanceTriggers: "Too breathless to speak, blue lips, silent chest, or no improvement with rescue doses.",
    dangerSigns: "Tugging at the neck, sucking in between ribs, pale skin.",
    carerActions: "Keep child upright. Administer 4:4:4 asthma first aid."
  },
  epilepsy: {
    greenZone: "Seizure free. Normal activity. Maintenance AEDs as prescribed.",
    yellowZone: "Increased seizure frequency or prolonged absence seizures.",
    redZone: "Generalized Tonic-Clonic seizure > 5 minutes or repeated seizures without regaining consciousness.",
    emergencyMeds: "Midazolam (Buccal/Intranasal) as prescribed.",
    ambulanceTriggers: "Seizure > 5 mins, first ever seizure, airway compromise, or breathing fails to return to normal.",
    dangerSigns: "Status epilepticus, cyanosis (turning blue), seizure during swimming/eating.",
    carerActions: "Time the seizure. Clear the area. Recovery position once finished. Do not put anything in mouth."
  },
  diabetes_t1: {
    greenZone: "BGL 4.0 - 8.0 mmol/L. Normal diet and insulin routine.",
    yellowZone: "BGL > 15.0 mmol/L with trace ketones or BGL < 3.9 mmol/L (Hypo).",
    redZone: "Persistent vomiting, inability to eat/drink, or moderate/large ketones (DKA risk).",
    emergencyMeds: "Glucagon injection (for severe hypo), Fast-acting glucose (jelly beans).",
    ambulanceTriggers: "Unconscious, seizure, or breathing is heavy/fruity (Kussmaul breathing).",
    dangerSigns: "Abdominal pain, nausea, confusion, rapid weight loss.",
    carerActions: "Check BGL and ketones every 2 hours. Follow specific hypo protocol."
  },
  croup: {
    greenZone: "Mild barking cough, no noisy breathing at rest.",
    yellowZone: "Noisy breathing (stridor) when upset or active. Barking cough worsening.",
    redZone: "Stridor (whistling) when quiet/at rest. Sucking in at throat.",
    emergencyMeds: "Prednisolone/Dexamethasone (if prescribed).",
    ambulanceTriggers: "Unable to drink, blue lips, silent breathing despite effort, or unusually sleepy.",
    dangerSigns: "Stridor at rest, tracheal tug, sternal recession.",
    carerActions: "Stay calm. Keep child calm. Do not examine throat."
  },
  generic_viral: {
    greenZone: "Happy, hydrated, normal behavior. Fever managed.",
    yellowZone: "Fever > 38.5, mild dehydration, refusing food but drinking.",
    redZone: "Non-blanching rash, altered consciousness, high-pitched cry.",
    emergencyMeds: "Paracetamol, Ibuprofen.",
    ambulanceTriggers: "Fits (Febrile convulsions), blue appearance, or won't wake up.",
    dangerSigns: "Purple spots, stiff neck, bulging soft spot (infants).",
    carerActions: "Encourage fluids. Monitor wet nappies. Do not overdress."
  }
};

export const SickDayPlanView: React.FC = () => {
  const { history, updateHistory } = useMedicalHistory();
  const { role } = useRole();
  const planPhotoRef = useRef<HTMLInputElement>(null);
  const [draftText, setDraftText] = useState('');

  const handlePlanPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateHistory({ sickDayPlan: { ...history.sickDayPlan, planPhoto: reader.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplySickDayTemplate = (type: string) => {
    const template = SICK_DAY_TEMPLATES[type];
    if (template) {
      updateHistory({ sickDayPlan: { ...history.sickDayPlan, ...template } });
    }
  };

  const updateSickDayField = (field: keyof SickDayPlan, value: string) => {
    updateHistory({ sickDayPlan: { ...history.sickDayPlan, [field]: value } });
  };

  const copyPlanToClipboard = () => {
    const p = history.sickDayPlan;
    const text = `PEDIPULSE SICK DAY ACTION PLAN
Generated: ${new Date().toLocaleDateString()}

*** EMERGENCY: CALL 000 / AMBULANCE IF ***
${p.ambulanceTriggers || 'Not specified'}

DANGER SIGNS:
${p.dangerSigns || 'Not specified'}

CARER ACTIONS:
${p.carerActions || 'Not specified'}

-------------------------------------------
GREEN ZONE (WELL):
${p.greenZone || 'Follow standard routine'}

YELLOW ZONE (UNWELL/ESCALATE):
${p.yellowZone || 'Monitor closely, consult GP'}

RED ZONE (CRITICAL/ED):
${p.redZone || 'Seek immediate emergency review'}

BACKGROUND FOR STAFF:
${p.backgroundForED || 'None specified'}

RESCUE MEDS: ${p.emergencyMeds || 'None'}
FLUID REQS: ${p.fluidRequirements || 'Standard'}
-------------------------------------------`;
    
    navigator.clipboard.writeText(text);
    alert("Full plan copied to clipboard. Ready for hospital handover or clinical documentation.");
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 italic tracking-tight">Sick Day <span className="text-rose-600">Action Plan</span></h2>
          <p className="text-slate-500 font-medium italic mt-1">Personalized clinical guidelines for acute illness management.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={copyPlanToClipboard}
                className="px-6 py-4 bg-indigo-50 text-indigo-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 shadow-sm transition-all flex items-center gap-2"
            >
                <span>📋</span> Copy Text
            </button>
            <button 
                onClick={() => planPhotoRef.current?.click()}
                className="px-6 py-4 bg-white border-2 border-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 text-slate-900 shadow-sm transition-all flex items-center gap-2"
            >
                <span>📷</span> {history.sickDayPlan.planPhoto ? 'Update Photo' : 'Capture Physical Plan'}
            </button>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={planPhotoRef} onChange={handlePlanPhotoUpload} />
        </div>
      </header>

      {role === 'clinician' && (
        <section className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-black italic tracking-tighter">Clinician Plan Workbench</h3>
              <div className="flex flex-wrap gap-2">
                 {Object.keys(SICK_DAY_TEMPLATES).map(k => (
                    <button key={k} onClick={() => handleApplySickDayTemplate(k)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[8px] font-black uppercase border border-white/10 transition-all">
                      {k.replace('_', ' ')}
                    </button>
                 ))}
              </div>
           </div>
           <textarea 
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            placeholder="DRAFTING AREA: Paste your hospital discharge macros or raw plan text here to copy/paste into specific fields below..."
            className="w-full h-32 bg-white/5 rounded-2xl p-6 font-bold italic text-indigo-100 border border-white/10 shadow-inner outline-none focus:bg-white/10 transition-all text-sm"
           />
           <div className="flex justify-between items-center px-4">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Workspace for clinical drafting only</p>
              <button onClick={() => setDraftText('')} className="text-[9px] font-black text-slate-500 uppercase hover:text-white">Clear Draft</button>
           </div>
        </section>
      )}

      <div className="bg-rose-600 p-8 sm:p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 space-y-10">
            <div className="grid grid-cols-1 gap-8">
                {/* EMERGENCY / AMBULANCE SECTION */}
                <div className="bg-white p-10 rounded-[3rem] border-l-[24px] border-l-rose-800 space-y-8 shadow-2xl text-slate-800">
                    <div className="flex items-center gap-4">
                       <span className="text-5xl animate-pulse">🚑</span>
                       <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-600 leading-none">Emergency Threshold</p>
                          <h3 className="text-2xl font-black italic tracking-tighter uppercase mt-1">When to call an ambulance (000)</h3>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Critical Triggers (Specific to this child)</label>
                        <textarea 
                          value={history.sickDayPlan.ambulanceTriggers} 
                          onChange={e => updateSickDayField('ambulanceTriggers', e.target.value)}
                          className="w-full h-32 p-6 rounded-2xl bg-rose-50 text-rose-900 font-black text-lg italic outline-none border border-rose-100 shadow-inner focus:ring-4 focus:ring-rose-200 transition-all placeholder:text-rose-200"
                          placeholder="e.g. Seizure > 5 mins, cyanosis, stridor at rest, unable to wake..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Specific Danger Signs</p>
                           <textarea 
                             value={history.sickDayPlan.dangerSigns} 
                             onChange={e => updateSickDayField('dangerSigns', e.target.value)}
                             className="w-full h-28 p-5 rounded-2xl bg-slate-50 text-slate-800 font-bold text-sm italic outline-none border border-slate-100 shadow-inner"
                             placeholder="e.g. Tracheal tug, non-blanching rash, lethargy..."
                           />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Carer Actions Needed</p>
                           <textarea 
                             value={history.sickDayPlan.carerActions} 
                             onChange={e => updateSickDayField('carerActions', e.target.value)}
                             className="w-full h-28 p-5 rounded-2xl bg-slate-50 text-slate-800 font-bold text-sm italic outline-none border border-slate-100 shadow-inner"
                             placeholder="e.g. Recovery position, keep upright, administer EpiPen..."
                           />
                        </div>
                      </div>
                    </div>
                </div>

                {/* YELLOW ZONE */}
                <div className="bg-amber-500/20 p-8 rounded-[3rem] border border-amber-400/30 space-y-4 shadow-inner">
                    <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]"></span>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Yellow Zone: Escalation Required</p>
                    </div>
                    <textarea 
                    value={history.sickDayPlan.yellowZone} 
                    onChange={e => updateSickDayField('yellowZone', e.target.value)}
                    className="w-full h-32 p-6 rounded-2xl bg-white/10 text-white font-bold text-base italic outline-none border border-white/10 shadow-inner focus:bg-white/20 transition-all"
                    placeholder="Escalation steps: increase doses, call specialist/GP..."
                    />
                </div>

                {/* GREEN ZONE */}
                <div className="bg-emerald-500/20 p-8 rounded-[3rem] border border-emerald-400/30 space-y-4 shadow-inner">
                    <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]"></span>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Green Zone: Maintenance / Well</p>
                    </div>
                    <textarea 
                    value={history.sickDayPlan.greenZone} 
                    onChange={e => updateSickDayField('greenZone', e.target.value)}
                    className="w-full h-24 p-6 rounded-2xl bg-white/10 text-white font-bold text-base italic outline-none border border-white/10 shadow-inner focus:bg-white/20 transition-all"
                    placeholder="Routine unwell care when clinical signs are stable..."
                    />
                </div>
            </div>

            {/* Background for ED / Responders */}
            <div className="bg-slate-900/50 p-10 rounded-[3.5rem] border border-white/10 space-y-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <span className="text-3xl">🛡️</span>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 text-rose-100">Handover Context for ED Staff</p>
                        <p className="text-[9px] font-bold text-rose-100/50 uppercase">Vital for non-regular doctors</p>
                    </div>
                </div>
                <textarea 
                value={history.sickDayPlan.backgroundForED} 
                onChange={e => updateSickDayField('backgroundForED', e.target.value)}
                className="w-full h-24 p-6 rounded-2xl bg-white/5 text-white font-bold text-base italic outline-none border border-white/10 shadow-inner focus:bg-white/10 transition-all"
                placeholder="Vital context for doctors who don't know your child (e.g. 'Difficult Airway', 'Immunosuppressed')..."
                />
            </div>

            {/* Standard Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { label: 'Primary Illness Triggers', field: 'triggers', icon: '⚡' },
                    { label: 'Rescue Medications', field: 'emergencyMeds', icon: '💊' },
                    { label: 'Specific Fluid Goals', field: 'fluidRequirements', icon: '💧' },
                    { label: 'Direct Specialist Contact', field: 'emergencyContact', icon: '📞' }
                ].map((item) => (
                    <div key={item.field} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-3 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                            <span className="text-lg opacity-70">{item.icon}</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{item.label}</p>
                        </div>
                        <input 
                            className="w-full bg-transparent border-none outline-none font-black text-lg placeholder-white/20 text-white" 
                            placeholder="..."
                            value={(history.sickDayPlan as any)[item.field]} 
                            onChange={e => updateSickDayField(item.field as any, e.target.value)} 
                        />
                    </div>
                ))}
            </div>

            {/* Physical Photo Reference */}
            {history.sickDayPlan.planPhoto && (
                <div className="pt-10 border-t border-white/10 space-y-6">
                <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📸</span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Attached Physical Reference</p>
                    </div>
                    <button onClick={() => updateSickDayField('planPhoto', '')} className="text-[10px] font-black uppercase text-rose-300 hover:text-white transition-colors">Remove Photo</button>
                </div>
                <div className="p-2 bg-white rounded-[3rem] shadow-2xl border-4 border-rose-400/30 overflow-hidden">
                    <img src={history.sickDayPlan.planPhoto} alt="Physical Plan" className="w-full rounded-[2.5rem] object-cover max-h-[600px]" />
                </div>
                </div>
            )}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg flex items-center gap-8">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-rose-100">💡</div>
        <div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">Parenting Strategy</h4>
            <p className="text-slate-500 font-medium leading-relaxed italic max-w-2xl mt-1">
                "Keep this document updated after every hospital admission or specialist visit. Having clear ambulance triggers helps reduce decision fatigue during a crisis."
            </p>
        </div>
      </div>
    </div>
  );
};
