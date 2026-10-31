
import React from 'react';
import { useGovernance } from '../context/GovernanceContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export const GovernanceLog: React.FC = () => {
  const { log, clearLog } = useGovernance();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const copyEntry = (entry: any) => {
    const text = `PEDIPULSE GOVERNANCE ENTRY\nType: ${entry.eventType}\nTimestamp: ${new Date(entry.timestamp).toLocaleString()}\nInput: ${entry.inputSummary}\nOutput: ${entry.outputSummary}\nRed Flags: ${entry.redFlags?.join(', ') || 'None'}`;
    navigator.clipboard.writeText(text).then(
      () => showToast("Entry copied to the clipboard."),
      () => showToast("Couldn't copy to the clipboard.", 'error')
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Governance <span className="text-indigo-600">Log</span></h2>
          <p className="text-slate-500 font-medium">Traceability audit trail for decision-support interactions.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className="text-xs font-black text-emerald-700 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
             🛡️ Active Integrity Check: {new Date().toLocaleDateString()}
           </span>
           <button 
             onClick={async () => { if (await confirm({ title: 'Clear the activity log?', message: 'This removes every entry in the log on this device.', confirmLabel: 'Clear Log', danger: true })) clearLog(); }}
             className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-700 transition-all"
           >
             Clear Audit Trail 🗑️
           </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-2xl space-y-4">
        {log.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-black uppercase tracking-widest text-sm">
            No safety-critical interactions recorded in current audit cycle.
          </div>
        ) : (
          log.map((entry) => (
            <div key={entry.id} className="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/20 hover:bg-slate-50 transition-colors space-y-4 relative group">
              <button 
                onClick={() => copyEntry(entry)}
                className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 p-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-100 shadow-sm"
              >
                Copy Rationale 📋
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                    entry.eventType === 'symptom_evaluation' ? 'bg-rose-50 text-rose-700' :
                    entry.eventType === 'dose_calculation' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {entry.eventType === 'symptom_evaluation' ? '🌡️' : entry.eventType === 'dose_calculation' ? '💊' : '📄'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                      {entry.eventType.replace('_', ' ')}
                    </h4>
                    <p className="text-xs text-slate-600 font-bold">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${entry.environment === 'low-resource' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{entry.environment.replace('-', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-1">
                   <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Input Context</p>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed">"{entry.inputSummary}"</p>
                </div>
                <div className="space-y-1">
                   <p className="text-xs font-black text-slate-600 uppercase tracking-widest">System Outcome</p>
                   <p className="text-sm font-bold text-slate-800 leading-relaxed">{entry.outputSummary}</p>
                </div>
              </div>

              {entry.redFlags && entry.redFlags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {entry.redFlags.map(rf => (
                    <span key={rf} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">🚩 ALERT: {rf}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
