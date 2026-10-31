import React from 'react';
import { RCH_FACT_SHEETS } from '../clinical/factSheets';
import { FactSheetLinks, Helplines } from './FactSheetLinks';

/**
 * General guidance on when to seek care. It doesn't assess a particular
 * child: parents are pointed to emergency services, a doctor, or trusted
 * fact sheets.
 */
const CALL_000 = [
  'Struggling to breathe, or breathing that is very fast, noisy or sucking in at the ribs or throat',
  'Blue or grey lips, or very pale, blotchy skin',
  "A rash of purple or red spots that don't fade when you press on them",
  'A seizure (fit) that lasts more than 5 minutes, a first seizure, or not waking up afterwards',
  'Floppy, very drowsy or hard to wake',
  'A serious injury, or a head injury with loss of consciousness or repeated vomiting',
];

const SEE_DOCTOR_TODAY = [
  'A baby under 3 months with a fever (38 degrees Celsius or higher)',
  'Not drinking, or far fewer wet nappies than usual',
  'Vomiting or diarrhoea that keeps going',
  'A fever lasting more than 2 days, or your child seems very unwell to you',
  'Pain that is getting worse, or anything else that worries you',
];

export const WhenToGetHelp: React.FC = () => (
  <div className="space-y-8 pb-20">
    <header className="space-y-2">
      <h2 className="text-3xl font-black text-slate-800">When to <span className="text-rose-600">Get Help</span></h2>
      <p className="text-base font-medium text-slate-600 max-w-2xl">
        General guidance for parents. This app can't assess your child. If you're worried, trust your instincts and get help.
      </p>
    </header>

    <section className="bg-rose-600 text-white rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-xl">
      <h3 className="text-xl font-black">Call 000 now if your child has:</h3>
      <ul className="space-y-2 list-disc pl-5 text-base font-bold">
        {CALL_000.map(sign => <li key={sign}>{sign}</li>)}
      </ul>
      <a href="tel:000" className="inline-block bg-white text-rose-700 font-black px-6 py-3 rounded-2xl">Call 000</a>
    </section>

    <section className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 sm:p-8 space-y-4">
      <h3 className="text-xl font-black text-amber-950">See a doctor today, or call healthdirect on 1800 022 222, if:</h3>
      <ul className="space-y-2 list-disc pl-5 text-base font-bold text-amber-950">
        {SEE_DOCTOR_TODAY.map(sign => <li key={sign}>{sign}</li>)}
      </ul>
    </section>

    <Helplines />

    <FactSheetLinks
      sheets={[
        RCH_FACT_SHEETS.fever,
        RCH_FACT_SHEETS.dehydration,
        RCH_FACT_SHEETS.febrileSeizures,
        RCH_FACT_SHEETS.croup,
        RCH_FACT_SHEETS.bronchiolitis,
        RCH_FACT_SHEETS.headInjury,
        RCH_FACT_SHEETS.all,
      ]}
    />
  </div>
);
