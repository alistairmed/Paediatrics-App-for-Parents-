
import React, { useState, useMemo, useEffect } from 'react';
import { ViewType, ChildProfile, MedicalHistory, ClinicalEvent, AcuteLogEntry, Vaccination, GrowthRecord, Milestone, Appointment, SpecialistContact, Medication, Condition } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SymptomChecker } from './components/SymptomChecker';
import { GrowthTracker } from './components/GrowthTracker';
import { DoseCalculator } from './components/DoseCalculator';
import { MilestoneNavigator } from './components/MilestoneNavigator';
import { CalmStory } from './components/CalmStory';
import { VaccineTracker } from './components/VaccineTracker';
import { ScreeningTool } from './components/ScreeningTool';
import { MedicalProfile } from './components/MedicalProfile';
import { AppointmentManager } from './components/AppointmentManager';
import { RedBook } from './components/RedBook';
import { ParentingTips } from './components/ParentingTips';
import { ChildProfileSetup } from './components/ChildProfileSetup';
import { BondingJournal } from './components/BondingJournal';
import { AcuteTracker } from './components/AcuteTracker';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [childProfile, setChildProfile] = useState<ChildProfile | undefined>(undefined);
  
  // Centralized Medical State
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    pastMedicalHistory: '',
    surgicalHistory: '',
    currentMedications: [],
    previousMedications: [],
    allergies: [],
    familyHistory: { maternal: '', paternal: '', siblings: '', other: '' },
    specialists: [],
    appointments: [],
    devices: [],
    sickDayPlan: { instructions: '', emergencyMeds: '', fluidRequirements: '', triggers: '', emergencyContact: '', planPhoto: undefined },
    activeRecommendations: [],
    medicalReports: [],
    conditions: [],
    vaccinations: [],
    growthRecords: [],
    milestones: [],
    acuteLogs: []
  });

  const [bondingNotes, setBondingNotes] = useState<string>('');
  const [pendingClinicalEvents, setPendingClinicalEvents] = useState<ClinicalEvent[]>([]);

  // Sync latest weight to profile
  const latestWeight = useMemo(() => {
    if (medicalHistory.growthRecords && medicalHistory.growthRecords.length > 0) {
      return medicalHistory.growthRecords[medicalHistory.growthRecords.length - 1].weight;
    }
    return childProfile?.weight;
  }, [medicalHistory.growthRecords, childProfile]);

  const handleAddAcuteLog = (entry: Omit<AcuteLogEntry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) } as AcuteLogEntry;
    setMedicalHistory(prev => ({
      ...prev,
      acuteLogs: [newEntry, ...(prev.acuteLogs || [])]
    }));
  };

  const updateMedicalHistory = (updates: Partial<MedicalHistory>) => {
    setMedicalHistory(prev => ({ ...prev, ...updates }));
  };

  const handleAddAppointment = (apt: Appointment, addToCareTeam: boolean) => {
    setMedicalHistory(prev => {
      const newAppointments = [...prev.appointments, apt];
      let newSpecialists = [...prev.specialists];

      if (addToCareTeam) {
        const exists = newSpecialists.some(s => s.name.toLowerCase() === apt.provider.toLowerCase());
        if (!exists) {
          const newSpecialist: SpecialistContact = {
            id: Math.random().toString(36).substr(2, 9),
            name: apt.provider,
            specialty: apt.specialty,
            category: 'Medical'
          };
          newSpecialists.push(newSpecialist);
        }
      }

      return {
        ...prev,
        appointments: newAppointments,
        specialists: newSpecialists
      };
    });
  };

  const nextAppointment = useMemo(() => {
    const upcoming = medicalHistory.appointments
      .filter(a => a.status === 'Upcoming' && new Date(a.dateTime) > new Date())
      .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    return upcoming[0];
  }, [medicalHistory.appointments]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return (
        <div className="space-y-12">
          {nextAppointment && (
            <div className="bg-indigo-600 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🗓️</div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Next Appointment</p>
                   <p className="text-2xl font-black italic">{nextAppointment.specialty} with {nextAppointment.provider}</p>
                   <p className="text-sm font-medium opacity-80">{new Date(nextAppointment.dateTime).toLocaleDateString()} @ {new Date(nextAppointment.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <button onClick={() => setActiveView('appointments')} className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">Prepare Now</button>
            </div>
          )}
          <Dashboard onNavigate={setActiveView} latestWeight={latestWeight} childProfile={childProfile} />
        </div>
      );
      case 'acutelogs': return <AcuteTracker onLogEntry={handleAddAcuteLog} entries={medicalHistory.acuteLogs || []} childWeight={latestWeight} />;
      case 'appointments': return (
        <AppointmentManager 
          history={medicalHistory} 
          onAddAppointment={handleAddAppointment}
          onUpdateAppointments={(apts) => updateMedicalHistory({ appointments: apts })}
        />
      );
      case 'profile': return (
        <MedicalProfile 
          history={medicalHistory}
          updateHistory={updateMedicalHistory}
          attachmentData={{ caregiverObservations: bondingNotes }} 
          pendingEvents={pendingClinicalEvents} 
        />
      );
      case 'redbook': return (
        <RedBook 
          vaccinations={medicalHistory.vaccinations || []} 
          growthRecords={medicalHistory.growthRecords || []} 
          onVaccineUpdate={(v) => updateMedicalHistory({ vaccinations: v })} 
          onGrowthUpdate={(g) => updateMedicalHistory({ growthRecords: g })} 
          onWeightUpdate={(w) => {/* Handled by growth records */}}
        />
      );
      case 'setup': return <ChildProfileSetup initialProfile={childProfile} onSave={setChildProfile} onCancel={() => setActiveView('dashboard')} />;
      case 'symptoms': return <SymptomChecker onSaveEvent={e => setPendingClinicalEvents(prev => [{...e, id: Math.random().toString(36)}, ...prev])} />;
      case 'growth': return <GrowthTracker onWeightUpdate={(w) => {/* Handled by RedBook */}} />;
      case 'dosage': return <DoseCalculator initialWeight={latestWeight} />;
      case 'milestones': return <MilestoneNavigator onLogRedFlag={(desc) => {
        setPendingClinicalEvents(prev => [{ id: Math.random().toString(36), source: 'Development', description: desc, date: new Date().toLocaleDateString(), severity: 'Medium' }, ...prev]);
      }} />;
      case 'bonding': return <BondingJournal observations={bondingNotes} onUpdate={setBondingNotes} childName={childProfile?.name} />;
      case 'vaccines': return <VaccineTracker onSaveEvent={e => setPendingClinicalEvents(prev => [{...e, id: Math.random().toString(36)}, ...prev])} />;
      case 'parenting': return <ParentingTips />;
      case 'stories': return <CalmStory />;
      case 'screening': return <ScreeningTool />;
      default: return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
