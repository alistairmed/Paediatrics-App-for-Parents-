
import React, { useState } from 'react';
import { Appointment, MedicalHistory } from '../types';
import { prepareAppointmentQuestions } from '../services/gemini';

interface AppointmentManagerProps {
  history: MedicalHistory;
  onAddAppointment: (apt: Appointment, addToCareTeam: boolean) => void;
  onUpdateAppointments: (appointments: Appointment[]) => void;
}

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({ 
  history, 
  onAddAppointment, 
  onUpdateAppointments 
}) => {
  const [prepLoading, setPrepLoading] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({ 
    provider: '', specialty: '', dateTime: '', location: '', purpose: '', status: 'Upcoming' 
  });
  const [linkSpecialist, setLinkSpecialist] = useState(true);
  const [activeReminders, setActiveReminders] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    if (newAppointment.provider && newAppointment.dateTime) {
      const apt: Appointment = { 
        id: Math.random().toString(36).substr(2, 9), 
        preVisitNotes: '',
        postVisitSummary: '',
        reminderSent: false,
        ...newAppointment 
      } as Appointment;
      onAddAppointment(apt, linkSpecialist);
      setNewAppointment({ provider: '', specialty: '', dateTime: '', location: '', purpose: '', status: 'Upcoming' });
    }
  };

  const handleAIPrep = async (apt: Appointment) => {
    setPrepLoading(apt.id);
    try {
      const questions = await prepareAppointmentQuestions(history, apt);
      onUpdateAppointments(history.appointments.map(a => 
        a.id === apt.id ? { ...a, preVisitNotes: questions } : a
      ));
    } catch (e) {
      alert("Error generating prep questions.");
    } finally {
      setPrepLoading(null);
    }
  };

  const setBrowserReminder = (apt: Appointment) => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const aptTime = new Date(apt.dateTime).getTime();
        const now = new Date().getTime();
        const delay = aptTime - now - 3600000; // 1 hour before

        if (delay > 0) {
          setTimeout(() => {
            new Notification(`Upcoming Appointment: ${apt.specialty}`, {
              body: `Meeting with ${apt.provider} in 1 hour at ${apt.location}`,
              icon: '/icon.png'
            });
          }, delay);
          setActiveReminders(prev => new Set(prev).add(apt.id));
          alert("Reminder set for 1 hour before appointment!");
        } else {
          alert("Appointment is too soon for a 1-hour reminder.");
        }
      }
    });
  };

  const handleCalendarSync = (apt: Appointment) => {
    const start = new Date(apt.dateTime).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(new Date(apt.dateTime).getTime() + 3600000).toISOString().replace(/-|:|\.\d+/g, "");
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${apt.specialty} with ${apt.provider}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `LOCATION:${apt.location}`,
      `DESCRIPTION:${apt.purpose}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointment_${apt.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalendarLink = (apt: Appointment) => {
    const start = new Date(apt.dateTime).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(new Date(apt.dateTime).getTime() + 3600000).toISOString().replace(/-|:|\.\d+/g, "");
    const text = encodeURIComponent(`${apt.specialty} - ${apt.provider}`);
    const location = encodeURIComponent(apt.location);
    const details = encodeURIComponent(apt.purpose);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`;
  };

  // Helper to split AI notes into interactive items
  const renderQuestionList = (notes: string) => {
    const lines = notes.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
    if (lines.length === 0) return <p className="italic text-slate-600">{notes}</p>;
    
    return (
      <div className="space-y-3">
        {lines.map((line, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white/50 rounded-xl transition-all">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
            <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
              {line.replace(/^[•-]\s*/, '')}
            </span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <header>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Appointment <span className="text-indigo-600">Navigator</span></h2>
        <p className="text-slate-500 font-medium italic">Clinical visit preparation, scheduling coordination, and AI prep.</p>
      </header>

      {/* Appointment Add Form */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">🗓️</div>
           <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Schedule Specialist Visit</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Provider Name</label>
             <input value={newAppointment.provider} onChange={e => setNewAppointment({...newAppointment, provider: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Specialty</label>
             <input value={newAppointment.specialty} onChange={e => setNewAppointment({...newAppointment, specialty: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date & Time</label>
             <input type="datetime-local" value={newAppointment.dateTime} onChange={e => setNewAppointment({...newAppointment, dateTime: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Location</label>
             <input value={newAppointment.location} onChange={e => setNewAppointment({...newAppointment, location: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1 md:col-span-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Clinical Purpose</label>
             <input value={newAppointment.purpose} onChange={e => setNewAppointment({...newAppointment, purpose: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-50">
          <label className="flex items-center gap-3 cursor-pointer group">
             <input type="checkbox" checked={linkSpecialist} onChange={e => setLinkSpecialist(e.target.checked)} className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500" />
             <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Link provider to Care Team automatically</span>
          </label>
          <button onClick={handleAdd} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all hover:-translate-y-1">Confirm Booking</button>
        </div>
      </section>

      {/* Appointment List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-2xl font-black text-slate-800">Timeline of Care</h3>
           <div className="flex gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Upcoming ({history.appointments.filter(a => a.status === 'Upcoming').length})</span>
           </div>
        </div>
        
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
                          {activeReminders.has(apt.id) && <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded animate-pulse">🔔 Reminder Set</span>}
                       </div>
                       <p className="text-indigo-600 font-bold">{apt.provider}</p>
                       <p className="text-slate-400 text-xs font-medium flex items-center gap-2 mt-1 italic">
                         📍 {apt.location} • 🕒 {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 self-start justify-end">
                    <div className="flex gap-1">
                      <button onClick={() => handleCalendarSync(apt)} title="Download .ics" className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2">
                        <span className="text-sm">📥</span>
                        <span className="text-[9px] font-black uppercase">Universal</span>
                      </button>
                      <a href={getGoogleCalendarLink(apt)} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2">
                        <span className="text-sm">📅</span>
                        <span className="text-[9px] font-black uppercase">Google</span>
                      </a>
                    </div>
                    {apt.status === 'Upcoming' && (
                      <button onClick={() => setBrowserReminder(apt)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2">
                        <span className="text-sm">🔔</span>
                        <span className="text-[9px] font-black uppercase">Reminder</span>
                      </button>
                    )}
                    {apt.status === 'Upcoming' && (
                      <button onClick={() => handleAIPrep(apt)} disabled={!!prepLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg">
                        {prepLoading === apt.id ? 'Analyzing...' : 'Prep with AI ✨'}
                      </button>
                    )}
                  </div>
                </div>

                {apt.preVisitNotes && (
                  <div className="bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100 animate-in slide-in-from-top-4">
                     <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">✨</span>
                        <div>
                           <h6 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Clinical Prep Checklist</h6>
                           <p className="text-[10px] text-slate-400 font-medium">Interactive questions generated for this visit</p>
                        </div>
                     </div>
                     <div className="border-l-4 border-indigo-200 pl-6">
                        {renderQuestionList(apt.preVisitNotes)}
                     </div>
                  </div>
                )}

                <div className="space-y-4">
                   <div className="relative">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 absolute -top-2 left-4 bg-white px-2">Visit Summary & Outcome</label>
                      <textarea 
                        value={apt.postVisitSummary}
                        onChange={e => onUpdateAppointments(history.appointments.map(a => a.id === apt.id ? { ...a, postVisitSummary: e.target.value } : a))}
                        className="w-full h-32 p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50/30 outline-none text-sm font-bold italic shadow-inner focus:ring-2 focus:ring-indigo-100 transition-all"
                        placeholder="Log changes to plan, medication adjustments, or follow-up instructions..."
                      />
                   </div>
                   {apt.status === 'Upcoming' && (
                     <div className="flex justify-end">
                       <button 
                        onClick={() => onUpdateAppointments(history.appointments.map(a => a.id === apt.id ? { ...a, status: 'Completed' } : a))}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all hover:-translate-y-1"
                       >
                         Complete Visit & Save Summary
                       </button>
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
