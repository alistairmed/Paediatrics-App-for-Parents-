import React from 'react';
import { RCH_FACT_SHEETS } from '../clinical/factSheets';
import { FactSheetLinks, Helplines } from './FactSheetLinks';

/**
 * General, label-style information about common children's pain and fever
 * medicines. It never says how much or how often to give: that depends on the
 * child and the product, so parents follow the label and ask a pharmacist.
 */
const MEDICINES = [
  {
    name: 'Paracetamol',
    usedFor: 'Pain, and discomfort from fever.',
    forms: 'Liquid (syrup or drops), chewable tablets, tablets and suppositories, in different strengths.',
    ask: [
      'Your baby is under 3 months old.',
      'Your child has liver problems or takes other medicines.',
      "You're not sure whether another medicine you're giving also contains paracetamol.",
    ],
  },
  {
    name: 'Ibuprofen',
    usedFor: 'Pain, and discomfort from fever. It is an anti-inflammatory medicine.',
    forms: 'Liquid, chewable tablets and tablets, in different strengths.',
    ask: [
      'Your child is a baby, has asthma, kidney problems or a bleeding problem.',
      'Your child is not drinking well, or is vomiting or has diarrhoea.',
      'Your child takes other medicines.',
    ],
  },
];

export const MedicineInfo: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="space-y-8 pb-20">
    <header className="space-y-2">
      <h2 className="text-3xl font-black text-slate-800">Medicines <span className="text-emerald-700">& Pain Relief</span></h2>
      <p className="text-base font-medium text-slate-600 max-w-2xl">
        General information only. PediPulse doesn't tell you how much or how often to give a medicine.
      </p>
    </header>

    <p role="note" className="bg-emerald-50 border-2 border-emerald-200 rounded-4xl p-5 text-lg font-black text-emerald-950">
      Check the product label and ask your pharmacist or doctor.
    </p>

    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MEDICINES.map(medicine => (
        <article key={medicine.name} className="bg-white border-2 border-slate-200 rounded-4xl p-6 space-y-3" aria-labelledby={`medicine-${medicine.name}`}>
          <h3 id={`medicine-${medicine.name}`} className="text-lg font-black text-slate-800">{medicine.name}</h3>
          <p className="text-base font-medium text-slate-700"><strong>What it's for:</strong> {medicine.usedFor}</p>
          <p className="text-base font-medium text-slate-700"><strong>Common forms:</strong> {medicine.forms}</p>
          <div>
            <p className="text-base font-bold text-slate-800">Ask a pharmacist or doctor before using it if:</p>
            <ul className="mt-1 space-y-1 list-disc pl-5 text-base font-medium text-slate-700">
              {medicine.ask.map(point => <li key={point}>{point}</li>)}
            </ul>
          </div>
        </article>
      ))}
    </section>

    <section className="bg-white border-2 border-slate-200 rounded-4xl p-6 space-y-2">
      <h3 className="text-lg font-black text-slate-800">Using children's medicines safely</h3>
      <ul className="space-y-1 list-disc pl-5 text-base font-medium text-slate-700">
        <li>Products come in different strengths, so read the label every time, including when you buy a new bottle.</li>
        <li>Use the measuring device that comes with the product.</li>
        <li>Keep medicines out of reach of children.</li>
        <li>Don't give aspirin to children unless a doctor has prescribed it.</li>
      </ul>
    </section>

    {children}

    <Helplines />

    <FactSheetLinks sheets={[RCH_FACT_SHEETS.painRelief, RCH_FACT_SHEETS.fever, RCH_FACT_SHEETS.all]} />
  </div>
);
