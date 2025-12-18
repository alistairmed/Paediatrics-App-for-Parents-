
import React, { useState, useMemo } from 'react';
import { Milestone } from '../types';

interface MilestoneNavigatorProps {
  onLogRedFlag?: (description: string) => void;
}

const INITIAL_DATA: Milestone[] = [
  // 6-8 WEEKS
  { id: "6w-m1", ageRange: "6-8 Weeks", category: "Motor", description: "Lifts head briefly. Example: When lying on their tummy, they can clear their chin from the floor for a few seconds.", completed: false, isRedFlag: false },
  { id: "6w-l1", ageRange: "6-8 Weeks", category: "Language", description: "Coos and gurgles. Example: Making little \"ooh\" and \"aah\" sounds when you talk to them.", completed: false, isRedFlag: false },
  { id: "6w-s1", ageRange: "6-8 Weeks", category: "Social", description: "Social Smile. Example: Giving a real, intentional smile back at you when you smile or talk high-pitched to them.", completed: false, isRedFlag: false },
  { id: "6w-c1", ageRange: "6-8 Weeks", category: "Cognitive", description: "Watches faces. Example: They focus their eyes on your face and might follow you briefly as you move.", completed: false, isRedFlag: false },
  { id: "6w-rf-m1", ageRange: "6-8 Weeks", category: "Motor", description: "Concern: Unusually floppy or very stiff. Example: Their head falls back completely with no control, or their limbs are hard to move.", completed: false, isRedFlag: true },
  { id: "6w-rf-l1", ageRange: "6-8 Weeks", category: "Language", description: "Concern: No vocalizations. Example: The baby is unusually quiet and does not make cooing sounds by 8 weeks.", completed: false, isRedFlag: true },
  { id: "6w-rf-s1", ageRange: "6-8 Weeks", category: "Social", description: "Concern: No social smile. Example: Does not smile back at people by 8 weeks of age.", completed: false, isRedFlag: true },
  { id: "6w-rf-c1", ageRange: "6-8 Weeks", category: "Cognitive", description: "Concern: Poor eye contact. Example: Does not look at your face or follow a moving toy with their eyes.", completed: false, isRedFlag: true },

  // 4 MONTHS
  { id: "4m-m1", ageRange: "4 Months", category: "Motor", description: "Steady head. Example: Holds head upright without support when being held or sitting with help.", completed: false, isRedFlag: false },
  { id: "4m-l1", ageRange: "4 Months", category: "Language", description: "Laughs aloud. Example: Making a clear \"ha-ha\" sound when tickled or playing.", completed: false, isRedFlag: false },
  { id: "4m-s1", ageRange: "4 Months", category: "Social", description: "Copies expressions. Example: They might frown if you frown or smile back excitedly.", completed: false, isRedFlag: false },
  { id: "4m-c1", ageRange: "4 Months", category: "Cognitive", description: "Reaches for toys. Example: Swings their arm towards a dangling toy and tries to grab it.", completed: false, isRedFlag: false },
  { id: "4m-rf-m1", ageRange: "4 Months", category: "Motor", description: "Concern: Persistent head lag. Example: When pulled from lying to sitting, the head still flops backward significantly.", completed: false, isRedFlag: true },
  { id: "4m-rf-l1", ageRange: "4 Months", category: "Language", description: "Concern: Does not coo or babble. Example: They aren't making a variety of sounds or responding to noises.", completed: false, isRedFlag: true },
  { id: "4m-rf-s1", ageRange: "4 Months", category: "Social", description: "Concern: Uninterested in people. Example: Doesn't seem to notice or care when someone enters the room.", completed: false, isRedFlag: true },
  { id: "4m-rf-c1", ageRange: "4 Months", category: "Cognitive", description: "Concern: Not bringing hands to mouth. Example: They haven't started the stage of sucking on fingers or toys for exploration.", completed: false, isRedFlag: true },

  // 6 MONTHS
  { id: "6m-m1", ageRange: "6 Months", category: "Motor", description: "Rolls over. Example: Moving from their tummy to their back, or back to tummy.", completed: false, isRedFlag: false },
  { id: "6m-l1", ageRange: "6 Months", category: "Language", description: "Strings vowels together. Example: \"ah-eh-oh\" sounds and taking turns \"talking\" with you.", completed: false, isRedFlag: false },
  { id: "6m-s1", ageRange: "6 Months", category: "Social", description: "Knows familiar faces. Example: Excitedly recognizes parents/caregivers and may be wary of strangers.", completed: false, isRedFlag: false },
  { id: "6m-c1", ageRange: "6 Months", category: "Cognitive", description: "Passes things from hand to hand. Example: Holding a block in one hand and moving it to the other.", completed: false, isRedFlag: false },
  { id: "6m-rf-m1", ageRange: "6 Months", category: "Motor", description: "Concern: Cannot sit with support. Example: Slumps over immediately even when propped up with pillows.", completed: false, isRedFlag: true },
  { id: "6m-rf-l1", ageRange: "6 Months", category: "Language", description: "Concern: No vowel sounds. Example: They aren't making \"ah\", \"ee\", or \"oh\" sounds.", completed: false, isRedFlag: true },
  { id: "6m-rf-s1", ageRange: "6 Months", category: "Social", description: "Concern: No eye contact. Example: They avoid looking at you during feeding or play.", completed: false, isRedFlag: true },
  { id: "6m-rf-c1", ageRange: "6 Months", category: "Cognitive", description: "Concern: Not reaching for objects. Example: Shows no interest in toys placed within reach.", completed: false, isRedFlag: true },

  // 9 MONTHS
  { id: "9m-m1", ageRange: "9 Months", category: "Motor", description: "Sits independently. Example: Can sit on the floor for several minutes without using hands for balance.", completed: false, isRedFlag: false },
  { id: "9m-l1", ageRange: "9 Months", category: "Language", description: "Understands \"No\". Example: Briefly stops what they are doing when you say \"No\" firmly.", completed: false, isRedFlag: false },
  { id: "9m-s1", ageRange: "9 Months", category: "Social", description: "Clings to familiar adults. Example: Showing \"separation anxiety\" when you leave the room.", completed: false, isRedFlag: false },
  { id: "9m-c1", ageRange: "9 Months", category: "Cognitive", description: "Looks for hidden things. Example: Lifting a cloth to find a toy you just hid underneath.", completed: false, isRedFlag: false },
  { id: "9m-rf-m1", ageRange: "9 Months", category: "Motor", description: "Concern: Not sitting by 9 months. Example: Still needs to be held or propped up to stay upright.", completed: false, isRedFlag: true },
  { id: "9m-rf-l1", ageRange: "9 Months", category: "Language", description: "Concern: No babbling. Example: Not using consonant sounds like \"ba-ba\" or \"da-da\".", completed: false, isRedFlag: true },
  { id: "9m-rf-s1", ageRange: "9 Months", category: "Social", description: "Concern: Does not respond to name. Example: Doesn't look around when you call their name from across the room.", completed: false, isRedFlag: true },
  { id: "9m-rf-c1", ageRange: "9 Months", category: "Cognitive", description: "Concern: No back-and-forth play. Example: Doesn't try to play peek-a-boo or \"copy\" sounds you make.", completed: false, isRedFlag: true },

  // 12 MONTHS
  { id: "12m-m1", ageRange: "12 Months", category: "Motor", description: "Pulls to stand. Example: Uses the couch or your legs to get themselves up onto their feet.", completed: false, isRedFlag: false },
  { id: "12m-l1", ageRange: "12 Months", category: "Language", description: "Uses simple gestures. Example: Waving \"bye-bye\" or shaking their head \"no\".", completed: false, isRedFlag: false },
  { id: "12m-s1", ageRange: "12 Months", category: "Social", description: "Points to show interest. Example: Pointing at a dog in the park to get you to look at it too.", completed: false, isRedFlag: false },
  { id: "12m-c1", ageRange: "12 Months", category: "Cognitive", description: "Explores things in different ways. Example: Shaking, banging, and throwing toys to see what happens.", completed: false, isRedFlag: false },
  { id: "12m-rf-m1", ageRange: "12 Months", category: "Motor", description: "Concern: Not crawling. Example: They aren't moving across the floor by 12 months (crawling or bottom-shuffling).", completed: false, isRedFlag: true },
  { id: "12m-rf-l1", ageRange: "12 Months", category: "Language", description: "Concern: No single words. Example: Hasn't said clear words like \"mama\", \"dada\", or \"bottle\" yet.", completed: false, isRedFlag: true },
  { id: "12m-rf-s1", ageRange: "12 Months", category: "Social", description: "Concern: No waving or pointing. Example: Does not use hands to communicate basic needs or interest.", completed: false, isRedFlag: true },
  { id: "12m-rf-c1", ageRange: "12 Months", category: "Cognitive", description: "Concern: Doesn't search for hidden objects. Example: Shows no interest in finding a toy that went behind a cushion.", completed: false, isRedFlag: true },

  // 18 MONTHS
  { id: "18m-m1", ageRange: "18 Months", category: "Motor", description: "Walks independently. Example: Can walk across a room without holding onto anything or falling frequently.", completed: false, isRedFlag: false },
  { id: "18m-l1", ageRange: "18 Months", category: "Language", description: "Says several single words. Example: Having a vocabulary of 10-20 words they use consistently.", completed: false, isRedFlag: false },
  { id: "18m-s1", ageRange: "18 Months", category: "Social", description: "Pretend play. Example: Pretending to feed a teddy bear or \"talk\" on a toy phone.", completed: false, isRedFlag: false },
  { id: "18m-c1", ageRange: "18 Months", category: "Cognitive", description: "Points to body parts. Example: Can point to their nose or hair when you ask \"Where is your...?\"", completed: false, isRedFlag: false },
  { id: "18m-rf-m1", ageRange: "18 Months", category: "Motor", description: "Concern: Not walking by 18 months. Example: Still prefers crawling or needs to hold hands to walk.", completed: false, isRedFlag: true },
  { id: "18m-rf-l1", ageRange: "18 Months", category: "Language", description: "Concern: Fewer than 6 words. Example: They only use 1 or 2 words or just grunt to get what they want.", completed: false, isRedFlag: true },
  { id: "18m-rf-s1", ageRange: "18 Months", category: "Social", description: "Concern: No shared attention. Example: Doesn't look at what you point to, or doesn't look at you for your reaction.", completed: false, isRedFlag: true },
  { id: "18m-rf-c1", ageRange: "18 Months", category: "Cognitive", description: "Concern: Does not understand simple commands. Example: Can't follow \"give me the ball\" even with a gesture.", completed: false, isRedFlag: true },

  // 2 YEARS
  { id: "2y-m1", ageRange: "2 Years", category: "Motor", description: "Runs and kicks. Example: Can run fairly smoothly and swing a leg to kick a large ball.", completed: false, isRedFlag: false },
  { id: "2y-l1", ageRange: "2 Years", category: "Language", description: "Two-word phrases. Example: Saying \"More milk\", \"Dada go\", or \"Big car\".", completed: false, isRedFlag: false },
  { id: "2y-s1", ageRange: "2 Years", category: "Social", description: "Shows independence. Example: Might say \"No!\" or try to do things like putting on shoes by themselves.", completed: false, isRedFlag: false },
  { id: "2y-c1", ageRange: "2 Years", category: "Cognitive", description: "Follows 2-step instructions. Example: \"Pick up the block and put it in the box.\"", completed: false, isRedFlag: false },
  { id: "2y-rf-m1", ageRange: "2 Years", category: "Motor", description: "Concern: Persistent toe-walking. Example: Walks on tip-toes most of the time rather than flat-footed.", completed: false, isRedFlag: true },
  { id: "2y-rf-l1", ageRange: "2 Years", category: "Language", description: "Concern: Not joining two words. Example: Still only using single words and has a small vocabulary (<50 words).", completed: false, isRedFlag: true },
  { id: "2y-rf-s1", ageRange: "2 Years", category: "Social", description: "Concern: Unusual social behaviors. Example: Extreme tantrums or showing no interest in other children.", completed: false, isRedFlag: true },
  { id: "2y-rf-c1", ageRange: "2 Years", category: "Cognitive", description: "Concern: Cannot follow simple 1-step directions. Example: Doesn't seem to understand \"come here\" or \"sit down\".", completed: false, isRedFlag: true },

  // 3 YEARS
  { id: "3y-m1", ageRange: "3 Years", category: "Motor", description: "Climbs well. Example: Can walk up and down stairs alternating feet (one foot per step).", completed: false, isRedFlag: false },
  { id: "3y-l1", ageRange: "3 Years", category: "Language", description: "3-word sentences. Example: \"I want juice\" or \"Dog is big\". Strangers can understand them half the time.", completed: false, isRedFlag: false },
  { id: "3y-s1", ageRange: "3 Years", category: "Social", description: "Takes turns. Example: Can wait a short time for their turn during a simple game with others.", completed: false, isRedFlag: false },
  { id: "3y-c1", ageRange: "3 Years", category: "Cognitive", description: "Does puzzles. Example: Can complete a 3-4 piece wooden inset puzzle.", completed: false, isRedFlag: false },
  { id: "3y-rf-m1", ageRange: "3 Years", category: "Motor", description: "Concern: Clumsiness. Example: Frequently falls over or has great difficulty handling small toys/crayons.", completed: false, isRedFlag: true },
  { id: "3y-rf-l1", ageRange: "3 Years", category: "Language", description: "Concern: Very unclear speech. Example: Family members have trouble understanding what the child is saying.", completed: false, isRedFlag: true },
  { id: "3y-rf-s1", ageRange: "3 Years", category: "Social", description: "Concern: Does not play with others. Example: Always plays alone and resists any interaction with peers.", completed: false, isRedFlag: true },
  { id: "3y-rf-c1", ageRange: "3 Years", category: "Cognitive", description: "Concern: Cannot follow 2-step related instructions. Example: Fails to \"get your shoes and bring them to me.\"", completed: false, isRedFlag: true },

  // 4 YEARS
  { id: "4y-m1", ageRange: "4 Years", category: "Motor", description: "Hops on one foot. Example: Can balance on one leg and take a small hop without falling.", completed: false, isRedFlag: false },
  { id: "4y-l1", ageRange: "4 Years", category: "Language", description: "Tells stories. Example: Can describe what happened at preschool or a birthday party using 4-5 word sentences.", completed: false, isRedFlag: false },
  { id: "4y-s1", ageRange: "4 Years", category: "Social", description: "Prefers group play. Example: Actively joins in with other children to play \"house\" or \"tag\".", completed: false, isRedFlag: false },
  { id: "4y-c1", ageRange: "4 Years", category: "Cognitive", description: "Names colors and numbers. Example: Can correctly identify red, blue, green and count 4-5 objects.", completed: false, isRedFlag: false },
  { id: "4y-rf-m1", ageRange: "4 Years", category: "Motor", description: "Concern: Cannot hold a crayon with fingers/thumb (still uses whole fist).", completed: false, isRedFlag: true },
  { id: "4y-rf-l1", ageRange: "4 Years", category: "Language", description: "Concern: Cannot tell a simple story. Example: Cannot put together a sentence longer than 2-3 words.", completed: false, isRedFlag: true },
  { id: "4y-rf-s1", ageRange: "4 Years", category: "Social", description: "Concern: Extreme aggression or isolation. Example: Regularly hits/bites or has no concept of sharing/cooperation.", completed: false, isRedFlag: true },
  { id: "4y-rf-c1", ageRange: "4 Years", category: "Cognitive", description: "Concern: Cannot follow 3-part instructions. Example: Unable to \"Go to your room, get your coat, and put it on the table.\"", completed: false, isRedFlag: true },

  // LOSS OF SKILLS
  { id: "loss-skills", ageRange: "All Ages", category: "Cognitive", description: "CRITICAL CONCERN: Loss of any skill. Example: A child who used to say 10 words now says none, or a child who used to walk now only crawls.", completed: false, isRedFlag: true },
];

export const MilestoneNavigator: React.FC<MilestoneNavigatorProps> = ({ onLogRedFlag }) => {
  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_DATA);
  const [activeAge, setActiveAge] = useState('6-8 Weeks');
  const [showRedFlags, setShowRedFlags] = useState(false);

  const toggleMilestone = (id: string) => {
    const updated = milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
    setMilestones(updated);
    
    const item = updated.find(x => x.id === id);
    if (item?.isRedFlag && item.completed && onLogRedFlag) {
      onLogRedFlag(`Developmental Concern (${item.ageRange}): ${item.description.split('. Example:')[0]}`);
    }
  };

  const ageGroups = ['6-8 Weeks', '4 Months', '6 Months', '9 Months', '12 Months', '18 Months', '2 Years', '3 Years', '4 Years', 'All Ages'];

  const filteredData = useMemo(() => {
    return milestones.filter(m => m.ageRange === activeAge && m.isRedFlag === showRedFlags);
  }, [milestones, activeAge, showRedFlags]);

  const CategoryBadge = ({ category }: { category: string }) => {
    const colors: Record<string, string> = {
      Motor: 'bg-blue-50 text-blue-600 border-blue-100',
      Language: 'bg-purple-50 text-purple-600 border-purple-100',
      Social: 'bg-pink-50 text-pink-600 border-pink-100',
      Cognitive: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${colors[category] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="px-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Milestone <span className="text-teal-600">Screen</span></h2>
        <p className="text-slate-500 text-xs font-medium italic leading-tight mt-1">Standardized developmental tracking (QCH Guidelines).</p>
      </header>

      {/* Sticky Age Group Selector */}
      <nav className="sticky top-[58px] md:top-0 z-40 bg-[#FBFBFE]/80 backdrop-blur-md py-2 overflow-x-auto no-scrollbar">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm min-w-max">
          {ageGroups.map(age => (
            <button
              key={age}
              onClick={() => setActiveAge(age)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeAge === age ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {age}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm max-w-sm">
        <button 
          onClick={() => setShowRedFlags(false)}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
            !showRedFlags ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'
          }`}
        >
          Typical
        </button>
        <button 
          onClick={() => setShowRedFlags(true)}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
            showRedFlags ? 'bg-rose-50 text-rose-700' : 'text-slate-400'
          }`}
        >
          Concerns
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-in slide-in-from-bottom-4">
        {filteredData.map(m => (
          <button
            key={m.id}
            onClick={() => toggleMilestone(m.id)}
            className={`p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden h-full flex flex-col justify-between ${
              m.completed 
                ? (showRedFlags ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-emerald-50 border-emerald-200 shadow-sm')
                : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <CategoryBadge category={m.category} />
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                  m.completed 
                    ? (showRedFlags ? 'bg-rose-600 border-rose-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white')
                    : 'border-slate-100'
                }`}>
                  {m.completed && <span className="text-sm font-black">✓</span>}
                </div>
              </div>
              
              <div className="space-y-3">
                <p className={`text-base font-black leading-tight tracking-tight ${m.completed ? 'opacity-80' : 'text-slate-800'}`}>
                  {m.description.split('. Example:')[0]}
                </p>
                {!m.completed && (
                  <p className="text-[11px] font-bold italic text-slate-500 leading-tight">
                    {m.description.includes('. Example:') ? m.description.split('. Example:')[1] : ''}
                  </p>
                )}
              </div>
            </div>

            {m.isRedFlag && !m.completed && (
              <div className="mt-4 flex items-center gap-1.5 text-rose-500 font-black text-[9px] uppercase">
                <span className="animate-pulse text-base">⚠️</span>
                Review if observed
              </div>
            )}
            {m.isRedFlag && m.completed && (
              <div className="mt-4 flex items-center gap-1.5 text-rose-900 font-black text-[9px] uppercase bg-rose-100/50 p-2 rounded-xl border border-rose-100">
                <span>📍</span> Logged for Clinical Review
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
