
import React, { useState, useMemo } from 'react';
import { analyzeScreening } from '../services/gemini';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { useToast } from '../context/ToastContext';
import { useNavigation } from '../context/NavigationContext';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import { AI_ENABLED } from '../config/features';

type ResponseOption = { label: string; value: string; color?: string };

interface ScreeningMod {
  id: string;
  name: string;
  ageRange: string;
  domain: 'Behavior' | 'Development' | 'Mood' | 'Social' | 'Focus';
  description: string;
  type: 'scale' | 'binary' | 'tri-state';
  options: ResponseOption[];
  questions: { id: string; text: string; category: string }[];
}

const SCREENING_MODS: Record<string, ScreeningMod> = {
  snap4: {
    id: 'snap4',
    name: 'Attention Check (8 SNAP-IV items)',
    ageRange: '6-18 Years',
    domain: 'Focus',
    description: 'Eight items from the SNAP-IV rating scale about attention and behaviour. A shortened check, not the full validated questionnaire.',
    type: 'scale',
    options: [
      { label: 'Not at all', value: '0' },
      { label: 'Just a little', value: '1' },
      { label: 'Quite a bit', value: '2' },
      { label: 'Very much', value: '3' }
    ],
    questions: [
      { id: 's1', text: 'Often fails to give close attention to details or makes careless mistakes.', category: 'Inattention' },
      { id: 's2', text: 'Often has difficulty sustaining attention in tasks or play activities.', category: 'Inattention' },
      { id: 's3', text: 'Often does not seem to listen when spoken to directly.', category: 'Inattention' },
      { id: 's4', text: 'Often fidgets with hands or feet or squirms in seat.', category: 'Hyperactivity' },
      { id: 's5', text: 'Often leaves seat in classroom or in other situations.', category: 'Hyperactivity' },
      { id: 's6', text: 'Often blurts out answers before questions have been completed.', category: 'Impulsivity' },
      { id: 's7', text: 'Often loses temper.', category: 'Oppositional' },
      { id: 's8', text: 'Often actively defies or refuses to comply with adult requests.', category: 'Oppositional' },
    ]
  },
  gad7: {
    id: 'gad7',
    name: 'GAD-7 (Anxiety Screening)',
    ageRange: '12+ Years',
    domain: 'Mood',
    description: 'A brief measure of generalized anxiety symptoms in adolescents and adults.',
    type: 'scale',
    options: [
        { label: 'Not at all', value: '0' }, 
        { label: 'Several days', value: '1' }, 
        { label: 'More than half', value: '2' }, 
        { label: 'Nearly every day', value: '3' }
    ],
    questions: [
      { id: 'g1', text: 'Feeling nervous, anxious or on edge.', category: 'Anxiety' },
      { id: 'g2', text: 'Not being able to stop or control worrying.', category: 'Anxiety' },
      { id: 'g3', text: 'Worrying too much about different things.', category: 'Anxiety' },
      { id: 'g4', text: 'Trouble relaxing.', category: 'Physical' },
      { id: 'g5', text: 'Being so restless that it is hard to sit still.', category: 'Physical' },
      { id: 'g6', text: 'Becoming easily annoyed or irritable.', category: 'Emotional' },
      { id: 'g7', text: 'Feeling afraid as if something awful might happen.', category: 'Emotional' },
    ]
  },
  phq9: {
    id: 'phq9',
    name: 'Mood Check (7 PHQ-9 items)',
    ageRange: '12+ Years',
    domain: 'Mood',
    description: 'Seven items from the PHQ-9 about mood over the last two weeks. A shortened check, not the full validated questionnaire.',
    type: 'scale',
    options: [
        { label: 'Not at all', value: '0' }, 
        { label: 'Several days', value: '1' }, 
        { label: 'More than half', value: '2' }, 
        { label: 'Nearly every day', value: '3' }
    ],
    questions: [
      { id: 'p1', text: 'Little interest or pleasure in doing things.', category: 'Mood' },
      { id: 'p2', text: 'Feeling down, depressed, or hopeless.', category: 'Mood' },
      { id: 'p3', text: 'Trouble falling or staying asleep, or sleeping too much.', category: 'Sleep/Energy' },
      { id: 'p4', text: 'Feeling tired or having little energy.', category: 'Sleep/Energy' },
      { id: 'p5', text: 'Poor appetite or overeating.', category: 'Somatic' },
      { id: 'p6', text: 'Feeling bad about yourself.', category: 'Emotional' },
      { id: 'p7', text: 'Trouble concentrating on things.', category: 'Cognitive' },
    ]
  }
};

const FINDER_STEPS = {
    age: [
        { id: 'infant', label: 'Infant (0-12m)', next: 'dev' },
        { id: 'toddler', label: 'Toddler (1-3y)', next: 'dev' },
        { id: 'child', label: 'School Age (4-11y)', next: 'bh' },
        { id: 'teen', label: 'Adolescent (12y+)', next: 'mh' }
    ],
    concerns: {
        dev: [
            { id: 'social', label: 'Social & Interaction', test: 'dev_milestones' },
            { id: 'milestones', label: 'Overall Progress', test: 'dev_milestones' },
            { id: 'physical', label: 'Physical Milestones', test: 'dev_milestones' },
        ],
        bh: [
            { id: 'adhd', label: 'Attention & Focus', test: 'snap4' },
        ],
        mh: [
            { id: 'adhd_teen', label: 'Focus & Organization', test: 'snap4' },
            { id: 'anxiety', label: 'Anxiety/Worry', test: 'gad7' },
            { id: 'mood', label: 'Low Mood/Sleep', test: 'phq9' }
        ]
    }
};

export const ScreeningTool: React.FC = () => {
  const { history, updateHistory } = useMedicalHistory();
  const { showToast } = useToast();
  const { navigateTo } = useNavigation();
  const [viewState, setViewState] = useState<'hub' | 'finder' | 'test'>('hub');
  const [finderPath, setFinderPath] = useState<{ age?: string; domain?: string }>({});
  const [activeModKey, setActiveModKey] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const activeMod = activeModKey ? SCREENING_MODS[activeModKey] : null;


  const chartData = useMemo(() => {
    if (!analysis || !activeMod) return [];
    const categories = Array.from(new Set(activeMod.questions.map(q => q.category)));
    return categories.map(cat => {
      const catQuestions = activeMod.questions.filter(q => q.category === cat);
      const sum = catQuestions.reduce((acc, q) => acc + parseInt(responses[q.id] || '0'), 0);
      const fullMarkMap = { 'binary': 1, 'scale': 3, 'tri-state': 10 };
      return {
        subject: cat,
        A: sum / catQuestions.length,
        fullMark: fullMarkMap[activeMod.type] || 3,
      };
    });
  }, [analysis, responses, activeMod]);

  const handleResponse = (qId: string, val: string) => {
    setResponses(prev => ({ ...prev, [qId]: val }));
  };

  const handleStartFinder = () => {
    setViewState('finder');
    setFinderPath({});
  };

  const handleSelectTest = (id: string) => {
    if (id === 'dev_milestones') {
        navigateTo('milestones');
        return;
    }
    setActiveModKey(id);
    setViewState('test');
    setResponses({});
    setAnalysis(null);
    setShowAnswers(false);
  };

  const handleSubmit = async () => {
    if (!activeMod) return;
    setLoading(true);
    try {
      const result = await analyzeScreening(activeMod.name, responses);
      setAnalysis(result);
    } catch (e) {
      showToast("Couldn't analyse the assessment. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentFinderOptions = useMemo(() => {
    if (!finderPath.age) return FINDER_STEPS.age;
    const key = FINDER_STEPS.age.find(a => a.id === finderPath.age)?.next;
    return (FINDER_STEPS.concerns as any)[key!] || [];
  }, [finderPath]);

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'Mood': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Social': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Focus': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Development': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-teal-50 text-teal-700 border-teal-100';
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'Mood': return '🧠';
      case 'Social': return '🫂';
      case 'Focus': return '🎯';
      case 'Development': return '🌱';
      default: return '🔍';
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-28 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter leading-none">Conversation <span className="text-teal-700">Starters</span></h2>
          <p className="text-slate-500 font-medium mt-2 text-xs sm:text-sm">Short checklists to help you put what you've noticed into words before seeing your GP, child health nurse or paediatrician. They aren't tests and don't give a score.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {viewState !== 'hub' && (
                <button onClick={() => {setViewState('hub'); setActiveModKey(null); setAnalysis(null); setShowAnswers(false);}} className="bg-white border border-slate-200 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xs min-h-[44px]">Return to Hub</button>
            )}
            {viewState === 'hub' && (
                <button onClick={handleStartFinder} className="w-full md:w-auto bg-teal-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl hover:bg-teal-800 active:scale-95 transition-all min-h-[44px]">Start Test Finder ✨</button>
            )}
        </div>
      </header>

      {viewState === 'finder' && (
        <div className="bg-white p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-teal-100 shadow-2xl space-y-8 sm:space-y-12 animate-in zoom-in-95">
            <div className="text-center space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase">Find a checklist</h3>
                <p className="text-slate-500 font-medium text-xs sm:text-sm">Answer 2 simple questions to find a checklist that fits.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {currentFinderOptions.map((opt: any) => (
                    <button 
                        key={opt.id}
                        onClick={() => {
                            if (!finderPath.age) setFinderPath({ age: opt.id });
                            else handleSelectTest(opt.test);
                        }}
                        className="bg-slate-50 p-6 sm:p-8 rounded-4xl border border-slate-100 hover:border-teal-500 hover:bg-teal-50 transition-all text-center group min-h-[44px]"
                    >
                        <p className="text-base sm:text-lg font-black text-slate-800 group-hover:text-teal-900">{opt.label}</p>
                        <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">Select Option <span>→</span></p>
                    </button>
                ))}
            </div>
            
            {finderPath.age && (
                <div className="flex justify-center">
                    <button onClick={() => setFinderPath({})} className="text-xs font-black uppercase text-slate-600 hover:text-teal-700 min-h-[44px]">← Back to Start</button>
                </div>
            )}
        </div>
      )}

      {viewState === 'hub' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {Object.values(SCREENING_MODS).map((mod) => {
              return (
                <div key={mod.id} className="bg-white p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 shadow-xs hover:shadow-xl transition-all group relative flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getDomainIcon(mod.domain)}</span>
                          <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getDomainColor(mod.domain)}`}>
                              {mod.domain}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-600 uppercase">Age: {mod.ageRange}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none">{mod.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">{mod.description}</p>
                  </div>
                  <button onClick={() => handleSelectTest(mod.id)} className="mt-6 sm:mt-8 py-4 sm:py-5 min-h-[44px] bg-slate-900 text-white rounded-2xl sm:rounded-3xl font-black text-xs uppercase tracking-[0.15em] shadow-lg group-hover:bg-teal-800 transition-all">Start Assessment</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewState === 'test' && activeMod && (
        <div className="space-y-8">
          {showAnswers ? (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-5 print:shadow-none print:border-0 print:p-0">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{activeMod.name}: your answers</h3>
                  <p className="text-sm font-bold text-slate-600">{new Date().toLocaleDateString()} · a conversation starter, not a test or a score</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {activeMod.questions.map(q => {
                    const answer = activeMod.options.find(o => o.value === responses[q.id]);
                    return (
                      <li key={q.id} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1 break-inside-avoid">
                        <span className="text-base font-medium text-slate-800">{q.text}</span>
                        <span className={`text-base font-black shrink-0 ${answer ? 'text-teal-800' : 'text-slate-600'}`}>{answer ? answer.label : 'Not answered'}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-sm font-medium text-slate-600">
                  Take this to your GP, child health nurse or paediatrician. They can talk it through with you and decide whether anything else is needed.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 print:hidden">
                <button onClick={() => window.print()} className="min-h-[48px] px-6 rounded-2xl bg-teal-700 text-white font-black uppercase tracking-widest text-xs">Print or Save as PDF</button>
                <button onClick={() => setShowAnswers(false)} className="min-h-[48px] px-6 rounded-2xl border-2 border-slate-300 font-black uppercase tracking-widest text-xs text-slate-700">Change Answers</button>
              </div>
            </div>
          ) : !analysis ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="bg-indigo-900 p-10 rounded-[3.5rem] text-white shadow-2xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black tracking-tighter leading-none">{activeMod.name}</h3>
                    <p className="text-indigo-200 text-sm font-medium opacity-70">Conversation starter for your appointment.</p>
                 </div>
                 <div className="px-6 py-2 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-xs font-black text-indigo-100">{Object.keys(responses).length} / {activeMod.questions.length} Complete</span>
                 </div>
              </div>

              <div role="note" className="bg-amber-50 border-2 border-amber-200 rounded-4xl p-6 space-y-2">
                <p className="text-sm font-bold text-amber-950 leading-relaxed">
                  This check can't diagnose or rule out any condition. Use it to organise what you've noticed before talking with your GP, child health nurse or paediatrician.
                </p>
                {activeMod.domain === 'Mood' && (
                  <p className="text-sm font-bold text-amber-950 leading-relaxed">
                    If your child talks about hurting themselves or you're worried about their safety, get help now: call <strong>000</strong> in an emergency, <strong>Kids Helpline 1800 55 1800</strong> (5–25 years) or <strong>Lifeline 13 11 14</strong>, any time.
                  </p>
                )}
              </div>

              {activeMod.questions.map((q, i) => (
                <div key={q.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-xs hover:border-teal-100 transition-colors">
                  <div className="flex gap-6 items-start flex-1">
                    <span className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-600 shrink-0 border border-slate-100">{i+1}</span>
                    <p className="text-xl font-black text-slate-700 leading-snug">{q.text}</p>
                  </div>
                  <div className="flex bg-slate-50 p-1.5 rounded-3xl border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
                    {activeMod.options.map(opt => (
                      <button 
                        key={opt.value}
                        onClick={() => handleResponse(q.id, opt.value)}
                        className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
                            responses[q.id] === opt.value 
                            ? (opt.color || 'bg-teal-700 text-white shadow-lg') 
                            : 'text-slate-600 hover:text-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-12">
                {AI_ENABLED ? (
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading || Object.keys(responses).length < activeMod.questions.length}
                      className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl disabled:bg-slate-200 transition-all hover:bg-indigo-700 active:scale-95"
                  >
                      {loading ? 'Synthesizing Patterns...' : 'Finalize & Prepare Handover ✨'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAnswers(true)}
                      disabled={Object.keys(responses).length === 0}
                      className="w-full py-6 bg-teal-700 text-white rounded-4xl font-black uppercase tracking-widest shadow-xl disabled:bg-slate-300 hover:bg-teal-800"
                    >
                      See My Answers
                    </button>
                    <p className="text-sm font-medium text-slate-600 text-center">You don't have to answer every question.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in zoom-in-95">
              <div className="bg-white p-12 rounded-[4rem] border-l-24 border-l-teal-600 shadow-2xl space-y-12 relative overflow-hidden">
                 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-50 rounded-full opacity-50 blur-[100px]"></div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-teal-50 text-teal-700 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-teal-100">🔬</div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-800 leading-none tracking-tight">Pattern Insight</h3>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-700 mt-2">Clinical Synthesis for Specialist</p>
                            </div>
                        </div>
                        <p className="text-slate-700 font-bold leading-relaxed text-2xl border-l-4 border-slate-100 pl-8">{analysis.overallSummary}</p>
                        
                        <div className="space-y-4 pt-8">
                            <h4 className="text-xs font-black uppercase text-teal-700 tracking-[0.3em] ml-2">Clinical Recommendations</h4>
                            <div className="space-y-4">
                                {analysis.actionableTips?.map((t: string, i: number) => (
                                    <div key={i} className="bg-teal-50/50 p-6 rounded-3xl border border-teal-100 flex gap-6 shadow-xs group hover:bg-white transition-all">
                                        <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-xs group-hover:scale-110 transition-transform">📋</span>
                                        <p className="text-sm font-black text-teal-950 leading-snug">{t}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 p-10 rounded-[4rem] border border-slate-100 h-[500px] shadow-inner">
                        <div className="text-center mb-8">
                            <h4 className="text-xs font-black uppercase text-slate-600 tracking-[0.3em]">Domain Distribution Profile</h4>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#cbd5e1" strokeWidth={1} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }} />
                                <PolarRadiusAxis angle={30} domain={[0, activeMod.type === 'binary' ? 1 : activeMod.type === 'tri-state' ? 10 : 3]} tick={false} axisLine={false} />
                                <Radar
                                    name="Current Intensity"
                                    dataKey="A"
                                    stroke="#0d9488"
                                    strokeWidth={4}
                                    fill="#14b8a6"
                                    fillOpacity={0.6}
                                />
                                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-100 flex justify-between items-center opacity-40">
                    <p className="text-xs font-black uppercase tracking-widest">Standardized Tool: {activeMod.name}</p>
                    <p className="text-xs font-black uppercase tracking-widest">Pattern Generated: {new Date().toLocaleDateString()}</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
