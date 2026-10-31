import React, { useMemo, useState } from 'react';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { growthPercentile, describePercentile, ageInMonthsAt, GrowthSex } from '../clinical/growth';
import { NIP_SCHEDULE, vaccineReminders } from '../clinical/vaccineSchedule';

const fmtDate = (d: string | Date | undefined) => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** A one-page summary for the parent to print or save as PDF and show the GP. No AI. */
export const PrintableSummary: React.FC = () => {
  const { history } = useMedicalHistory();
  const { childProfile, childAge } = useChildProfile();
  const [note, setNote] = useState('');

  const sex: GrowthSex | null = childProfile?.sex === 'Male' ? 'male' : childProfile?.sex === 'Female' ? 'female' : null;
  const growth = useMemo(() => {
    const records = [...(history.growthRecords || [])].sort((a, b) => a.date.localeCompare(b.date));
    const latest = (field: 'weight' | 'height' | 'headCircumference') => [...records].reverse().find(r => typeof r[field] === 'number' && (r[field] as number) > 0);
    const describe = (field: 'weight' | 'height' | 'headCircumference', measure: 'weight' | 'length' | 'head', unit: string) => {
      const r = latest(field);
      if (!r) return null;
      const age = childProfile?.dob ? ageInMonthsAt(childProfile.dob, r.date) : null;
      const p = sex && age !== null ? growthPercentile(sex, measure, age, r[field] as number) : null;
      return `${r[field]} ${unit} (${fmtDate(r.date)})${p !== null ? `, about the ${describePercentile(p)} percentile (WHO)` : ''}`;
    };
    return [
      ['Weight', describe('weight', 'weight', 'kg')],
      ['Length / height', describe('height', 'length', 'cm')],
      ['Head circumference', describe('headCircumference', 'head', 'cm')],
    ].filter(([, v]) => v) as [string, string][];
  }, [history.growthRecords, childProfile?.dob, sex]);

  const vaccines = useMemo(() => {
    const list = history.vaccinations?.length ? history.vaccinations : childProfile?.dob ? NIP_SCHEDULE(new Date(childProfile.dob)) : [];
    return { given: list.filter(v => v.status === 'completed'), ...vaccineReminders(list) };
  }, [history.vaccinations, childProfile?.dob]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = (history.acuteLogs || [])
    .filter(l => new Date(l.timestamp).getTime() >= weekAgo && l.type !== 'Vitals')
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 15);
  const conditions = (history.conditions || []).filter(c => c.status !== 'Resolved');
  const upcoming = (history.appointments || []).filter(a => a.status === 'Upcoming' && new Date(a.dateTime) > new Date());

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="break-inside-avoid space-y-1">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1">{title}</h3>
      <div className="text-sm text-slate-800 leading-relaxed">{children}</div>
    </section>
  );
  const none = <p className="text-slate-500">None recorded.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 print:pb-0 print:max-w-none">
      <div className="print:hidden space-y-3">
        <h2 className="text-3xl font-black text-slate-800">Summary for your doctor</h2>
        <p className="text-base font-medium text-slate-600">A one-page summary of {childProfile?.name ? `${childProfile.name}'s` : 'your child\'s'} records. Print it, or choose "Save as PDF" in the print window.</p>
        <label className="block">
          <span className="block text-sm font-bold text-slate-700 mb-1">Anything you want to tell the doctor (printed at the top, not saved)</span>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="w-full p-3 rounded-xl border-2 border-slate-300 font-medium text-slate-900" />
        </label>
        <button onClick={() => window.print()} className="min-h-[48px] px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs">Print or Save as PDF</button>
      </div>

      <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 print:border-0 print:p-0 print:rounded-none" aria-label="Printable summary">
        <header className="flex justify-between items-start gap-4 border-b-2 border-slate-800 pb-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{childProfile?.name || 'Child'}</h1>
            <p className="text-sm font-bold text-slate-700">
              {childProfile?.dob ? `Born ${fmtDate(childProfile.dob)}` : 'Date of birth not recorded'}{childAge ? ` · ${childAge}` : ''}{childProfile?.sex ? ` · ${childProfile.sex}` : ''}
            </p>
          </div>
          <p className="text-xs font-bold text-slate-600 text-right">Prepared by the parent/carer<br />{fmtDate(new Date())}</p>
        </header>

        {note.trim() && <Section title="Parent's note"><p className="whitespace-pre-wrap">{note}</p></Section>}

        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-5">
          <Section title="Allergies">{history.allergies?.length ? <ul className="list-disc pl-5">{history.allergies.map(a => <li key={a}>{a}</li>)}</ul> : none}</Section>
          <Section title="Current medicines">
            {history.currentMedications?.length
              ? <ul className="list-disc pl-5">{history.currentMedications.map(m => <li key={m.id}>{m.name}{m.dose ? ` – ${m.dose}` : ''}{m.indication ? ` (${m.indication})` : ''}</li>)}</ul>
              : none}
          </Section>
          <Section title="Conditions">{conditions.length ? <ul className="list-disc pl-5">{conditions.map(c => <li key={c.id}>{c.name}{c.status === 'Under Investigation' ? ' (being investigated)' : ''}</li>)}</ul> : none}</Section>
          <Section title="Growth">{growth.length ? <ul className="list-disc pl-5">{growth.map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}</ul> : none}</Section>
        </div>

        {(history.pastMedicalHistory || history.surgicalHistory) && (
          <Section title="Medical history">
            {history.pastMedicalHistory && <p className="whitespace-pre-wrap">{history.pastMedicalHistory}</p>}
            {history.surgicalHistory && <p className="whitespace-pre-wrap"><strong>Surgical:</strong> {history.surgicalHistory}</p>}
          </Section>
        )}

        <Section title="Vaccines">
          <p><strong>Recorded as given:</strong> {vaccines.given.length ? vaccines.given.map(v => `${v.name}${v.receivedDate ? ` (${fmtDate(v.receivedDate)})` : ''}`).join(', ') : 'none recorded'}</p>
          {vaccines.overdue.length > 0 && <p><strong>Not yet recorded:</strong> {vaccines.overdue.map(v => v.name).join(', ')}</p>}
          {vaccines.dueSoon.length > 0 && <p><strong>Due soon:</strong> {vaccines.dueSoon.map(v => `${v.name} (${fmtDate(v.dueDate)})`).join(', ')}</p>}
        </Section>

        <Section title="Last 7 days (from the parent's log)">
          {recentLogs.length
            ? <table className="w-full text-left text-sm"><tbody>{recentLogs.map(l => (
                <tr key={l.id} className="border-b border-slate-100 align-top">
                  <td className="py-1 pr-3 whitespace-nowrap">{fmtDateTime(l.timestamp)}</td>
                  <td className="py-1 pr-3">{l.type}{l.medicationName ? `: ${l.medicationName}` : ''}</td>
                  <td className="py-1">{l.value}{l.notes ? ` – ${l.notes}` : ''}</td>
                </tr>))}</tbody></table>
            : none}
        </Section>

        {upcoming.length > 0 && (
          <Section title="Upcoming appointments">
            <ul className="list-disc pl-5">{upcoming.map(a => <li key={a.id}>{fmtDateTime(a.dateTime)} – {a.specialty} with {a.provider}{a.purpose ? ` (${a.purpose})` : ''}</li>)}</ul>
          </Section>
        )}

        <footer className="text-xs text-slate-500 border-t border-slate-200 pt-2">
          Recorded by the parent or carer in PediPulse. Not a clinical record; please confirm details with the family.
        </footer>
      </article>
    </div>
  );
};
