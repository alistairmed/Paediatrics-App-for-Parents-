import React, { useState } from 'react';
import { Appointment } from '../types';
import { prepareAppointmentQuestions, GeminiError } from '../services/gemini';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useGovernance } from '../context/GovernanceContext';

export const AppointmentManager: React.FC = () => {
  const { history, updateHistory, addAppointment } = useMedicalHistory();
  const { log } = useGovernance();
  const [prepLoading, setPrepLoading] = useState<string | null>(null);
  const [prepErrors, setPrepErrors] = useState<Record<string, string>>({});
  const [manualPrepId, setManualPrepId] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({ 
    provider: '', specialty: '', dateTime: '', location: '', purpose: '', status: 'Upcoming' 
  });
  const [linkSpecialist, setLinkSpecialist] = useState(true);

  const handleAdd = () => {
    if (newAppointment.provider && newAppointment.dateTime) {
      const apt: Appointment = { 
        id: crypto.randomUUID(), 
        preVisitNotes: '',
        postVisitSummary: '',
        reminderSent: false,
        ...newAppointment 
      } as Appointment;
      addAppointment(apt, linkSpecialist);
      setNewAppointment({ provider: '', specialty: '', dateTime: '', location: '', purpose: '', status: 'Upcoming' });
    }
  };

  const handleAIPrep = async (apt: Appointment) => {
    setPrepLoading(apt.id);
    setPrepErrors(prev => ({ ...prev, [apt.id]: '' }));
    try {
      const recentUrgentFlags = log
        .filter(e => e.redFlags && e.redFlags.length > 0)
        .slice(0, 3)
        .flatMap(e => e.redFlags || []);

      const questions = await prepareAppointmentQuestions(history, apt, recentUrgentFlags);
      updateHistory({
        appointments: history.appointments.map(a => 
          a.id === apt.id ? { ...a, preVisitNotes: questions } : a
        )
      });
    } catch (e: any) {
      console.error(e);
      const msg = e instanceof GeminiError ? e.message : (e?.message || "Error generating prep questions.");
      setPrepErrors(prev => ({ ...prev, [apt.id]: msg }));
    } finally {
      setPrepLoading(null);
    }
  };

  const handleUpdateNotes = (id: string, preVisitNotes: string) => {
    updateHistory({
      appointments: history.appointments.map(a => a.id === id ? { ...a, preVisitNotes } : a)
    });
  };

  const handleUpdateStatus = (id: string, status: 'Completed' | 'Upcoming' | 'Cancelled') => {
    updateHistory({
      appointments: history.appointments.map(a => a.id === id ? { ...a, status } : a)
    });
  };

  const handleUpdateSummary = (id: string, postVisitSummary: string) => {
    updateHistory({
      appointments: history.appointments.map(a => a.id === id ? { ...a, postVisitSummary } : a)
    });
  };

  const renderQuestionList = (notes: string) => {
    const lines = notes.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
    if (lines.length === 0) return <p className="italic text-slate-600 font-bold leading-relaxed">{notes}</p>;
    
    return (
      <div className="space-y-3">
        {lines.map((line, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white/50 rounded-xl transition-all">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
            <span className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
              {line.replace(/^[•-]\s*/, '')}
            </span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-28">
      <header>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight italic">Appointment <span className="text-indigo-600">Navigator</span></h2>
        <p className="text-slate-500 font-medium italic text-xs sm:text-sm">Clinical visit preparation, scheduling coordination, and AI prep.</p>
      </header>

      <section className="bg-white p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 shadow-xl space-y-6 sm:space-y-8">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl shrink-0">🗓️</div>
           <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Schedule Specialist Visit</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-1">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Provider Name</label>
             <input value={newAppointment.provider} onChange={e => setNewAppointment({...newAppointment, provider: e.target.value})} className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]" />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Specialty</label>
             <input value={newAppointment.specialty} onChange={e => setNewAppointment({...newAppointment, specialty: e.target.value})} className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]" />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Date & Time</label>
             <input type="datetime-local" value={newAppointment.dateTime} onChange={e => setNewAppointment({...newAppointment, dateTime: e.target.value})} className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 uppercase min-h-[44px]" />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Location</label>
             <input value={newAppointment.location} onChange={e => setNewAppointment({...newAppointment, location: e.target.value})} className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]" />
          </div>
          <div className="space-y-1 sm:col-span-2">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Clinical Purpose</label>
             <input value={newAppointment.purpose} onChange={e => setNewAppointment({...newAppointment, purpose: e.target.value})} className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 pt-4 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
             <input type="checkbox" checked={linkSpecialist} onChange={e => setLinkSpecialist(e.target.checked)} className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 shrink-0" />
             <span className="text-xs font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Link provider to Care Team</span>
          </label>
          <button onClick={handleAdd} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all min-h-[44px]">Confirm Booking</button>
        </div>
      </section>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-800">Timeline of Care</h3>
        <div className="grid grid-cols-1 gap-6">
          {history.appointments.length === 0 ? (
            <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] p-20 text-center space-y-4">
               <span className="text-6xl block">🗓️</span>
               <p className="text-slate-400 font-black uppercase text-sm tracking-widest">No appointments scheduled</p>
            </div>
          ) : (
            history.appointments.sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()).map(apt => (
              <div key={apt.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm space-y-6 group hover:shadow-xl transition-all ${apt.status === 'Completed' ? 'opacity-70 border-slate-100' : 'border-indigo-50'}`}>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-6">
                    <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black shadow-inner shrink-0 ${apt.status === 'Completed' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                       <span className="text-[10px] uppercase opacity-60">{new Date(apt.dateTime).toLocaleString('en-US', { month: 'short' })}</span>
                       <span className="text-3xl tracking-tighter">{new Date(apt.dateTime).getDate()}</span>
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h5 className="text-2xl font-black text-slate-800 tracking-tight">{apt.specialty}</h5>
                          {apt.status === 'Completed' && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">✓ Completed</span>}
                       </div>
                       <p className="text-indigo-600 font-bold">{apt.provider}</p>
                       <p className="text-slate-400 text-xs font-medium flex items-center gap-2 mt-1 italic">📍 {apt.location} • 🕒 {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 self-start justify-end">
                    {apt.status === 'Upcoming' && (
                      <button 
                        onClick={() => handleAIPrep(apt)} 
                        disabled={prepLoading === apt.id} 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg"
                      >
                        {prepLoading === apt.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing Alerts...
                          </>
                        ) : 'AI Prep ✨'}
                      </button>
                    )}
                  </div>
                </div>

                {prepErrors[apt.id] && (
                  <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 space-y-3">
                    <p className="font-black text-rose-800 text-sm">⚠️ {prepErrors[apt.id]}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleAIPrep(apt)} 
                        className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all"
                      >
                        Try Again
                      </button>
                      <button 
                        onClick={() => setManualPrepId(manualPrepId === apt.id ? null : apt.id)} 
                        className="px-5 py-2 bg-white border border-rose-200 text-rose-800 rounded-xl font-black text-xs uppercase tracking-widest"
                      >
                        Type Questions Manually
                      </button>
                    </div>
                  </div>
                )}

                {(manualPrepId === apt.id || (!apt.preVisitNotes && !prepErrors[apt.id])) && (
                  <div className="pt-2">
                    <button 
                      onClick={() => setManualPrepId(manualPrepId === apt.id ? null : apt.id)}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      ✏️ {manualPrepId === apt.id ? 'Hide Manual Notes' : 'Add Custom Questions Manually'}
                    </button>
                    {manualPrepId === apt.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={apt.preVisitNotes || ''}
                          onChange={e => handleUpdateNotes(apt.id, e.target.value)}
                          placeholder="• Enter questions to ask your doctor...&#10;• What are potential side effects?&#10;• When is our follow-up?"
                          className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {apt.preVisitNotes && (
                  <div className="bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100 animate-in slide-in-from-top-4">
                     <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Recommended Clinical Questions</p>
                     <div className="border-l-4 border-indigo-200 pl-6">
                        {renderQuestionList(apt.preVisitNotes)}
                     </div>
                  </div>
                )}

                <div className="space-y-4">
                   <div className="relative">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 absolute -top-2 left-4 bg-white px-2">Visit Summary</label>
                      <textarea 
                        value={apt.postVisitSummary}
                        onChange={e => handleUpdateSummary(apt.id, e.target.value)}
                        className="w-full h-32 p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50/30 outline-none text-sm font-black italic shadow-inner focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900"
                        placeholder="Log changes to plan, medication adjustments, or follow-up instructions..."
                      />
                   </div>
                   {apt.status === 'Upcoming' && (
                     <div className="flex justify-end">
                       <button onClick={() => handleUpdateStatus(apt.id, 'Completed')} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all hover:-translate-y-1">Mark as Completed</button>
                     </div>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
