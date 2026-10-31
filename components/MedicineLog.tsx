import React, { useEffect, useMemo, useState } from 'react';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useToast } from '../context/ToastContext';
import { medicineStatus, TIMED_MEDICINES, TimedMedicine, MEDICINE_RULES } from '../clinical/medicineTimer';

const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
const formatTime = (d: Date) => {
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString([], timeFormat) : d.toLocaleString([], { weekday: 'short', ...timeFormat });
};
const localInputValue = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

/**
 * The parent's own record of paracetamol and ibuprofen given, with reminders
 * of when the label limits allow another dose. Never suggests an amount.
 */
export const MedicineLog: React.FC = () => {
  const { history, addAcuteLog } = useMedicalHistory();
  const { childProfile } = useChildProfile();
  const { showToast } = useToast();
  const [now, setNow] = useState(() => new Date());
  const [medicine, setMedicine] = useState<TimedMedicine>('Paracetamol');
  const [amount, setAmount] = useState('');
  const [givenAt, setGivenAt] = useState(() => localInputValue(new Date()));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const doses = useMemo(
    () => (history.acuteLogs || []).filter(l => l.type === 'Medication' && TIMED_MEDICINES.includes(l.medicationName as TimedMedicine)),
    [history.acuteLogs]
  );

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const when = new Date(givenAt);
    if (isNaN(when.getTime()) || when > new Date()) {
      showToast("Please choose a time that isn't in the future.", 'error');
      return;
    }
    addAcuteLog({ timestamp: when.toISOString(), type: 'Medication', medicationName: medicine, value: amount.trim() || 'Amount not recorded' });
    setAmount('');
    setGivenAt(localInputValue(new Date()));
    showToast(`${medicine} recorded at ${formatTime(when)}.`);
  };

  return (
    <section className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-6" aria-labelledby="medicine-log-title">
      <div className="space-y-1">
        <h3 id="medicine-log-title" className="text-xl font-black text-slate-800">Medicine log{childProfile ? ` for ${childProfile.name}` : ''}</h3>
        <p className="text-sm font-medium text-slate-600">
          Record doses as you give them. Reminders use the general limits on most labels; always follow your product's label and your doctor's advice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TIMED_MEDICINES.map(name => {
          const status = medicineStatus(name, doses.filter(d => d.medicationName === name).map(d => new Date(d.timestamp)), now);
          const rule = MEDICINE_RULES[name];
          return (
            <div key={name} className={`rounded-2xl p-5 border-2 ${status.nextAllowedAt ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`} aria-live="polite">
              <h4 className="font-black text-slate-800">{name}</h4>
              <p className="text-base font-bold text-slate-800 mt-1">
                {status.nextAllowedAt ? `Next dose not before ${formatTime(status.nextAllowedAt)}` : status.lastGiven ? 'Label limits allow another dose now, if needed' : 'No doses recorded'}
              </p>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {status.dosesInLast24Hours} of {status.maxPer24Hours} doses in the last 24 hours
                {status.lastGiven ? ` · last at ${formatTime(status.lastGiven)}` : ''}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-2">At least {rule.minHoursApart} hours apart, no more than {rule.maxPer24Hours} times in 24 hours.</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleRecord} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <label className="block">
          <span className="block text-sm font-bold text-slate-700 mb-1">Medicine</span>
          <select value={medicine} onChange={e => setMedicine(e.target.value as TimedMedicine)} className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white">
            {TIMED_MEDICINES.map(m => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-bold text-slate-700 mb-1">Amount given (optional)</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 7.5 mL" className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-slate-900" />
        </label>
        <label className="block">
          <span className="block text-sm font-bold text-slate-700 mb-1">Time given</span>
          <input type="datetime-local" value={givenAt} max={localInputValue(now)} onChange={e => setGivenAt(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-slate-900" />
        </label>
        <button type="submit" className="min-h-[48px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs">Record Dose</button>
      </form>
    </section>
  );
};
