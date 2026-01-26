
import React, { useState, useEffect, useMemo } from 'react';
import { calculateDosage } from '../services/gemini';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useNavigation } from '../context/NavigationContext';
import { useRole } from '../context/RoleContext';
import { useConnectivity } from '../hooks/useConnectivity';
import { useGovernance } from '../context/GovernanceContext';
import { useEnvironment } from '../context/EnvironmentContext';
import { calculateSafetyCeiling } from '../clinical/dosing';

const OTC_MEDICATIONS = [
  { id: 'paracetamol', name: 'Paracetamol (Panadol/Tylenol)', icon: '💧' },
  { id: 'ibuprofen', name: 'Ibuprofen (Nurofen/Advil)', icon: '🍊' },
  { id: 'cetirizine', name: 'Antihistamine (Cetirizine/Zyrtec)', icon: '🤧' },
];

export const DoseCalculator: React.FC = () => {
  const { latestWeight } = useMedicalHistory();
  const { navigateTo } = useNavigation();
  const { role } = useRole();
  const { addEntry } = useGovernance();
  const { mode } = useEnvironment();
  const isOnline = useConnectivity();

  const [weight, setWeight] = useState(latestWeight?.toString() || '');
  const [medication, setMedication] = useState(OTC_MEDICATIONS[0].name);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Deterministic Safety Check - Runs automatically
  const safetyCeiling = useMemo(() => {
    const wNum = parseFloat(weight);
    if (!weight || isNaN(wNum)) return null;
    return calculateSafetyCeiling(wNum, medication);
  }, [weight, medication]);

  useEffect(() => {
    if (latestWeight) {
      setWeight(latestWeight.toString());
    }
  }, [latestWeight]);

  const handleCalculate = async () => {
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum <= 0) return;
    
    const safetyMultiplier = mode === 'low-resource' ? 0.8 : 1.0;

    if (!isOnline) {
      if (safetyCeiling) {
        const adjustedDose = Math.floor((safetyCeiling.mgPerDose * safetyMultiplier) / 10) * 10;
        setResult({
          medicationName: safetyCeiling.medication,
          recommendedDose: `${adjustedDose} mg (Conservative Offline Calc)`,
          frequency: `Every ${safetyCeiling.intervalHours} hours`,
          maxDose24h: `${safetyCeiling.maxDosesPerDay} doses in 24 hours`,
          cautionaryNotes: `Offline Mode. ${mode === 'low-resource' ? 'Low-resource safety margin applied.' : ''} ${safetyCeiling.safetyWarnings.join(' ')}`
        });
      }
      return;
    }

    setLoading(true);
    try {
      const res = await calculateDosage(weightNum, medication);
      setResult(res);

      addEntry({
        eventType: "dose_calculation",
        userRole: role,
        environment: mode,
        online: isOnline,
        inputSummary: `Weight: ${weight}kg, Medication: ${medication}`,
        outputSummary: `Dose calculated: ${res.recommendedDose}`,
        disclaimerShown: true
      });
    } catch (error) {
      console.error(error);
      alert("Error calculating dosage.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-5 rounded-2xl border-2 border-slate-300 bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none font-black text-2xl text-slate-900 placeholder:text-slate-500 shadow-sm transition-all";
  const labelClass = "block text-[11px] font-black text-slate-700 uppercase tracking-widest ml-2 mb-1";

  if (!latestWeight && !weight) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12 animate-in fade-in">
        <div className="bg-amber-50 border-4 border-dashed border-amber-300 p-12 rounded-[4rem] text-center space-y-8">
           <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-xl mx-auto border-2 border-amber-100">⚖️</div>
           <div className="space-y-3">
             <h3 className="text-3xl font-black text-amber-950 tracking-tighter italic">Weight Required</h3>
             <p className="text-amber-900 text-base font-bold italic leading-relaxed max-w-sm mx-auto">Clinical safety protocols require a recent weight measurement before calculating safe pediatric dosages.</p>
           </div>
           <button onClick={() => navigateTo('redbook')} className="px-10 py-5 bg-amber-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-amber-700 transition-all hover:scale-105">Log Weight in Red Book</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="px-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">SafeDose <span className="text-emerald-600">OTC</span></h2>
          <p className="text-slate-600 font-bold italic mt-1">Weight-based guidance for standard medications.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border-2 border-slate-200 space-y-8">
            <div className="space-y-1">
              <label className={labelClass}>Child's Weight (kg)</label>
              <div className="relative">
                <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 12" className={inputClass} />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm tracking-widest uppercase">kg</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className={labelClass}>Common OTC Medication</label>
              <div className="grid grid-cols-1 gap-3">
                {OTC_MEDICATIONS.map(m => (
                  <button key={m.id} onClick={() => setMedication(m.name)} className={`w-full p-5 rounded-[2rem] border-2 text-left transition-all flex items-center gap-5 ${medication === m.name ? 'border-emerald-600 bg-emerald-50 shadow-md scale-105' : 'border-slate-200 bg-white hover:border-emerald-200 text-slate-500'}`}>
                    <span className="text-3xl">{m.icon}</span>
                    <span className="font-black text-sm leading-tight text-slate-800">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCalculate} disabled={loading || !weight} className={`w-full py-6 rounded-[2rem] font-black text-white shadow-2xl transition-all uppercase tracking-widest text-sm w-full ${loading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}>{loading ? 'Consulting Protocols...' : 'Verify Safe Dose ✨'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
