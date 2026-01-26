
import React from 'react';

export const EthicsSafety: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <header className="space-y-4">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Ethics & <span className="text-indigo-600">Safety Framework</span></h2>
        <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
          Our commitment to clinical safety, regulatory transparency, and equitable pediatric care.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🎯</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Intended Purpose</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
            PediPulse AI is a <strong>decision-support and health information tool</strong>. It is designed to assist caregivers in organizing information and recognizing potential clinical red flags. 
            <br/><br/>
            <strong>It is NOT intended for diagnosis, treatment, or the prevention of illness.</strong> It does not replace the judgment of a qualified medical professional.
          </p>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🛡️</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Safety Guardrails</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
            The application incorporates deterministic red-flag engines based on WHO (IMCI) and Australian (RCH) guidelines. 
            <br/><br/>
            In cases of conflicting information, the system is designed to <strong>bias toward clinical escalation</strong> and emergency review.
          </p>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🌍</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Equity & Global Health</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
            We provide a <strong>Low-Resource Setting Mode</strong> that applies conservative safety margins and simplified WHO-aligned danger signs, specifically optimized for environments with limited healthcare access.
          </p>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🔒</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Privacy & Data Sovereignty</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
            <strong>Data remains on your device.</strong> PediPulse AI stores sensitive health data locally. No diagnostic data is transmitted to remote servers unless explicitly exported as a clinical handover by the user.
          </p>
        </section>
      </div>

      <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
        <div className="relative z-10 space-y-6">
           <h4 className="text-2xl font-black italic tracking-tighter">Regulatory Alignment (Australia)</h4>
           <p className="text-slate-300 text-sm leading-relaxed max-w-2xl font-medium">
             PediPulse AI follows the <strong>TGA (Therapeutic Goods Administration)</strong> guidance for software that is NOT a medical device. By providing informational support only and explicitly excluding diagnostic functionality, the app adheres to current Australian regulatory frameworks for digital health tools.
           </p>
        </div>
      </div>
    </div>
  );
};
