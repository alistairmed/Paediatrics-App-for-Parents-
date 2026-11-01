
import React, { useState, useMemo, useEffect } from 'react';
import { Milestone } from '../types';
import { useMedicalHistory } from '../context/MedicalHistoryContext';
import { RCH_FACT_SHEETS } from '../clinical/factSheets';

export const INITIAL_DATA: Milestone[] = [
  // 6-8 WEEKS
  { id: "6w-m1", ageRange: "6-8 Weeks", category: "Motor", description: "Lifts head briefly when prone. Example: Can clear chin from the floor for a few seconds.", completed: false, isRedFlag: false },
  { id: "6w-m2", ageRange: "6-8 Weeks", category: "Social", description: "Responsive social smile. Example: Smiles back when you talk to or smile at them.", completed: false, isRedFlag: false },
  { id: "6w-m3", ageRange: "6-8 Weeks", category: "Language", description: "Coos and makes gurgling sounds. Example: Makes 'ooh' and 'aah' noises when you talk.", completed: false, isRedFlag: false },
  { id: "6w-m4", ageRange: "6-8 Weeks", category: "Cognitive", description: "Watches faces and follows with eyes. Example: Tracks your face briefly as you move.", completed: false, isRedFlag: false },
  { id: "6w-rf1", ageRange: "6-8 Weeks", category: "Motor", description: "Persistent fisting. Example: Hands stay clenched in a tight fist most of the time.", completed: false, isRedFlag: true },
  { id: "6w-rf2", ageRange: "6-8 Weeks", category: "Motor", description: "Floppy or Stiff. Example: Feels unusually 'loose' or 'hard' like a board when handled.", completed: false, isRedFlag: true },
  { id: "6w-rf3", ageRange: "6-8 Weeks", category: "Social", description: "No social smile by 8 weeks. Example: Does not smile back at caregivers.", completed: false, isRedFlag: true },
  { id: "6w-rf4", ageRange: "6-8 Weeks", category: "Language", description: "Not startled by noises. Example: Shows no reaction to sudden loud sounds.", completed: false, isRedFlag: true },
  { id: "6w-rf5", ageRange: "6-8 Weeks", category: "Cognitive", description: "Vision concern. Example: Persistent squint or not following a face with eyes.", completed: false, isRedFlag: true },

  // 4 MONTHS
  { id: "4m-m1", ageRange: "4 Months", category: "Motor", description: "Holds head steady, unsupported. Example: No longer 'bobbles' when being held upright.", completed: false, isRedFlag: false },
  { id: "4m-m2", ageRange: "4 Months", category: "Motor", description: "Reaches for objects; grasps a rattle. Example: Tries to grab a toy hanging in front of them.", completed: false, isRedFlag: false },
  { id: "4m-m3", ageRange: "4 Months", category: "Language", description: "Laughs out loud. Example: Makes happy squealing sounds.", completed: false, isRedFlag: false },
  { id: "4m-m4", ageRange: "4 Months", category: "Social", description: "Turns head to sounds. Example: Looks toward a voice or rattle sound.", completed: false, isRedFlag: false },
  { id: "4m-rf1", ageRange: "4 Months", category: "Motor", description: "Significant head lag. Example: Head drops back when being pulled to sit.", completed: false, isRedFlag: true },
  { id: "4m-rf2", ageRange: "4 Months", category: "Social", description: "Not smiling at people. Example: Rarely or never makes eye contact or smiles at caregivers.", completed: false, isRedFlag: true },
  { id: "4m-rf3", ageRange: "4 Months", category: "Language", description: "Not babbling. Example: Not making cooing sounds or responding to voices.", completed: false, isRedFlag: true },

  // 6 MONTHS
  { id: "6m-m1", ageRange: "6 Months", category: "Motor", description: "Rolls over in both directions. Example: From tummy to back and back to tummy.", completed: false, isRedFlag: false },
  { id: "6m-m2", ageRange: "6 Months", category: "Motor", description: "Transfers objects between hands. Example: Moves a toy from one hand to the other.", completed: false, isRedFlag: false },
  { id: "6m-m3", ageRange: "6 Months", category: "Language", description: "Babbles with consonants (ba, da, ga). Example: Strings sounds together like 'bababa'.", completed: false, isRedFlag: false },
  { id: "6m-m4", ageRange: "6 Months", category: "Social", description: "Knows familiar faces. Example: Reaches out to be picked up by a parent.", completed: false, isRedFlag: false },
  { id: "6m-rf1", ageRange: "6 Months", category: "Motor", description: "Hand preference. Example: Consistently uses only one hand for all reaching; other hand stays still.", completed: false, isRedFlag: true },
  { id: "6m-rf2", ageRange: "6 Months", category: "Language", description: "Not turning to sounds. Example: No reaction when you speak from behind them.", completed: false, isRedFlag: true },
  { id: "6m-rf3", ageRange: "6 Months", category: "Social", description: "No smiles or squeals. Example: Does not show outward signs of joy or social engagement.", completed: false, isRedFlag: true },

  // 9 MONTHS
  { id: "9m-m1", ageRange: "9 Months", category: "Motor", description: "Sits without support. Example: Can play with a toy while sitting on the floor.", completed: false, isRedFlag: false },
  { id: "9m-m2", ageRange: "9 Months", category: "Social", description: "Stranger anxiety begins. Example: Clings to familiar adults when new people are around.", completed: false, isRedFlag: false },
  { id: "9m-m3", ageRange: "9 Months", category: "Language", description: "Understands 'No'. Example: Briefly stops what they are doing when you say no.", completed: false, isRedFlag: false },
  { id: "9m-m4", ageRange: "9 Months", category: "Cognitive", description: "Plays Peek-a-boo. Example: Enjoys interactive games where items disappear.", completed: false, isRedFlag: false },
  { id: "9m-rf1", ageRange: "9 Months", category: "Motor", description: "Not sitting independently. Example: Slumps over immediately if not supported.", completed: false, isRedFlag: true },
  { id: "9m-rf2", ageRange: "9 Months", category: "Social", description: "No back-and-forth play. Example: Doesn't respond to peek-a-boo or imitate sounds.", completed: false, isRedFlag: true },
  { id: "9m-rf3", ageRange: "9 Months", category: "Language", description: "Not responding to name. Example: Doesn't look around when called.", completed: false, isRedFlag: true },

  // 12 MONTHS
  { id: "12m-m1", ageRange: "12 Months", category: "Motor", description: "Pulls up to stand and 'cruises'. Example: Walks while holding furniture.", completed: false, isRedFlag: false },
  { id: "12m-m2", ageRange: "12 Months", category: "Motor", description: "Fine pincer grasp. Example: Picks up a single pea with tips of fingers.", completed: false, isRedFlag: false },
  { id: "12m-m3", ageRange: "12 Months", category: "Language", description: "1-3 specific words. Example: Uses 'Dada' or 'Mama' correctly for parents.", completed: false, isRedFlag: false },
  { id: "12m-m4", ageRange: "12 Months", category: "Social", description: "Points to show interest. Example: Points at a bird to get your attention.", completed: false, isRedFlag: false },
  { id: "12m-rf1", ageRange: "12 Months", category: "Social", description: "No pointing or waving. Example: Does not use gestures to communicate.", completed: false, isRedFlag: true },
  { id: "12m-rf2", ageRange: "12 Months", category: "Language", description: "No words. Example: Has no recognizable single words like 'cat' or 'juice'.", completed: false, isRedFlag: true },
  { id: "12m-rf3", ageRange: "12 Months", category: "Motor", description: "Not pulling to stand. Example: Does not try to stand even with support.", completed: false, isRedFlag: true },

  // 18 MONTHS
  { id: "18m-m1", ageRange: "18 Months", category: "Motor", description: "Walks alone independently. Example: Walks across a room without holding on.", completed: false, isRedFlag: false },
  { id: "18m-m2", ageRange: "18 Months", category: "Language", description: "Says several single words (10-25). Example: Names common objects like 'ball' or 'milk'.", completed: false, isRedFlag: false },
  { id: "18m-m3", ageRange: "18 Months", category: "Social", description: "Simple pretend play. Example: Pretends to feed a doll.", completed: false, isRedFlag: false },
  { id: "18m-m4", ageRange: "18 Months", category: "Cognitive", description: "Follows 1-step commands. Example: 'Give me the toy'.", completed: false, isRedFlag: false },
  { id: "18m-rf1", ageRange: "18 Months", category: "Motor", description: "Not walking independently. Example: Still needs hand-holding to take steps.", completed: false, isRedFlag: true },
  { id: "18m-rf2", ageRange: "18 Months", category: "Language", description: "Less than 6–10 words. Example: Vocabulary is extremely limited for this age.", completed: false, isRedFlag: true },
  { id: "18m-rf3", ageRange: "18 Months", category: "Social", description: "No joint attention. Example: Doesn't look where you point or show you things.", completed: false, isRedFlag: true },
  { id: "18m-rf4", ageRange: "18 Months", category: "Cognitive", description: "Not following instructions. Example: Fails to understand simple requests like 'Come here'.", completed: false, isRedFlag: true },

  // 2 YEARS
  { id: "2y-m1", ageRange: "2 Years", category: "Motor", description: "Kicks a ball; runs well. Example: Can swing leg to kick a stationary ball.", completed: false, isRedFlag: false },
  { id: "2y-m2", ageRange: "2 Years", category: "Language", description: "Says 2-word phrases. Example: 'More milk' or 'Doggy bark'.", completed: false, isRedFlag: false },
  { id: "2y-m3", ageRange: "2 Years", category: "Social", description: "Parallel play. Example: Plays near other children happily.", completed: false, isRedFlag: false },
  { id: "2y-m4", ageRange: "2 Years", category: "Cognitive", description: "Follows 2-step commands. Example: 'Get your shoes and put them on'.", completed: false, isRedFlag: false },
  { id: "2y-rf1", ageRange: "2 Years", category: "Language", description: "Less than 50 words. Example: Very limited vocabulary for a 2-year-old.", completed: false, isRedFlag: true },
  { id: "2y-rf2", ageRange: "2 Years", category: "Language", description: "No 2-word phrases. Example: Only uses single words to communicate.", completed: false, isRedFlag: true },
  { id: "2y-rf3", ageRange: "2 Years", category: "Social", description: "Poor eye contact. Example: Rarely looks you in the eye during requests.", completed: false, isRedFlag: true },
  { id: "2y-rf4", ageRange: "2 Years", category: "Social", description: "No interest in others. Example: Doesn't notice or want to play near other children.", completed: false, isRedFlag: true },

  // 3 YEARS
  { id: "3y-m1", ageRange: "3 Years", category: "Motor", description: "Rides a tricycle; climbs stairs alternating feet. Example: One foot per step like an adult.", completed: false, isRedFlag: false },
  { id: "3y-m2", ageRange: "3 Years", category: "Language", description: "3-word sentences. Example: 'I want juice'.", completed: false, isRedFlag: false },
  { id: "3y-m3", ageRange: "3 Years", category: "Social", description: "Takes turns in games. Example: Understands waiting for their turn.", completed: false, isRedFlag: false },
  { id: "3y-m4", ageRange: "3 Years", category: "Cognitive", description: "Make-believe play. Example: Pretends a block is a phone.", completed: false, isRedFlag: false },
  { id: "3y-rf1", ageRange: "3 Years", category: "Language", description: "Speech unintelligible to family. Example: Parents struggle to understand the child's needs.", completed: false, isRedFlag: true },
  { id: "3y-rf2", ageRange: "3 Years", category: "Social", description: "No pretend play. Example: Does not engage in imaginative play.", completed: false, isRedFlag: true },
  { id: "3y-rf3", ageRange: "3 Years", category: "Motor", description: "Frequent falling. Example: Falls down much more often than peers.", completed: false, isRedFlag: true },

  // 4 YEARS
  { id: "4y-m1", ageRange: "4 Years", category: "Motor", description: "Hops on one foot. Example: Can balance on one leg for a few seconds.", completed: false, isRedFlag: false },
  { id: "4y-m2", ageRange: "4 Years", category: "Language", description: "Tells a simple story. Example: Describes what happened at the park.", completed: false, isRedFlag: false },
  { id: "4y-m3", ageRange: "4 Years", category: "Social", description: "Cooperative play. Example: Plays with others to build a tower.", completed: false, isRedFlag: false },
  { id: "4y-m4", ageRange: "4 Years", category: "Cognitive", description: "Knows some colors and numbers. Example: Correct identifies 'red' or 'blue'.", completed: false, isRedFlag: false },
  { id: "4y-rf1", ageRange: "4 Years", category: "Language", description: "Unintelligible to strangers. Example: People outside the family cannot understand the child.", completed: false, isRedFlag: true },
  { id: "4y-rf2", ageRange: "4 Years", category: "Social", description: "Very withdrawn. Example: Shows no interest in playing with other children.", completed: false, isRedFlag: true },

  // 5 YEARS
  { id: "5y-m1", ageRange: "5 Years", category: "Motor", description: "Draws a person with 6 parts. Example: Head, body, arms, legs.", completed: false, isRedFlag: false },
  { id: "5y-m2", ageRange: "5 Years", category: "Language", description: "Speaks clearly using full sentences. Example: Easy for anyone to understand.", completed: false, isRedFlag: false },
  { id: "5y-rf1", ageRange: "5 Years", category: "Language", description: "Difficulty telling a story. Example: Cannot describe a simple sequence of events.", completed: false, isRedFlag: true },
  { id: "5y-rf2", ageRange: "5 Years", category: "Cognitive", description: "Unable to concentrate for 5 mins. Example: Flits between activities without finishing.", completed: false, isRedFlag: true },

  // 6 YEARS
  { id: "6y-m1", ageRange: "6 Years", category: "Motor", description: "Prints first name; copies a triangle. Example: Can write their own name clearly.", completed: false, isRedFlag: false },
  { id: "6y-m2", ageRange: "6 Years", category: "Social", description: "Distinguishes fantasy from reality. Example: Understands cartoons aren't real.", completed: false, isRedFlag: false },
  { id: "6y-rf1", ageRange: "6 Years", category: "Cognitive", description: "Significant literacy difficulty. Example: Cannot recognize any letters or count to 10.", completed: false, isRedFlag: true },

  // ALL AGES
  { id: "loss-skills", ageRange: "All Ages", category: "Cognitive", description: "Loses skills they used to have. Example: Stops saying words they used to say, or stops walking.", completed: false, isRedFlag: true },
  { id: "global-delay", ageRange: "All Ages", category: "Cognitive", description: "Seems behind in several areas, such as movement, play and talking.", completed: false, isRedFlag: true },
  { id: "sensory-concern", ageRange: "All Ages", category: "Social", description: "You keep wondering about their hearing or vision.", completed: false, isRedFlag: true },
];

/**
 * Brings a saved milestone list up to date with INITIAL_DATA: refreshes the
 * built-in items' text, adds new ones, and keeps what the parent ticked and
 * wrote, plus any milestones they added themselves.
 */
export function syncMilestones(saved: Milestone[]): Milestone[] {
  const byId = new Map(saved.map(m => [m.id, m]));
  const builtIn = INITIAL_DATA.map(item => {
    const old = byId.get(item.id);
    return old ? { ...item, completed: old.completed, notes: old.notes } : item;
  });
  const builtInIds = new Set(INITIAL_DATA.map(m => m.id));
  return [...builtIn, ...saved.filter(m => !builtInIds.has(m.id))];
}

export const MilestoneNavigator: React.FC = () => {
  const { history, updateHistory, addClinicalEvent } = useMedicalHistory();
  const [activeAge, setActiveAge] = useState('6-8 Weeks');
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<'All' | 'Motor' | 'Cognitive' | 'Social' | 'Language'>('All');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customMilestone, setCustomMilestone] = useState<Partial<Milestone>>({ description: '', category: 'Motor' });

  // Saved lists keep a copy of each item's text: bring built-in items up to date
  // (keeping what the parent ticked and wrote) and keep any they added.
  useEffect(() => {
    const synced = syncMilestones(history.milestones || []);
    if (JSON.stringify(synced) !== JSON.stringify(history.milestones || [])) updateHistory({ milestones: synced });
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
        source: 'Milestones',
        description: `Noted to discuss with the GP (${item.ageRange}): ${item.description.split('. Example:')[0]}`,
        date: new Date().toLocaleDateString('en-AU'),
        severity: 'Low'
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
      Social: 'bg-pink-50 text-pink-700 border-pink-100',
      Cognitive: 'bg-amber-50 text-amber-700 border-amber-100',
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-xs flex items-center gap-1.5 ${colors[category] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
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
             <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center text-xl shadow-lg -rotate-3">✨</div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Milestone <span className="text-teal-700">Sync</span></h2>
          </div>
          <button aria-label={showAddCustom ? 'Cancel adding a milestone' : 'Add a milestone'} 
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="bg-teal-50 text-teal-700 p-2.5 rounded-xl border border-teal-100 shadow-xs active:scale-95 transition-all"
            title="Add Observation"
          >
            {showAddCustom ? <span className="text-sm font-black">Cancel</span> : <span className="text-xl">➕</span>}
          </button>
        </div>
      </header>

      {/* Quick Source Link */}
      <div className="px-4 flex flex-wrap items-center gap-2">
        <p className="text-slate-700 text-sm font-bold">A guide to typical development. Every child develops at their own pace.</p>
        <a href={RCH_FACT_SHEETS.all.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-sm uppercase tracking-widest border border-teal-100">RCH Kids Health Info ↗</a>
      </div>

      {/* Floating Entry Panel */}
      {showAddCustom && (
        <div className="fixed inset-x-4 top-20 z-60 bg-white p-6 rounded-[2.5rem] border-2 border-teal-100 shadow-2xl animate-in slide-in-from-top-4 space-y-6 md:relative md:top-0 md:inset-x-0 md:bg-teal-50/50">
           <h3 className="text-lg font-black text-teal-900 tracking-tight">Log Private Observation for {activeAge}</h3>
           <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="milest-observation" className="text-xs font-black text-teal-700 uppercase tracking-widest ml-3">Observation</label>
                <input id="milest-observation" 
                  placeholder="e.g. Points to birds, says 'Dada'..." 
                  value={customMilestone.description}
                  onChange={e => setCustomMilestone({...customMilestone, description: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white border-2 border-teal-200 font-black text-slate-900 outline-hidden shadow-inner focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="milest-category" className="text-xs font-black text-teal-700 uppercase tracking-widest ml-3">Category</label>
                <select id="milest-category" 
                  value={customMilestone.category}
                  onChange={e => setCustomMilestone({...customMilestone, category: e.target.value as any})}
                  className="w-full p-4 rounded-xl bg-white border-2 border-teal-200 font-black text-slate-900 outline-hidden shadow-inner appearance-none"
                >
                  <option>Motor</option>
                  <option>Social</option>
                  <option>Language</option>
                  <option>Cognitive</option>
                </select>
              </div>
              <button onClick={handleAddCustom} className="w-full py-4 bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Synchronize ✨</button>
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
                className={`relative px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all overflow-hidden border-2 ${
                  isActive 
                    ? 'bg-teal-700 text-white border-teal-600 shadow-lg scale-105' 
                    : 'bg-white text-slate-600 border-slate-100 hover:border-teal-100'
                }`}
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span>{age}</span>
                  {stats.total > 0 && <span className="text-xs">{stats.completed}/{stats.total}</span>}
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
            <button onClick={() => setShowRedFlags(false)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!showRedFlags ? 'bg-white text-teal-700 shadow-md' : 'text-slate-600'}`}>Standard Progress</button>
            <button onClick={() => setShowRedFlags(true)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${showRedFlags ? 'bg-amber-800 text-white shadow-md' : 'text-slate-600'}`}>Things to Discuss</button>
         </div>

         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {domains.map(d => (
              <button 
                key={d.name} 
                onClick={() => setSelectedDomain(d.name as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 flex items-center gap-2 ${selectedDomain === d.name ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-50 text-slate-600'}`}
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
              className={`rounded-4xl border-2 transition-all flex flex-col group ${
                m.completed 
                  ? (showRedFlags ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-emerald-50 border-emerald-300 shadow-md') 
                  : 'bg-white border-slate-100 shadow-xs'
              }`}
            >
              <div className="p-5 flex flex-col h-full gap-4 relative overflow-hidden">
                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col gap-2">
                    <CategoryBadge category={m.category} />
                    {m.isRedFlag && (
                        <span className="bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit">To discuss</span>
                    )}
                  </div>
                  <button aria-label={m.completed ? `Mark "${m.description}" as not done` : `Mark "${m.description}" as done`} 
                    onClick={() => toggleMilestone(m.id)}
                    className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center transition-all z-10 ${
                      m.completed 
                        ? (showRedFlags ? 'bg-amber-800 border-white text-white rotate-360 shadow-lg' : 'bg-emerald-700 border-white text-white rotate-360 shadow-lg') 
                        : 'bg-slate-50 border-slate-100 text-slate-200 hover:border-teal-200 active:scale-90 shadow-inner'
                    }`}
                  >
                    {m.completed ? <span className="font-black text-xl">✓</span> : null}
                  </button>
                </div>
                
                <div className="flex-1 space-y-3 z-10">
                  <p className={`text-lg font-black leading-tight tracking-tight  ${showRedFlags ? 'text-amber-950' : 'text-slate-800'}`}>
                    {title}
                  </p>
                  {example && (
                    <div className={`p-3 rounded-2xl border ${showRedFlags ? 'bg-white/60 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-xs font-bold  leading-snug ${showRedFlags ? 'text-amber-900' : 'text-slate-600'}`}>
                        "{example}"
                        </p>
                    </div>
                  )}
                </div>

                <div className={`pt-4 border-t z-10 space-y-2 ${showRedFlags ? 'border-amber-200' : 'border-slate-100'}`}>
                   <label className={`text-xs font-black uppercase tracking-widest ml-2 ${showRedFlags ? 'text-amber-900' : 'text-slate-600'}`}>Journal Entry</label>
                   <textarea 
                    value={m.notes || ''}
                    onChange={e => updateNotes(m.id, e.target.value)}
                    placeholder="Capture the moment..."
                    className={`w-full h-20 p-4 rounded-2xl border font-bold  text-xs outline-hidden focus:ring-2 transition-all shadow-inner resize-none ${
                        showRedFlags ? 'bg-white/60 border-amber-100 focus:ring-amber-100 text-amber-950' : 'bg-white/50 border-slate-50 focus:ring-teal-100/50 text-slate-600'
                    }`}
                   />
                </div>

                {m.isRedFlag && !m.completed && (
                  <p className="text-amber-950 font-bold text-sm pt-2 border-t border-amber-200 bg-amber-50 p-4 rounded-2xl z-10">
                    If you notice this, tick it and mention it to your GP or child health nurse.
                  </p>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
            <span className="text-6xl mb-6 grayscale">🌱</span>
            <div className="max-w-xs space-y-1">
                <p className="font-black text-sm uppercase tracking-widest text-slate-500">No matching markers</p>
                <p className="text-xs text-slate-600 font-bold">Try a different domain filter.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Expert Insight (Mobile Optimized) */}
      <div className="px-4">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col gap-6 shadow-xl relative overflow-hidden border-b-12 border-slate-950">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-indigo-600 rounded-full opacity-10 blur-3xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-white/10 shadow-inner">📜</div>
            <h4 className="text-xl font-black uppercase tracking-tighter text-indigo-100 leading-none">About milestones</h4>
          </div>
          <p className="text-indigo-50 text-sm font-medium leading-relaxed relative z-10">
            Milestones are a guide, not a test, and every child develops at their own pace. If your child stops doing things they could do before,
            or you're worried about their hearing, vision, movement, speech or play, talk to your GP or child health nurse. They can also do the checks in your child's Red Book.
          </p>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300 pt-4 border-t border-white/5">General information, not a diagnosis</p>
        </div>
      </div>
    </div>
  );
};
