
import React, { useState, useEffect } from 'react';
import { calculateDosage } from '../services/gemini';

interface DoseCalculatorProps {
  initialWeight?: number;
}

const OTC_MEDICATIONS = [
  { id: 'paracetamol', name: 'Paracetamol (Panadol/Tylenol)', icon: '💧' },
  { id: 'ibuprofen', name: 'Ibuprofen (Nurofen/Advil)', icon: '🍊' },
  { id: 'cetirizine', name: 'Antihistamine (Cetirizine/Zyrtec)', icon: '🤧' },
];

export const DoseCalculator: React.FC<DoseCalculatorProps> = ({ initialWeight }) => {
  const [weight, setWeight] = useState(initialWeight?.toString() || '');
  const [medication, setMedication] = useState(OTC_MEDICATIONS[0].name);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (initialWeight) {
      setWeight(initialWeight.toString());
    }
  }, [initialWeight]);

  const handleCalculate = async () => {
    if (!weight || Number(weight) <= 0) return;
    setLoading(true);
    try {
      const res = await calculateDosage(Number(weight), medication);
      setResult(res);
    } catch (error) {
      console.error(error);
      alert("Error calculating dosage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="px-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">SafeDose <span className="text-emerald-600">OTC</span></h2>
        <p className="text-slate-500 text-xs font-medium italic mt-1">Weight-based guidance for standard medications.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Child's Weight (kg)</label>
              <div className="relative">
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full p-5 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-black text-xl bg-slate-50/30" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs tracking-widest uppercase">kg</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Common OTC Medication</label>
              <div className="grid grid-cols-1 gap-2">
                {OTC_MEDICATIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMedication(m.name)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                      medication === m.name 
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                        : 'border-slate-50 bg-white hover:border-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="font-bold text-sm leading-tight">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleCalculate}
              disabled={loading || !weight}
              className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all uppercase tracking-widest text-xs ${
                loading ? 'bg-slate-300' : 'bg-emerald-600 active:scale-95'
              }`}
            >
              {loading ? 'Consulting Protocols...' : 'Verify Safe Dose ✨'}
            </button>
          </div>

          <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
             <span className="text-2xl">💡</span>
             <p className="text-amber-800 text-[11px] font-bold italic leading-relaxed">
               Verify the <strong>concentration</strong> (mg/mL) on the label. Volume varies based on the specific brand's strength.
             </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] border border-emerald-50 shadow-2xl space-y-8 animate-in zoom-in-95 border-l-[16px] border-l-emerald-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500 rounded-full opacity-5 blur-3xl"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">💊</div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">{result.medicationName}</h3>
                  <p className="text-emerald-600 font-black text-[9px] uppercase tracking-widest">Guideline for {weight}kg</p>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 text-center">
                  <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-3">Recommended Single Dose</p>
                  <p className="text-5xl font-black text-emerald-600 tracking-tighter">{result.recommendedDose}</p>
                  <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mt-2 opacity-60">{result.frequency}</p>
                </div>
                
                <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 text-center">
                  <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-3">Max in 24 Hours</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{result.maxDose24h}</p>
                  <p className="text-rose-500 font-black text-[8px] uppercase tracking-widest mt-2">Critical Safety Limit</p>
                </div>
              </div>

              <div className="relative z-10 bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 space-y-2">
                <h4 className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Clinical Precautions</h4>
                <p className="text-emerald-950 font-bold text-base leading-relaxed italic">
                  {result.cautionaryNotes}
                </p>
              </div>

              <div className="relative z-10 pt-6 border-t border-slate-100 flex flex-wrap justify-center gap-3">
                <span className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase">RCH Pharmacopoeia</span>
                <span className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase">QCH Guidelines</span>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center space-y-4">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm text-slate-300 opacity-50">⚖️</div>
               <div className="max-w-xs">
                 <h4 className="font-black text-slate-800 text-lg tracking-tight mb-1">Verify Safe Dose</h4>
                 <p className="text-slate-400 text-xs font-medium italic">Enter weight and select medication to see clinical guidance.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-rose-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group mx-1">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-xl border border-white/10">🚨</div>
            <p className="font-black text-2xl italic tracking-tighter leading-none">Safety Notice</p>
          </div>
          <p className="text-rose-50 text-sm font-bold leading-relaxed italic">
            This tool provides estimates for <strong>OTC medications only</strong>. It is NOT a prescription. Always use an oral syringe for precise measurement. Antibiotics must be dosed by a physician.
          </p>
        </div>
      </div>
    </div>
  );
};
