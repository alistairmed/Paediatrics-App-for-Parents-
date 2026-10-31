
import React, { useMemo, useEffect, useState, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { ChildProfileSetup } from './components/ChildProfileSetup';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ChildProfileProvider, useChildProfile } from './context/ChildProfileContext';
import { MedicalHistoryProvider, useMedicalHistory } from './context/MedicalHistoryContext';
import { GovernanceProvider, useGovernance } from './context/GovernanceContext';
import { EnvironmentProvider } from './context/EnvironmentContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AiConsentBridge } from './components/AiConsent';
import { LockScreen } from './components/LockScreen';
import { isLockEnabled, isUnlocked, lockNow } from './utils/vault';

const AUTO_LOCK_AFTER_MS = 5 * 60 * 1000;
import { ViewType } from './types';
import { AI_ENABLED } from './config/features';

// Each screen is loaded on demand so the first page doesn't download the whole app.
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const WhenToGetHelp = lazy(() => import('./components/WhenToGetHelp').then(m => ({ default: m.WhenToGetHelp })));
const GrowthTracker = lazy(() => import('./components/GrowthTracker').then(m => ({ default: m.GrowthTracker })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfUse = lazy(() => import('./components/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const PrintableSummary = lazy(() => import('./components/PrintableSummary').then(m => ({ default: m.PrintableSummary })));
const MedicineLog = lazy(() => import('./components/MedicineLog').then(m => ({ default: m.MedicineLog })));
const MedicineInfo = lazy(() => import('./components/MedicineInfo').then(m => ({ default: m.MedicineInfo })));
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

const ViewLoading: React.FC = () => (
  <div className="py-24 text-center text-slate-600 font-black text-xs uppercase tracking-widest animate-pulse">Loading…</div>
);

const DisclaimerModal: React.FC = () => {
  const { hasAcceptedDisclaimer, acceptDisclaimer } = useGovernance();
  const { activeView, navigateTo } = useNavigation();

  // Let people read the privacy policy and terms before agreeing.
  if (hasAcceptedDisclaimer || activeView === 'privacy' || activeView === 'terms') return null;

  return (
    <div className="fixed inset-0 z-100 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="disclaimer-title" className="bg-white rounded-[3rem] max-w-lg w-full p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
         <div className="w-20 h-20 bg-rose-50 text-rose-700 rounded-4xl flex items-center justify-center text-4xl shadow-inner mx-auto" aria-hidden="true">⚠️</div>
         <div className="text-center space-y-4">
            <h2 id="disclaimer-title" className="text-3xl font-black text-slate-800 tracking-tight leading-none">Purpose & Safety Notice</h2>
            <div className="text-slate-700 font-medium space-y-4 leading-relaxed text-base">
               <p>PediPulse helps you keep your child's health records and find <strong>general information</strong>. Your records stay on this device.</p>
               <p>It is <strong>NOT medical advice</strong> and doesn't diagnose, assess symptoms or calculate doses.</p>
               <p><strong>In an emergency, call 000.</strong></p>
            </div>
         </div>
         <div className="space-y-3">
           <button 
            onClick={acceptDisclaimer}
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
           >
             I Understand & Agree
           </button>
           <p className="text-center text-sm font-bold text-slate-600">
             Read the <button onClick={() => navigateTo('privacy')} className="underline text-indigo-700">Privacy Policy</button> and <button onClick={() => navigateTo('terms')} className="underline text-indigo-700">Terms of Use</button>.
           </p>
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
               <p className="text-xs font-black uppercase tracking-widest opacity-70">Next Appointment</p>
               <p className="text-2xl font-black">{nextAppointment.specialty} with {nextAppointment.provider}</p>
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
    const publicViews: ViewType[] = ['ethics', 'regulatory', 'governance', 'setup', 'privacy', 'terms'];
    const isReady = !!childProfile || hasSkippedSetup;
    
    if (!isReady && !publicViews.includes(activeView)) {
      navigateTo('setup', { replace: true });
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
      symptoms: <WhenToGetHelp />,
      growth: <GrowthTracker />,
      dosage: <MedicineInfo><MedicineLog /></MedicineInfo>,
      milestones: <MilestoneNavigator />,
      bonding: <BondingJournal />,
      vaccines: <VaccineTracker />,
      parenting: <ParentingTips />,
      stories: <CalmStory />,
      screening: <ScreeningTool />,
      handover: <HandoverSummary />,
      governance: <GovernanceLog />,
      ethics: <EthicsSafety />,
      privacy: <PrivacyPolicy />,
      terms: <TermsOfUse />,
      summary: <PrintableSummary />,
      regulatory: <RegulatoryRisk />,
      sickday: <SickDayPlanView />
    };
    return views[activeView] || views.dashboard;
  }, [activeView]);

  return (
    <Layout activeView={activeView} onNavigate={navigateTo}>
      <DisclaimerModal />
      <div className="print:hidden bg-rose-50 border-b border-rose-100 px-4 py-2 sm:px-6 sm:py-3 text-center mb-4 sm:mb-8 rounded-2xl shadow-xs space-y-1">
        <p className="text-xs font-black text-rose-700 uppercase tracking-wider sm:tracking-[0.2em]">⚠️ Safety Notice: Decision Support Tool Only</p>
        <p className="hidden sm:block text-xs text-rose-700 font-bold">{AI_ENABLED ? 'AI features send your entries to Google Gemini' : 'Data remains on this device'} • Replaces no clinical judgment.</p>
      </div>
      <Suspense fallback={<ViewLoading />}>
        {ViewComponent}
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(() => !isLockEnabled() || isUnlocked());

  // With the passcode lock on, lock again after 5 minutes in the background.
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibilityChange = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (isLockEnabled() && hiddenAt && Date.now() - hiddenAt > AUTO_LOCK_AFTER_MS) lockNow();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <NavigationProvider>
      <ToastProvider>
      <ConfirmProvider>
        <AiConsentBridge />
        <EnvironmentProvider>
          <GovernanceProvider>
            <ChildProfileProvider>
              <MedicalHistoryProvider>
                <AppContent />
              </MedicalHistoryProvider>
            </ChildProfileProvider>
          </GovernanceProvider>
        </EnvironmentProvider>
      </ConfirmProvider>
      </ToastProvider>
    </NavigationProvider>
  );
};

export default App;
