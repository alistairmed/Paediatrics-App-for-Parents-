
import React, { useState, useEffect } from 'react';
import { getParentingAdvice } from '../services/gemini';

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

const MENTAL_HEALTH_RESOURCES = [
  { 
    name: 'Raising Children Network', 
    desc: 'The complete Australian resource for parenting from newborns to teens.', 
    url: 'https://raisingchildren.net.au',
    tags: ['AU Standard', 'Comprehensive']
  },
  { 
    name: 'Emerging Minds', 
    desc: 'National workforce centre for child mental health resources and toolkits.', 
    url: 'https://emergingminds.com.au',
    tags: ['Trauma-Informed', 'Clinical']
  },
  { 
    name: 'Beyond Blue: Be You', 
    desc: 'Support for educator and parent mental health literacy.', 
    url: 'https://beyou.edu.au',
    tags: ['Anxiety', 'Wellbeing']
  },
  { 
    name: 'Headspace (Adolescents)', 
    desc: 'National youth mental health foundation for ages 12-25.', 
    url: 'https://headspace.org.au',
    tags: ['Youth', 'Crisis Support']
  }
];

const CLINICAL_MODULES = [
  { 
    title: 'Circle of Security', 
    desc: 'Focuses on strengthening the attachment between a parent and child.',
    focus: 'Attachment & Security'
  },
  { 
    title: 'CCI: Perfectionsim', 
    desc: 'Evidence-based cognitive behavioral therapy modules for high achievers.',
    focus: 'Anxiety Management'
  },
  { 
    title: 'Triple P (Positive Parenting)', 
    desc: 'World-renowned program for behavioral management and emotional growth.',
    focus: 'Behavioral Strategy'
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
  const [activeTab, setActiveTab] = useState<'tips' | 'mentalhealth' | 'clinical'>('tips');

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

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Parenting <span className="text-amber-500">Hub</span></h2>
          <p className="text-slate-500 font-medium italic">Clinical strategies and evidence-based resources for emotional development.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          <button 
            onClick={() => setActiveTab('tips')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tips' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            AI Strategies
          </button>
          <button 
            onClick={() => setActiveTab('mentalhealth')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'mentalhealth' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Resource Library
          </button>
          <button 
            onClick={() => setActiveTab('clinical')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'clinical' ? 'bg-white text-teal-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Clinical Frameworks
          </button>
        </div>
      </header>

      {activeTab === 'tips' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Age Group</label>
                <select 
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none font-bold"
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
                    className="flex-1 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-medium text-sm shadow-inner"
                    placeholder="Describe behavior..."
                  />
                  <button onClick={() => handleGetAdvice()} className="w-14 h-14 bg-amber-500 text-white rounded-2xl shadow-lg hover:bg-amber-600 transition-transform active:scale-95">✨</button>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Access Modules</h4>
              <div className="grid grid-cols-1 gap-2">
                {COMMON_CHALLENGES.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { setChallenge(c.label); handleGetAdvice(c.label); }}
                    className="w-full p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.icon}</span>
                      <span className="text-sm font-bold text-slate-700">{c.label}</span>
                    </div>
                    {c.source && <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-widest">{c.source}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 animate-pulse text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-4xl animate-bounce">🧠</div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Synthesizing clinical strategies...</p>
              </div>
            ) : advice ? (
              <div className="bg-white p-12 rounded-[4rem] border-l-[20px] border-l-amber-500 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500 rounded-full opacity-5 blur-[100px]"></div>
                <div className="relative z-10 whitespace-pre-wrap text-slate-700 leading-relaxed font-bold italic prose prose-lg max-w-none">
                  {advice.text}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50/50 border-4 border-dashed border-slate-200 rounded-[4rem] text-center p-12 space-y-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-sm grayscale opacity-30">🌻</div>
                <div className="max-w-sm">
                  <h4 className="font-black text-slate-800 text-xl tracking-tight mb-2">Strategy Lab</h4>
                  <p className="text-slate-400 font-medium">Describe a parenting challenge or select a module to receive tailored clinical insights.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mentalhealth' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
          {MENTAL_HEALTH_RESOURCES.map((res, i) => (
            <a 
              key={i} 
              href={res.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-6 transition-transform">
                  🔗
                </div>
                <div className="flex gap-1">
                  {res.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase rounded tracking-widest border border-slate-100">{tag}</span>
                  ))}
                </div>
              </div>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{res.name}</h4>
              <p className="text-slate-500 font-medium leading-relaxed italic">{res.desc}</p>
              <div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                Visit Resource <span>→</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {activeTab === 'clinical' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <div className="bg-teal-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                {CLINICAL_MODULES.map((mod, i) => (
                  <div key={i} className="space-y-4">
                     <span className="px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">{mod.focus}</span>
                     <h4 className="text-2xl font-black tracking-tight">{mod.title}</h4>
                     <p className="text-teal-100/70 text-sm font-medium leading-relaxed italic">{mod.desc}</p>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="bg-white p-10 rounded-[4rem] border border-teal-100 shadow-lg flex items-center gap-8">
             <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center text-4xl shadow-inner">💡</div>
             <div>
                <h5 className="text-xl font-black text-slate-800">Why Evidence-Based?</h5>
                <p className="text-slate-500 font-medium leading-relaxed max-w-2xl mt-1 italic">
                  These frameworks are utilized by Australian clinical psychologists and pediatricians because they are backed by decades of research into child development and family systems.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
