
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GrowthRecord } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';

const WHO_WEIGHT_REF = [
  { age: 0, p3: 2.4, p50: 3.3, p97: 4.3 },
  { age: 3, p3: 5.0, p50: 6.4, p97: 8.0 },
  { age: 6, p3: 6.4, p50: 7.9, p97: 9.8 },
  { age: 9, p3: 7.1, p50: 8.9, p97: 11.0 },
  { age: 12, p3: 7.7, p50: 9.6, p97: 12.0 },
  { age: 18, p3: 8.8, p50: 10.9, p97: 13.7 },
  { age: 24, p3: 9.7, p50: 12.2, p97: 15.3 },
  { age: 36, p3: 11.3, p50: 14.3, p97: 18.3 },
  { age: 48, p3: 12.7, p50: 16.3, p97: 21.2 },
];

export const GrowthTracker: React.FC = () => {
  const { history, updateHistory } = useMedicalHistory();
  const records = history.growthRecords || [];
  const [showReferenceLines, setShowReferenceLines] = useState(true);

  const [newRecord, setNewRecord] = useState({ 
    age: '', weight: '', height: '', head: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  const handleAddRecord = () => {
    const ageNum = Number(newRecord.age);
    const weightNum = Number(newRecord.weight);
    if (isNaN(ageNum) || isNaN(weightNum) || weightNum < 1 || weightNum > 150) {
       alert("Please enter a realistic pediatric weight (2kg - 100kg).");
       return;
    }
    if (!newRecord.age || !newRecord.weight || !newRecord.height) return;
    const record: GrowthRecord = {
      age: ageNum,
      weight: weightNum,
      height: Number(newRecord.height),
      headCircumference: newRecord.head ? Number(newRecord.head) : undefined,
      date: newRecord.date
    };
    const updated = [...records, record].sort((a, b) => a.age - b.age);
    updateHistory({ growthRecords: updated });
    setNewRecord({ age: '', weight: '', height: '', head: '', date: new Date().toISOString().split('T')[0] });
  };

  const velocity = useMemo(() => {
    if (records.length < 2) return null;
    const last = records[records.length - 1];
    const prev = records[records.length - 2];
    const weightDiffGrams = (last.weight - prev.weight) * 1000;
    const timeDiffDays = (new Date(last.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
    
    if (timeDiffDays === 0) return 0;
    return Math.round(weightDiffGrams / timeDiffDays);
  }, [records]);

  const chartData = useMemo(() => {
    const ages = Array.from(new Set([
      ...WHO_WEIGHT_REF.map(r => r.age), 
      ...records.map(r => r.age)
    ])).sort((a, b) => a - b);

    return ages.map(age => {
      const ref = WHO_WEIGHT_REF.find(r => r.age === age);
      const user = records.find(r => r.age === age);
      return {
        age,
        weight: user?.weight,
        height: user?.height,
        p3_weight: ref?.p3,
        p50_weight: ref?.p50,
        p97_weight: ref?.p97
      };
    });
  }, [records]);

  const currentPercentile = useMemo(() => {
    if (records.length === 0) return null;
    const last = records[records.length - 1];
    const ref = WHO_WEIGHT_REF.reduce((prev, curr) => 
      Math.abs(curr.age - last.age) < Math.abs(prev.age - last.age) ? curr : prev
    );
    
    if (last.weight < ref.p3) return "Below 3rd (Consult GP)";
    if (last.weight < ref.p50) return "15th - 50th";
    if (last.weight === ref.p50) return "50th (Average)";
    if (last.weight < ref.p97) return "50th - 97th";
    return "Above 97th";
  }, [records]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight italic">Growth <span className="text-indigo-600">Trajectory</span></h2>
          <p className="text-slate-500 font-medium">WHO Reference Percentiles integrated tracking.</p>
        </div>
        <div className="flex gap-2">
           {velocity !== null && (
              <div className={`px-6 py-2 rounded-xl text-white shadow-lg ${velocity < 0 ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none">Clinical Velocity</p>
                 <p className="text-sm font-black mt-1">{velocity} g/day</p>
              </div>
           )}
           <button onClick={() => setShowReferenceLines(!showReferenceLines)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showReferenceLines ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}>
              {showReferenceLines ? 'Hide WHO Lines' : 'Show WHO Lines'}
           </button>
           {currentPercentile && (
              <div className="bg-emerald-600 px-6 py-2 rounded-xl text-white shadow-lg">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none">Weight Category</p>
                 <p className="text-sm font-black mt-1">{currentPercentile}</p>
              </div>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 self-start">
          <h3 className="font-bold text-slate-800 mb-6 uppercase text-[10px] tracking-widest">Log Measurement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">Age (months)</label>
              <input type="number" value={newRecord.age} onChange={e => setNewRecord({...newRecord, age: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">Weight (kg)</label>
                <input type="number" step="0.1" value={newRecord.weight} onChange={e => setNewRecord({...newRecord, weight: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-black text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">Height (cm)</label>
                <input type="number" step="0.1" value={newRecord.height} onChange={e => setNewRecord({...newRecord, height: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-black text-slate-900" />
              </div>
            </div>
            <button onClick={handleAddRecord} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all transform active:scale-95">Log Measurement</button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-full min-h-[500px]">
            <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
              <span className="text-blue-500">📉</span> Interactive Trajectory
            </h3>
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <YAxis yAxisId="kg" domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }} />
                  <Legend verticalAlign="top" height={36}/>
                  
                  {showReferenceLines && <Line yAxisId="kg" type="monotone" dataKey="p97_weight" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="5 5" dot={false} name="WHO 97th" />}
                  {showReferenceLines && <Line yAxisId="kg" type="monotone" dataKey="p50_weight" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="10 5" dot={false} name="WHO 50th (Mean)" />}
                  {showReferenceLines && <Line yAxisId="kg" type="monotone" dataKey="p3_weight" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="5 5" dot={false} name="WHO 3rd" />}
                  
                  <Line yAxisId="kg" type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={5} dot={{ r: 8, fill: '#3b82f6', strokeWidth: 4, stroke: '#fff' }} name="Child's Weight" animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
