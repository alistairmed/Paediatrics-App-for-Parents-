
import React, { useState, useEffect, useMemo } from 'react';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useNavigation } from '../context/NavigationContext';
import { useRole } from '../context/RoleContext';
import { useConnectivity } from '../hooks/useConnectivity';
import { useGovernance } from '../context/GovernanceContext';
import { useEnvironment } from '../context/EnvironmentContext';
import { calculateSafetyCeiling } from '../clinical/dosing';
import { ageInMonths } from '../clinical/age';

interface DoseResult {
  medicationName: string;
  recommendedDose: string;
  frequency: string;
  maxDose24h: string;
  cautionaryNotes: string;
  contraindication?: string;
}

const OTC_MEDICATIONS = [
  { id: 'paracetamol', name: 'Paracetamol (Panadol/Tylenol)', icon: '💧' },
  { id: 'ibuprofen', name: 'Ibuprofen (Nurofen/Advil)', icon: '🍊' },
  { id: 'cetirizine', name: 'Antihistamine (Cetirizine/Zyrtec)', icon: '🤧' },
];

export const DoseCalculator: React.FC = () => {
  const { latestWeight } = useMedicalHistory();
  const { childProfile } = useChildProfile();
  const { navigateTo } = useNavigation();
  const { role } = useRole();
  const { addEntry } = useGovernance();
  const { mode } = useEnvironment();
  const isOnline = useConnectivity();

  const [weight, setWeight] = useState(latestWeight?.toString() || '');
  const [medication, setMedication] = useState(OTC_MEDICATIONS[0].name);
  const [result, setResult] = useState<DoseResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ageMonths = useMemo(() => ageInMonths(childProfile?.dob), [childProfile]);

  // Deterministic Safety Check - Runs automatically
  const safetyCeiling = useMemo(() => {
    const wNum = parseFloat(weight);
    if (!weight || isNaN(wNum)) return null;
    return calculateSafetyCeiling(wNum, medication, ageMonths);
  }, [weight, medication, ageMonths]);

  useEffect(() => {
    if (latestWeight) {
      setWeight(latestWeight.toString());
    }
  }, [latestWeight]);

  // A shown result must always match the current inputs.
  useEffect(() => {
    setResult(null);
    setNotice(null);
  }, [weight, medication]);

  // The dose always comes from the deterministic engine in clinical/dosing.ts,
  // never from the AI, so it can't exceed the safety ceiling.
  const handleCalculate = () => {
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum <= 0) return;

    if (!safetyCeiling) {
      setResult(null);
      setNotice(
        weightNum < 2 || weightNum > 150
          ? 'Please check the weight. SafeDose only calculates doses for children between 2 kg and 150 kg.'
          : 'SafeDose does not calculate doses for this medicine. Antihistamine doses depend on age, not weight: follow the directions on the pack or ask your pharmacist.'
      );
      return;
    }

    const safetyMultiplier = mode === 'low-resource' ? 0.8 : 1.0;
    const dose = Math.floor(safetyCeiling.mgPerDose * safetyMultiplier);

    const res: DoseResult = {
      medicationName: safetyCeiling.medication,
      recommendedDose: `${dose} mg`,
      frequency: `At least ${safetyCeiling.intervalHours} hours apart`,
      maxDose24h: `${safetyCeiling.maxDosesPerDay} doses`,
      cautionaryNotes: `${mode === 'low-resource' ? 'Low-resource safety margin applied. ' : ''}${safetyCeiling.safetyWarnings.join(' ')}`,
      contraindication: safetyCeiling.contraindication
    };
    setNotice(null);
    setResult(res);

    addEntry({
      eventType: "dose_calculation",
      userRole: role,
      environment: mode,
      online: isOnline,
      inputSummary: `Weight: ${weight}kg, Medication: ${medication}`,
      outputSummary: res.contraindication ? `Not recommended: ${res.contraindication}` : `Dose calculated: ${res.recommendedDose}`,
      disclaimerShown: true
    });
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

            <button onClick={handleCalculate} disabled={!weight} className={`w-full py-6 rounded-[2rem] font-black text-white shadow-2xl transition-all uppercase tracking-widest text-sm w-full ${!weight ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}>Verify Safe Dose ✨</button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] border border-emerald-50 shadow-2xl space-y-8 animate-in zoom-in-95 border-l-[16px] border-l-emerald-600 relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">💊</div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">{result.medicationName}</h3>
                  <p className="text-emerald-600 font-black text-[9px] uppercase tracking-widest">Guideline for {weight}kg</p>
                </div>
              </div>

              {result.contraindication ? (
                <div className="relative z-10 bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200 space-y-2">
                  <h4 className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Do Not Give Without Medical Advice</h4>
                  <p className="text-rose-950 font-bold text-base leading-relaxed">{result.contraindication}</p>
                </div>
              ) : (
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 text-center">
                    <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-3">Maximum Single Dose</p>
                    <p className="text-5xl font-black text-emerald-600 tracking-tighter">{result.recommendedDose}</p>
                    <p className="text-slate-600 font-black text-[9px] uppercase tracking-widest mt-2">{result.frequency}</p>
                  </div>

                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 text-center">
                    <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-3">Max in 24 Hours</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{result.maxDose24h}</p>
                    <p className="text-rose-600 font-black text-[8px] uppercase tracking-widest mt-2">Critical Safety Limit</p>
                  </div>
                </div>
              )}

              <div className="relative z-10 bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 space-y-2">
                <h4 className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Clinical Precautions</h4>
                <p className="text-emerald-950 font-bold text-base leading-relaxed italic">{result.cautionaryNotes}</p>
                <p className="text-emerald-900 text-sm font-bold">Check the strength (mg per mL) on the bottle to work out how many mL to give.</p>
              </div>
            </div>
          ) : notice ? (
            <div className="h-full min-h-[350px] bg-amber-50 border-2 border-amber-200 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm">⚠️</div>
              <p className="max-w-sm text-amber-950 font-bold leading-relaxed">{notice}</p>
            </div>
          ) : (
            <div className="h-full min-h-[350px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm text-slate-300 opacity-50">⚖️</div>
              <div className="max-w-xs">
                <h4 className="font-black text-slate-800 text-lg tracking-tight mb-1">Verify Safe Dose</h4>
                <p className="text-slate-500 text-xs font-medium italic">Enter weight and select medication to see clinical guidance.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
