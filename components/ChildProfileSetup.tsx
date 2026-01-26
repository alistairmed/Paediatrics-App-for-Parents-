
import React, { useState, useEffect } from 'react';
import { ChildProfile, Medication } from '../types';
import { useChildProfile } from '../context/ChildProfileContext';
import { useNavigation } from '../context/NavigationContext';

export const ChildProfileSetup: React.FC = () => {
  const { childProfile, setChildProfile, setHasSkippedSetup } = useChildProfile();
  const { navigateTo } = useNavigation();
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Child Info
  const [name, setName] = useState(childProfile?.name || '');
  const [dob, setDob] = useState(childProfile?.dob || '');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(childProfile?.sex || 'Male');
  const [weight, setWeight] = useState(childProfile?.weight?.toString() || '');
  const [height, setHeight] = useState(childProfile?.height?.toString() || '');
  const [medHistory, setMedHistory] = useState(childProfile?.pastMedicalHistory || '');
  
  // Account Info
  const [email, setEmail] = useState(childProfile?.email || '');
  const [password, setPassword] = useState(childProfile?.password || '');
  const [stayLoggedIn, setStayLoggedIn] = useState(childProfile?.stayLoggedIn ?? true);
  const [agreedToTerms, setAgreedToTerms] = useState(!!childProfile);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const errors = [];
    if (!name) errors.push("Name is required");
    if (!dob) errors.push("DOB is required");
    if (!email) errors.push("Email is required");
    if (!agreedToTerms) errors.push("Agreement required");
    setValidationErrors(errors);
  }, [name, dob, email, agreedToTerms]);

  const handleSkip = () => {
    setHasSkippedSetup(true);
    navigateTo('dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationErrors.length > 0) {
      return;
    }

    const weightNum = parseFloat(weight);
    if (weight && (weightNum < 2 || weightNum > 150)) {
       alert("Please enter a realistic pediatric weight (2 kg to 150 kg).");
       return;
    }

    setIsSaving(true);
    
    setTimeout(() => {
      setChildProfile({
        name,
        dob,
        sex,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        pastMedicalHistory: medHistory,
        medications: childProfile?.medications || [],
        previousMedications: childProfile?.previousMedications || [],
        allergies: childProfile?.allergies || [],
        email,
        password,
        stayLoggedIn
      });
      setHasSkippedSetup(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        navigateTo('dashboard');
        setIsSaving(false);
      }, 800);
    }, 1000);
  };

  const inputClass = "w-full p-5 rounded-2xl border-2 border-slate-300 bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-slate-900 text-lg transition-all placeholder:text-slate-400 shadow-sm";
  const labelClass = "block text-[11px] font-black text-slate-700 uppercase tracking-widest ml-2 mb-1";

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      <header className="text-center space-y-4">
        <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl rotate-3 transition-transform hover:rotate-0 cursor-default">🩺</div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">
          {childProfile ? 'Profile Edit' : 'Clinical Onboarding'}
        </h2>
        <p className="text-slate-600 font-bold italic">Persistence for clinical baseline and alerts.</p>
        
        {!childProfile && !isSuccess && (
          <div className="pt-4">
            <button onClick={handleSkip} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 border-2 border-slate-200 px-8 py-3 rounded-2xl transition-all">Skip →</button>
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>Child's Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Birth Date</label>
              <input type="date" required max={new Date().toISOString().split('T')[0]} value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass + " uppercase"} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Latest Weight (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 12.5" className={inputClass} />
            </div>
            <div className="space-y-1">
               <label className={labelClass}>Guardian Email</label>
               <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" className={inputClass} />
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <button type="submit" disabled={isSaving || validationErrors.length > 0} className={`w-full py-7 text-white font-black rounded-[2.5rem] shadow-2xl transition-all transform active:scale-95 text-base uppercase tracking-[0.2em] flex items-center justify-center gap-3 ${isSuccess ? 'bg-emerald-500' : (validationErrors.length > 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700')}`}>
            {isSuccess ? 'Profile Ready ✓' : isSaving ? 'Saving...' : 'Sync Registry ✨'}
          </button>
        </div>
      </form>
    </div>
  );
};
