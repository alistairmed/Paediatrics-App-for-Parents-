
import React, { useState } from 'react';
import { ChildProfile, Medication } from '../types';

interface ChildProfileSetupProps {
  initialProfile?: ChildProfile;
  onSave: (profile: ChildProfile) => void;
  onCancel?: () => void;
}

export const ChildProfileSetup: React.FC<ChildProfileSetupProps> = ({ initialProfile, onSave, onCancel }) => {
  // Child Info
  const [name, setName] = useState(initialProfile?.name || '');
  const [dob, setDob] = useState(initialProfile?.dob || '');
  const [sex, setSex] = useState<ChildProfile['sex']>(initialProfile?.sex || 'Male');
  const [weight, setWeight] = useState(initialProfile?.weight?.toString() || '');
  const [height, setHeight] = useState(initialProfile?.height?.toString() || '');
  const [medHistory, setMedHistory] = useState(initialProfile?.pastMedicalHistory || '');
  
  // Account Info
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [password, setPassword] = useState(initialProfile?.password || '');
  const [stayLoggedIn, setStayLoggedIn] = useState(initialProfile?.stayLoggedIn ?? true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [meds, setMeds] = useState<Medication[]>(initialProfile?.medications || []);
  const [newMed, setNewMed] = useState<Partial<Medication>>({ 
    name: '', 
    dose: '', 
    instructions: '', 
    indication: '', 
    startDate: new Date().toISOString().split('T')[0] 
  });
  
  const [allergies, setAllergies] = useState<string[]>(initialProfile?.allergies || []);
  const [newAllergy, setNewAllergy] = useState('');

  const handleAddMed = () => {
    if (newMed.name) {
      setMeds([...meds, { id: Math.random().toString(36).substr(2, 9), ...newMed } as Medication]);
      setNewMed({ 
        name: '', 
        dose: '', 
        instructions: '', 
        indication: '', 
        startDate: new Date().toISOString().split('T')[0] 
      });
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob || !email) {
      alert("Please complete the required fields (Name, DOB, and Email).");
      return;
    }
    if (!initialProfile && !agreedToTerms) {
      alert("Please agree to the clinical terms and privacy policy.");
      return;
    }
    onSave({
      name,
      dob,
      sex,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      pastMedicalHistory: medHistory,
      medications: meds,
      previousMedications: initialProfile?.previousMedications || [],
      allergies: allergies,
      email,
      password,
      stayLoggedIn
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      <header className="text-center space-y-4">
        <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl rotate-3">
          🩺
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">
          {initialProfile ? 'Account Settings' : 'Clinical Onboarding'}
        </h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          {initialProfile 
            ? 'Refine your account and child\'s baseline medical data.' 
            : 'Initialize your PediPulse account and child\'s clinical profile to enable personalized AI triage.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* Account Information Section */}
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg">🔑</span>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Account & Security</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
              <input
                type="password"
                required={!initialProfile}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-2">
             <input 
              type="checkbox" 
              checked={stayLoggedIn} 
              onChange={e => setStayLoggedIn(e.target.checked)}
              className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500"
             />
             <span className="text-xs font-bold text-slate-500">Keep me logged in for faster triage access</span>
          </div>
        </section>

        {/* Identity Section */}
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg">🆔</span>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Child's Profile</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Child's Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date of Birth</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sex</label>
              <select 
                value={sex} 
                onChange={(e) => setSex(e.target.value as any)}
                className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50/50 font-bold"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Current Weight</label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.000"
                  className="w-full p-5 pr-14 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 font-bold text-lg outline-none transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-indigo-600 transition-colors uppercase text-[10px] tracking-widest">kg</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Current Height</label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="00.0"
                  className="w-full p-5 pr-14 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 font-bold text-lg outline-none transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-indigo-600 transition-colors uppercase text-[10px] tracking-widest">cm</span>
              </div>
            </div>
          </div>
        </section>

        {/* Clinical History Section */}
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-lg">📋</span>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Medical Background</h3>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Longitudinal Medical History</label>
            <textarea
              value={medHistory}
              onChange={(e) => setMedHistory(e.target.value)}
              placeholder="List chronic conditions, past surgeries, or specialist involvements..."
              className="w-full h-40 p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-rose-500 outline-none font-medium resize-none shadow-inner"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Allergies & Reactions</label>
            <div className="flex gap-2">
              <input 
                value={newAllergy} 
                onChange={e => setNewAllergy(e.target.value)} 
                placeholder="e.g. Peanuts (Anaphylaxis)" 
                className="flex-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
              />
              <button type="button" onClick={handleAddAllergy} className="bg-rose-500 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {allergies.map((a, i) => (
                <span key={i} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black border border-rose-100 flex items-center gap-2 uppercase tracking-wider">
                  {a} <button type="button" onClick={() => setAllergies(allergies.filter((_, idx) => idx !== i))}>×</button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Legal Consent */}
        {!initialProfile && (
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex items-start gap-4">
             <input 
              type="checkbox" 
              checked={agreedToTerms} 
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500"
             />
             <div className="text-xs text-slate-500 leading-relaxed font-medium italic">
                I agree to the <strong className="text-slate-800">Terms of Service</strong> and <strong className="text-slate-800">Privacy Policy</strong>. I understand that PediPulse AI provides clinical guidance but is <strong>not a replacement for emergency medical care</strong>.
             </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex-grow py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl hover:bg-indigo-700 transition-all transform active:scale-95 text-sm uppercase tracking-widest"
          >
            {initialProfile ? 'Save Changes' : 'Create Account & Profile ✨'}
          </button>
        </div>
      </form>
    </div>
  );
};
