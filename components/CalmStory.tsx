
import React, { useState } from 'react';
import { generateCalmingStory } from '../services/gemini';

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

  const handleGenerate = async () => {
    if (!childName) return;
    setLoading(true);
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
        
        setLoading(false);
        alert("A soothing story is now playing!");
      }
    } catch (error) {
      console.error(error);
      alert("Error generating story.");
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
