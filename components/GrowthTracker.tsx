import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GrowthRecord } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useToast } from '../context/ToastContext';
import {
  GrowthMeasure, GrowthSex, PERCENTILE_LINES, WHO_MAX_MONTHS,
  lmsAt, valueAtZ, growthPercentile, describePercentile, ageInMonthsAt,
} from '../clinical/growth';

const MEASURES: { id: GrowthMeasure; label: string; unit: string; field: keyof GrowthRecord }[] = [
  { id: 'weight', label: 'Weight', unit: 'kg', field: 'weight' },
  { id: 'length', label: 'Length / height', unit: 'cm', field: 'height' },
  { id: 'head', label: 'Head', unit: 'cm', field: 'headCircumference' },
];

// Values outside these ranges are almost certainly typing errors.
const LIMITS = { weight: [1, 150], height: [30, 220], head: [25, 65] } as const;

export const GrowthTracker: React.FC = () => {
  const { history, updateHistory } = useMedicalHistory();
  const { childProfile } = useChildProfile();
  const { showToast } = useToast();
  const records = history.growthRecords || [];

  const [measureId, setMeasureId] = useState<GrowthMeasure>('weight');
  const [chartSex, setChartSex] = useState<GrowthSex>(childProfile?.sex === 'Male' ? 'male' : 'female');
  const sex: GrowthSex = childProfile?.sex === 'Male' ? 'male' : childProfile?.sex === 'Female' ? 'female' : chartSex;
  const measure = MEASURES.find(m => m.id === measureId)!;

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ date: today, weight: '', height: '', head: '' });

  /** Age in months at a record: from the date of birth when known, otherwise as entered. */
  const ageOf = (r: GrowthRecord) => (childProfile?.dob ? ageInMonthsAt(childProfile.dob, r.date) : null) ?? r.age;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const n = (s: string) => (s.trim() ? Number(s.replace(',', '.')) : undefined);
    const weight = n(form.weight), height = n(form.height), head = n(form.head);
    if (weight === undefined && height === undefined && head === undefined) {
      showToast('Enter at least one measurement.', 'error');
      return;
    }
    const bad = ([['weight', weight, 'weight in kg'], ['height', height, 'length or height in cm'], ['head', head, 'head circumference in cm']] as const)
      .find(([key, v]) => v !== undefined && (!Number.isFinite(v) || v < LIMITS[key][0] || v > LIMITS[key][1]));
    if (bad) {
      showToast(`Please check the ${bad[2]} (between ${LIMITS[bad[0]][0]} and ${LIMITS[bad[0]][1]}).`, 'error');
      return;
    }
    if (!form.date || form.date > today) {
      showToast("Please choose a measurement date that isn't in the future.", 'error');
      return;
    }
    const age = childProfile?.dob ? ageInMonthsAt(childProfile.dob, form.date) : null;
    if (childProfile?.dob && age === null) {
      showToast("The measurement date can't be before the date of birth.", 'error');
      return;
    }
    const record: GrowthRecord = {
      age: age !== null ? Math.round(age * 10) / 10 : 0,
      weight,
      height,
      headCircumference: head,
      date: form.date,
    };
    const updated = [...records, record].sort((a, b) => a.date.localeCompare(b.date));
    updateHistory({ growthRecords: updated });
    setForm({ date: today, weight: '', height: '', head: '' });
    showToast('Measurement saved.');
  };

  const points = useMemo(
    () => records
      .map(r => ({ age: ageOf(r), value: r[measure.field] as number | undefined, date: r.date }))
      .filter(p => typeof p.value === 'number' && Number.isFinite(p.value) && p.age >= 0),
    [records, measure.field, childProfile?.dob]
  );

  const chartData = useMemo(() => {
    const maxAge = Math.min(WHO_MAX_MONTHS, Math.max(12, ...points.map(p => Math.ceil(p.age) + 3)));
    const rows: Record<string, number | undefined>[] = [];
    for (let m = 0; m <= maxAge; m++) {
      const lms = lmsAt(sex, measure.id, m)!;
      const row: Record<string, number | undefined> = { age: m };
      PERCENTILE_LINES.forEach(line => { row[line.label] = Math.round(valueAtZ(lms, line.z) * 100) / 100; });
      rows.push(row);
    }
    points.forEach(p => rows.push({ age: Math.round(p.age * 100) / 100, child: p.value }));
    return rows.sort((a, b) => (a.age as number) - (b.age as number));
  }, [points, sex, measure.id]);

  const latest = points[points.length - 1];
  const latestPercentile = latest ? growthPercentile(sex, measure.id, latest.age, latest.value!) : null;
  const olderThanWho = latest && latest.age > WHO_MAX_MONTHS;

  const inputClass = "w-full p-3 rounded-xl border-2 border-slate-300 bg-white font-bold text-slate-900";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Growth{childProfile ? ` – ${childProfile.name}` : ''}</h2>
        <p className="text-base font-medium text-slate-600">Plotted on the WHO Child Growth Standards (birth to 5 years), as used in the Red Book.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-4xl border border-slate-200 shadow-xs space-y-4 self-start">
          <h3 className="font-black text-slate-800">Add a measurement</h3>
          <label className="block">
            <span className={labelClass}>Date measured</span>
            <input type="date" max={today} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Weight (kg)</span>
            <input inputMode="decimal" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 9.4" className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Length or height (cm)</span>
            <input inputMode="decimal" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} placeholder="e.g. 74.5" className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Head circumference (cm)</span>
            <input inputMode="decimal" value={form.head} onChange={e => setForm({ ...form, head: e.target.value })} placeholder="optional" className={inputClass} />
          </label>
          {!childProfile?.dob && <p className="text-sm font-bold text-amber-800">Add your child's date of birth to plot measurements by age.</p>}
          <button type="submit" className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl uppercase tracking-widest text-xs">Save Measurement</button>
        </form>

        <section className="lg:col-span-2 bg-white p-6 rounded-4xl border border-slate-200 shadow-xs space-y-4" aria-labelledby="growth-chart-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="growth-chart-title" className="font-black text-slate-800">{measure.label} for age ({sex === 'male' ? 'boys' : 'girls'})</h3>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl" role="tablist" aria-label="Measurement">
              {MEASURES.map(m => (
                <button key={m.id} role="tab" aria-selected={m.id === measureId} onClick={() => setMeasureId(m.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold min-h-[40px] ${m.id === measureId ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {childProfile?.sex === 'Other' && (
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <span>Chart:</span>
              {(['female', 'male'] as const).map(s => (
                <button key={s} onClick={() => setChartSex(s)} aria-pressed={chartSex === s} className={`px-3 py-1 rounded-lg border-2 ${chartSex === s ? 'border-indigo-600 text-indigo-700' : 'border-slate-300'}`}>
                  {s === 'female' ? 'Girls' : 'Boys'}
                </button>
              ))}
            </div>
          )}

          {latest && (
            <p className="text-base font-bold text-slate-800" aria-live="polite">
              Latest: {latest.value} {measure.unit} on {new Date(latest.date).toLocaleDateString()}
              {latestPercentile !== null ? ` – around the ${describePercentile(latestPercentile)} percentile.` : '.'}
            </p>
          )}
          {olderThanWho && <p className="text-sm font-bold text-amber-800">Your child is over 5 years old. These charts cover birth to 5 years; ask your GP about charts for older children.</p>}

          <div className="h-[380px] w-full" role="img" aria-label={`${measure.label} growth chart with WHO percentile lines`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="age" type="number" domain={[0, 'dataMax']} tick={{ fill: '#475569', fontSize: 12 }} label={{ value: 'Age (months)', position: 'insideBottom', offset: -8, fill: '#475569', fontSize: 12 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#475569', fontSize: 12 }} unit={` ${measure.unit}`} width={64} />
                <Tooltip formatter={(v: number) => `${v} ${measure.unit}`} labelFormatter={(a: number) => `${Math.round(a * 10) / 10} months`} />
                <Legend verticalAlign="top" height={32} />
                {PERCENTILE_LINES.map(line => (
                  <Line key={line.label} type="monotone" dataKey={line.label} name={line.label} dot={false} connectNulls isAnimationActive={false}
                    stroke={line.z === 0 ? '#64748b' : '#cbd5e1'} strokeWidth={line.z === 0 ? 2 : 1.5} strokeDasharray={line.z === 0 ? undefined : '6 4'} />
                ))}
                <Line type="monotone" dataKey="child" name={childProfile?.name || 'Your child'} stroke="#4f46e5" strokeWidth={3} connectNulls dot={{ r: 5, fill: '#4f46e5' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm font-medium text-slate-600">
            Percentiles describe how a measurement compares with other children; a single reading isn't good or bad. Your child health nurse or GP can explain your child's growth pattern.
          </p>
        </section>
      </div>
    </div>
  );
};
