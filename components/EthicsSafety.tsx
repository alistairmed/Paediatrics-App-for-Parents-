
import React from 'react';
import { AI_ENABLED } from '../config/features';
import { PasscodeSettings } from './PasscodeSettings';
import { BackupRestore } from './BackupRestore';
import { AiConsentSettings } from './AiConsent';

export const EthicsSafety: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <header className="space-y-4">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Privacy, Backup <span className="text-indigo-600">&amp; Safety</span></h2>
        <p className="text-slate-600 font-medium max-w-2xl leading-relaxed">
          How PediPulse keeps your child's records private, what it does and doesn't do, and how to back up or lock your records.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🎯</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Intended Purpose</h3>
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            PediPulse is a <strong>record-keeping and general health information tool</strong> for parents and carers. It helps you keep your child's health records in one place and find trusted general information.
            <br/><br/>
            <strong>It does not diagnose, assess symptoms or calculate doses</strong>, and it doesn't replace advice from your child's doctor, nurse or pharmacist.
          </p>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🛡️</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Safety</h3>
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            PediPulse <strong>doesn't calculate doses, assess symptoms or score checklists</strong>. "When to Get Help" links to the Royal Children's Hospital fact sheets and lists 000, healthdirect and the Poisons Information Centre.
            <br/><br/>
            AI features are off in this version. If they are switched on, every request carries a safety instruction and nothing is sent without your permission.
          </p>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🌍</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Works Offline</h3>
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            Once it has been opened, PediPulse <strong>works without internet</strong>, so your child's records are there when reception is poor. You can add it to your home screen like an app.
          </p>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🔒</div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Privacy & Data Sovereignty</h3>
          {AI_ENABLED ? (
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              <strong>Records are stored on your device.</strong> When you use an AI feature (marked ✨), the information needed for that request, such as symptom descriptions, photos or medical history, is sent to Google's Gemini service, or for premium features a de-identified summary is sent to Anthropic's Claude, to generate the response. Nothing is sent unless you use an AI feature and agree first.
            </p>
          ) : (
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              <strong>Data remains on your device.</strong> PediPulse stores health records only in this browser. AI features are switched off in this version, so nothing you enter is sent to any server. Records leave the device only if you copy or export them yourself.
            </p>
          )}
        </section>
      </div>

      <PasscodeSettings />

      <BackupRestore />

      <AiConsentSettings />

      <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
        <div className="relative z-10 space-y-6">
           <h4 className="text-2xl font-black tracking-tighter">Regulatory Alignment (Australia)</h4>
           <p className="text-slate-300 text-sm leading-relaxed max-w-2xl font-medium">
             PediPulse is a pilot and has <strong>not been assessed by the TGA (Therapeutic Goods Administration)</strong>. It is designed for keeping records and finding general information: it doesn't calculate doses, assess symptoms or diagnose, and it doesn't replace advice from your child's doctor, nurse or pharmacist.
           </p>
        </div>
      </div>
    </div>
  );
};
