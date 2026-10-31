
import React, { useRef } from 'react';
import { SickDayPlan } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useToast } from '../context/ToastContext';
import { readImageAsCompressedDataUrl } from '../utils/image';

export const SickDayPlanView: React.FC = () => {
  const { history, updateHistory } = useMedicalHistory();
  const { showToast } = useToast();
  const planPhotoRef = useRef<HTMLInputElement>(null);

  const handlePlanPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const planPhoto = await readImageAsCompressedDataUrl(file);
      updateHistory({ sickDayPlan: { ...history.sickDayPlan, planPhoto } });
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
    
    navigator.clipboard.writeText(text).then(
      () => showToast("Full plan copied to the clipboard, ready to paste into a handover."),
      () => showToast("Couldn't copy to the clipboard.", 'error')
    );
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-28">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">Sick Day <span className="text-rose-700">Action Plan</span></h2>
          <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">Personalized clinical guidelines for acute illness management.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button 
                onClick={copyPlanToClipboard}
                className="flex-1 md:flex-none px-4 py-3 min-h-[44px] bg-indigo-50 text-indigo-800 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 shadow-sm transition-all flex items-center justify-center gap-2"
            >
                <span>📋</span> Copy Text
            </button>
            <button 
                onClick={() => planPhotoRef.current?.click()}
                className="flex-1 md:flex-none px-4 py-3 min-h-[44px] bg-white border-2 border-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 text-slate-900 shadow-sm transition-all flex items-center justify-center gap-2"
            >
                <span>📷</span> {history.sickDayPlan.planPhoto ? 'Update Photo' : 'Capture Photo'}
            </button>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={planPhotoRef} onChange={handlePlanPhotoUpload} />
        </div>
      </header>

      <div className="bg-rose-800 p-5 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 space-y-6 sm:space-y-10">
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
                {/* EMERGENCY / AMBULANCE SECTION */}
                <div className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-l-[12px] sm:border-l-[24px] border-l-rose-800 space-y-6 sm:space-y-8 shadow-2xl text-slate-800">
                    <div className="flex items-center gap-3 sm:gap-4">
                       <span className="text-3xl sm:text-5xl animate-pulse">🚑</span>
                       <div>
                          <p className="text-xs font-black uppercase tracking-widest text-rose-700 leading-none">Emergency Threshold</p>
                          <h3 className="text-lg sm:text-2xl font-black tracking-tighter uppercase mt-1">When to call an ambulance (000)</h3>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="sickda-critical-triggers-specific-to-" className="text-xs font-black text-rose-700 uppercase tracking-widest ml-1">Critical Triggers (Specific to this child)</label>
                        <textarea id="sickda-critical-triggers-specific-to-" 
                          value={history.sickDayPlan.ambulanceTriggers} 
                          onChange={e => updateSickDayField('ambulanceTriggers', e.target.value)}
                          className="w-full h-32 p-4 sm:p-6 rounded-2xl bg-rose-50 text-rose-900 font-black text-base sm:text-lg outline-none border border-rose-100 shadow-inner focus:ring-4 focus:ring-rose-200 transition-all placeholder:text-rose-200"
                          placeholder="e.g. Seizure > 5 mins, cyanosis, stridor at rest, unable to wake..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                           <p className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Specific Danger Signs</p>
                           <textarea 
                             value={history.sickDayPlan.dangerSigns} 
                             onChange={e => updateSickDayField('dangerSigns', e.target.value)}
                             className="w-full h-28 p-4 sm:p-5 rounded-2xl bg-slate-50 text-slate-800 font-bold text-sm outline-none border border-slate-100 shadow-inner"
                             placeholder="e.g. Tracheal tug, non-blanching rash, lethargy..."
                           />
                        </div>
                        <div className="space-y-2">
                           <p className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Carer Actions Needed</p>
                           <textarea 
                             value={history.sickDayPlan.carerActions} 
                             onChange={e => updateSickDayField('carerActions', e.target.value)}
                             className="w-full h-28 p-4 sm:p-5 rounded-2xl bg-slate-50 text-slate-800 font-bold text-sm outline-none border border-slate-100 shadow-inner"
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
                    className="w-full h-32 p-6 rounded-2xl bg-white/10 text-white font-bold text-base outline-none border border-white/10 shadow-inner focus:bg-white/20 transition-all"
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
                    className="w-full h-24 p-6 rounded-2xl bg-white/10 text-white font-bold text-base outline-none border border-white/10 shadow-inner focus:bg-white/20 transition-all"
                    placeholder="Routine unwell care when clinical signs are stable..."
                    />
                </div>
            </div>

            {/* Background for ED / Responders */}
            <div className="bg-slate-900/50 p-10 rounded-[3.5rem] border border-white/10 space-y-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <span className="text-3xl">🛡️</span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80 text-rose-100">Handover Context for ED Staff</p>
                        <p className="text-xs font-bold text-rose-100 uppercase">Vital for non-regular doctors</p>
                    </div>
                </div>
                <textarea 
                value={history.sickDayPlan.backgroundForED} 
                onChange={e => updateSickDayField('backgroundForED', e.target.value)}
                className="w-full h-24 p-6 rounded-2xl bg-white/5 text-white font-bold text-base outline-none border border-white/10 shadow-inner focus:bg-white/10 transition-all"
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
                            <p className="text-xs font-black uppercase tracking-[0.2em]">{item.label}</p>
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
                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Attached Physical Reference</p>
                    </div>
                    <button onClick={() => updateSickDayField('planPhoto', '')} className="text-xs font-black uppercase text-rose-300 hover:text-white transition-colors">Remove Photo</button>
                </div>
                <div className="p-2 bg-white rounded-[3rem] shadow-2xl border-4 border-rose-400/30 overflow-hidden">
                    <img src={history.sickDayPlan.planPhoto} alt="Physical Plan" className="w-full rounded-[2.5rem] object-cover max-h-[600px]" />
                </div>
                </div>
            )}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg flex items-center gap-8">
        <div className="w-20 h-20 bg-rose-50 text-rose-700 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-rose-100">💡</div>
        <div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">Parenting Strategy</h4>
            <p className="text-slate-500 font-medium leading-relaxed max-w-2xl mt-1">
                "Keep this document updated after every hospital admission or specialist visit. Having clear ambulance triggers helps reduce decision fatigue during a crisis."
            </p>
        </div>
      </div>
    </div>
  );
};
