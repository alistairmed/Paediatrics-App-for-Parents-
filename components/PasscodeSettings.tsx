import React, { useEffect, useState } from 'react';
import { isLockEnabled, enableLock, disableLock, lockNow } from '../utils/vault';
import { useToast } from '../context/ToastContext';
import { biometricsAvailable, biometricUnlockEnabled, enableBiometricUnlock, disableBiometricUnlock } from '../services/biometricUnlock';

const MIN_LENGTH = 6;

/** Turn the optional passcode lock on or off (Ethics & privacy page). */
export const PasscodeSettings: React.FC = () => {
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(isLockEnabled);
  const [passcode, setPasscode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioPasscode, setBioPasscode] = useState('');
  const [bioError, setBioError] = useState<string | null>(null);

  useEffect(() => {
    biometricsAvailable().then(setBioAvailable);
    biometricUnlockEnabled().then(setBioEnabled).catch(() => setBioEnabled(false));
  }, []);

  const reset = () => { setPasscode(''); setConfirmation(''); setUnderstood(false); setError(null); };

  const handleBioOn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBioError(null);
    try {
      const result = await enableBiometricUnlock(bioPasscode);
      if (result === 'enabled') {
        setBioEnabled(true);
        setBioPasscode('');
        showToast('Face ID or fingerprint unlock is on for this phone.');
      } else {
        setBioError(result === 'wrong-passcode' ? "That passcode isn't right." : 'Face ID or fingerprint check was cancelled.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBioOff = async () => {
    await disableBiometricUnlock();
    setBioEnabled(false);
    showToast('Face ID or fingerprint unlock is off.', 'info');
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (passcode !== confirmation) return setError("The two passcodes don't match.");
    if (!understood) return setError('Please confirm you understand that a forgotten passcode means the records are lost.');
    setBusy(true);
    try {
      await enableLock(passcode);
      await disableBiometricUnlock(); // a key from an earlier passcode no longer applies
      setBioEnabled(false);
      setEnabled(true);
      reset();
      showToast('Passcode lock is on. Your records are now encrypted on this device.');
    } catch (err: any) {
      setError(err?.message || "Couldn't turn on the passcode lock.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (await disableLock(passcode)) {
        await disableBiometricUnlock();
        setBioEnabled(false);
        setEnabled(false);
        reset();
        showToast('Passcode lock is off. Your records are no longer encrypted.', 'info');
      } else {
        setError("That passcode isn't right.");
      }
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border-2 border-ink-300 focus:border-terracotta-600 outline-hidden font-black text-ink-900";

  return (
    <section className="bg-white p-6 sm:p-10 rounded-4xl sm:rounded-[3rem] border border-ink-100 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🔐</span>
        <h3 className="text-xl font-black text-ink-800 uppercase tracking-tight">Passcode Lock</h3>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-black ${enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-600'}`}>{enabled ? 'On' : 'Off'}</span>
      </div>

      {enabled ? (
        <form onSubmit={handleDisable} className="space-y-4">
          <p className="text-sm font-medium text-ink-600 leading-relaxed">
            Your child's profile, medical history and audit log are encrypted on this device. The app locks again after 5 minutes in the background.
          </p>
          <button type="button" onClick={lockNow} className="px-5 py-3 rounded-xl bg-ink-900 text-white font-black text-xs uppercase tracking-widest">Lock Now</button>
          <label className="block pt-2">
            <span className="block text-xs font-bold text-ink-700 mb-1">To turn the lock off, enter your passcode</span>
            <input type="password" autoComplete="current-password" value={passcode} onChange={e => setPasscode(e.target.value)} className={inputClass} />
          </label>
          {error && <p role="alert" className="text-sm font-bold text-terracotta-700">{error}</p>}
          <button type="submit" disabled={busy || !passcode} className="px-5 py-3 rounded-xl bg-white border-2 border-ink-300 text-ink-800 font-black text-xs uppercase tracking-widest disabled:opacity-50">
            {busy ? 'Checking…' : 'Turn Lock Off'}
          </button>
        </form>
      ) : null}

      {enabled && bioAvailable && (
        <div className="pt-4 border-t border-ink-100 space-y-3">
          <h4 className="text-base font-black text-ink-800">Face ID or fingerprint unlock</h4>
          <p className="text-sm font-medium text-ink-600 leading-relaxed">
            Optional. Your records' key is kept in this phone's secure storage and is only released after your face or fingerprint is recognised.
            Anyone whose face or fingerprint is set up on this phone could open them. Your passcode always works too.
          </p>
          {bioEnabled ? (
            <button type="button" onClick={handleBioOff} className="px-5 py-3 rounded-xl bg-white border-2 border-ink-300 text-ink-800 font-black text-xs uppercase tracking-widest">
              Turn Off Face ID or Fingerprint
            </button>
          ) : (
            <form onSubmit={handleBioOn} className="space-y-3">
              <label className="block">
                <span className="block text-xs font-bold text-ink-700 mb-1">Enter your passcode to turn it on</span>
                <input type="password" autoComplete="current-password" value={bioPasscode} onChange={e => setBioPasscode(e.target.value)} className={inputClass} />
              </label>
              {bioError && <p role="alert" className="text-sm font-bold text-terracotta-700">{bioError}</p>}
              <button type="submit" disabled={busy || !bioPasscode} className="px-5 py-3 rounded-xl bg-terracotta-600 text-white font-black text-xs uppercase tracking-widest disabled:bg-ink-400">
                Turn On Face ID or Fingerprint
              </button>
            </form>
          )}
        </div>
      )}

      {!enabled && (
        <form onSubmit={handleEnable} className="space-y-4">
          <p className="text-sm font-medium text-ink-600 leading-relaxed">
            Encrypt your child's records on this device with a passcode, so someone using this phone or browser can't read them without it.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-bold text-ink-700 mb-1">New passcode (at least {MIN_LENGTH} characters)</span>
              <input type="password" autoComplete="new-password" value={passcode} onChange={e => setPasscode(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-ink-700 mb-1">Repeat passcode</span>
              <input type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <input type="checkbox" checked={understood} onChange={e => setUnderstood(e.target.checked)} className="mt-1 w-5 h-5 shrink-0" />
            <span className="text-sm font-bold text-amber-950">I understand that if I forget this passcode, my records can't be recovered.</span>
          </label>
          {error && <p role="alert" className="text-sm font-bold text-terracotta-700">{error}</p>}
          <button type="submit" disabled={busy} className="px-5 py-3 rounded-xl bg-terracotta-600 text-white font-black text-xs uppercase tracking-widest disabled:bg-ink-400">
            {busy ? 'Encrypting…' : 'Turn On Passcode Lock'}
          </button>
        </form>
      )}
    </section>
  );
};
