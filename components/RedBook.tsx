
import React, { useState, useMemo } from 'react';
import { HealthCheck, Vaccination, GrowthRecord } from '../types';
import { VaccineTracker } from './VaccineTracker';
import { GrowthTracker } from './GrowthTracker';

interface RedBookProps {
  vaccinations: Vaccination[];
  growthRecords: GrowthRecord[];
  onVaccineUpdate: (vaccines: Vaccination[]) => void;
  onGrowthUpdate: (records: GrowthRecord[]) => void;
  onWeightUpdate?: (weight: number) => void;
}

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

export const RedBook: React.FC<RedBookProps> = ({ 
  vaccinations, 
  growthRecords, 
  onVaccineUpdate, 
  onGrowthUpdate,
  onWeightUpdate 
}) => {
  const [checks, setChecks] = useState<HealthCheck[]>(INITIAL_CHECKS);
  const [activeTab, setActiveTab] = useState<'checks' | 'vax' | 'growth'>('checks');
  const [activeCheck, setActiveCheck] = useState<string | null>(null);

  const alerts = useMemo(() => {
    const overdueVax = vaccinations.filter(v => v.status === 'pending' && new Date() > new Date(v.dueDate));
    const pendingChecks = checks.filter(c => !c.completed);
    
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

    return { overdueVax, pendingChecks, growthAlert, growthSeverity };
  }, [vaccinations, checks, growthRecords]);

  const toggleCheck = (id: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const updateNotes = (id: string, notes: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const hasAlerts = alerts.overdueVax.length > 0 || alerts.growthAlert;

  const tabs = [
    { id: 'checks', label: 'Checks', icon: '🗓️' },
    { id: 'vax', label: 'Vax', icon: '💉' },
    { id: 'growth', label: 'Growth', icon: '📉' }
  ];

  return (
    <div className="space-y-6 pb-32">
      {/* Alert Banner */}
      {hasAlerts && (
        <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-xl overflow-hidden animate-in slide-in-from-top-4">
          <div className="bg-rose-600 px-6 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="animate-bounce">🚨</span>
              <h3 className="font-black text-[10px] uppercase tracking-widest">Urgent Notifications</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {alerts.overdueVax.length > 0 && (
              <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <span className="text-xl">💉</span>
                <div className="flex-1">
                  <p className="font-black text-rose-900 text-sm">Missed Immunisations</p>
                  <p className="text-rose-700/70 text-[10px] font-bold leading-tight mt-0.5">Contact GP clinic to schedule missing doses.</p>
                </div>
              </div>
            )}
            {alerts.growthAlert && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${alerts.growthSeverity === 'High' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                <span className="text-xl">{alerts.growthSeverity === 'High' ? '📉' : '⚖️'}</span>
                <div className="flex-1">
                  <p className={`font-black text-sm ${alerts.growthSeverity === 'High' ? 'text-rose-900' : 'text-amber-900'}`}>
                    {alerts.growthSeverity === 'High' ? 'Weight Faltering' : 'Growth Plateau'}
                  </p>
                  <p className={`text-[10px] font-bold leading-tight mt-0.5 ${alerts.growthSeverity === 'High' ? 'text-rose-700/70' : 'text-amber-700/70'}`}>
                    {alerts.growthSeverity === 'High' ? 'Review with Pediatrician immediately.' : 'Monitor feeding and discuss at next review.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="flex items-center gap-4 px-1">
        <div className="w-12 h-16 bg-rose-600 rounded-xl flex items-center justify-center text-white font-black text-xs rotate-[-3deg] border-2 border-white shadow-lg">RED BOOK</div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">Digital <span className="text-rose-600">Red Book</span></h2>
          <p className="text-slate-500 text-xs font-medium italic">Standardized Child Health Record</p>
        </div>
      </header>

      {/* Sticky Navigation Tabs */}
      <nav className="sticky top-[58px] md:top-0 z-40 bg-[#FBFBFE]/80 backdrop-blur-md py-2">
        <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex items-center">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 py-3.5 rounded-full font-black transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 ${
                activeTab === tab.id ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] animate-in slide-in-from-bottom-4">
        {activeTab === 'checks' && (
          <div className="p-5 sm:p-8 space-y-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="text-rose-500">📅</span> Assessments
            </h3>
            <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
              {checks.map((check) => (
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
                    className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                      activeCheck === check.id ? 'border-rose-100 bg-rose-50/30' : 'border-slate-50 bg-white shadow-sm'
                    }`}
                    onClick={() => setActiveCheck(activeCheck === check.id ? null : check.id)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-lg text-slate-800 tracking-tight">{check.ageMilestone} Check</h4>
                      {check.completed && <span className="text-[8px] font-black text-emerald-600 uppercase">Complete</span>}
                    </div>
                    {activeCheck === check.id && (
                      <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                        <textarea 
                          className="w-full h-28 p-4 rounded-2xl border border-slate-100 bg-white text-sm font-bold italic outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Nurse observations..."
                          value={check.notes}
                          onChange={(e) => updateNotes(check.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vax' && (
          <div className="p-4 sm:p-8">
             <VaccineTracker />
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="p-4 sm:p-8">
             <GrowthTracker onWeightUpdate={onWeightUpdate} />
          </div>
        )}
      </div>
    </div>
  );
};
