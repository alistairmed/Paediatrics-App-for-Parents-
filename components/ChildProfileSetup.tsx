import React, { useState } from 'react';
import { useChildProfile } from '../context/ChildProfileContext';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

/** Add a child, or edit / remove the active child's profile. */
export const ChildProfileSetup: React.FC = () => {
  const { isAddingChild, activeChildId } = useChildProfile();
  // Start with a fresh form when switching between adding and editing, or between children.
  return <ChildProfileForm key={`${isAddingChild ? 'add' : 'edit'}-${activeChildId}`} />;
};

const ChildProfileForm: React.FC = () => {
  const { childProfile, setChildProfile, addChild, removeChild, setHasSkippedSetup, isAddingChild, setIsAddingChild, children } = useChildProfile();
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const editing = isAddingChild ? undefined : childProfile;
  const [name, setName] = useState(editing?.name || '');
  const [dob, setDob] = useState(editing?.dob || '');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(editing?.sex || 'Female');
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const isFirstChild = children.length === 0;

  const finish = () => {
    setIsAddingChild(false);
    navigateTo('dashboard');
  };

  const handleSkip = () => {
    setHasSkippedSetup(true);
    finish();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your child's name.");
    if (!dob) return setError('Please enter a date of birth.');
    if (dob > today) return setError("The date of birth can't be in the future.");

    const profile = {
      medications: [], previousMedications: [], allergies: [],
      ...editing,
      name: name.trim(), dob, sex,
    };
    if (editing) {
      setChildProfile(profile);
      showToast(`${profile.name}'s profile is saved.`);
    } else {
      addChild(profile);
      showToast(`${profile.name} has been added.`);
    }
    setHasSkippedSetup(false);
    finish();
  };

  const handleRemove = async () => {
    if (!editing) return;
    const ok = await confirm({
      title: `Remove ${editing.name}?`,
      message: `This permanently deletes ${editing.name}'s profile and all of their records on this device. Save a backup first if you might need them.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    removeChild(editing.id);
    showToast(`${editing.name} has been removed.`, 'info');
    finish();
  };

  const inputClass = "w-full p-4 rounded-2xl border-2 border-slate-300 bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-slate-900 text-base";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-28">
      <header className="text-center space-y-3">
        <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-xl" aria-hidden="true">👶</div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          {editing ? `Edit ${editing.name}'s profile` : isFirstChild ? 'Add your child' : 'Add another child'}
        </h2>
        <p className="text-base font-medium text-slate-600">Your child's details stay on this device.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Child's name</span>
            <input type="text" autoComplete="off" value={name} onChange={e => setName(e.target.value)} placeholder="First name" className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Date of birth</span>
            <input type="date" max={today} value={dob} onChange={e => setDob(e.target.value)} className={inputClass} />
          </label>
          <fieldset>
            <legend className={labelClass}>Sex</legend>
            <div className="flex gap-2">
              {(['Female', 'Male', 'Other'] as const).map(option => (
                <label key={option} className={`flex-1 text-center p-4 rounded-2xl border-2 font-bold cursor-pointer ${sex === option ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-300 text-slate-700'}`}>
                  <input type="radio" name="sex" value={option} checked={sex === option} onChange={() => setSex(option)} className="sr-only" />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <p className="text-sm font-medium text-slate-600">Record weight and height in the Red Book's growth section.</p>

        {error && <p role="alert" className="text-sm font-bold text-rose-700">{error}</p>}

        <button type="submit" className="w-full py-5 min-h-[48px] text-white font-black rounded-[2rem] shadow-xl bg-indigo-600 hover:bg-indigo-700 uppercase tracking-widest">
          {editing ? 'Save Profile' : `Add ${name.trim() || 'Child'}`}
        </button>

        <div className="flex flex-wrap justify-center gap-4">
          {!editing && isFirstChild && (
            <button type="button" onClick={handleSkip} className="text-sm font-bold text-slate-600 underline min-h-[44px]">Skip for now</button>
          )}
          {!isFirstChild && (
            <button type="button" onClick={finish} className="text-sm font-bold text-slate-600 underline min-h-[44px]">Cancel</button>
          )}
          {editing && (
            <button type="button" onClick={handleRemove} className="text-sm font-bold text-rose-700 underline min-h-[44px]">Remove this child</button>
          )}
        </div>
      </form>
    </div>
  );
};
