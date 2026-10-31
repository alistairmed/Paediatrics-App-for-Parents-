import React, { useEffect, useState } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { AI_ENABLED } from '../config/features';
import { setAiConsentPrompt, hasAiConsent, withdrawAiConsent, AI_DAILY_LIMIT } from '../services/aiGuard';

const CONSENT_MESSAGE =
  'To answer, PediPulse sends what you typed or uploaded for this feature, and any child details it needs (such as age), ' +
  "to Google's Gemini AI service through our server. Google may process it outside Australia. " +
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
  if (!AI_ENABLED) return null;
  return (
    <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 space-y-3" aria-labelledby="ai-consent-title">
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
    </section>
  );
};
