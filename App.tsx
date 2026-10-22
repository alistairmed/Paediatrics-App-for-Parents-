
import React, { useMemo, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { ChildProfileSetup } from './components/ChildProfileSetup';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ChildProfileProvider, useChildProfile } from './context/ChildProfileContext';
import { MedicalHistoryProvider, useMedicalHistory } from './context/MedicalHistoryContext';
import { RoleProvider } from './context/RoleContext';
import { GovernanceProvider, useGovernance } from './context/GovernanceContext';
import { EnvironmentProvider } from './context/EnvironmentContext';
import { ViewType } from './types';

// Each screen is loaded on demand so the first page doesn't download the whole app.
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const SymptomChecker = lazy(() => import('./components/SymptomChecker').then(m => ({ default: m.SymptomChecker })));
const GrowthTracker = lazy(() => import('./components/GrowthTracker').then(m => ({ default: m.GrowthTracker })));
const DoseCalculator = lazy(() => import('./components/DoseCalculator').then(m => ({ default: m.DoseCalculator })));
const MilestoneNavigator = lazy(() => import('./components/MilestoneNavigator').then(m => ({ default: m.MilestoneNavigator })));
const CalmStory = lazy(() => import('./components/CalmStory').then(m => ({ default: m.CalmStory })));
const VaccineTracker = lazy(() => import('./components/VaccineTracker').then(m => ({ default: m.VaccineTracker })));
const ScreeningTool = lazy(() => import('./components/ScreeningTool').then(m => ({ default: m.ScreeningTool })));
const MedicalProfile = lazy(() => import('./components/MedicalProfile').then(m => ({ default: m.MedicalProfile })));
const AppointmentManager = lazy(() => import('./components/AppointmentManager').then(m => ({ default: m.AppointmentManager })));
const RedBook = lazy(() => import('./components/RedBook').then(m => ({ default: m.RedBook })));
const ParentingTips = lazy(() => import('./components/ParentingTips').then(m => ({ default: m.ParentingTips })));
const BondingJournal = lazy(() => import('./components/BondingJournal').then(m => ({ default: m.BondingJournal })));
const AcuteTracker = lazy(() => import('./components/AcuteTracker').then(m => ({ default: m.AcuteTracker })));
const HandoverSummary = lazy(() => import('./components/HandoverSummary').then(m => ({ default: m.HandoverSummary })));
const GovernanceLog = lazy(() => import('./components/GovernanceLog').then(m => ({ default: m.GovernanceLog })));
const EthicsSafety = lazy(() => import('./components/EthicsSafety').then(m => ({ default: m.EthicsSafety })));
const RegulatoryRisk = lazy(() => import('./components/RegulatoryRisk').then(m => ({ default: m.RegulatoryRisk })));
const SickDayPlanView = lazy(() => import('./components/SickDayPlanView').then(m => ({ default: m.SickDayPlanView })));
const ClinicianTools = lazy(() => import('./components/ClinicianTools').then(m => ({ default: m.ClinicianTools })));

const ViewLoading: React.FC = () => (
  <div className="py-24 text-center text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading…</div>
);

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
      <Suspense fallback={<ViewLoading />}>
        {ViewComponent}
      </Suspense>
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
