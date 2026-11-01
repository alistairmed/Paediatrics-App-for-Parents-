import React, { useEffect, useState } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { AI_ENABLED, PREMIUM_ENABLED } from '../config/features';
import { setAiConsentPrompt, hasAiConsent, withdrawAiConsent, AI_DAILY_LIMIT, getPremiumCode, setPremiumCode } from '../services/aiGuard';

const CONSENT_MESSAGE =
  'To answer, PediPulse sends what you typed or uploaded for this feature, and any child details it needs (such as age), ' +
  "to an AI service through our server: Google's Gemini for most features" +
  (PREMIUM_ENABLED ? ", and Anthropic's Claude for premium features, which receive a de-identified summary only (no name, date of birth or contact details)" : '') +
  '. These companies may process it outside Australia. ' +
  "Leave out names and other details that identify your child. The answer is general information, not medical advice. " +
  `You can use up to ${AI_DAILY_LIMIT} AI requests a day, and withdraw this permission any time in Privacy, Backup & Lock.`;

/** Lets the AI guard ask for consent with the app's own dialog. Renders nothing. */
export const AiConsentBridge: React.FC = () => {
  const confirm = useConfirm();
  useEffect(() => {
    if (!AI_ENABLED) return;
    setAiConsentPrompt(() => confirm({
      title: 'Send this to an AI service?',
      message: CONSENT_MESSAGE,
      confirmLabel: 'I Agree, Send It',
      cancelLabel: "Don't Send",
    }));
    return () => setAiConsentPrompt(null);
  }, [confirm]);
  return null;
};

/** Shows whether AI permission has been given, with a way to withdraw it. */
export const AiConsentSettings: React.FC = () => {
  const { showToast } = useToast();
  const [given, setGiven] = useState(hasAiConsent);
  const [hasCode, setHasCode] = useState(() => !!getPremiumCode());
  const [code, setCode] = useState('');
  if (!AI_ENABLED) return null;

  const saveCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setPremiumCode(code);
    setCode('');
    setHasCode(true);
    showToast('Premium access code saved on this device.');
  };
  return (
    <section className="bg-white p-6 sm:p-8 rounded-4xl border border-slate-200 space-y-3" aria-labelledby="ai-consent-title">
      <h3 id="ai-consent-title" className="text-xl font-black text-slate-800">AI features</h3>
      <p className="text-base font-medium text-slate-700">
        {given
          ? 'You have allowed PediPulse to send the questions you ask to an AI service.'
          : "You haven't allowed AI features. PediPulse will ask before sending anything."}
      </p>
      {given && (
        <button
          onClick={() => { withdrawAiConsent(); setGiven(false); showToast('AI permission withdrawn.'); }}
          className="min-h-[48px] px-5 rounded-xl border-2 border-slate-300 font-black text-slate-800 uppercase tracking-widest text-xs"
        >
          Withdraw Permission
        </button>
      )}
      {PREMIUM_ENABLED && (
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <h4 className="text-base font-black text-slate-800">Premium access code</h4>
          {hasCode ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-base font-medium text-slate-700">A premium access code is saved on this device.</p>
              <button
                onClick={() => { setPremiumCode(null); setHasCode(false); showToast('Premium access code removed.'); }}
                className="min-h-[44px] px-4 rounded-xl border-2 border-slate-300 font-black text-slate-800 uppercase tracking-widest text-xs"
              >
                Remove Code
              </button>
            </div>
          ) : (
            <form onSubmit={saveCode} className="flex flex-wrap items-end gap-3">
              <label className="flex-1 min-w-[12rem]">
                <span className="block text-sm font-bold text-slate-700 mb-1">Access code</span>
                <input value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false}
                  className="w-full p-3 rounded-xl border-2 border-slate-300 font-mono text-sm text-slate-900" />
              </label>
              <button type="submit" className="min-h-[48px] px-5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-black uppercase tracking-widest text-xs">
                Save Code
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};
