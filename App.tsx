
import React, { useMemo, useEffect } from 'react';
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
import { HandoverSummary } from './components/HandoverSummary';
import { GovernanceLog } from './components/GovernanceLog';
import { EthicsSafety } from './components/EthicsSafety';
import { RegulatoryRisk } from './components/RegulatoryRisk';
import { SickDayPlanView } from './components/SickDayPlanView';
import { ClinicianTools } from './components/ClinicianTools';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ChildProfileProvider, useChildProfile } from './context/ChildProfileContext';
import { MedicalHistoryProvider, useMedicalHistory } from './context/MedicalHistoryContext';
import { RoleProvider } from './context/RoleContext';
import { GovernanceProvider, useGovernance } from './context/GovernanceContext';
import { EnvironmentProvider } from './context/EnvironmentContext';
import { ViewType } from './types';

const DisclaimerModal: React.FC = () => {
  const { hasAcceptedDisclaimer, acceptDisclaimer } = useGovernance();
  const { navigateTo } = useNavigation();

  if (hasAcceptedDisclaimer) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] max-w-lg w-full p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
         <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner mx-auto">⚠️</div>
         <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic leading-none">Purpose & Safety Notice</h2>
            <div className="text-slate-500 font-medium italic space-y-4 leading-relaxed text-sm">
               <p>PediPulse AI is a <strong>decision-support tool</strong>. It organizes data and highlights red flags locally.</p>
               <p>It is <strong>NOT intended to provide medical advice, diagnosis, or treatment.</strong></p>
               <p>If you observe dangerous signs, <strong>seek professional medical care immediately.</strong></p>
            </div>
         </div>
         <div className="space-y-3">
           <button 
            onClick={acceptDisclaimer}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
           >
             I Understand & Agree
           </button>
         </div>
      </div>
    </div>
  );
};

const DashboardView: React.FC = () => {
  const { nextAppointment } = useMedicalHistory();
  const { navigateTo } = useNavigation();

  return (
    <div className="space-y-12">
      {nextAppointment && (
        <div className="bg-indigo-600 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🗓️</div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Next Appointment</p>
               <p className="text-2xl font-black italic">{nextAppointment.specialty} with {nextAppointment.provider}</p>
            </div>
          </div>
          <button onClick={() => navigateTo('appointments')} className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">Prepare</button>
        </div>
      )}
      <Dashboard />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeView, navigateTo } = useNavigation();
  const { childProfile, hasSkippedSetup } = useChildProfile();

  // Airtight Persistence Redirect: Runs once on mount and when profile state changes
  useEffect(() => {
    const publicViews: ViewType[] = ['ethics', 'regulatory', 'governance', 'setup'];
    const isReady = !!childProfile || hasSkippedSetup;
    
    if (!isReady && !publicViews.includes(activeView)) {
      navigateTo('setup');
    } else if (isReady && activeView === 'setup' && !childProfile) {
      // If we are at setup but have already skipped, dashboard is home
      // But if we have a childProfile, we stay on setup only if manually clicked (for editing)
    }
  }, [childProfile, hasSkippedSetup, activeView, navigateTo]);

  const ViewComponent = useMemo(() => {
    // Fix: Added missing 'developmental' property to views Record to match ViewType definition
    const views: Record<ViewType, React.ReactNode> = {
      dashboard: <DashboardView />,
      acutelogs: <AcuteTracker />,
      appointments: <AppointmentManager />,
      profile: <MedicalProfile />,
      history: <MedicalProfile />,
      medications: <MedicalProfile />,
      careteam: <MedicalProfile />,
      diagnostics: <MedicalProfile />,
      reports: <MedicalProfile />,
      devices: <MedicalProfile />,
      familyhistory: <MedicalProfile />,
      developmental: <MedicalProfile />,
      redbook: <RedBook />,
      setup: <ChildProfileSetup />,
      symptoms: <SymptomChecker />,
      growth: <GrowthTracker />,
      dosage: <DoseCalculator />,
      milestones: <MilestoneNavigator />,
      bonding: <BondingJournal />,
      vaccines: <VaccineTracker />,
      parenting: <ParentingTips />,
      stories: <CalmStory />,
      screening: <ScreeningTool />,
      handover: <HandoverSummary />,
      governance: <GovernanceLog />,
      ethics: <EthicsSafety />,
      regulatory: <RegulatoryRisk />,
      sickday: <SickDayPlanView />,
      consults: <ClinicianTools type="consults" />,
      assignments: <ClinicianTools type="assignments" />,
      reasoning: <ClinicianTools type="reasoning" />
    };
    return views[activeView] || views.dashboard;
  }, [activeView]);

  return (
    <Layout activeView={activeView} onNavigate={navigateTo}>
      <DisclaimerModal />
      <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 text-center mb-8 rounded-2xl shadow-sm space-y-1">
        <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">⚠️ Safety Notice: Decision Support Tool Only</p>
        <p className="text-[9px] text-rose-500 italic font-bold">Data remains on this device • Replaces no clinical judgment.</p>
      </div>
      {ViewComponent}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <NavigationProvider>
      <EnvironmentProvider>
        <RoleProvider>
          <GovernanceProvider>
            <ChildProfileProvider>
              <MedicalHistoryProvider>
                <AppContent />
              </MedicalHistoryProvider>
            </ChildProfileProvider>
          </GovernanceProvider>
        </RoleProvider>
      </EnvironmentProvider>
    </NavigationProvider>
  );
};

export default App;
