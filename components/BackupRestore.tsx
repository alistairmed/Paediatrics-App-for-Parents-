import React, { useRef, useState } from 'react';
import { createBackup, readBackup, restoreRecords, backupFileName, BackupError, MIN_BACKUP_PASSWORD } from '../utils/backup';
import { useToast } from '../context/ToastContext';

/** Export an encrypted backup file, or restore one (replaces this device's records). */
export const BackupRestore: React.FC = () => {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError(null);
    if (password.length < MIN_BACKUP_PASSWORD) return setExportError(`Use a password of at least ${MIN_BACKUP_PASSWORD} characters.`);
    if (password !== confirmation) return setExportError("The two passwords don't match.");
    setBusy(true);
    try {
      const blob = new Blob([await createBackup(password)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFileName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setPassword('');
      setConfirmation('');
      showToast('Backup saved. Keep the file and its password somewhere safe.');
    } catch {
      setExportError("Couldn't create the backup. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) return;
    setRestoreError(null);
    setBusy(true);
    try {
      const { records, createdAt } = await readBackup(await restoreFile.text(), restorePassword);
      const made = new Date(createdAt).toLocaleString();
      // Replacing everything is the point of a restore, but it must be deliberate.
      if (!window.confirm(`Replace all records on this device with the backup from ${made}? Records not in the backup will be removed.`)) return;
      await restoreRecords(records);
      showToast('Backup restored.');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setRestoreError(err instanceof BackupError ? err.message : "Couldn't restore this backup.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border-2 border-slate-300 focus:border-indigo-600 outline-none font-black text-slate-900";

  return (
    <section className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">💾</span>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Backup & Restore</h3>
      </div>
      <p className="text-sm font-medium text-slate-600 leading-relaxed">
        Your records live only on this device. Save an encrypted backup file regularly, and keep it somewhere safe such as your own cloud drive.
      </p>

      <form onSubmit={handleExport} className="space-y-3">
        <h4 className="font-black text-slate-800">Save a backup</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">Backup password (at least {MIN_BACKUP_PASSWORD} characters)</span>
            <input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">Repeat password</span>
            <input type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={inputClass} />
          </label>
        </div>
        <p className="text-xs font-bold text-amber-800">You'll need this password to restore the backup. It can't be recovered.</p>
        {exportError && <p role="alert" className="text-sm font-bold text-rose-700">{exportError}</p>}
        <button type="submit" disabled={busy} className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest disabled:bg-slate-400">
          {busy ? 'Working…' : 'Save Backup File'}
        </button>
      </form>

      <form onSubmit={handleRestore} className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="font-black text-slate-800">Restore a backup</h4>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => { setRestoreFile(e.target.files?.[0] || null); setRestoreError(null); }} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="px-5 py-3 rounded-xl bg-white border-2 border-slate-300 text-slate-800 font-black text-xs uppercase tracking-widest">
            Choose Backup File
          </button>
          <span className="text-sm font-bold text-slate-600">{restoreFile ? restoreFile.name : 'No file chosen'}</span>
        </div>
        {restoreFile && (
          <>
            <label className="block max-w-sm">
              <span className="block text-xs font-bold text-slate-700 mb-1">Backup password</span>
              <input type="password" autoComplete="current-password" value={restorePassword} onChange={e => setRestorePassword(e.target.value)} className={inputClass} />
            </label>
            {restoreError && <p role="alert" className="text-sm font-bold text-rose-700">{restoreError}</p>}
            <button type="submit" disabled={busy || !restorePassword} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest disabled:bg-slate-400">
              {busy ? 'Working…' : 'Restore Backup'}
            </button>
          </>
        )}
      </form>
    </section>
  );
};
