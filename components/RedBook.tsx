
import React, { useState, useMemo } from 'react';
import { HealthCheck, Vaccination } from '../types';
import { VaccineTracker } from './VaccineTracker';
import { GrowthTracker } from './GrowthTracker';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useNavigation } from '../context/NavigationContext';

const INITIAL_CHECKS: HealthCheck[] = [
  { id: '1', ageMilestone: 'Birth', completed: false, notes: '' },
  { id: '2', ageMilestone: '1-4 Weeks', completed: false, notes: '' },
  { id: '3', ageMilestone: '6-8 Weeks', completed: false, notes: '' },
  { id: '4', ageMilestone: '4 Months', completed: false, notes: '' },
  { id: '5', ageMilestone: '6 Months', completed: false, notes: '' },
  { id: '6', ageMilestone: '12 Months', completed: false, notes: '' },
  { id: '7', ageMilestone: '18 Months', completed: false, notes: '' },
  { id: '8', ageMilestone: '2 Years', completed: false, notes: '' },
  { id: '9', ageMilestone: '3.5-4 Years', completed: false, notes: '' },
];

export const RedBook: React.FC = () => {
  const { history, updateHistory } = useMedicalHistory();
  const { navigateTo } = useNavigation();
  const [checks, setChecks] = useState<HealthCheck[]>(INITIAL_CHECKS);
  const [activeTab, setActiveTab] = useState<'checks' | 'vax' | 'growth'>('checks');
  const [activeCheck, setActiveCheck] = useState<string | null>(null);

  const alerts = useMemo(() => {
    const vaccinations = history.vaccinations || [];
    const growthRecords = history.growthRecords || [];
    const milestones = history.milestones || [];
    
    const overdueVax = vaccinations.filter(v => v.status === 'pending' && new Date() > new Date(v.dueDate));
    const vaxClusterConcern = overdueVax.length >= 3;

    let growthAlert = false;
    let growthSeverity: 'Low' | 'High' = 'Low';
    if (growthRecords.length >= 2) {
      const last = growthRecords[growthRecords.length - 1];
      const prev = growthRecords[growthRecords.length - 2];
      if (last.weight < prev.weight) {
        growthAlert = true;
        growthSeverity = 'High';
      } else if (last.weight === prev.weight && last.age > prev.age) {
        growthAlert = true; 
        growthSeverity = 'Low';
      }
    }

    const activeRedFlags = milestones.filter(m => m.isRedFlag && m.completed);
    return { overdueVax, vaxClusterConcern, growthAlert, growthSeverity, activeRedFlags };
  }, [history.vaccinations, history.growthRecords, history.milestones]);

  const toggleCheck = (id: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const updateNotes = (id: string, notes: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const handleScheduleCheck = (milestone: string) => {
    // In a real app we might pass state to pre-fill the appointment
    navigateTo('appointments');
  };

  const getVaxStatusForMilestone = (milestone: string): Vaccination | undefined => {
    if (!history.vaccinations) return undefined;
    const map: Record<string, number> = { 'Birth': 0, '6-8 Weeks': 2, '4 Months': 4, '6 Months': 6, '12 Months': 12, '18 Months': 18 };
    const age = map[milestone];
    return history.vaccinations.find(v => v.ageMilestone === age);
  };

  const hasAlerts = alerts.overdueVax.length > 0 || alerts.growthAlert || alerts.activeRedFlags.length > 0;

  const tabs = [
    { id: 'checks', label: 'Checks', icon: '🗓️' },
    { id: 'vax', label: 'Vax', icon: '💉' },
    { id: 'growth', label: 'Growth', icon: '📉' }
  ];

  return (
    <div className="space-y-6 pb-32">
      {hasAlerts && (
        <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-xl overflow-hidden animate-in slide-in-from-top-4">
          <div className="bg-rose-600 px-6 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="animate-bounce">🚨</span>
              <h3 className="font-black text-[10px] uppercase tracking-widest">Clinical Patterns of Concern</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {alerts.overdueVax.length > 0 && (
              <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <span className="text-xl">💉</span>
                <div className="flex-1">
                  <p className="font-black text-rose-900 text-sm">Missed Immunisations</p>
                  <p className="text-rose-700/70 text-[10px] font-bold mt-0.5">{alerts.overdueVax.length} doses are overdue. Community risk increased.</p>
                </div>
              </div>
            )}
            {alerts.activeRedFlags.length > 0 && (
              <div className="flex items-start gap-3 bg-rose-100 p-4 rounded-2xl border border-rose-200">
                <span className="text-xl">🚩</span>
                <div className="flex-1">
                  <p className="font-black text-rose-900 text-sm">Red Flags Identified</p>
                  <p className="text-rose-800 text-[10px] font-bold mt-0.5">{alerts.activeRedFlags.length} concerns require review by a Pediatrician.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="flex items-center gap-4 px-1">
        <div className="w-12 h-16 bg-rose-600 rounded-xl flex items-center justify-center text-white font-black text-xs rotate-[-3deg] border-2 border-white shadow-lg uppercase">Book</div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">Digital <span className="text-rose-600">Red Book</span></h2>
          <p className="text-slate-500 text-xs font-medium italic">Standardized Child Health Record Sync</p>
        </div>
      </header>

      <nav className="sticky top-[58px] md:top-0 z-40 bg-[#FBFBFE]/80 backdrop-blur-md py-2">
        <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex items-center">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3.5 rounded-full font-black transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] animate-in slide-in-from-bottom-4">
        {activeTab === 'checks' && (
          <div className="p-5 sm:p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"> Assessment Log</h3>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">Synchronized Baseline</span>
            </div>
            
            <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
              {checks.map((check) => {
                const vax = getVaxStatusForMilestone(check.ageMilestone);
                return (
                  <div key={check.id} className="relative pl-12">
                    <button 
                      onClick={() => toggleCheck(check.id)}
                      className={`absolute left-0 w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all z-10 shadow-sm ${
                        check.completed ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white border-slate-100 text-slate-200'
                      }`}
                    >
                      {check.completed ? '✓' : ''}
                    </button>
                    <div 
                      className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                        activeCheck === check.id ? 'border-rose-100 bg-rose-50/30 shadow-lg' : 'border-slate-50 bg-white shadow-sm hover:border-rose-100'
                      }`}
                      onClick={() => setActiveCheck(activeCheck === check.id ? null : check.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-xl text-slate-800 tracking-tight">{check.ageMilestone} Health Check</h4>
                          <div className="flex gap-2 mt-2">
                            {check.completed && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Assessment Complete</span>}
                            {vax && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                vax.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                {vax.status === 'completed' ? 'Vax Given' : 'Vax Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-slate-300 text-xs mt-1">▼</span>
                      </div>
                      {activeCheck === check.id && (
                        <div className="mt-6 space-y-6 animate-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                          <div className="relative">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest absolute -top-2 left-4 bg-white px-2">Assessment Notes</label>
                            <textarea 
                                className="w-full h-32 p-6 rounded-[2rem] border border-slate-100 bg-white text-sm font-bold italic outline-none focus:ring-4 focus:ring-rose-50 transition-all shadow-inner"
                                placeholder="Log weight gain, feeding concerns, or developmental observations..."
                                value={check.notes}
                                onChange={(e) => updateNotes(check.id, e.target.value)}
                            />
                          </div>
                          {!check.completed && (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={() => handleScheduleCheck(check.ageMilestone)}
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    🗓️ Schedule Review
                                </button>
                                <button 
                                    onClick={() => toggleCheck(check.id)}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all"
                                >
                                    ✓ Record Completion
                                </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'vax' && <div className="p-4 sm:p-8"><VaccineTracker /></div>}
        {activeTab === 'growth' && <div className="p-4 sm:p-8"><GrowthTracker /></div>}
      </div>
    </div>
  );
};
