
import React, { useState, useEffect } from 'react';
import { getParentingAdvice } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";

const COMMON_CHALLENGES = [
  { id: 'resilience', label: 'Building Resilience', icon: '🌈' },
  { id: 'anxiety', label: 'Anxiety & Fears', icon: '🫂' },
  { id: 'perfectionism', label: 'Perfectionism', icon: '💎', source: 'CCI' },
  { id: 'social_anxiety', label: 'Social Anxiety', icon: '🏘️', source: 'CCI' },
  { id: 'tantrums', label: 'Tantrums & Meltdowns', icon: '😤' },
  { id: 'procrastination', label: 'Procrastination', icon: '⏳', source: 'CCI' },
  { id: 'eating', label: 'Fussy Eating', icon: '🥦' },
  { id: 'mood', label: 'Low Mood', icon: '🌧️', source: 'CCI' },
];

const HEALTH_LITERACY_TERMS = [
  { term: 'Febrile Convulsion', category: 'Emergency', definition: 'A fit or seizure caused by a sudden spike in body temperature, usually from a fever. While they are terrifying to watch, they are usually brief and almost never cause brain damage or long-term issues.', icon: '🌡️', source: 'RCH Melbourne' },
  { term: 'Bronchiolitis', category: 'Respiratory', definition: 'A common chest infection in babies caused by a virus. It causes tiny breathing tubes to swell, making breathing sounds "wheezy" or "crackly".', icon: '🫁', source: 'Raising Children Network' },
  { term: 'Gastroenteritis', category: 'Illness', definition: 'A tummy bug that causes vomiting and diarrhoea. The main goal is staying hydrated with small, frequent sips.', icon: '💧', source: 'RCH Melbourne' },
  { term: 'Anaphylaxis', category: 'Emergency', definition: 'A severe, life-threatening allergic reaction. It requires immediate use of an EpiPen and an ambulance (000).', icon: '🚨', source: 'ASCIA / RCH' },
  { term: 'Hand, Foot and Mouth', category: 'Infection', definition: 'A common viral illness causing small blisters on the hands, feet, and inside the mouth. It is contagious but usually mild.', icon: '👄', source: 'Raising Children Network' },
  { term: 'Croup', category: 'Respiratory', definition: 'A viral infection that causes swelling around the voice box, leading to a "barking" cough that often sounds like a seal.', icon: '🐕', source: 'RCH Melbourne' },
  { term: 'RSV', category: 'Respiratory', definition: 'Respiratory Syncytial Virus. A very common virus that causes cold-like symptoms but can lead to bronchiolitis in small babies.', icon: '🦠', source: 'RCH Melbourne' },
  { term: 'Stridor', category: 'Respiratory', definition: 'A high-pitched whistling sound when breathing in. Often seen in croup. If severe or at rest, seek medical review.', icon: '🌬️', source: 'Clinical Practice Guidelines' },
];

const MENTAL_HEALTH_RESOURCES = [
  { 
    name: 'Raising Children Network', 
    desc: 'The complete Australian resource for parenting from newborns to teens.', 
    url: 'https://raisingchildren.net.au',
    tags: ['AU Standard', 'Comprehensive'],
    icon: '🇦🇺'
  },
  { 
    name: 'Parentline (13 22 89)', 
    desc: '24/7 Free professional telephone counseling for parents and carers.', 
    url: 'https://parentline.com.au',
    tags: ['24/7 Support', 'Crisis'],
    icon: '📞'
  },
  { 
    name: 'Emerging Minds', 
    desc: 'National workforce centre for child mental health resources and trauma-informed toolkits.', 
    url: 'https://emergingminds.com.au',
    tags: ['Trauma-Informed', 'Clinical'],
    icon: '🧠'
  },
  { 
    name: 'Gidget Foundation', 
    desc: 'Support for emotional wellbeing during pregnancy and early parenthood.', 
    url: 'https://gidgetfoundation.org.au',
    tags: ['Perinatal', 'New Parents'],
    icon: '🍼'
  },
  { 
    name: 'Maggie Dent (Commonly Grounded)', 
    desc: 'Practical AU strategies for resilience and navigating "the real world" of parenting.', 
    url: 'https://maggiedent.com',
    tags: ['Resilience', 'Practical'],
    icon: '🌻'
  },
  { 
    name: 'Beyond Blue: Be You', 
    desc: 'Support for educator and parent mental health literacy and school-based wellbeing.', 
    url: 'https://beyou.edu.au',
    tags: ['Anxiety', 'Schools'],
    icon: '🏫'
  },
  { 
    name: 'Headspace (Adolescents)', 
    desc: 'National youth mental health foundation for ages 12-25.', 
    url: 'https://headspace.org.au',
    tags: ['Youth', '12-25 Years'],
    icon: '🎧'
  }
];

const CLINICAL_MODULES = [
  { 
    title: 'Circle of Security', 
    focus: 'Attachment & Emotional Security',
    theory: 'Children need a "Secure Base" to explore from and a "Safe Haven" to return to.',
    application: 'Identify when your child is "on the circle." Are they going out to play or coming in for comfort? Meet the need, then support exploration.',
    icon: '⭕',
    color: 'border-indigo-200 bg-indigo-50/50',
    url: 'https://www.circleofsecurityinternational.com/'
  },
  { 
    title: 'Triple P (Positive Parenting)', 
    focus: 'Behavioral Strategy & Self-Regulation',
    theory: 'Behavior is communication. Proactive environment management reduces reactive discipline.',
    application: 'Use descriptive praise, set clear ground rules, and use "Time-In" to co-regulate during big emotions.',
    icon: '📈',
    color: 'border-emerald-200 bg-emerald-50/50',
    url: 'https://www.triplep-parenting.net.au/'
  },
  { 
    title: 'CCI: Perfectionism', 
    focus: 'Overcoming High Standards',
    theory: 'Perfectionism is a "relentless pursuit of unrealistic standards" that leads to self-worth being tied solely to achievement.',
    application: 'Practice "Behavioral Experiments" – test what happens if you don\'t do something perfectly. Focus on "Good Enough" and self-compassion.',
    icon: '💎',
    color: 'border-slate-200 bg-slate-50/50',
    url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Perfectionism'
  },
  { 
    title: 'CCI: Social Anxiety', 
    focus: 'Shyness & Social Confidence',
    theory: 'Social anxiety involves a fear of negative evaluation and excessive self-focus in social situations.',
    application: 'Use "External Focus" – shift attention from internal worries to the social environment. Practice "Social Mishap" exposures to build tolerance.',
    icon: '🏘️',
    color: 'border-blue-200 bg-blue-50/50',
    url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Social-Anxiety'
  },
  { 
    title: 'CCI: Procrastination', 
    focus: 'Task Completion & Schoolwork',
    theory: 'Procrastination is often "Emotional Regulation" – avoiding the discomfort associated with a task, not just "poor time management."',
    application: 'Break tasks into "micro-steps." Use the "5-Minute Rule" – commit to just 5 minutes of work to overcome initial avoidance.',
    icon: '⏳',
    color: 'border-amber-200 bg-amber-50/50',
    url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Procrastination'
  },
  { 
    title: 'CCI: Assertiveness', 
    focus: 'Communication & Confidence',
    theory: 'Being assertive means standing up for your own rights in a way that respects the rights of others.',
    application: 'Use "I" statements to express needs. Practice "The Broken Record" technique – calmly repeating your request when facing resistance.',
    icon: '🗣️',
    color: 'border-teal-200 bg-teal-50/50',
    url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Assertiveness'
  },
  { 
    title: 'CCI: Self-Compassion', 
    focus: 'Caregiver Burnout Prevention',
    theory: 'Treating yourself with the same kindness and understanding you would offer a friend during difficult times.',
    application: 'Identify the "Critical Inner Voice." Practice the "Self-Compassion Break": Mindfulness + Common Humanity + Self-Kindness.',
    icon: '💖',
    color: 'border-rose-200 bg-rose-50/50',
    url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Self-Compassion'
  },
  { 
    title: 'Collaborative & Proactive Solutions', 
    focus: 'Conflict Resolution & Skill Building',
    theory: '"Kids do well if they can." Challenging behavior occurs when demands exceed a child\'s skills.',
    application: 'Move from power-struggles to Plan B: Empathy + Define the Problem + Invitation to collaborate on a win-win solution.',
    icon: '🤝',
    color: 'border-blue-100 bg-blue-50/20',
    url: 'https://livesinthebalance.org/'
  },
  { 
    title: 'Whole-Brain Child (Mindsight)', 
    focus: 'Neuro-Developmental Integration',
    theory: 'The brain has "upstairs" (logic) and "downstairs" (emotion) parts. Stress causes dis-integration.',
    application: '"Connect and Redirect." Acknowledge the emotion (downstairs) before trying to logic through the behavior (upstairs).',
    icon: '🧠',
    color: 'border-purple-200 bg-purple-50/50',
    url: 'https://drdansiegel.com/the-whole-brain-child/'
  },
  { 
    title: 'PACE (Trauma-Informed)', 
    focus: 'Safety & Co-regulation',
    theory: 'Attachment is built through Playfulness, Acceptance, Curiosity, and Empathy.',
    application: 'Use a "wondering" tone (Curiosity) to understand feelings: "I wonder if you are feeling a bit worried about..." instead of assuming.',
    icon: '🌊',
    color: 'border-rose-200 bg-rose-50/50',
    url: 'https://ddpnetwork.org/about-ddp/me-the-ddp-family/pace/'
  },
  { 
    title: 'Emotion Coaching', 
    focus: 'Emotional Intelligence',
    theory: 'Children who understand their emotions have better health, school performance, and social skills.',
    application: 'The 5 steps: 1. Awareness, 2. Connection, 3. Listening, 4. Naming (Labeling), 5. Setting limits & Problem-solving.',
    icon: '❤️',
    color: 'border-amber-200 bg-amber-50/50',
    url: 'https://www.gottman.com/parents/emotion-coaching/'
  }
];

interface ParentingTipsProps {
  preselectedChallenge?: string;
  onClearChallenge?: () => void;
}

export const ParentingTips: React.FC<ParentingTipsProps> = ({ preselectedChallenge, onClearChallenge }) => {
  const [age, setAge] = useState('Toddler (1-3 years)');
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<{ text: string; sources: any[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'tips' | 'mentalhealth' | 'clinical' | 'literacy'>('literacy');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [aiTermExplanation, setAiTermExplanation] = useState<{ text: string, sources: any[] } | null>(null);
  const [literacyLoading, setLiteracyLoading] = useState(false);
  const [literacyCategory, setLiteracyCategory] = useState('All');

  useEffect(() => {
    if (preselectedChallenge) {
      setChallenge(preselectedChallenge);
      handleGetAdvice(preselectedChallenge);
      if (onClearChallenge) setTimeout(onClearChallenge, 1000);
    }
  }, [preselectedChallenge]);

  const handleGetAdvice = async (selectedChallenge?: string) => {
    const finalChallenge = selectedChallenge || challenge;
    if (!finalChallenge) return;
    
    setLoading(true);
    setAdvice(null);
    setActiveTab('tips');
    try {
      const res = await getParentingAdvice(age, finalChallenge);
      setAdvice(res);
    } catch (error) {
      alert("Error generating advice.");
    } finally {
      setLoading(false);
    }
  };

  const handleExplainTerm = async () => {
    if (!searchQuery.trim()) return;
    setLiteracyLoading(true);
    setAiTermExplanation(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Explain the medical term or condition "${searchQuery}" for a parent with a child in the "${age}" group. 
        Use simple, supportive language.
        Format your response clearly with:
        1. Simple Definition
        2. Common Symptoms
        3. Actionable Advice
        4. When to seek urgent care.
        Reference reliable Australian sources (RCH Melbourne, Raising Children Network).`,
        config: { tools: [{ googleSearch: {} }] }
      });
      setAiTermExplanation({
        text: response.text || '',
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      });
    } catch (e) {
      alert("Error explaining term.");
    } finally {
      setLiteracyLoading(false);
    }
  };

  const filteredTerms = HEALTH_LITERACY_TERMS.filter(t => 
    (literacyCategory === 'All' || t.category === literacyCategory) &&
    (t.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.definition.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Parenting <span className="text-amber-500">Hub</span></h2>
          <p className="text-slate-500 font-medium italic">Health literacy and evidence-based clinical strategies.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'literacy', label: 'Health Literacy', color: 'text-emerald-600' },
            { id: 'tips', label: 'AI Strategies', color: 'text-amber-600' },
            { id: 'mentalhealth', label: 'Resources', color: 'text-indigo-600' },
            { id: 'clinical', label: 'Frameworks', color: 'text-teal-600' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-white ${tab.color} shadow-md` : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'literacy' && (
        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
          <section className="bg-emerald-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-4xl shadow-inner backdrop-blur-md">📖</div>
                  <div>
                    <h3 className="text-3xl font-black italic tracking-tighter leading-none">Clinical Terms Decoder</h3>
                    <p className="text-emerald-100/70 text-sm font-bold uppercase tracking-widest mt-1">Reliable Pediatric Knowledge</p>
                  </div>
                </div>
                <p className="text-emerald-50 font-medium italic opacity-80 max-w-xl leading-relaxed">
                  Confused by medical jargon? Search our database or ask our Clinical AI for an age-appropriate explanation grounded in RCH Melbourne standards.
                </p>
                <div className="flex gap-2 max-w-md">
                   <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="e.g. Febrile Convulsion, Stridor..."
                    className="flex-1 p-5 rounded-2xl bg-white font-black text-slate-900 outline-none border-none shadow-xl placeholder-slate-400"
                    onKeyPress={e => e.key === 'Enter' && handleExplainTerm()}
                   />
                   <button 
                    onClick={handleExplainTerm}
                    disabled={literacyLoading}
                    className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl hover:bg-emerald-400 transition-all active:scale-95"
                   >
                     {literacyLoading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" /> : '🔍'}
                   </button>
                </div>
             </div>
          </section>

          {aiTermExplanation && (
            <div className="bg-white p-12 rounded-[4rem] border-l-[20px] border-l-emerald-600 shadow-2xl animate-in zoom-in-95 relative overflow-hidden flex flex-col">
               <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500 rounded-full opacity-5 blur-[100px]"></div>
               <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner border-2 border-emerald-100">✨</div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 italic uppercase leading-none">Clinical Translation</h4>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">Personalized Contextual Logic</p>
                    </div>
                  </div>
                  <button onClick={() => setAiTermExplanation(null)} className="text-slate-300 hover:text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl transition-all">Dismiss</button>
               </div>
               
               <div className="relative z-10 space-y-10">
                  {aiTermExplanation.text.split('\n').map((line, idx) => {
                    const isHeader = line.match(/^\d\./);
                    return (
                      <div key={idx} className={isHeader ? "mt-4" : ""}>
                        {isHeader ? (
                           <h5 className="text-xl text-emerald-900 not-italic font-black uppercase tracking-tighter flex items-center gap-3 border-b-2 border-emerald-50 pb-2">
                             <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[11px]">{line.split('.')[0]}</span>
                             {line.split('. ')[1]}
                           </h5>
                        ) : (
                          <p className="text-slate-800 leading-relaxed font-bold italic border-l-4 border-slate-100 pl-8 text-lg mt-4">
                            {line}
                          </p>
                        )}
                      </div>
                    );
                  })}
               </div>

               {aiTermExplanation.sources.length > 0 && (
                 <div className="pt-10 mt-10 border-t border-slate-100 space-y-4 relative z-10">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Scientific Grounding</p>
                    <div className="flex flex-wrap gap-2">
                      {aiTermExplanation.sources.map((s: any, i: number) => (
                        <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-emerald-600 bg-slate-50 px-4 py-2.5 rounded-xl border-2 border-slate-100 transition-all flex items-center gap-2 group">
                          {s.web?.title || 'Health Resource'} <span className="group-hover:translate-x-1 transition-transform">↗</span>
                        </a>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
               {['All', 'Emergency', 'Respiratory', 'Infection', 'Illness'].map(cat => (
                 <button
                  key={cat}
                  onClick={() => setLiteracyCategory(cat)}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${literacyCategory === cat ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTerms.map((t, i) => (
                <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                        {t.icon}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.category === 'Emergency' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {t.category}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">{t.term}</h4>
                    <p className="text-slate-500 font-medium italic text-sm leading-relaxed">{t.definition}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Reliable Info</span>
                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tips' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Age Group</label>
                <select 
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none font-black text-slate-900"
                >
                  <option>Toddler (1-3 years)</option>
                  <option>Preschooler (3-5 years)</option>
                  <option>School Age (5-12 years)</option>
                  <option>Adolescent (12+ years)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Specific Concern</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={challenge}
                    onChange={e => setChallenge(e.target.value)}
                    className="flex-1 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-black text-slate-900 text-sm shadow-inner placeholder-slate-400"
                    placeholder="Describe behavior..."
                  />
                  <button 
                    onClick={() => handleGetAdvice()} 
                    disabled={loading}
                    className="w-14 h-14 bg-amber-500 text-white rounded-2xl shadow-lg hover:bg-amber-600 transition-transform active:scale-95 flex items-center justify-center"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✨'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
               <h5 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>💡</span> Strategy Guide
               </h5>
               <p className="text-amber-100 text-xs font-bold italic leading-relaxed">
                  These insights are generated by analyzing standard pediatric behavioral protocols including Triple P and Circle of Security principles.
               </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 animate-pulse text-center space-y-6 shadow-sm">
                <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-5xl animate-bounce shadow-inner">🌻</div>
                <div className="space-y-2">
                  <p className="font-black text-slate-800 uppercase tracking-widest text-sm">Reviewing Clinical Frameworks...</p>
                  <p className="text-slate-400 text-xs font-bold italic">Synthesizing evidence-based strategies for your child's age group.</p>
                </div>
              </div>
            ) : advice ? (
              <div className="bg-white p-10 sm:p-14 rounded-[4rem] border border-slate-100 shadow-2xl animate-in zoom-in-95 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500 rounded-full opacity-5 blur-[100px]"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 relative z-10">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-4xl shadow-inner border-2 border-amber-100">💡</div>
                      <div>
                        <h4 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">Parenting Strategy</h4>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2">Professional Caretaker Insight</p>
                      </div>
                   </div>
                   <div className="px-5 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EBM Synthesis 1.0</span>
                   </div>
                </div>

                <div className="relative z-10 space-y-12">
                   {advice.text.split('\n').map((line, idx) => {
                      const isBold = line.match(/^\*\*(.*)\*\*/);
                      const isList = line.match(/^[-•]/);
                      return (
                        <div key={idx} className={`${isList ? 'ml-6' : ''}`}>
                           {isBold ? (
                              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 shadow-sm">
                                <h5 className="text-xl font-black text-amber-950 uppercase tracking-tight mb-2 flex items-center gap-2">
                                   <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                   {line.replace(/\*\*/g, '')}
                                </h5>
                              </div>
                           ) : isList ? (
                              <div className="flex gap-4 items-start py-2">
                                 <span className="w-2 h-2 rounded-full bg-amber-200 mt-2 shrink-0 shadow-sm"></span>
                                 <p className="text-lg font-black italic text-slate-700 leading-relaxed">
                                    {line.replace(/^[-•]\s*/, '')}
                                 </p>
                              </div>
                           ) : (
                              <p className="text-xl font-black italic text-slate-800 leading-relaxed pl-8 border-l-4 border-slate-100">
                                 {line}
                              </p>
                           )}
                        </div>
                      );
                   })}
                </div>
                
                {advice.sources.length > 0 && (
                  <div className="pt-10 mt-16 border-t border-slate-100 space-y-4 relative z-10">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Guideline Registry</p>
                    <div className="flex flex-wrap gap-3">
                      {advice.sources.map((s: any, i: number) => (
                        <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-amber-600 bg-white px-5 py-2.5 rounded-2xl border-2 border-slate-100 transition-all flex items-center gap-2 shadow-sm group">
                          {s.web?.title || 'Health Resource'} <span className="text-xs transition-transform group-hover:translate-x-1">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-slate-50 opacity-40">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">
                      Disclaimer: This strategy is for educational support only. <br/> Consult a professional for complex behavioral concerns.
                   </p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50/50 border-4 border-dashed border-slate-200 rounded-[4rem] text-center p-12 space-y-6">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-5xl shadow-sm grayscale opacity-30">🌻</div>
                <div className="max-w-sm">
                  <h4 className="font-black text-slate-800 text-xl tracking-tight mb-2 uppercase italic">Strategy Lab</h4>
                  <p className="text-slate-600 font-bold italic">Describe a parenting challenge or select a clinical module to receive tailored synthesis.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mentalhealth' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-indigo-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
            <h3 className="text-3xl font-black italic tracking-tighter mb-4 relative z-10">Professional Support Registry</h3>
            <p className="text-indigo-100 font-medium italic opacity-80 max-w-2xl relative z-10">
              Validated Australian resources for parenting, behavior, and family mental health.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MENTAL_HEALTH_RESOURCES.map((res, i) => (
              <a 
                key={i} 
                href={res.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">{res.icon}</div>
                    <span className="text-slate-300 group-hover:text-indigo-600 transition-colors">↗</span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors leading-tight">{res.name}</h4>
                  <p className="text-slate-500 font-medium italic text-sm leading-relaxed mb-6">{res.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50">
                  {res.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'clinical' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-teal-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
            <h3 className="text-3xl font-black italic tracking-tighter mb-4 relative z-10">Clinical Framework Explainers</h3>
            <p className="text-teal-100 font-medium italic opacity-80 max-w-2xl relative z-10">
              Understanding the professional models used by pediatricians and psychologists.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {CLINICAL_MODULES.map((mod, i) => (
              <div key={i} className={`p-10 rounded-[4rem] border-2 shadow-sm flex flex-col group hover:shadow-xl transition-all ${mod.color}`}>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-sm border border-white group-hover:rotate-6 transition-transform">
                    {mod.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-1">{mod.focus}</p>
                    <h4 className="text-3xl font-black text-slate-800 leading-tight">{mod.title}</h4>
                  </div>
                  <a href={mod.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/40 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-white/50 transition-all text-teal-600 font-black">↗</a>
                </div>

                <div className="space-y-8 flex-1">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Clinical Theory</p>
                      <p className="text-base font-bold text-slate-700 italic border-l-4 border-white/50 pl-4">{mod.theory}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Parental Application</p>
                      <div className="bg-white/40 p-6 rounded-3xl border border-white/50 shadow-inner group-hover:bg-white/60 transition-all">
                        <p className="text-base font-black text-slate-800 leading-relaxed">
                          {mod.application}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200/30 flex justify-between items-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scientific Model of Care</span>
                   <div className="flex gap-2">
                      <a href={mod.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase tracking-widest text-teal-600 hover:underline">Further Reading</a>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                        <span className="w-2 h-2 rounded-full bg-teal-200"></span>
                      </div>
                   </div>
                </div>
              </div>
            ))}

            <div className="bg-slate-900 p-10 rounded-[4rem] text-white flex flex-col justify-center relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-600 rounded-full opacity-20 blur-[100px]"></div>
               <div className="relative z-10 space-y-6">
                  <h4 className="text-2xl font-black italic tracking-tighter uppercase">Why Frameworks Matter?</h4>
                  <p className="text-indigo-100 text-sm font-medium italic leading-relaxed opacity-80">
                    "Frameworks aren't rules; they are lenses to see your child's behavior clearly. Instead of asking 'How do I stop this behavior?', these models help you ask 'What is my child trying to tell me?'"
                  </p>
                  <div className="pt-6 border-t border-white/10">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">PediPulse Professional Logic v1.0</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
