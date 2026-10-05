import React, { useState } from 'react';
import { generateCalmingStory, GeminiError } from '../services/gemini';

// Audio decoding helpers as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const CalmStory: React.FC = () => {
  const [childName, setChildName] = useState('');
  const [theme, setTheme] = useState('Gentle Forest');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualStory, setShowManualStory] = useState(false);

  const handleGenerate = async () => {
    if (!childName) return;
    setLoading(true);
    setErrorMessage(null);
    setIsPlaying(false);

    try {
      const base64Audio = await generateCalmingStory(childName, theme);
      if (base64Audio) {
        // Initialize AudioContext for raw PCM playback
        const outputAudioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          outputAudioContext,
          24000,
          1
        );

        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();
        
        setIsPlaying(true);
      } else {
        throw new Error("No audio payload returned from story generator.");
      }
    } catch (error: any) {
      console.error(error);
      if (error instanceof GeminiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(error?.message || "Failed to generate audio story. Please try again.");
      }
      setShowManualStory(true);
    } finally {
      setLoading(false);
    }
  };

  const themes = [
    { name: 'Gentle Forest', icon: '🌲' },
    { name: 'Under the Sea', icon: '🌊' },
    { name: 'Cloud Kingdom', icon: '☁️' },
    { name: 'Space Journey', icon: '🚀' },
    { name: 'Secret Garden', icon: '🌸' },
  ];

  const getFallbackStoryText = () => {
    const name = childName || "little star";
    switch (theme) {
      case 'Under the Sea':
        return `Once upon a time in a soft, glowing underwater world, ${name} drifted through a calm turquoise ocean. Friendly sea turtles swam by slowly, floating through giant kelp forests. Every breath was steady and deep, like the quiet rise and fall of gentle ocean waves...`;
      case 'Cloud Kingdom':
        return `High above the treetop hills, ${name} stepped onto a fluffy, warm cloud blanket. The sky was brushed with lavender and rose gold. Every step felt weightless and peaceful, wrapping ${name} in soft, quiet comfort...`;
      case 'Space Journey':
        return `In a quiet spaceship floating smoothly past twinkling stars, ${name} looked out the window at the distant velvet night. Galaxies spun slowly like giant silver pinwheels, guiding ${name} into a restful, dreamy slumber...`;
      case 'Secret Garden':
        return `Inside a hidden garden filled with sweet jasmine and glowing fireflies, ${name} rested on a bed of cool green moss. Wind chimes chimed softly in the warm evening breeze, keeping ${name} safe and peaceful...`;
      default:
        return `Deep in the quiet emerald forest, the ancient pine trees whispered softly as the twilight settled. ${name} rested comfortably beside a gentle babbling brook. The leaves rustled with a soothing rhythm: inhale calm, exhale rest...`;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black text-slate-800 italic tracking-tight">CalmCast <span className="text-indigo-600">Stories</span></h2>
        <p className="text-slate-500 text-sm font-medium">Instant soothing stories for doctor visits or bedtime.</p>
      </header>

      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 max-w-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-indigo-50 rounded-full opacity-50 blur-3xl -z-10"></div>
        
        <div className="space-y-8 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Who is the story for?</label>
            <input 
              type="text" 
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Enter child's name..."
              className="w-full p-6 rounded-2xl border-2 border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none bg-indigo-50/30 text-indigo-950 font-black text-lg placeholder-indigo-300 transition-all shadow-inner" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Choose a Magical Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themes.map(t => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${
                    theme === t.name 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' 
                      : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-4xl filter drop-shadow-md">{t.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {isPlaying && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 space-y-2 flex items-center gap-4">
              <span className="text-3xl animate-pulse">🔊</span>
              <div>
                <p className="font-black text-emerald-900 text-sm">A soothing audio story is playing now!</p>
                <p className="text-emerald-700 text-xs font-bold italic">Adjust volume on your device to keep it calm and comfortable.</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 space-y-3">
              <p className="font-black text-rose-800 text-sm">⚠️ {errorMessage}</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleGenerate} 
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => setShowManualStory(true)} 
                  className="px-5 py-2 bg-white border border-rose-200 text-rose-800 rounded-xl font-black text-xs uppercase tracking-widest"
                >
                  Read Manual Story Instead
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading || !childName}
            className={`w-full py-6 rounded-[2rem] font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest hover:-translate-y-1 active:scale-95 ${
              loading || !childName ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                Brewing Magic...
              </>
            ) : (
              <>
                <span className="text-xl">🔊</span> Play CalmCast Story
              </>
            )}
          </button>

          {(showManualStory || !errorMessage) && (
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowManualStory(!showManualStory)} 
                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                📖 {showManualStory ? 'Hide Read-Aloud Bedtime Story' : 'Read a Calm Bedtime Story Manually'}
              </button>

              {showManualStory && (
                <div className="mt-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                  <h4 className="font-black text-indigo-950 text-sm uppercase tracking-widest">
                    {theme} Bedtime Tale for {childName || 'Child'}
                  </h4>
                  <p className="text-slate-800 font-bold italic leading-relaxed text-sm">
                    {getFallbackStoryText()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6 max-w-2xl">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-indigo-50 shrink-0">
          💡
        </div>
        <p className="text-indigo-800 text-sm font-bold italic leading-relaxed">
          "Try generating a story when your child feels anxious about a check-up. Use their favorite animals in the theme to build a positive clinical association."
        </p>
      </div>
    </div>
  );
};
