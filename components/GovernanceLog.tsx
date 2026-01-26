
import React from 'react';
import { useGovernance } from '../context/GovernanceContext';

export const GovernanceLog: React.FC = () => {
  const { log, clearLog } = useGovernance();

  const copyEntry = (entry: any) => {
    const text = `PEDIPULSE GOVERNANCE ENTRY\nType: ${entry.eventType}\nTimestamp: ${new Date(entry.timestamp).toLocaleString()}\nInput: ${entry.inputSummary}\nOutput: ${entry.outputSummary}\nRed Flags: ${entry.redFlags?.join(', ') || 'None'}`;
    navigator.clipboard.writeText(text);
    alert("Entry copied to clipboard for clinical review.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Governance <span className="text-indigo-600">Log</span></h2>
          <p className="text-slate-500 font-medium italic">Traceability audit trail for decision-support interactions.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
             🛡️ Active Integrity Check: {new Date().toLocaleDateString()}
           </span>
           <button 
             onClick={() => confirm("Clear all governance logs?") && clearLog()}
             className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
           >
             Clear Audit Trail 🗑️
           </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-2xl space-y-4">
        {log.length === 0 ? (
          <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm italic">
            No safety-critical interactions recorded in current audit cycle.
          </div>
        ) : (
          log.map((entry) => (
            <div key={entry.id} className="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/20 hover:bg-slate-50 transition-colors space-y-4 relative group">
              <button 
                onClick={() => copyEntry(entry)}
                className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 p-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm"
              >
                Copy Rationale 📋
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                    entry.eventType === 'symptom_evaluation' ? 'bg-rose-50 text-rose-600' :
                    entry.eventType === 'dose_calculation' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {entry.eventType === 'symptom_evaluation' ? '🌡️' : entry.eventType === 'dose_calculation' ? '💊' : '📄'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                      {entry.eventType.replace('_', ' ')}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${entry.userRole === 'clinician' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-indigo-600 border-indigo-100'}`}>{entry.userRole}</span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${entry.environment === 'low-resource' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{entry.environment.replace('-', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Input Context</p>
                   <p className="text-sm font-medium text-slate-600 italic leading-relaxed">"{entry.inputSummary}"</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Outcome</p>
                   <p className="text-sm font-bold text-slate-800 leading-relaxed">{entry.outputSummary}</p>
                </div>
              </div>

              {entry.redFlags && entry.redFlags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {entry.redFlags.map(rf => (
                    <span key={rf} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">🚩 ALERT: {rf}</span>
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
