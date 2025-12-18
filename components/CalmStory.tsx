
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
        <h2 className="text-2xl font-bold text-slate-800">CalmCast Stories</h2>
        <p className="text-slate-500">Instant soothing stories for doctor visits or bedtime.</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Who is the story for?</label>
            <input 
              type="text" 
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Child's name"
              className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-3">Choose a Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themes.map(t => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    theme === t.name 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="text-3xl">{t.icon}</span>
                  <span className="text-xs font-bold uppercase">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !childName}
            className={`w-full py-4 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 shadow-md transition-all flex items-center justify-center gap-2 ${
              loading ? 'bg-slate-300' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating magic...
              </>
            ) : (
              <>
                <span>🔊</span> Generate Calm Story
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
          💡
        </div>
        <p className="text-blue-800 text-sm italic">
          "Try generating a story when your child feels anxious about a vaccination. 
          Use their favorite animals in the theme!"
        </p>
      </div>
    </div>
  );
};
