import React from 'react';

/** Shown in place of an AI feature's button while AI features are switched off. */
export const AiOffNotice: React.FC<{ feature: string; children?: React.ReactNode }> = ({ feature, children }) => (
  <div role="note" className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-5 py-4 space-y-3">
    <p className="text-sm font-bold text-slate-600 leading-relaxed">
      <span aria-hidden="true">🔒 </span>
      {feature} uses AI, which is switched off in this version. Your information stays on this device.
    </p>
    {children}
  </div>
);
