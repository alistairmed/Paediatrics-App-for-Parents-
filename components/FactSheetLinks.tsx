import React from 'react';
import { FactSheet, HELPLINES } from '../clinical/factSheets';

export const FactSheetLinks: React.FC<{ sheets: FactSheet[]; heading?: string }> = ({ sheets, heading = 'Trusted information' }) => (
  <section className="space-y-3">
    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest px-1">{heading}</h3>
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sheets.map(sheet => (
        <li key={sheet.url}>
          <a
            href={sheet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-5 transition-colors"
          >
            <span className="block font-black text-slate-800">{sheet.title} <span aria-hidden="true">↗</span></span>
            <span className="block text-sm font-medium text-slate-600 mt-1">{sheet.summary}</span>
            <span className="sr-only">(opens the Royal Children's Hospital website in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  </section>
);

export const Helplines: React.FC = () => (
  <section className="space-y-3">
    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest px-1">Phone numbers</h3>
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {HELPLINES.map(line => (
        <li key={line.number} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          <span className="block text-sm font-bold text-slate-600">{line.name}</span>
          <a href={`tel:${line.number.replace(/\s/g, '')}`} className="block text-2xl font-black text-indigo-700 my-1">{line.number}</a>
          <span className="block text-sm font-medium text-slate-600">{line.note}</span>
        </li>
      ))}
    </ul>
  </section>
);
