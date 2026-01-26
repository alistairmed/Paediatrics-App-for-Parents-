
import React, { useState, useMemo, useEffect } from 'react';
import { Milestone } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';

const INITIAL_DATA: Milestone[] = [
  // 6-8 WEEKS
  { id: "6w-m1", ageRange: "6-8 Weeks", category: "Motor", description: "Lifts head briefly when prone. Example: Can clear chin from the floor for a few seconds.", completed: false, isRedFlag: false },
  { id: "6w-m2", ageRange: "6-8 Weeks", category: "Social", description: "Responsive social smile. Example: Smiles back when you talk to or smile at them.", completed: false, isRedFlag: false },
  { id: "6w-m3", ageRange: "6-8 Weeks", category: "Language", description: "Coos and makes gurgling sounds. Example: Makes 'ooh' and 'aah' noises when you talk.", completed: false, isRedFlag: false },
  { id: "6w-m4", ageRange: "6-8 Weeks", category: "Cognitive", description: "Watches faces and follows with eyes. Example: Tracks your face briefly as you move.", completed: false, isRedFlag: false },
  { id: "6w-rf1", ageRange: "6-8 Weeks", category: "Motor", description: "Red Flag: Persistent fisting. Example: Hands stay clenched in a tight fist most of the time.", completed: false, isRedFlag: true },
  { id: "6w-rf2", ageRange: "6-8 Weeks", category: "Motor", description: "Red Flag: Floppy or Stiff. Example: Feels unusually 'loose' or 'hard' like a board when handled.", completed: false, isRedFlag: true },
  { id: "6w-rf3", ageRange: "6-8 Weeks", category: "Social", description: "Red Flag: No social smile by 8 weeks. Example: Does not smile back at caregivers.", completed: false, isRedFlag: true },
  { id: "6w-rf4", ageRange: "6-8 Weeks", category: "Language", description: "Red Flag: Not startled by noises. Example: Shows no reaction to sudden loud sounds.", completed: false, isRedFlag: true },
  { id: "6w-rf5", ageRange: "6-8 Weeks", category: "Cognitive", description: "Red Flag: Vision concern. Example: Persistent squint or not following a face with eyes.", completed: false, isRedFlag: true },

  // 4 MONTHS
  { id: "4m-m1", ageRange: "4 Months", category: "Motor", description: "Holds head steady, unsupported. Example: No longer 'bobbles' when being held upright.", completed: false, isRedFlag: false },
  { id: "4m-m2", ageRange: "4 Months", category: "Motor", description: "Reaches for objects; grasps a rattle. Example: Tries to grab a toy hanging in front of them.", completed: false, isRedFlag: false },
  { id: "4m-m3", ageRange: "4 Months", category: "Language", description: "Laughs out loud. Example: Makes happy squealing sounds.", completed: false, isRedFlag: false },
  { id: "4m-m4", ageRange: "4 Months", category: "Social", description: "Turns head to sounds. Example: Looks toward a voice or rattle sound.", completed: false, isRedFlag: false },
  { id: "4m-rf1", ageRange: "4 Months", category: "Motor", description: "Red Flag: Significant head lag. Example: Head drops back when being pulled to sit.", completed: false, isRedFlag: true },
  { id: "4m-rf2", ageRange: "4 Months", category: "Social", description: "Red Flag: Not smiling at people. Example: Rarely or never makes eye contact or smiles at caregivers.", completed: false, isRedFlag: true },
  { id: "4m-rf3", ageRange: "4 Months", category: "Language", description: "Red Flag: Not babbling. Example: Not making cooing sounds or responding to voices.", completed: false, isRedFlag: true },

  // 6 MONTHS
  { id: "6m-m1", ageRange: "6 Months", category: "Motor", description: "Rolls over in both directions. Example: From tummy to back and back to tummy.", completed: false, isRedFlag: false },
  { id: "6m-m2", ageRange: "6 Months", category: "Motor", description: "Transfers objects between hands. Example: Moves a toy from one hand to the other.", completed: false, isRedFlag: false },
  { id: "6m-m3", ageRange: "6 Months", category: "Language", description: "Babbles with consonants (ba, da, ga). Example: Strings sounds together like 'bababa'.", completed: false, isRedFlag: false },
  { id: "6m-m4", ageRange: "6 Months", category: "Social", description: "Knows familiar faces. Example: Reaches out to be picked up by a parent.", completed: false, isRedFlag: false },
  { id: "6m-rf1", ageRange: "6 Months", category: "Motor", description: "Red Flag: Hand preference. Example: Consistently uses only one hand for all reaching; other hand stays still.", completed: false, isRedFlag: true },
  { id: "6m-rf2", ageRange: "6 Months", category: "Language", description: "Red Flag: Not turning to sounds. Example: No reaction when you speak from behind them.", completed: false, isRedFlag: true },
  { id: "6m-rf3", ageRange: "6 Months", category: "Social", description: "Red Flag: No smiles or squeals. Example: Does not show outward signs of joy or social engagement.", completed: false, isRedFlag: true },

  // 9 MONTHS
  { id: "9m-m1", ageRange: "9 Months", category: "Motor", description: "Sits without support. Example: Can play with a toy while sitting on the floor.", completed: false, isRedFlag: false },
  { id: "9m-m2", ageRange: "9 Months", category: "Social", description: "Stranger anxiety begins. Example: Clings to familiar adults when new people are around.", completed: false, isRedFlag: false },
  { id: "9m-m3", ageRange: "9 Months", category: "Language", description: "Understands 'No'. Example: Briefly stops what they are doing when you say no.", completed: false, isRedFlag: false },
  { id: "9m-m4", ageRange: "9 Months", category: "Cognitive", description: "Plays Peek-a-boo. Example: Enjoys interactive games where items disappear.", completed: false, isRedFlag: false },
  { id: "9m-rf1", ageRange: "9 Months", category: "Motor", description: "Red Flag: Not sitting independently. Example: Slumps over immediately if not supported.", completed: false, isRedFlag: true },
  { id: "9m-rf2", ageRange: "9 Months", category: "Social", description: "Red Flag: No back-and-forth play. Example: Doesn't respond to peek-a-boo or imitate sounds.", completed: false, isRedFlag: true },
  { id: "9m-rf3", ageRange: "9 Months", category: "Language", description: "Red Flag: Not responding to name. Example: Doesn't look around when called.", completed: false, isRedFlag: true },

  // 12 MONTHS
  { id: "12m-m1", ageRange: "12 Months", category: "Motor", description: "Pulls up to stand and 'cruises'. Example: Walks while holding furniture.", completed: false, isRedFlag: false },
  { id: "12m-m2", ageRange: "12 Months", category: "Motor", description: "Fine pincer grasp. Example: Picks up a single pea with tips of fingers.", completed: false, isRedFlag: false },
  { id: "12m-m3", ageRange: "12 Months", category: "Language", description: "1-3 specific words. Example: Uses 'Dada' or 'Mama' correctly for parents.", completed: false, isRedFlag: false },
  { id: "12m-m4", ageRange: "12 Months", category: "Social", description: "Points to show interest. Example: Points at a bird to get your attention.", completed: false, isRedFlag: false },
  { id: "12m-rf1", ageRange: "12 Months", category: "Social", description: "Red Flag: No pointing or waving. Example: Does not use gestures to communicate.", completed: false, isRedFlag: true },
  { id: "12m-rf2", ageRange: "12 Months", category: "Language", description: "Red Flag: No words. Example: Has no recognizable single words like 'cat' or 'juice'.", completed: false, isRedFlag: true },
  { id: "12m-rf3", ageRange: "12 Months", category: "Motor", description: "Red Flag: Not pulling to stand. Example: Does not try to stand even with support.", completed: false, isRedFlag: true },

  // 18 MONTHS
  { id: "18m-m1", ageRange: "18 Months", category: "Motor", description: "Walks alone independently. Example: Walks across a room without holding on.", completed: false, isRedFlag: false },
  { id: "18m-m2", ageRange: "18 Months", category: "Language", description: "Says several single words (10-25). Example: Names common objects like 'ball' or 'milk'.", completed: false, isRedFlag: false },
  { id: "18m-m3", ageRange: "18 Months", category: "Social", description: "Simple pretend play. Example: Pretends to feed a doll.", completed: false, isRedFlag: false },
  { id: "18m-m4", ageRange: "18 Months", category: "Cognitive", description: "Follows 1-step commands. Example: 'Give me the toy'.", completed: false, isRedFlag: false },
  { id: "18m-rf1", ageRange: "18 Months", category: "Motor", description: "Red Flag: Not walking independently. Example: Still needs hand-holding to take steps.", completed: false, isRedFlag: true },
  { id: "18m-rf2", ageRange: "18 Months", category: "Language", description: "Red Flag: Less than 6–10 words. Example: Vocabulary is extremely limited for this age.", completed: false, isRedFlag: true },
  { id: "18m-rf3", ageRange: "18 Months", category: "Social", description: "Red Flag: No joint attention. Example: Doesn't look where you point or show you things.", completed: false, isRedFlag: true },
  { id: "18m-rf4", ageRange: "18 Months", category: "Cognitive", description: "Red Flag: Not following instructions. Example: Fails to understand simple requests like 'Come here'.", completed: false, isRedFlag: true },

  // 2 YEARS
  { id: "2y-m1", ageRange: "2 Years", category: "Motor", description: "Kicks a ball; runs well. Example: Can swing leg to kick a stationary ball.", completed: false, isRedFlag: false },
  { id: "2y-m2", ageRange: "2 Years", category: "Language", description: "Says 2-word phrases. Example: 'More milk' or 'Doggy bark'.", completed: false, isRedFlag: false },
  { id: "2y-m3", ageRange: "2 Years", category: "Social", description: "Parallel play. Example: Plays near other children happily.", completed: false, isRedFlag: false },
  { id: "2y-m4", ageRange: "2 Years", category: "Cognitive", description: "Follows 2-step commands. Example: 'Get your shoes and put them on'.", completed: false, isRedFlag: false },
  { id: "2y-rf1", ageRange: "2 Years", category: "Language", description: "Red Flag: Less than 50 words. Example: Very limited vocabulary for a 2-year-old.", completed: false, isRedFlag: true },
  { id: "2y-rf2", ageRange: "2 Years", category: "Language", description: "Red Flag: No 2-word phrases. Example: Only uses single words to communicate.", completed: false, isRedFlag: true },
  { id: "2y-rf3", ageRange: "2 Years", category: "Social", description: "Red Flag: Poor eye contact. Example: Rarely looks you in the eye during requests.", completed: false, isRedFlag: true },
  { id: "2y-rf4", ageRange: "2 Years", category: "Social", description: "Red Flag: No interest in others. Example: Doesn't notice or want to play near other children.", completed: false, isRedFlag: true },

  // 3 YEARS
  { id: "3y-m1", ageRange: "3 Years", category: "Motor", description: "Rides a tricycle; climbs stairs alternating feet. Example: One foot per step like an adult.", completed: false, isRedFlag: false },
  { id: "3y-m2", ageRange: "3 Years", category: "Language", description: "3-word sentences. Example: 'I want juice'.", completed: false, isRedFlag: false },
  { id: "3y-m3", ageRange: "3 Years", category: "Social", description: "Takes turns in games. Example: Understands waiting for their turn.", completed: false, isRedFlag: false },
  { id: "3y-m4", ageRange: "3 Years", category: "Cognitive", description: "Make-believe play. Example: Pretends a block is a phone.", completed: false, isRedFlag: false },
  { id: "3y-rf1", ageRange: "3 Years", category: "Language", description: "Red Flag: Speech unintelligible to family. Example: Parents struggle to understand the child's needs.", completed: false, isRedFlag: true },
  { id: "3y-rf2", ageRange: "3 Years", category: "Social", description: "Red Flag: No pretend play. Example: Does not engage in imaginative play.", completed: false, isRedFlag: true },
  { id: "3y-rf3", ageRange: "3 Years", category: "Motor", description: "Red Flag: Frequent falling. Example: Falls down much more often than peers.", completed: false, isRedFlag: true },

  // 4 YEARS
  { id: "4y-m1", ageRange: "4 Years", category: "Motor", description: "Hops on one foot. Example: Can balance on one leg for a few seconds.", completed: false, isRedFlag: false },
  { id: "4y-m2", ageRange: "4 Years", category: "Language", description: "Tells a simple story. Example: Describes what happened at the park.", completed: false, isRedFlag: false },
  { id: "4y-m3", ageRange: "4 Years", category: "Social", description: "Cooperative play. Example: Plays with others to build a tower.", completed: false, isRedFlag: false },
  { id: "4y-m4", ageRange: "4 Years", category: "Cognitive", description: "Knows some colors and numbers. Example: Correct identifies 'red' or 'blue'.", completed: false, isRedFlag: false },
  { id: "4y-rf1", ageRange: "4 Years", category: "Language", description: "Red Flag: Unintelligible to strangers. Example: People outside the family cannot understand the child.", completed: false, isRedFlag: true },
  { id: "4y-rf2", ageRange: "4 Years", category: "Social", description: "Red Flag: Very withdrawn. Example: Shows no interest in playing with other children.", completed: false, isRedFlag: true },

  // 5 YEARS
  { id: "5y-m1", ageRange: "5 Years", category: "Motor", description: "Draws a person with 6 parts. Example: Head, body, arms, legs.", completed: false, isRedFlag: false },
  { id: "5y-m2", ageRange: "5 Years", category: "Language", description: "Speaks clearly using full sentences. Example: Easy for anyone to understand.", completed: false, isRedFlag: false },
  { id: "5y-rf1", ageRange: "5 Years", category: "Language", description: "Red Flag: Difficulty telling a story. Example: Cannot describe a simple sequence of events.", completed: false, isRedFlag: true },
  { id: "5y-rf2", ageRange: "5 Years", category: "Cognitive", description: "Red Flag: Unable to concentrate for 5 mins. Example: Flits between activities without finishing.", completed: false, isRedFlag: true },

  // 6 YEARS
  { id: "6y-m1", ageRange: "6 Years", category: "Motor", description: "Prints first name; copies a triangle. Example: Can write their own name clearly.", completed: false, isRedFlag: false },
  { id: "6y-m2", ageRange: "6 Years", category: "Social", description: "Distinguishes fantasy from reality. Example: Understands cartoons aren't real.", completed: false, isRedFlag: false },
  { id: "6y-rf1", ageRange: "6 Years", category: "Cognitive", description: "Red Flag: Significant literacy difficulty. Example: Cannot recognize any letters or count to 10.", completed: false, isRedFlag: true },

  // ALL AGES / CRITICAL (Consensus Safety Markers)
  { id: "loss-skills", ageRange: "All Ages", category: "Cognitive", description: "CRITICAL RED FLAG: Loss of any previously acquired skill. Example: Stopped talking or stopped walking.", completed: false, isRedFlag: true },
  { id: "global-delay", ageRange: "All Ages", category: "Cognitive", description: "CRITICAL RED FLAG: Significant delay in multiple domains (Motor, Social, Language).", completed: false, isRedFlag: true },
  { id: "sensory-concern", ageRange: "All Ages", category: "Social", description: "CRITICAL RED FLAG: Persistent parent concern about hearing or vision.", completed: false, isRedFlag: true },
];

export const MilestoneNavigator: React.FC = () => {
  const { history, updateHistory, addClinicalEvent } = useMedicalHistory();
  const [activeAge, setActiveAge] = useState('6-8 Weeks');
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<'All' | 'Motor' | 'Cognitive' | 'Social' | 'Language'>('All');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customMilestone, setCustomMilestone] = useState<Partial<Milestone>>({ description: '', category: 'Motor' });

  useEffect(() => {
    if (!history.milestones || history.milestones.length === 0) {
      updateHistory({ milestones: INITIAL_DATA });
    }
  }, [history.milestones, updateHistory]);

  const milestones = history.milestones || [];
  const ageGroups = ['6-8 Weeks', '4 Months', '6 Months', '9 Months', '12 Months', '18 Months', '2 Years', '3 Years', '4 Years', '5 Years', '6 Years', 'All Ages'];
  const domains = [
    { name: 'All', icon: '🌟' },
    { name: 'Motor', icon: '🏃' },
    { name: 'Cognitive', icon: '🧠' },
    { name: 'Social', icon: '🫂' },
    { name: 'Language', icon: '💬' }
  ];

  const completionStats = useMemo(() => {
    return ageGroups.reduce((acc, age) => {
      const group = milestones.filter(m => m.ageRange === age && !m.isRedFlag);
      const completed = group.filter(m => m.completed).length;
      acc[age] = { completed, total: group.length };
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);
  }, [milestones]);

  const toggleMilestone = (id: string) => {
    const updated = milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
    updateHistory({ milestones: updated });
    
    const item = updated.find(x => x.id === id);
    if (item?.isRedFlag && item.completed) {
      addClinicalEvent({ 
        source: 'Developmental Alert', 
        description: `Clinical Red Flag Identified (${item.ageRange}): ${item.description.split('. Example:')[0]}`, 
        date: new Date().toLocaleDateString(), 
        severity: 'High' 
      });
    }
  };

  const updateNotes = (id: string, notes: string) => {
    const updated = milestones.map(m => m.id === id ? { ...m, notes } : m);
    updateHistory({ milestones: updated });
  };

  const handleAddCustom = () => {
    if (!customMilestone.description) return;
    const newM: Milestone = {
      id: crypto.randomUUID(),
      ageRange: activeAge,
      category: customMilestone.category as any,
      description: customMilestone.description,
      completed: true,
      isRedFlag: false,
      notes: ''
    };
    updateHistory({ milestones: [...milestones, newM] });
    setCustomMilestone({ description: '', category: 'Motor' });
    setShowAddCustom(false);
  };

  const filteredData = useMemo(() => {
    return milestones.filter(m => 
      m.ageRange === activeAge && 
      m.isRedFlag === showRedFlags &&
      (selectedDomain === 'All' || m.category === selectedDomain)
    );
  }, [milestones, activeAge, showRedFlags, selectedDomain]);

  const CategoryBadge = ({ category }: { category: string }) => {
    const domain = domains.find(d => d.name === category);
    const colors: Record<string, string> = {
      Motor: 'bg-blue-50 text-blue-600 border-blue-100',
      Language: 'bg-purple-50 text-purple-600 border-purple-100',
      Social: 'bg-pink-50 text-pink-600 border-pink-100',
      Cognitive: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${colors[category] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
        <span>{domain?.icon}</span>
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Mobile-Optimized Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#FBFBFE]/95 backdrop-blur-xl border-b border-slate-100 px-4 py-4 -mx-4 md:static md:bg-transparent md:border-none md:p-0 md:m-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-xl shadow-lg rotate-[-3deg]">✨</div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">Milestone <span className="text-teal-600">Sync</span></h2>
          </div>
          <button 
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="bg-teal-50 text-teal-600 p-2.5 rounded-xl border border-teal-100 shadow-sm active:scale-95 transition-all"
            title="Add Observation"
          >
            {showAddCustom ? <span className="text-sm font-black">Cancel</span> : <span className="text-xl">➕</span>}
          </button>
        </div>
      </header>

      {/* Quick Source Link */}
      <div className="px-4 flex flex-wrap items-center gap-2">
        <p className="text-slate-400 text-[10px] font-bold italic">Standardized Clinical Markers</p>
        <div className="flex gap-1.5">
          <a href="https://www.childrens.health.qld.gov.au/..." target="_blank" className="text-[8px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-widest border border-teal-100">QCH Flags ↗</a>
          <a href="https://www.pedscases.com/..." target="_blank" className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">PedsCases ↗</a>
        </div>
      </div>

      {/* Floating Entry Panel */}
      {showAddCustom && (
        <div className="fixed inset-x-4 top-20 z-[60] bg-white p-6 rounded-[2.5rem] border-2 border-teal-100 shadow-2xl animate-in slide-in-from-top-4 space-y-6 md:relative md:top-0 md:inset-x-0 md:bg-teal-50/50">
           <h3 className="text-lg font-black text-teal-900 italic tracking-tight">Log Private Observation for {activeAge}</h3>
           <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-teal-600 uppercase tracking-widest ml-3">Observation</label>
                <input 
                  placeholder="e.g. Points to birds, says 'Dada'..." 
                  value={customMilestone.description}
                  onChange={e => setCustomMilestone({...customMilestone, description: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white border-2 border-teal-200 font-black text-slate-900 outline-none shadow-inner focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-teal-600 uppercase tracking-widest ml-3">Category</label>
                <select 
                  value={customMilestone.category}
                  onChange={e => setCustomMilestone({...customMilestone, category: e.target.value as any})}
                  className="w-full p-4 rounded-xl bg-white border-2 border-teal-200 font-black text-slate-900 outline-none shadow-inner appearance-none"
                >
                  <option>Motor</option>
                  <option>Social</option>
                  <option>Language</option>
                  <option>Cognitive</option>
                </select>
              </div>
              <button onClick={handleAddCustom} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Synchronize ✨</button>
           </div>
        </div>
      )}

      {/* Age Horizontal Selection */}
      <nav className="overflow-x-auto no-scrollbar py-2 -mx-4 px-4 bg-[#FBFBFE]">
        <div className="flex gap-2 min-w-max">
          {ageGroups.map(age => {
            const stats = completionStats[age] || { completed: 0, total: 0 };
            const isActive = activeAge === age;
            const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
            return (
              <button 
                key={age} 
                onClick={() => setActiveAge(age)} 
                className={`relative px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all overflow-hidden border-2 ${
                  isActive 
                    ? 'bg-teal-600 text-white border-teal-600 shadow-lg scale-105' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-teal-100'
                }`}
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span>{age}</span>
                  {stats.total > 0 && <span className="opacity-60 text-[8px]">{stats.completed}/{stats.total}</span>}
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 h-1 bg-teal-300 opacity-50 transition-all duration-700" style={{ width: `${progress}%` }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Filter Segmented Control */}
      <div className="px-4 space-y-4">
         <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button onClick={() => setShowRedFlags(false)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${!showRedFlags ? 'bg-white text-teal-700 shadow-md' : 'text-slate-400'}`}>Standard Progress</button>
            <button onClick={() => setShowRedFlags(true)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${showRedFlags ? 'bg-rose-900 text-white shadow-md' : 'text-slate-400'}`}>Clinical Red Flags</button>
         </div>

         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {domains.map(d => (
              <button 
                key={d.name} 
                onClick={() => setSelectedDomain(d.name as any)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 flex items-center gap-2 ${selectedDomain === d.name ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-50 text-slate-400'}`}
              >
                <span>{d.icon}</span>
                {d.name}
              </button>
            ))}
         </div>
      </div>

      {/* Card Grid - Adaptive Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 animate-in slide-in-from-bottom-4">
        {filteredData.length > 0 ? filteredData.map(m => {
          const parts = m.description.split('. Example:');
          const title = parts[0];
          const example = parts[1];

          return (
            <div 
              key={m.id}
              className={`rounded-[2rem] border-2 transition-all flex flex-col group ${
                m.completed 
                  ? (showRedFlags ? 'bg-rose-100 border-rose-900 shadow-rose-200 shadow-lg' : 'bg-emerald-50 border-emerald-300 shadow-md') 
                  : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="p-5 flex flex-col h-full gap-4 relative overflow-hidden">
                {showRedFlags && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/20 rotate-45 translate-x-10 -translate-y-10"></div>
                )}

                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col gap-2">
                    <CategoryBadge category={m.category} />
                    {m.isRedFlag && (
                        <span className="bg-rose-800 text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit shadow-sm">Urgent Alert</span>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleMilestone(m.id)}
                    className={`w-11 h-11 rounded-[1rem] border-2 flex items-center justify-center transition-all z-10 ${
                      m.completed 
                        ? (showRedFlags ? 'bg-rose-900 border-white text-white rotate-[360deg] shadow-lg' : 'bg-emerald-600 border-white text-white rotate-[360deg] shadow-lg') 
                        : 'bg-slate-50 border-slate-100 text-slate-200 hover:border-teal-200 active:scale-90 shadow-inner'
                    }`}
                  >
                    {m.completed ? <span className="font-black text-xl">✓</span> : null}
                  </button>
                </div>
                
                <div className="flex-1 space-y-3 z-10">
                  <p className={`text-lg font-black leading-tight tracking-tight italic ${showRedFlags ? 'text-rose-950 underline decoration-rose-300' : 'text-slate-800'}`}>
                    {title}
                  </p>
                  {example && (
                    <div className={`p-3 rounded-2xl border ${showRedFlags ? 'bg-white/40 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-[10px] font-bold italic leading-snug ${showRedFlags ? 'text-rose-800' : 'text-slate-500'}`}>
                        "{example}"
                        </p>
                    </div>
                  )}
                </div>

                <div className={`pt-4 border-t z-10 space-y-2 ${showRedFlags ? 'border-rose-200' : 'border-slate-100'}`}>
                   <label className={`text-[8px] font-black uppercase tracking-widest ml-2 ${showRedFlags ? 'text-rose-400' : 'text-slate-400'}`}>Journal Entry</label>
                   <textarea 
                    value={m.notes || ''}
                    onChange={e => updateNotes(m.id, e.target.value)}
                    placeholder="Capture the moment..."
                    className={`w-full h-20 p-4 rounded-2xl border font-bold italic text-xs outline-none focus:ring-2 transition-all shadow-inner resize-none ${
                        showRedFlags ? 'bg-white/60 border-rose-100 focus:ring-rose-100 text-rose-900' : 'bg-white/50 border-slate-50 focus:ring-teal-100/50 text-slate-600'
                    }`}
                   />
                </div>

                {m.isRedFlag && !m.completed && (
                  <div className="flex items-center gap-2 text-rose-600 font-black text-[8px] uppercase tracking-widest pt-2 border-t border-rose-200 bg-rose-50/80 p-4 rounded-2xl z-10">
                    <span className="text-xl animate-pulse">🚨</span>
                    <span className="leading-tight">Clinical Action Recommended if Observed.</span>
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center opacity-60">
            <span className="text-6xl mb-6 grayscale">🌱</span>
            <div className="max-w-xs space-y-1">
                <p className="font-black text-sm uppercase tracking-widest text-slate-500">No matching markers</p>
                <p className="text-[10px] text-slate-400 font-bold italic">Try a different domain filter.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Expert Insight (Mobile Optimized) */}
      <div className="px-4">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col gap-6 shadow-xl relative overflow-hidden border-b-[12px] border-slate-950">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-indigo-600 rounded-full opacity-10 blur-3xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-white/10 shadow-inner">📜</div>
            <h4 className="text-xl font-black italic uppercase tracking-tighter text-indigo-100 leading-none">Clinical Consensus</h4>
          </div>
          <p className="text-indigo-50/70 text-sm font-medium italic leading-relaxed relative z-10">
            "Developmental red flags represent high-specificity indicators for pediatric review. Loss of any previously acquired skill is an absolute red flag requiring urgent evaluation."
          </p>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 pt-4 border-t border-white/5">PediPulse Pipeline • QCH + PedsCases</p>
        </div>
      </div>
    </div>
  );
};
