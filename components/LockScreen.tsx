import React, { useState } from 'react';
import { unlock, eraseAllData } from '../utils/vault';

/** Shown before the app loads when the passcode lock is on. */
export const LockScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [passcode, setPasscode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErase, setShowErase] = useState(false);
  const [eraseText, setEraseText] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;
    setChecking(true);
    setError(null);
    try {
      if (await unlock(passcode)) onUnlock();
      else setError("That passcode isn't right. Please try again.");
    } catch {
      setError("Couldn't open your records on this device.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 sm:p-10 shadow-2xl space-y-6 border border-slate-100">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg mx-auto" aria-hidden="true">🔒</div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">PediPulse is locked</h1>
          <p className="text-sm font-bold text-slate-600">Enter your passcode to open your child's records.</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <label className="block">
            <span className="block text-[11px] font-black text-slate-700 uppercase tracking-widest ml-2 mb-1">Passcode</span>
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-xl text-slate-900"
            />
          </label>
          {error && <p role="alert" className="text-sm font-bold text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={checking || !passcode}
            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400"
          >
            {checking ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>

        {!showErase ? (
          <button onClick={() => setShowErase(true)} className="w-full text-xs font-bold text-slate-500 underline">
            Forgot your passcode?
          </button>
        ) : (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-rose-950 leading-relaxed">
              Your records are encrypted with your passcode, so they can't be recovered without it. You can erase everything on this device and start again.
            </p>
            <label className="block">
              <span className="block text-xs font-bold text-rose-900 mb-1">Type ERASE to confirm</span>
              <input value={eraseText} onChange={e => setEraseText(e.target.value)} className="w-full p-3 rounded-xl border-2 border-rose-200 font-black" />
            </label>
            <div className="flex gap-2">
              <button
                onClick={eraseAllData}
                disabled={eraseText.trim().toUpperCase() !== 'ERASE'}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest disabled:bg-rose-300"
              >
                Erase all data
              </button>
              <button onClick={() => { setShowErase(false); setEraseText(''); }} className="flex-1 py-3 rounded-xl bg-white border-2 border-rose-200 text-rose-900 font-black text-xs uppercase tracking-widest">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
