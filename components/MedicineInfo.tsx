import React from 'react';
import { RCH_FACT_SHEETS } from '../clinical/factSheets';
import { FactSheetLinks, Helplines } from './FactSheetLinks';

/**
 * General medicine safety information. The app doesn't calculate doses: the
 * right dose depends on a child's weight and the product's strength, so
 * parents follow the label or ask a pharmacist.
 */
const RULES = [
  {
    name: 'Paracetamol',
    points: [
      'Can be given at any age. For babies under 1 month, ask a doctor first.',
      'No more than 4 times in 24 hours, at least 4 to 6 hours apart.',
    ],
  },
  {
    name: 'Ibuprofen',
    points: [
      'For children over 3 months.',
      'No more than 3 times in 24 hours, at least 6 hours apart.',
      "Don't give it to a child who is dehydrated.",
    ],
  },
];

export const MedicineInfo: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="space-y-8 pb-20">
    <header className="space-y-2">
      <h2 className="text-3xl font-black text-slate-800">Medicines <span className="text-emerald-700">& Pain Relief</span></h2>
      <p className="text-base font-medium text-slate-600 max-w-2xl">
        General information only. PediPulse doesn't work out doses: the right dose depends on your child's weight and the strength of the product.
      </p>
    </header>

    <section className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-6 sm:p-8 space-y-3">
      <h3 className="text-xl font-black text-emerald-950">Getting the dose right</h3>
      <ul className="space-y-2 list-disc pl-5 text-base font-bold text-emerald-950">
        <li>Follow the dosing instructions on the label for your child's weight or age.</li>
        <li>Check the strength (mg per mL) on the bottle, and use the measuring device that came with it.</li>
        <li>If you're unsure, ask your pharmacist or doctor.</li>
        <li>Don't give aspirin to children unless a doctor has prescribed it.</li>
      </ul>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {RULES.map(rule => (
        <div key={rule.name} className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 space-y-2">
          <h3 className="text-lg font-black text-slate-800">{rule.name}</h3>
          <ul className="space-y-1 list-disc pl-5 text-base font-medium text-slate-700">
            {rule.points.map(point => <li key={point}>{point}</li>)}
          </ul>
        </div>
      ))}
    </section>

    {children}

    <Helplines />

    <FactSheetLinks sheets={[RCH_FACT_SHEETS.painRelief, RCH_FACT_SHEETS.fever, RCH_FACT_SHEETS.all]} />
  </div>
);
