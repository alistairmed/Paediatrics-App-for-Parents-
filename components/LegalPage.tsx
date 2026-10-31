import React from 'react';
import { LEGAL } from '../config/legal';

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

/** Shared layout for the Privacy Policy and Terms of Use. */
export const LegalPage: React.FC<{ title: string; intro: React.ReactNode; sections: LegalSection[] }> = ({ title, intro, sections }) => (
  <article className="max-w-3xl mx-auto space-y-6 pb-20">
    <header className="space-y-2">
      <h2 className="text-3xl font-black text-slate-800">{title}</h2>
      <p className="text-sm font-bold text-slate-500">Last updated {LEGAL.lastUpdated}</p>
      <div className="text-base font-medium text-slate-700 leading-relaxed">{intro}</div>
    </header>
    {sections.map((section, i) => (
      <section key={section.heading} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
        <h3 className="text-lg font-black text-slate-800">{i + 1}. {section.heading}</h3>
        <div className="text-base font-medium text-slate-700 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">{section.body}</div>
      </section>
    ))}
    <p className="text-sm font-bold text-slate-500">
      Questions? Contact {LEGAL.operator} at {LEGAL.contactEmail}.
    </p>
  </article>
);
