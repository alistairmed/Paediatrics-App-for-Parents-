import React, { useMemo, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { buildPrompt, DEFAULT_REPO, PRESET_LABELS, PromptInput, PromptPreset } from '../utils/promptBuilder';

const field = 'w-full min-h-[44px] px-4 py-3 bg-ink-50 border-2 border-ink-200 focus:border-terracotta-500 rounded-2xl font-bold text-sm text-ink-800';
const label = 'text-xs font-black text-ink-700 uppercase tracking-widest';

/** Hidden developer page: fills in a Claude Code prompt. Only reachable when PROMPT_TOOL_ENABLED is true. */
export const PromptLab: React.FC = () => {
  const { showToast } = useToast();
  const [input, setInput] = useState<PromptInput>({
    preset: 'paeds-fix', repo: DEFAULT_REPO, branch: '', task: '', files: '',
    runChecks: true, openPr: true, updateTracker: true,
  });
  const set = <K extends keyof PromptInput>(key: K, value: PromptInput[K]) => setInput(prev => ({ ...prev, [key]: value }));
  const prompt = useMemo(() => buildPrompt(input), [input]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      showToast('Prompt copied.');
    } catch {
      showToast('Could not copy. Select the text and copy it by hand.');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-4xl font-black text-ink-800 tracking-tight">Prompt generator</h2>
        <p className="text-sm font-bold text-ink-600 mt-2">Fill in the boxes, then copy the prompt into Claude Code. Nothing is saved or sent anywhere.</p>
      </div>

      <div className="space-y-5 bg-white p-6 rounded-3xl border border-ink-100">
        <div className="space-y-2">
          <label htmlFor="pl-preset" className={label}>Type of prompt</label>
          <select id="pl-preset" className={field} value={input.preset} onChange={e => set('preset', e.target.value as PromptPreset)}>
            {(Object.keys(PRESET_LABELS) as PromptPreset[]).map(k => <option key={k} value={k}>{PRESET_LABELS[k]}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="pl-repo" className={label}>Repo (owner/name)</label>
          <input id="pl-repo" className={field} value={input.repo} onChange={e => set('repo', e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="pl-branch" className={label}>Branch name</label>
          <input id="pl-branch" className={field} placeholder="claude/short-task-name" value={input.branch} onChange={e => set('branch', e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="pl-task" className={label}>Task (one point per line)</label>
          <textarea id="pl-task" rows={5} className={field} value={input.task} onChange={e => set('task', e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="pl-files" className={label}>Likely files (optional, one per line)</label>
          <textarea id="pl-files" rows={2} className={field} value={input.files} onChange={e => set('files', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          {([['runChecks', 'Include checks'], ['openPr', 'Open a PR, no merge'], ['updateTracker', 'Update tracker log']] as const).map(([key, text]) => (
            <label key={key} className="flex items-center gap-3 min-h-[44px] cursor-pointer text-sm font-black text-ink-700">
              <input type="checkbox" className="w-5 h-5 shrink-0" checked={input[key]} onChange={e => set(key, e.target.checked)} />
              {text}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className={label}>Your prompt</h3>
          <button onClick={copy} className="min-h-[44px] px-6 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Copy prompt</button>
        </div>
        <pre aria-label="Generated prompt" className="whitespace-pre-wrap break-words bg-ink-50 border border-ink-200 rounded-2xl p-5 text-xs font-mono text-ink-800">{prompt}</pre>
      </div>
    </div>
  );
};
