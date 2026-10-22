
import React from 'react';

export const RegulatoryRisk: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <header className="space-y-4">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Regulatory & <span className="text-indigo-600">Risk Audit</span></h2>
        <p className="text-slate-500 font-medium max-w-2xl leading-relaxed italic">
          Formal TGA Self-Classification, Clinical Risk Register (ISO 14971-Lite), and Governance SOP.
        </p>
      </header>

      {/* PART A: TGA Self-Classification */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🇦🇺</div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Part A: TGA Self-Classification</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Australia (Regulatory Posture)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-4">
            <div>
              <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] mb-1">Intended Purpose</h4>
              <p className="text-slate-600 leading-relaxed font-medium italic">
                Support caregivers and clinicians by organising paediatric health information, highlighting potential red flags, and assisting preparation for medical review. 
                <strong> Does not diagnose disease, recommend treatment, or replace clinical judgment.</strong>
              </p>
            </div>
            <div>
              <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] mb-1">Intended Users</h4>
              <p className="text-slate-600 font-medium">• Parents & Caregivers<br/>• Healthcare Professionals (Clinician Mode)</p>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] mb-4 text-center">TGA SaMD Assessment</h4>
            <div className="space-y-3">
              {[
                { label: 'Provides health information', status: true },
                { label: 'Supports clinical decisions', status: true },
                { label: 'Makes diagnosis/treatment decisions', status: false },
                { label: 'Replaces clinician judgment', status: false },
                { label: 'Directly controls therapy', status: false },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-500">{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-lg font-black uppercase text-[8px] ${item.status ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.status ? 'Yes' : 'No'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-[10px] font-black text-indigo-600 uppercase">Conclusion: Non-Regulated Software</p>
            </div>
          </div>
        </div>
      </section>

      {/* PART B: Clinical Risk Register */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📋</div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Part B: Clinical Risk Register</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ISO 14971-Lite Principles</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-4 pb-2">Hazard / Risk</th>
                <th className="px-4 pb-2">Severity</th>
                <th className="px-4 pb-2">Likelihood</th>
                <th className="px-4 pb-2">Residual</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                { hazard: 'Missed Serious Illness', sev: 'High', like: 'Possible', res: 'Low-Mod' },
                { hazard: 'Medication Overdose', sev: 'High', like: 'Possible', res: 'Low' },
                { hazard: 'Low-Resource Settings Error', sev: 'Mod', like: 'Likely', res: 'Low' },
                { hazard: 'Diagnostic Misinterpretation', sev: 'Mod', like: 'Possible', res: 'Low' },
                { hazard: 'Data Privacy Breach', sev: 'Mod', like: 'Rare', res: 'Low' },
              ].map((row, i) => (
                <tr key={i} className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 rounded-l-2xl font-black text-slate-800">{row.hazard}</td>
                  <td className="px-4 py-4"><span className={`font-black uppercase text-[9px] ${row.sev === 'High' ? 'text-rose-600' : 'text-amber-600'}`}>{row.sev}</span></td>
                  <td className="px-4 py-4 font-bold text-slate-500">{row.like}</td>
                  <td className="px-4 py-4 rounded-r-2xl font-black text-indigo-600">{row.res}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PART C: Version Control & Change Log */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📅</div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Part C: Version Control</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Controlled Audit Trail</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 font-black text-slate-400 uppercase tracking-widest">Ver</th>
                <th className="py-3 font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="py-3 font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="py-3 font-black text-slate-400 uppercase tracking-widest">Impact</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-600">
              <tr className="border-b border-slate-50">
                <td className="py-4 font-black">1.0</td>
                <td className="py-4">Initial</td>
                <td className="py-4 italic">TGA self-classification and risk register</td>
                <td className="py-4"><span className="text-[10px] font-black uppercase text-slate-400">Baseline</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* PART D: IMCI Mapping Table */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🌍</div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Part D: IMCI Mapping</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">WHO Guidelines Alignment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-8 rounded-3xl border border-slate-100">
          {[
            { sign: 'Not able to drink', trigger: 'Symptom: "not drinking"', action: 'Urgent Escalation' },
            { sign: 'Vomits everything', trigger: 'Symptom: "vomiting everything"', action: 'Urgent Escalation' },
            { sign: 'Convulsions', trigger: 'Symptom: "convulsions"', action: 'Urgent Escalation' },
            { sign: 'Lethargic/Unconscious', trigger: 'Symptom: "lethargic"', action: 'Urgent Escalation' },
            { sign: 'Fever in Young Infant', trigger: 'Age <3mo + Fever ≥38°C', action: 'Urgent Escalation' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2 shadow-sm">
              <h5 className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{item.sign}</h5>
              <p className="text-[10px] text-slate-400 font-bold italic">{item.trigger}</p>
              <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                 <span className="text-[9px] font-black uppercase text-rose-600">{item.action}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PART E: Clinical Governance SOP */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl shadow-inner">⚖️</div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Part E: Clinical Governance SOP</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logic Change Approval Process</p>
          </div>
        </div>

        <div className="space-y-6">
           {[
             { step: '1', title: 'Identification', desc: 'Bug fix, safety improvement, or evidence update identified.' },
             { step: '2', title: 'Impact Assessment', desc: 'Does the change alter escalation thresholds or shift SaMD classification?' },
             { step: '3', title: 'Clinical Review', desc: 'Safety impact assessed; confirm non-diagnostic framing is preserved.' },
             { step: '4', title: 'Verification', desc: 'Relevant clinical tests updated; governance logs reviewed.' },
           ].map((s, i) => (
             <div key={i} className="flex gap-6 items-start">
               <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shrink-0 border border-indigo-100 shadow-sm">{s.step}</div>
               <div>
                  <h5 className="font-black text-slate-800 text-sm">{s.title}</h5>
                  <p className="text-xs text-slate-500 font-medium italic mt-1 leading-relaxed">{s.desc}</p>
               </div>
             </div>
           ))}
        </div>
      </section>

      <div className="bg-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
        <div className="relative z-10 space-y-4">
          <h4 className="text-2xl font-black italic tracking-tighter">Regulatory Position Statement</h4>
          <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl font-medium italic opacity-90">
            "PediPulse AI is positioned as a decision-support and information tool, not a medical device, in accordance with TGA software guidance. All residual risks are considered acceptable for a non-diagnostic educational and informational application."
          </p>
          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Version 1.0</span>
             <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Scope: Pilot / Educational</span>
          </div>
        </div>
      </div>
    </div>
  );
};
