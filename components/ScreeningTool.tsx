
import React, { useState, useMemo } from 'react';
import { analyzeScreening } from '../services/gemini';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';

type ResponseOption = { label: string; value: string };

interface ScreeningMod {
  name: string;
  url: string;
  description: string;
  options: ResponseOption[];
  questions: { id: string; text: string; category?: string; inverted?: boolean }[];
}

interface ScreeningToolProps {
  onLinkChallenge?: (challenge: string) => void;
}

const PCE_ITEMS = [
  { id: 'pce1', text: "My child feels able to talk to our family about their feelings." },
  { id: 'pce2', text: "My child feels the family stands by them during difficult times." },
  { id: 'pce3', text: "My child enjoys participating in community or family traditions." },
  { id: 'pce4', text: "My child feels a sense of belonging at school or childcare." },
  { id: 'pce5', text: "My child feels supported by their friends." },
  { id: 'pce6', text: "My child has at least two non-parent adults who take a genuine interest in them (e.g., teachers, coaches, relatives)." },
  { id: 'pce7', text: "My child feels safe and protected by an adult in our home." }
];

const SCREENING_MODS: Record<string, ScreeningMod> = {
  sdq: {
    name: 'SDQ (Strengths & Difficulties)',
    url: 'https://www.sdqinfo.org/',
    description: 'A brief behavioral screening questionnaire for children and adolescents ages 2-17.',
    options: [
      { label: 'Not True', value: '0' },
      { label: 'Somewhat True', value: '1' },
      { label: 'Certainly True', value: '2' }
    ],
    questions: [
      { id: '1', text: 'Considerate of other people’s feelings.', category: 'Prosocial' },
      { id: '2', text: 'Restless, overactive, cannot stay still for long.', category: 'Hyperactivity' },
      { id: '3', text: 'Often complains of headaches, stomach-aches or sickness.', category: 'Emotional' },
      { id: '4', text: 'Shares readily with other children (treats, toys, pencils etc.)', category: 'Prosocial' },
      { id: '5', text: 'Often has temper tantrums or hot tempers.', category: 'Conduct' },
      { id: '6', text: 'Rather solitary, tends to play alone.', category: 'Peer Problems' },
      { id: '7', text: 'Generally obedient, usually does what adults request.', category: 'Conduct' },
      { id: '8', text: 'Many worries, often seems worried.', category: 'Emotional' },
      { id: '9', text: 'Helpful if someone is hurt, upset or feeling ill.', category: 'Prosocial' },
      { id: '10', text: 'Constantly fidgeting or squirming.', category: 'Hyperactivity' }
    ]
  },
  vision: {
    name: 'Vision & Eye Health',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Vision_problems_in_children/',
    description: 'Screens for common pediatric vision concerns, alignment issues, and visual behaviors from infancy to school age.',
    options: [
      { label: 'Never', value: '0' },
      { label: 'Sometimes', value: '1' },
      { label: 'Frequently', value: '2' }
    ],
    questions: [
      { id: 'v1', text: 'Does one eye seem to drift or cross (not stay straight) even when tired?', category: 'Alignment' },
      { id: 'v2', text: 'Does your child squint, close one eye, or tilt their head to see things?', category: 'Behaviors' },
      { id: 'v3', text: 'Do the eyes appear cloudy, or is there a white reflection in the pupil?', category: 'Physical' },
      { id: 'v4', text: 'Does your child rub their eyes a lot when not sleepy?', category: 'Comfort' },
      { id: 'v5', text: 'Does your child hold books or devices very close to their face?', category: 'Behaviors' },
      { id: 'v6', text: 'For infants: Does your baby fail to follow a toy moving across their field of view?', category: 'Tracking' },
      { id: 'v7', text: 'Does your child complain of headaches or "tired eyes" after reading?', category: 'Comfort' },
      { id: 'v8', text: 'Does your child seem to stumble or trip over small objects on the floor frequently?', category: 'Coordination' }
    ]
  },
  hearing: {
    name: 'Hearing & Auditory Response',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Hearing_problems_in_children/',
    description: 'Tracks auditory milestones and signs of potential hearing loss or processing difficulties.',
    options: [
      { label: 'Not at all', value: '2' },
      { label: 'Inconsistently', value: '1' },
      { label: 'Always/Typical', value: '0' }
    ],
    questions: [
      { id: 'h1', text: 'Does your child startle or jump at sudden loud noises?', category: 'Response' },
      { id: 'h2', text: 'Does your child turn their head toward sounds or voices they can\'t see?', category: 'Response' },
      { id: 'h3', text: 'Does your child follow simple instructions without needing a gesture?', category: 'Understanding' },
      { id: 'h4', text: 'Does your child respond when you call their name from another room?', category: 'Understanding' },
      { id: 'h5', text: 'Is your child\'s speech clear and easy for strangers to understand for their age?', category: 'Communication' },
      { id: 'h6', text: 'Does your child often say "What?" or "Huh?" or need things repeated?', category: 'Communication' },
      { id: 'h7', text: 'Do they listen to TV or music at a volume that seems too loud for others?', category: 'Behaviors' },
      { id: 'h8', text: 'In infants: Does your baby babble or make a wide variety of sounds?', category: 'Communication' }
    ]
  },
  scared: {
    name: 'SCARED (Child Anxiety)',
    url: 'https://www.ementalhealth.ca/index.php?m=tl&id=25',
    description: 'Screen for Child Anxiety Related Emotional Disorders. Helps identify specific types of anxiety in children 8-18.',
    options: [
      { label: 'Not True', value: '0' },
      { label: 'Somewhat True', value: '1' },
      { label: 'Often True', value: '2' }
    ],
    questions: [
      { id: '1', text: 'I get scared when I have to go to sleep alone.', category: 'Separation' },
      { id: '2', text: 'I worry about being as good as other kids.', category: 'Generalized' },
      { id: '3', text: 'I get shaky or dizzy when I have to go to school.', category: 'School' },
      { id: '4', text: 'I feel nervous with people I don\'t know well.', category: 'Social' },
      { id: '5', text: 'I get scared for no reason at all.', category: 'Panic' },
      { id: '6', text: 'I worry about things working out for me.', category: 'Generalized' },
      { id: '7', text: 'I am shy.', category: 'Social' },
      { id: '8', text: 'I worry about being alone in the house.', category: 'Separation' },
      { id: '9', text: 'I feel like I am going crazy.', category: 'Panic' },
      { id: '10', text: 'I worry about something bad happening to my parents.', category: 'Separation' }
    ]
  },
  mchat: {
    name: 'M-CHAT-R/F (Autism)',
    url: 'https://www.autismspeaks.org/screen-your-child',
    description: 'The standard screening tool for Autism Spectrum Disorder in toddlers aged 16-30 months.',
    options: [
      { label: 'Yes', value: '1' },
      { label: 'No', value: '0' }
    ],
    questions: [
      { id: '1', text: 'If you point at something across the room, does your child look at it?' },
      { id: '2', text: 'Have you ever wondered if your child might be deaf?', inverted: true },
      { id: '3', text: 'Does your child play believe or pretend?' },
      { id: '4', text: 'Does your child like climbing on things?' },
      { id: '5', text: 'Does your child make unusual finger movements near their eyes?', inverted: true },
      { id: '6', text: 'Does your child point with one finger to ask for something?' },
      { id: '7', text: 'Does your child point with one finger to show you something interesting?' },
      { id: '8', text: 'Is your child interested in other children?' },
      { id: '9', text: 'Does your child show you things by bringing them to you?' },
      { id: '10', text: 'Does your child respond when you call their name?' }
    ]
  },
  phqa: {
    name: 'PHQ-A (Teen Depression)',
    url: 'https://www.aacap.org/',
    description: 'Validated tool for screening depression and suicide risk in adolescents (12-18 years).',
    options: [
      { label: 'Not at all', value: '0' },
      { label: 'Several days', value: '1' },
      { label: 'More than half', value: '2' },
      { label: 'Nearly every day', value: '3' }
    ],
    questions: [
      { id: '1', text: 'Little interest or pleasure in doing things?' },
      { id: '2', text: 'Feeling down, depressed, irritable, or hopeless?' },
      { id: '3', text: 'Trouble falling/staying asleep, or sleeping too much?' },
      { id: '4', text: 'Feeling tired or having little energy?' },
      { id: '5', text: 'Poor appetite, weight loss, or overeating?' },
      { id: '6', text: 'Feeling bad about yourself or that you are a failure?' },
      { id: '7', text: 'Trouble concentrating on things (school, reading)?' },
      { id: '8', text: 'Moving/speaking slowly, or being unusually fidgety?' },
      { id: '9', text: 'Thoughts that you would be better off dead?' }
    ]
  },
  crafft: {
    name: 'CRAFFT (Teen Substance)',
    url: 'https://crafft.org/',
    description: 'Substance use screening tool for adolescents (12-18 years).',
    options: [
      { label: 'No', value: '0' },
      { label: 'Yes', value: '1' }
    ],
    questions: [
      { id: '1', text: 'Have you ever ridden in a CAR driven by someone (including yourself) who was "high" or had been using alcohol or drugs?' },
      { id: '2', text: 'Do you ever use alcohol or drugs to RELAX, feel better about yourself, or fit in?' },
      { id: '3', text: 'Do you ever use alcohol or drugs while you are by yourself, ALONE?' },
      { id: '4', text: 'Do you ever FORGET things you did while using alcohol or drugs?' },
      { id: '5', text: 'Do your family or FRIENDS ever tell you that you should cut down on your drinking or drug use?' },
      { id: '6', text: 'Have you ever gotten into TROUBLE while you were using alcohol or drugs?' }
    ]
  },
  psc17: {
    name: 'PSC-17 (Psychosocial)',
    url: 'https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist',
    description: 'Brief psychosocial screen for internalizing, externalizing, and attention problems.',
    options: [
      { label: 'Never', value: '0' },
      { label: 'Sometimes', value: '1' },
      { label: 'Often', value: '2' }
    ],
    questions: [
      { id: '1', text: 'Feels sad, unhappy', category: 'Internalizing' },
      { id: '2', text: 'Feels hopeless', category: 'Internalizing' },
      { id: '3', text: 'Down on self', category: 'Internalizing' },
      { id: '4', text: 'Worries a lot', category: 'Internalizing' },
      { id: '5', text: 'Fidgety, unable to sit still', category: 'Attention' },
      { id: '6', text: 'Distracted easily', category: 'Attention' },
      { id: '7', text: 'Does not listen to rules', category: 'Externalizing' },
      { id: '8', text: 'Acts as if driven by a motor', category: 'Attention' },
      { id: '9', text: 'Fights with other children', category: 'Externalizing' },
      { id: '10', text: 'Teases others', category: 'Externalizing' }
    ]
  },
  ace: {
    name: 'ACEs (Trauma Exposure)',
    url: 'https://emergingminds.com.au/resources/adverse-childhood-experiences-aces-the-basics/',
    description: 'Screens for exposure to traumatic events in childhood which can impact long-term health.',
    options: [
      { label: 'No', value: '0' },
      { label: 'Yes', value: '1' }
    ],
    questions: [
      { id: '1', text: 'Emotional Abuse' },
      { id: '2', text: 'Physical Abuse' },
      { id: '3', text: 'Sexual Abuse' },
      { id: '4', text: 'Emotional Neglect' },
      { id: '5', text: 'Physical Neglect' },
      { id: '6', text: 'Parental Divorce/Separation' },
      { id: '7', text: 'Domestic Violence' },
      { id: '8', text: 'Household Substance Abuse' },
      { id: '9', text: 'Household Mental Illness' },
      { id: '10', text: 'Incarcerated Household Member' }
    ]
  },
  vanderbilt: {
    name: 'Vanderbilt ADHD (Parent)',
    url: 'https://psychology-tools.com/test/vadrs-vanderbilt-adhd-diagnostic-rating-scale',
    description: 'Screens for ADHD and common comorbidities in children aged 6-12.',
    options: [
      { label: 'Never', value: '0' },
      { label: 'Occasionally', value: '1' },
      { label: 'Often', value: '2' },
      { label: 'Very Often', value: '3' }
    ],
    questions: [
      { id: '1', text: 'Does not pay attention to details.', category: 'Inattention' },
      { id: '2', text: 'Difficulty keeping attention.', category: 'Inattention' },
      { id: '3', text: 'Does not seem to listen.', category: 'Inattention' },
      { id: '4', text: 'Fails to finish activities.', category: 'Inattention' },
      { id: '5', text: 'Difficulty organizing tasks.', category: 'Inattention' },
      { id: '6', text: 'Fidgets or squirms in seat.', category: 'Hyperactivity' },
      { id: '7', text: 'Leaves seat when expected to sit.', category: 'Hyperactivity' },
      { id: '8', text: 'Runs or climbs excessively.', category: 'Hyperactivity' },
      { id: '9', text: 'Talks excessively.', category: 'Hyperactivity' },
      { id: '10', text: 'Interrupts or intrudes on others.', category: 'Hyperactivity' }
    ]
  }
};

export const ScreeningTool: React.FC<ScreeningToolProps> = ({ onLinkChallenge }) => {
  const [activeModKey, setActiveModKey] = useState<keyof typeof SCREENING_MODS | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [pceResponses, setPceResponses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ text: string; sources: any[] } | null>(null);

  const activeMod = activeModKey ? SCREENING_MODS[activeModKey] : null;

  const handleSelectMod = (key: keyof typeof SCREENING_MODS) => {
    setActiveModKey(key);
    setResponses({});
    setPceResponses(new Set());
    setAnalysis(null);
  };

  const handleResponse = (qId: string, val: string) => {
    setResponses(prev => ({ ...prev, [qId]: val }));
  };

  const togglePce = (id: string) => {
    setPceResponses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scoreData = useMemo(() => {
    if (!activeMod || Object.keys(responses).length < activeMod.questions.length) return null;

    if (['sdq', 'scared', 'psc17', 'vanderbilt', 'vision', 'hearing'].includes(activeModKey || '')) {
      const categories = [...new Set(activeMod.questions.map(q => q.category).filter(Boolean))] as string[];
      return categories.map(cat => {
        const catQuestions = activeMod.questions.filter(q => q.category === cat);
        const total = catQuestions.reduce((sum, q) => {
           const val = parseInt(responses[q.id] || '0');
           if (activeModKey === 'vanderbilt') return sum + (val >= 2 ? 1 : 0);
           return sum + val;
        }, 0);
        return { category: cat, value: total, max: catQuestions.length * 2 };
      });
    }

    if (activeModKey === 'mchat') {
      let riskScore = 0;
      activeMod.questions.forEach(q => {
        const val = parseInt(responses[q.id]);
        if (q.inverted) {
          if (val === 1) riskScore++;
        } else {
          if (val === 0) riskScore++;
        }
      });
      return [{ name: 'ASD Risk Score', value: riskScore, max: activeMod.questions.length }];
    }

    if (activeModKey === 'phqa' || activeModKey === 'ace' || activeModKey === 'crafft') {
      const total = Object.values(responses).reduce((sum, val) => sum + parseInt(val), 0);
      return [{ name: activeMod.name + ' Score', value: total, max: activeMod.questions.length * (parseInt(activeMod.options[activeMod.options.length - 1].value)) }];
    }

    return null;
  }, [activeMod, responses, activeModKey]);

  const handleSubmit = async () => {
    if (!activeMod) return;
    setLoading(true);
    try {
      const result = await analyzeScreening(activeMod.name, responses);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      alert("Error analyzing assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToParenting = () => {
    if (!onLinkChallenge) return;
    if (activeModKey === 'scared') onLinkChallenge('Social Anxiety');
    else if (activeModKey === 'phqa') onLinkChallenge('Low Mood');
    else if (activeModKey === 'vanderbilt') onLinkChallenge('Procrastination');
    else onLinkChallenge('Building Resilience');
  };

  const isComplete = activeMod && activeMod.questions.length === Object.keys(responses).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Wellbeing Screening Hub</h2>
          <p className="text-slate-500 font-medium">Standardized tools to help you and your child's care team understand development and behavior.</p>
        </div>
        {!activeModKey && (
          <div className="bg-teal-500 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
            <span>🧠</span> Mental Health Integrated
          </div>
        )}
      </header>

      {!activeMod ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(SCREENING_MODS).map(([key, mod]) => (
            <button
              key={key}
              onClick={() => handleSelectMod(key as any)}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all text-left space-y-4 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-4xl group-hover:rotate-12 transition-transform shadow-inner ${
                  key === 'sdq' ? 'bg-teal-50 text-teal-600' : key === 'mchat' ? 'bg-indigo-50 text-indigo-600' : key === 'phqa' ? 'bg-rose-50 text-rose-600' : key === 'vision' ? 'bg-blue-50 text-blue-600' : key === 'hearing' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50'
                }`}>
                  {key === 'sdq' ? '🌈' : key === 'mchat' ? '🧩' : key === 'phqa' ? '🌿' : key === 'vision' ? '👁️' : key === 'hearing' ? '👂' : key === 'psc17' ? '📈' : key === 'scared' ? '😨' : key === 'crafft' ? '🧪' : '🛡️'}
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Clinical Standard</span>
              </div>
              <div>
                <h3 className="font-bold text-2xl text-slate-800 mb-2">{mod.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">{mod.description}</p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                Open Screen <span>→</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">🔍</div>
               <div>
                  <h3 className="font-bold text-2xl text-slate-800">{activeMod.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">Confidential Screening • Evidence-Based</p>
               </div>
            </div>
            <button 
              onClick={() => setActiveModKey(null)} 
              className="px-6 py-3 text-sm font-black text-slate-500 hover:bg-slate-50 rounded-2xl border border-slate-200 uppercase tracking-widest"
            >
              ← Back to Hub
            </button>
          </div>

          {!analysis && (
            <div className="grid grid-cols-1 gap-4">
              {activeMod.questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-indigo-100">
                  <div className="flex items-start gap-5">
                    <span className="bg-slate-50 text-slate-400 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-inner">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-800 font-bold text-xl leading-snug">{q.text}</p>
                      {q.category && <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{q.category}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {activeMod.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleResponse(q.id, opt.value)}
                        className={`px-6 py-3 rounded-2xl font-black transition-all text-xs uppercase tracking-widest border-2 ${
                          responses[q.id] === opt.value 
                            ? 'bg-teal-600 border-teal-600 text-white shadow-lg scale-105' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!analysis && (
            <div className="sticky bottom-8 bg-white/90 backdrop-blur-xl p-6 rounded-[3rem] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row items-center justify-between gap-6 max-w-3xl mx-auto z-30">
               <div className="flex items-center gap-4">
                 <div className="relative w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-teal-500" strokeDasharray={`${(Object.keys(responses).length / activeMod.questions.length) * 100}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-slate-600 text-xs">
                      {Math.round((Object.keys(responses).length / activeMod.questions.length) * 100)}%
                    </div>
                 </div>
                 <div className="hidden sm:block">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">Progress Tracker</p>
                    <p className="text-xs text-slate-400 font-bold">{Object.keys(responses).length} of {activeMod.questions.length} Answered</p>
                 </div>
               </div>
               <button
                onClick={handleSubmit}
                disabled={!isComplete || loading}
                className={`px-12 py-4 rounded-2xl font-black text-white shadow-2xl transition-all uppercase tracking-widest text-sm transform active:scale-95 ${
                  isComplete && !loading 
                    ? 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1'
                    : 'bg-slate-300 cursor-not-allowed grayscale'
                }`}
              >
                {loading ? 'Synthesizing...' : 'Finalize & Analyze✨'}
              </button>
            </div>
          )}

          {analysis && (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight italic">Score Insight</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleJumpToParenting}
                      className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2"
                    >
                      💡 Related Parenting Strategies <span>→</span>
                    </button>
                  </div>
                </div>

                <div className="h-[400px] w-full bg-slate-50/50 rounded-[3rem] p-8 border border-slate-50 shadow-inner">
                  {activeModKey === 'sdq' && scoreData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreData as any}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="Scoring" dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.5} />
                        <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}

                  {(activeModKey === 'ace' || activeModKey === 'mchat' || activeModKey === 'phqa' || activeModKey === 'crafft') && scoreData && (
                    <div className="flex flex-col items-center justify-center h-full space-y-8">
                       <div className="relative w-64 h-64">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                            <circle 
                              cx="50" cy="50" r="40" 
                              stroke={activeModKey === 'phqa' ? '#6366f1' : activeModKey === 'mchat' ? '#14b8a6' : activeModKey === 'crafft' ? '#f59e0b' : '#f43f5e'} 
                              strokeWidth="8" fill="transparent" 
                              strokeDasharray={`${((scoreData[0] as any).value / (scoreData[0] as any).max) * 251.2}, 251.2`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-black leading-none ${activeModKey === 'phqa' ? 'text-indigo-600' : activeModKey === 'mchat' ? 'text-teal-600' : activeModKey === 'crafft' ? 'text-amber-600' : 'text-rose-600'}`}>
                                {(scoreData[0] as any).value}
                            </span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">out of {(scoreData[0] as any).max}</span>
                          </div>
                       </div>
                    </div>
                  )}

                  {(activeModKey === 'vanderbilt' || activeModKey === 'psc17' || activeModKey === 'scared' || activeModKey === 'vision' || activeModKey === 'hearing') && scoreData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreData as any} layout="vertical" margin={{ left: 80, right: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="category" type="category" tick={{ fill: '#64748b', fontWeight: 800, fontSize: 10 }} width={80} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={30}>
                           {scoreData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#6366f1', '#f59e0b', '#14b8a6', '#f43f5e', '#8b5cf6'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* PCE Section for ACEs Analysis */}
              {activeModKey === 'ace' && (
                <div className="bg-white p-10 rounded-[4rem] border border-indigo-100 shadow-xl space-y-8 animate-in zoom-in-95">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner">🌱</div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Strength & Resilience Builder</h3>
                      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Positive Childhood Experiences (PCEs)</p>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100">
                    <p className="text-indigo-900 font-medium leading-relaxed mb-6 italic">
                      Trauma exposure (ACEs) is only one part of the story. <strong>Positive Childhood Experiences (PCEs)</strong> act as a powerful counterbalance, fostering resilience and long-term wellbeing. Tick the strengths that apply to your child:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PCE_ITEMS.map(item => (
                        <button
                          key={item.id}
                          onClick={() => togglePce(item.id)}
                          className={`p-5 rounded-2xl text-left transition-all border-2 flex items-start gap-3 ${
                            pceResponses.has(item.id)
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'
                          }`}
                        >
                          <span className="text-xl shrink-0">{pceResponses.has(item.id) ? '🌟' : '○'}</span>
                          <span className="text-sm font-bold leading-tight">{item.text}</span>
                        </button>
                      ))}
                    </div>
                    {pceResponses.size > 0 && (
                      <div className="mt-8 p-6 bg-white rounded-3xl border border-indigo-100 text-center animate-in fade-in">
                        <p className="text-indigo-800 font-black text-lg">
                          🎉 Your child has {pceResponses.size} active Resilience Buffers!
                        </p>
                        <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mt-1">Focusing on these strengths reduces the long-term impact of ACEs.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white p-12 rounded-[4rem] border border-teal-100 shadow-2xl border-l-[20px] border-l-teal-600 overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500 rounded-full opacity-5 blur-3xl"></div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 bg-teal-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl">✨</div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter italic">AI Interpretation</h3>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none prose-lg">
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-bold italic border-l-4 border-slate-100 pl-8 mb-12">
                    {analysis.text}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
