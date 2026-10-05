
import React, { useState, useRef, useMemo } from 'react';
import { Medication, SpecialistContact, MedicalDevice, MedicalReport, Condition, Investigation, PreviousMedication, GenogramMember } from '../types';
import { analyzeMedicalProfile, analyzeMedicalReport } from '../services/gemini';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useRole } from '../context/RoleContext';
import { useNavigation } from '../context/NavigationContext';
import { SearchFilterBar } from './SearchFilterBar';

const GenogramIcon: React.FC<{ member: GenogramMember }> = ({ member }) => {
  const isMale = member.sex === 'Male';
  const isFemale = member.sex === 'Female';
  const isPregnancy = member.sex === 'Pregnancy';
  const isOther = member.sex === 'Other';
  const isDeceased = !member.isAlive && !isPregnancy;

  // Shapes based on OSCB Detail
  const Shape = () => {
    const baseClass = `relative w-12 h-12 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border-2 ${member.condition ? 'bg-rose-500 border-rose-600' : 'bg-white border-slate-400'}`;
    
    if (isMale) return <div className={`${baseClass} rounded-none ${member.isIndex ? 'outline outline-4 outline-offset-2 outline-indigo-600' : ''}`} />;
    if (isFemale) return <div className={`${baseClass} rounded-full ${member.isIndex ? 'outline outline-4 outline-offset-2 outline-indigo-600' : ''}`} />;
    if (isOther) return <div className={`${baseClass} rounded-lg rotate-45 ${member.isIndex ? 'outline outline-4 outline-offset-2 outline-indigo-600' : ''}`} />;
    if (isPregnancy) return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[40px] border-b-slate-400" />
            <div className="absolute top-[6px] w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[34px] border-b-white" />
        </div>
    );
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-1 group relative">
      <div className="relative">
        <Shape />
        {isDeceased && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-[140%] h-[2px] bg-slate-900 rotate-45"></div>
            <div className="w-[140%] h-[2px] bg-slate-900 -rotate-45"></div>
          </div>
        )}
      </div>
      <span className="text-[8px] font-black text-slate-800 uppercase tracking-tighter text-center leading-none mt-1 max-w-[60px]">
        {member.relation}
      </span>
      {member.condition && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl whitespace-nowrap z-20 pointer-events-none border border-white/10">
          <span className="text-rose-400 mr-1">●</span> {member.condition}
        </div>
      )}
    </div>
  );
};

// Fix: Added optionality to children prop to resolve JSX type mismatch in some environments
const GenerationRow = ({ children, title }: { children?: React.ReactNode, title: string }) => (
  <div className="flex flex-col items-center gap-2">
    <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">{title}</p>
    <div className="flex gap-12 items-center justify-center">
      {children}
    </div>
  </div>
);

const GenerationRowWrapper = ({ children, title }: { children: React.ReactNode, title: string }) => (
  <div className="flex flex-col items-center gap-2">
    <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">{title}</p>
    <div className="flex gap-12 items-center justify-center">
      {children}
    </div>
  </div>
);

const GenogramViz: React.FC<{ members: GenogramMember[] }> = ({ members }) => {
  const g1Maternal = members.filter(m => m.relation.includes('Maternal Gran'));
  const g1Paternal = members.filter(m => m.relation.includes('Paternal Gran'));
  const g2 = members.filter(m => m.relation === 'Father' || m.relation === 'Mother');
  const g3 = members.filter(m => m.relation === 'Sibling' || m.isIndex);

  return (
    <div className="overflow-x-auto max-w-full pb-4">
      <div className="relative p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] bg-indigo-950/20 backdrop-blur-xl border border-white/5 shadow-inner min-w-[480px] space-y-12">
        <div className="flex justify-between w-full px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
               {g1Paternal.length > 0 ? g1Paternal.map(m => <GenogramIcon key={m.id} member={m} />) : <div className="w-12 h-12 rounded-full border border-dashed border-white/10" />}
            </div>
            <p className="text-xs font-black text-indigo-400 uppercase">Paternal Line</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
               {g1Maternal.length > 0 ? g1Maternal.map(m => <GenogramIcon key={m.id} member={m} />) : <div className="w-12 h-12 rounded-full border border-dashed border-white/10" />}
            </div>
            <p className="text-xs font-black text-rose-400 uppercase">Maternal Line</p>
          </div>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
          <line x1="25%" y1="15%" x2="40%" y2="40%" stroke="white" strokeWidth="2" strokeDasharray="5 5" />
          <line x1="75%" y1="15%" x2="60%" y2="40%" stroke="white" strokeWidth="2" strokeDasharray="5 5" />
          <line x1="50%" y1="55%" x2="50%" y2="80%" stroke="white" strokeWidth="2" />
          <line x1="20%" y1="80%" x2="80%" y2="80%" stroke="white" strokeWidth="2" />
        </svg>

        <GenerationRow title="Parental Generation">
          {g2.length > 0 ? g2.map(m => <GenogramIcon key={m.id} member={m} />) : (
            <div className="flex gap-4">
               <div className="w-12 h-12 rounded-none border border-dashed border-white/10" />
               <div className="w-12 h-12 rounded-full border border-dashed border-white/10" />
            </div>
          )}
        </GenerationRow>

        <GenerationRow title="Index Generation">
          {g3.length > 0 ? g3.map(m => <GenogramIcon key={m.id} member={m} />) : (
             <GenogramIcon member={{ id: 'pt-idx', relation: 'Patient', sex: 'Other', isAlive: true, isIndex: true }} />
          )}
        </GenerationRow>
      </div>
    </div>
  );
};

export const MedicalProfile: React.FC = () => {
  const { history, updateHistory, pendingEvents } = useMedicalHistory();
  const { activeView } = useNavigation();
  const { role } = useRole();
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [showCeasedMeds, setShowCeasedMeds] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; sources: any[] } | null>(null);
  
  const reportInputRef = useRef<HTMLInputElement>(null);

  // Shared reusable styles to fix the "white on white" issue
  const inputClass = "w-full p-4 rounded-2xl bg-white border border-slate-300 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400 shadow-sm";
  const textAreaClass = "w-full p-6 rounded-[2.5rem] bg-white border border-slate-300 outline-none font-bold italic text-slate-900 focus:ring-4 focus:ring-indigo-50 shadow-inner resize-none transition-all placeholder:text-slate-400";

  // Search & Date Range Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currentSection = useMemo(() => {
    switch (activeView) {
      case 'history': return 'history';
      case 'developmental': return 'dev';
      case 'medications': return 'meds';
      case 'careteam': return 'mdt';
      case 'diagnostics': return 'diagnostics';
      case 'reports': return 'reports';
      case 'devices': return 'gear';
      case 'familyhistory': return 'family';
      default: return 'overview';
    }
  }, [activeView]);

  const matchesFilter = (
    textFields: (string | undefined)[],
    dateField?: string
  ) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const hasMatch = textFields.some(f => f && f.toLowerCase().includes(q));
      if (!hasMatch) return false;
    }

    if (startDate || endDate) {
      if (!dateField) return true;
      const d = new Date(dateField);
      if (!isNaN(d.getTime())) {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (d < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (d > e) return false;
        }
      }
    }

    return true;
  };

  const filteredConditions = useMemo(() => {
    return (history.conditions || []).filter(c =>
      matchesFilter([c.name, c.status], c.dateDiagnosed)
    );
  }, [history.conditions, searchQuery, startDate, endDate]);

  const filteredMedications = useMemo(() => {
    return (history.currentMedications || []).filter(m =>
      matchesFilter([m.name, m.dose, m.instructions, m.indication], m.startDate)
    );
  }, [history.currentMedications, searchQuery, startDate, endDate]);

  const filteredSpecialists = useMemo(() => {
    return (history.specialists || []).filter(s =>
      matchesFilter([s.name, s.specialty, s.hospital, s.goals])
    );
  }, [history.specialists, searchQuery, startDate, endDate]);

  const filteredInvestigations = useMemo(() => {
    return (history.investigations || []).filter(inv =>
      matchesFilter([inv.name, inv.result, inv.category], inv.date)
    );
  }, [history.investigations, searchQuery, startDate, endDate]);

  const filteredReports = useMemo(() => {
    return (history.medicalReports || []).filter(rep =>
      matchesFilter([rep.specialist, rep.summary, ...(rep.actionItems || [])], rep.date)
    );
  }, [history.medicalReports, searchQuery, startDate, endDate]);

  const filteredDevices = useMemo(() => {
    return (history.devices || []).filter(d =>
      matchesFilter([d.type, d.model, d.size], d.prescribeDate)
    );
  }, [history.devices, searchQuery, startDate, endDate]);

  const filteredFamilyMembers = useMemo(() => {
    return (history.familyHistory.members || []).filter(m =>
      matchesFilter([m.relation, m.condition, m.sex])
    );
  }, [history.familyHistory.members, searchQuery, startDate, endDate]);

  const currentSectionFilterData = useMemo(() => {
    switch (currentSection) {
      case 'history':
        return {
          total: (history.conditions || []).length,
          filtered: filteredConditions.length,
          placeholder: 'Search diagnoses and problem history...'
        };
      case 'meds':
        return {
          total: (history.currentMedications || []).length,
          filtered: filteredMedications.length,
          placeholder: 'Search medications, doses, indications...'
        };
      case 'mdt':
        return {
          total: (history.specialists || []).length,
          filtered: filteredSpecialists.length,
          placeholder: 'Search specialists, specialties, hospitals...'
        };
      case 'diagnostics':
        return {
          total: (history.investigations || []).length,
          filtered: filteredInvestigations.length,
          placeholder: 'Search lab tests, radiology findings...'
        };
      case 'reports':
        return {
          total: (history.medicalReports || []).length,
          filtered: filteredReports.length,
          placeholder: 'Search specialist letters, action items...'
        };
      case 'gear':
        return {
          total: (history.devices || []).length,
          filtered: filteredDevices.length,
          placeholder: 'Search medical gear, technology...'
        };
      case 'family':
        return {
          total: (history.familyHistory.members || []).length,
          filtered: filteredFamilyMembers.length,
          placeholder: 'Search family relations, conditions...'
        };
      default:
        return null;
    }
  }, [
    currentSection,
    history,
    filteredConditions,
    filteredMedications,
    filteredSpecialists,
    filteredInvestigations,
    filteredReports,
    filteredDevices,
    filteredFamilyMembers
  ]);

  // Form States
  const [newMed, setNewMed] = useState<Partial<Medication>>({ name: '', dose: '', instructions: '', indication: '' });
  const [newSpecialist, setNewSpecialist] = useState<Partial<SpecialistContact>>({ name: '', specialty: '', hospital: '', goals: '', nextReview: '' });
  const [newDevice, setNewDevice] = useState<Partial<MedicalDevice>>({ type: '', model: '', size: '', lastChanged: '', nextChangeDue: '' });
  const [newIssue, setNewIssue] = useState<Partial<Condition>>({ name: '', status: 'Active' });
  const [newInvestigation, setNewInvestigation] = useState<Partial<Investigation>>({ name: '', result: '', date: new Date().toISOString().split('T')[0] });
  const [newRelative, setNewRelative] = useState<Partial<GenogramMember>>({ relation: 'Father', sex: 'Male', isAlive: true, condition: '' });

  const addRelative = () => {
    if (newRelative.relation) {
      updateHistory({ 
        familyHistory: { 
          ...history.familyHistory, 
          members: [...(history.familyHistory.members || []), { ...newRelative, id: crypto.randomUUID() } as GenogramMember] 
        } 
      });
      setNewRelative({ relation: 'Father', sex: 'Male', isAlive: true, condition: '' });
    }
  };

  const addMedication = () => {
    if (newMed.name) {
      updateHistory({ currentMedications: [...history.currentMedications, { ...newMed, id: crypto.randomUUID(), startDate: new Date().toISOString() } as Medication] });
      setNewMed({ name: '', dose: '', instructions: '', indication: '' });
    }
  };

  const addDevice = () => {
    if (newDevice.type) {
      updateHistory({ devices: [...(history.devices || []), { ...newDevice, id: crypto.randomUUID() } as MedicalDevice] });
      setNewDevice({ type: '', model: '', size: '', lastChanged: '', nextChangeDue: '' });
    }
  };

  const addInvestigation = () => {
    if (newInvestigation.name) {
      updateHistory({ investigations: [...(history.investigations || []), { ...newInvestigation, id: crypto.randomUUID() } as Investigation] });
      setNewInvestigation({ name: '', result: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await analyzeMedicalReport(base64);
          if (result) {
            const newReport: MedicalReport = {
              id: crypto.randomUUID(),
              date: new Date().toLocaleDateString(),
              specialist: result.specialist?.name || 'Unknown Specialist',
              summary: result.summary || 'AI synthesis pending...',
              actionItems: result.actionItems || [],
              photoUrl: base64
            };
            updateHistory({
              medicalReports: [...(history.medicalReports || []), newReport],
              // Automatically integrate found conditions/meds if reliable
              conditions: [...(history.conditions || []), ...(result.foundDiagnoses || []).map((d: string) => ({ id: crypto.randomUUID(), name: d, status: 'Active', dateDiagnosed: new Date().toLocaleDateString() }))],
              currentMedications: [...(history.currentMedications || []), ...(result.foundMedications || []).map((m: any) => ({ ...m, id: crypto.randomUUID(), startDate: new Date().toISOString() }))]
            });
            alert("Specialist letter integrated into registry.");
          }
        } catch (error) {
          alert("Error analyzing report.");
        } finally {
          setReportLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateHandover = async () => {
    setLoading(true);
    try {
      const result = await analyzeMedicalProfile({ history, linkedEvents: pendingEvents });
      setAiAnalysis(result);
    } catch (e) {
      alert("Error generating handover.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row justify-between items-start gap-4 px-2">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">
            {currentSection === 'overview' ? 'Clinical Overview' : 
             currentSection === 'history' ? 'History & Issues' :
             currentSection === 'dev' ? 'Developmental Journey' :
             currentSection === 'meds' ? 'Medications' :
             currentSection === 'mdt' ? 'Care Team (MDT)' :
             currentSection === 'diagnostics' ? 'Labs & Imaging' :
             currentSection === 'reports' ? 'Letters' :
             currentSection === 'gear' ? 'Medical Gear' : 'Family History'}
          </h2>
          <p className="text-slate-500 font-medium italic">Standard clinical record systems.</p>
        </div>
        {currentSection === 'overview' && (
          <button onClick={handleGenerateHandover} disabled={loading} className="bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all active:scale-95">
            {loading ? 'Synthesizing...' : 'Generate ISBAR ✨'}
          </button>
        )}
      </header>

      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl min-h-[600px] p-6 md:p-12 relative overflow-hidden">
        
        {currentSectionFilterData && (
          <div className="mb-8">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              totalCount={currentSectionFilterData.total}
              filteredCount={currentSectionFilterData.filtered}
              placeholder={currentSectionFilterData.placeholder}
            />
          </div>
        )}
        
        {currentSection === 'overview' && (
          <div className="space-y-12 animate-in zoom-in-95">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                   <div className="bg-indigo-50/50 p-10 rounded-[3rem] border border-indigo-100 flex items-center gap-8">
                      <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl shadow-xl border-2 border-indigo-100 shrink-0">🏥</div>
                      <div className="space-y-2">
                         <h3 className="text-3xl font-black text-slate-900 italic leading-tight">Registry Overview</h3>
                         <p className="text-slate-600 font-bold italic text-base leading-relaxed">
                            A consolidated view of the pediatric record. Use navigation to update developmental, family, or medication datasets.
                         </p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                         <span className="text-4xl">💊</span>
                         <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Meds Charted</p>
                            <p className="text-2xl font-black text-slate-900">{history.currentMedications.length}</p>
                         </div>
                      </div>
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                         <span className="text-4xl">🫂</span>
                         <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">MDT Care Team</p>
                            <p className="text-2xl font-black text-slate-900">{history.specialists.length}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border-b-[12px] border-slate-950">
                   <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">Expert Context</h4>
                   <p className="text-indigo-100 font-medium italic text-base leading-relaxed mb-10 opacity-80">
                     "This registry translates fragmented clinical data into professional documentation. Verify all findings with local clinical protocols."
                   </p>
                   <div className="pt-6 border-t border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Persistence Status</p>
                      <p className="text-xs font-bold text-emerald-400 mt-1">✓ Local Vault Active</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {currentSection === 'dev' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-blue-50/30 p-10 rounded-[3.5rem] border border-blue-100 space-y-8 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100">🥚</div>
                      <h3 className="text-xl font-black text-blue-900 tracking-tight italic uppercase">Prenatal</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                         <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Normal Scans?</span>
                         <input type="checkbox" checked={history.developmentalHistory.prenatal.scansNormal} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, prenatal: { ...history.developmentalHistory.prenatal, scansNormal: e.target.checked } } })} className="w-6 h-6 rounded-lg text-blue-600 border-blue-200" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-3">Pregnancy Complications</label>
                         <textarea value={history.developmentalHistory.prenatal.complications} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, prenatal: { ...history.developmentalHistory.prenatal, complications: e.target.value } } })} placeholder="e.g. PET, GDM..." className={textAreaClass + " h-28 text-sm placeholder:text-blue-200 border-blue-100"} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-3">Maternal Medications</label>
                         <textarea value={history.developmentalHistory.prenatal.medications} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, prenatal: { ...history.developmentalHistory.prenatal, medications: e.target.value } } })} placeholder="e.g. Antibiotics, preventers..." className={textAreaClass + " h-28 text-sm placeholder:text-blue-200 border-blue-100"} />
                      </div>
                   </div>
                </div>

                <div className="bg-indigo-50/30 p-10 rounded-[3.5rem] border border-indigo-100 space-y-8 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-indigo-100">👣</div>
                      <h3 className="text-xl font-black text-indigo-900 tracking-tight italic uppercase">Birth</h3>
                   </div>
                   <div className="space-y-5">
                      {[
                        { label: 'Gestation', field: 'gestation', placeholder: 'e.g. 40+2' },
                        { label: 'Delivery Mode', field: 'deliveryType', placeholder: 'e.g. SVD, LSCS' },
                        { label: 'Birth Weight', field: 'birthWeight', placeholder: 'e.g. 3450g' },
                        { label: 'Apgar Scores', field: 'apgars', placeholder: 'e.g. 9 and 10' }
                      ].map(item => (
                        <div key={item.field} className="space-y-1">
                           <label className="text-[9px] font-black text-indigo-400 uppercase ml-3">{item.label}</label>
                           <input placeholder={item.placeholder} value={(history.developmentalHistory.perinatal as any)[item.field]} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, perinatal: { ...history.developmentalHistory.perinatal, [item.field]: e.target.value } } })} className={inputClass + " border-indigo-100 text-indigo-950"} />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-emerald-50/30 p-10 rounded-[3.5rem] border border-emerald-100 space-y-8 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-emerald-100">🍼</div>
                      <h3 className="text-xl font-black text-emerald-900 tracking-tight italic uppercase">Neonatal</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center justify-center gap-3 p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm cursor-pointer group hover:bg-emerald-50 transition-colors">
                          <input type="checkbox" checked={history.developmentalHistory.neonatal.nicuStay} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, neonatal: { ...history.developmentalHistory.neonatal, nicuStay: e.target.checked } } })} className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">NICU</span>
                        </label>
                        <label className="flex items-center justify-center gap-3 p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm cursor-pointer group hover:bg-emerald-50 transition-colors">
                          <input type="checkbox" checked={history.developmentalHistory.neonatal.jaundice} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, neonatal: { ...history.developmentalHistory.neonatal, jaundice: e.target.checked } } })} className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">Jaundice</span>
                        </label>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-emerald-400 uppercase ml-3">Early Feeding Pattern</label>
                         <textarea value={history.developmentalHistory.neonatal.feedingIssues} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, neonatal: { ...history.developmentalHistory.neonatal, feedingIssues: e.target.value } } })} placeholder="Regain patterns, bottle/breast..." className={textAreaClass + " h-32 text-sm border-emerald-100"} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-emerald-400 uppercase ml-3">Caregiver Concerns</label>
                         <textarea value={history.developmentalHistory.neonatal.earlyConcerns} onChange={e => updateHistory({ developmentalHistory: { ...history.developmentalHistory, neonatal: { ...history.developmentalHistory.neonatal, earlyConcerns: e.target.value } } })} placeholder="Irritability, sleep, hearing..." className={textAreaClass + " h-32 text-sm border-emerald-100"} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {currentSection === 'family' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <div className="bg-indigo-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border-b-[16px] border-indigo-900">
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-[100px] opacity-20"></div>
               <div className="relative z-10 flex flex-col items-center gap-12">
                  <div className="space-y-6 text-center">
                     <h3 className="text-4xl font-black italic tracking-tighter leading-none uppercase">Lineage & Pedigree</h3>
                     <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-3 h-3 bg-white border border-slate-500"></span> Male</div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-3 h-3 bg-white border border-slate-500 rounded-full"></span> Female</div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-white"></span> Pregnancy</div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="text-rose-400">●</span> Condition</div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-3 h-3 border border-slate-500 relative flex items-center justify-center"><div className="w-[120%] h-[1px] bg-slate-900 rotate-45 absolute"></div></span> Deceased</div>
                     </div>
                  </div>
                  <GenogramViz members={history.familyHistory.members || []} />
               </div>
            </div>

            <section className="bg-slate-50 p-10 rounded-[4rem] border border-slate-200 space-y-10 shadow-inner">
               <div className="flex items-center gap-4 ml-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">🧬</div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Register Relative</h4>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4">Relationship</label>
                    <select value={newRelative.relation} onChange={e => setNewRelative({...newRelative, relation: e.target.value})} className={inputClass}>
                      <option>Father</option><option>Mother</option><option>Sibling</option>
                      <option>Paternal Grandma</option><option>Paternal Grandpa</option>
                      <option>Maternal Grandma</option><option>Maternal Grandpa</option>
                      <option>Aunt/Uncle</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4">Biological Sex / Symbol</label>
                    <select value={newRelative.sex} onChange={e => setNewRelative({...newRelative, sex: e.target.value as any})} className={inputClass}>
                      <option value="Male">Male (Square)</option>
                      <option value="Female">Female (Circle)</option>
                      <option value="Pregnancy">Pregnancy (Triangle)</option>
                      <option value="Other">Other (Diamond)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4">Clinical Context</label>
                    <input placeholder="e.g. T1DM, Cancer..." value={newRelative.condition} onChange={e => setNewRelative({...newRelative, condition: e.target.value})} className={inputClass} />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-3 p-4 bg-white border border-slate-300 rounded-2xl cursor-pointer flex-1 justify-center">
                       <input type="checkbox" checked={newRelative.isAlive} onChange={e => setNewRelative({...newRelative, isAlive: e.target.checked})} className="w-6 h-6 rounded text-indigo-600" />
                       <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Alive</span>
                    </label>
                    <button onClick={addRelative} className="bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-8 py-4 shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Add</button>
                  </div>
               </div>
               
               {(history.familyHistory.members?.length || 0) > 0 && (
                 <div className="pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-slate-200">
                   {filteredFamilyMembers.map(member => (
                     <div key={member.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between group hover:shadow-lg transition-all shadow-sm">
                        <div className="flex items-center gap-5">
                           <div className={`w-10 h-10 ${member.sex === 'Male' ? 'rounded-none' : 'rounded-full'} ${member.condition ? 'bg-rose-500' : 'bg-slate-200'} shrink-0 shadow-inner border border-slate-400 flex items-center justify-center relative`}>
                              {!member.isAlive && member.sex !== 'Pregnancy' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-[140%] h-[1px] bg-slate-900 rotate-45"></div><div className="w-[140%] h-[1px] bg-slate-900 -rotate-45"></div></div>}
                              {member.sex === 'Pregnancy' && <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-slate-400" />}
                           </div>
                           <div>
                              <p className="font-black text-slate-900 text-base italic leading-none">{member.relation} {!member.isAlive && '(Deceased)'}</p>
                              {member.condition && <p className="text-[11px] font-bold text-rose-600 italic mt-1">{member.condition}</p>}
                           </div>
                        </div>
                        <button onClick={() => updateHistory({ familyHistory: { ...history.familyHistory, members: history.familyHistory.members.filter(x => x.id !== member.id) } })} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2 font-black">✕</button>
                     </div>
                   ))}
                 </div>
               )}
            </section>
          </div>
        )}

        {currentSection === 'history' && (
          <div className="space-y-16 animate-in slide-in-from-bottom-4">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2 px-2"><span>📜</span> Past Medical History (PMHx)</h3>
                <textarea 
                  value={history.pastMedicalHistory} 
                  onChange={e => updateHistory({ pastMedicalHistory: e.target.value })} 
                  placeholder="Birth details, chronic diagnoses, genetic findings..." 
                  className={textAreaClass + " h-56"}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-2 px-2"><span>✂️</span> Surgical History (PSHx)</h3>
                <textarea 
                  value={history.surgicalHistory} 
                  onChange={e => updateHistory({ surgicalHistory: e.target.value })} 
                  placeholder="Dates, procedures, and relevant outcomes..." 
                  className={textAreaClass + " h-56"}
                />
              </div>
            </section>
            
            <section className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Problem Registry</h3>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">Live Registry</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredConditions.map(issue => (
                  <div key={issue.id} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 relative group shadow-sm hover:shadow-md transition-all">
                    <button onClick={() => updateHistory({ conditions: history.conditions?.filter(x => x.id !== issue.id) })} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 font-black">✕</button>
                    <p className="font-black text-2xl text-slate-900 tracking-tighter mb-3 leading-none italic">{issue.name}</p>
                    <div className="flex items-center gap-2 mt-4">
                       <span className="px-4 py-1.5 bg-white border border-slate-300 rounded-xl text-[9px] font-black uppercase text-slate-500 tracking-widest">{issue.status}</span>
                       {issue.clinicianVerified && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest">Verified ✓</span>}
                    </div>
                  </div>
                ))}
                <div className="bg-indigo-50/20 border-4 border-dashed border-indigo-200 p-10 rounded-[3.5rem] flex flex-col justify-center gap-6 group hover:border-indigo-400 transition-colors">
                   <input 
                      value={newIssue.name} 
                      onChange={e => setNewIssue({ ...newIssue, name: e.target.value })} 
                      placeholder="Add Diagnosis..." 
                      className="bg-transparent font-black text-2xl outline-none placeholder-indigo-300 text-slate-900 italic tracking-tight" 
                   />
                   <button onClick={() => { if(newIssue.name) { updateHistory({ conditions: [...(history.conditions || []), { ...newIssue, id: crypto.randomUUID(), status: 'Active', clinicianVerified: role === 'clinician' } as Condition] }); setNewIssue({ name: '' }); } }} className="w-fit px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Assign Label +</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentSection === 'meds' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <section className="space-y-10">
              <div className="flex justify-between items-end px-6">
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tight">Active Medication Chart</h3>
                 <button onClick={() => setShowCeasedMeds(!showCeasedMeds)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 underline transition-all">
                   {showCeasedMeds ? 'Hide Archives' : 'View Medication Archive'}
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                {filteredMedications.map(m => (
                  <div key={m.id} className="bg-emerald-50/50 p-10 rounded-[3.5rem] border border-emerald-100 relative group shadow-sm hover:shadow-2xl transition-all">
                    <div className="space-y-6">
                      <p className="text-4xl font-black text-emerald-900 tracking-tighter leading-none italic">{m.name}</p>
                      <div className="bg-white/80 p-6 rounded-[2.5rem] border border-emerald-100 shadow-inner">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-3">Dose & Frequency</p>
                         <p className="text-3xl font-black text-emerald-950 italic leading-none">{m.dose}</p>
                         <p className="text-sm font-bold text-emerald-800/70 mt-4 leading-relaxed italic border-t border-emerald-50 pt-4">{m.instructions || 'Follow specific specialist guidelines.'}</p>
                      </div>
                      <div className="space-y-1 ml-4">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Indication</p>
                         <p className="text-base font-black text-emerald-900/60 italic">{m.indication || 'Prophylactic/Routine'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-slate-50 border-4 border-dashed border-slate-200 p-10 rounded-[3.5rem] space-y-6 flex flex-col justify-center min-h-[350px] group hover:border-emerald-300 transition-all">
                   <div className="space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Medication Name</label>
                        <input value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="e.g. Salbutamol" className={inputClass} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Regime (Dose/Freq)</label>
                        <input value={newMed.dose} onChange={e => setNewMed({ ...newMed, dose: e.target.value })} placeholder="e.g. 5ml BD (twice daily)" className={inputClass} />
                      </div>
                      <button onClick={addMedication} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">Authorize Script +</button>
                   </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentSection === 'mdt' && (
          <div className="space-y-16 animate-in slide-in-from-bottom-4">
            <section className="space-y-10">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tight">Professional MDT Hub</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredSpecialists.map(s => (
                    <div key={s.id} className="p-10 rounded-[3.5rem] border-2 bg-white border-slate-100 text-slate-900 shadow-sm transition-all hover:shadow-lg">
                      <div className="space-y-8">
                         <div>
                            <p className="text-4xl font-black tracking-tighter italic leading-none mb-3 text-slate-900">{s.specialty}</p>
                            <p className="text-xl font-bold text-indigo-600">{s.name}</p>
                         </div>
                         <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                            <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service / Hospital</p>
                               <p className="text-base font-bold italic leading-none">{s.hospital || 'Private Clinic'}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                ))}
                <div className="bg-slate-50 border-4 border-dashed border-slate-200 p-12 rounded-[4rem] space-y-8 flex flex-col justify-center group hover:border-indigo-300 transition-all">
                   <h4 className="font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Add Specialist</h4>
                   <div className="space-y-5">
                      <input value={newSpecialist.specialty} onChange={e => setNewSpecialist({ ...newSpecialist, specialty: e.target.value })} placeholder="e.g. Neurology" className={inputClass} />
                      <input value={newSpecialist.name} onChange={e => setNewSpecialist({ ...newSpecialist, name: e.target.value })} placeholder="Full Professional Name" className={inputClass} />
                      <button onClick={() => { if(newSpecialist.name) { updateHistory({ specialists: [...history.specialists, { ...newSpecialist, id: crypto.randomUUID(), category: 'Medical' } as SpecialistContact] }); setNewSpecialist({ name: '', specialty: '' }); } }} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">Add to Care Team +</button>
                   </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentSection === 'diagnostics' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <section className="space-y-10">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tight">Investigation Results</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                {filteredInvestigations.map(inv => (
                  <div key={inv.id} className="bg-blue-50/50 p-10 rounded-[3.5rem] border border-blue-100 relative group shadow-sm hover:shadow-2xl transition-all">
                    <button onClick={() => updateHistory({ investigations: history.investigations?.filter(x => x.id !== inv.id) })} className="absolute top-10 right-10 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">✕</button>
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <span className="text-4xl">🧪</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.date}</span>
                      </div>
                      <p className="text-2xl font-black text-blue-900 leading-none">{inv.name}</p>
                      <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-inner">
                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{inv.result}"</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-slate-50 border-4 border-dashed border-slate-200 p-10 rounded-[3.5rem] space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Add Lab / Imaging Result</h4>
                   <input value={newInvestigation.name} onChange={e => setNewInvestigation({...newInvestigation, name: e.target.value})} placeholder="Test Name (e.g. FBC, CXR)" className={inputClass} />
                   <input value={newInvestigation.result} onChange={e => setNewInvestigation({...newInvestigation, result: e.target.value})} placeholder="Key Findings" className={inputClass} />
                   <button onClick={addInvestigation} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl">Record Result +</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentSection === 'reports' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <section className="space-y-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tight">Specialist Letters</h3>
                <button onClick={() => reportInputRef.current?.click()} disabled={reportLoading} className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all active:scale-95">
                  {reportLoading ? 'Analyzing Syntax...' : '+ Upload Specialist Letter'}
                </button>
                <input type="file" ref={reportInputRef} onChange={handleReportUpload} accept="image/*" className="hidden" />
              </div>
              <div className="space-y-6">
                {filteredReports.map(rep => (
                  <div key={rep.id} className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 flex flex-col md:flex-row gap-10 hover:shadow-md transition-all">
                    <div className="w-full md:w-32 h-44 bg-white rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center p-4 shadow-inner shrink-0 group relative overflow-hidden">
                       <span className="text-5xl mb-2">✉️</span>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rep.date}</p>
                       {rep.photoUrl && <img src={rep.photoUrl} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity" alt="Doc" />}
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <p className="text-2xl font-black text-slate-800 leading-none italic">{rep.specialist}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">Professional Synthesis</p>
                      </div>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-6">{rep.summary}</p>
                      <div className="flex flex-wrap gap-2 pt-4">
                        {rep.actionItems.map((item, i) => (
                           <span key={i} className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100">{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {currentSection === 'gear' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <section className="space-y-10">
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tight px-4">Medical Gear & Technology</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                {filteredDevices.map(d => (
                  <div key={d.id} className="bg-amber-50/50 p-10 rounded-[3.5rem] border border-amber-100 relative group shadow-sm hover:shadow-2xl transition-all">
                    <button onClick={() => updateHistory({ devices: history.devices.filter(x => x.id !== d.id) })} className="absolute top-10 right-10 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">✕</button>
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-amber-100">⚙️</div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black uppercase tracking-widest">Active</span>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-amber-950 leading-none italic">{d.type}</p>
                        <p className="text-lg font-bold text-amber-800/60 italic mt-2">{d.model || 'Standard OEM'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-slate-50 border-4 border-dashed border-slate-200 p-10 rounded-[3.5rem] space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Register Medical Technology</h4>
                   <input value={newDevice.type} onChange={e => setNewDevice({...newDevice, type: e.target.value})} placeholder="Device Type (e.g. Pump, Spacer)" className={inputClass} />
                   <input value={newDevice.model} onChange={e => setNewDevice({...newDevice, model: e.target.value})} placeholder="Model / Size" className={inputClass} />
                   <button onClick={addDevice} className="w-full py-5 bg-amber-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl">Add Gear +</button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-12">
        <button 
          onClick={() => {
            if (confirm("🚨 CRITICAL: This will delete ALL pediatric records stored locally on this device. This action cannot be undone. Are you sure?")) {
               localStorage.clear();
               window.location.reload();
            }
          }}
          className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-rose-500 transition-colors"
        >
          Factory Reset Medical Hub 🗑️
        </button>
      </div>
    </div>
  );
};
