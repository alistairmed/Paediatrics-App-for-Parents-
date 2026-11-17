/**
 * Builds a ready-to-paste prompt for Claude Code. Pure text, no network, nothing stored.
 * Used by the hidden Prompt generator page (see config/features.ts).
 */

export type PromptPreset = 'paeds-fix' | 'design' | 'generic';

export interface PromptInput {
  preset: PromptPreset;
  repo: string;
  branch: string;
  task: string;
  files: string;
  runChecks: boolean;
  openPr: boolean;
  updateTracker: boolean;
}

export const DEFAULT_REPO = 'alistairmed/Paediatrics-App-for-Parents-';

export const PRESET_LABELS: Record<PromptPreset, string> = {
  'paeds-fix': 'Paeds Pouch fix',
  design: 'Design and brand update',
  generic: 'Any repo (generic)',
};

/** Turns free text into clean point-form lines: one per non-empty line, bullets removed. */
export function toPoints(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

const bullets = (lines: string[]) => lines.map(l => `- ${l}`);

const PAEDS_RULES = [
  'Read CLAUDE.md first and open only the files the task needs.',
  'Small focused changes: one commit and one test each.',
  'Health text in plain Australian English (about Year 7 reading level). No emoji.',
  'Do not add medical advice, dose calculation or symptom assessment.',
  'Never put a key or secret in a VITE_ variable or client code.',
];

const DESIGN_RULES = [
  'Brand: terracotta #C2603C, navy #1F2A44 text, cream #FBF6EE backgrounds, sky blue #8EC5E8 accent.',
  'Headings use Fraunces. Self-host the font files; keep the CSP in vercel.json strict (no remote fonts or images).',
  'Keep tap targets at least 44px and text readable at 375px width.',
];

const GENERIC_RULES = [
  'Read CLAUDE.md or README first if the repo has one, and open only the files the task needs.',
  'Small focused changes: one commit and one test each.',
];

const PAEDS_CHECKS = [
  'Type check: npx tsc --noEmit',
  'While working, run one test file at a time: npx vitest run <path> or npx playwright test e2e/<file> --project=desktop',
  'Kill any old "vite preview" on port 4173 before running Playwright.',
  'Run npm run test:e2e once at the end, not after every edit.',
];

const GENERIC_CHECKS = [
  'Run the repo\'s type check and tests for the files you changed.',
  'Run the full test suite once at the end.',
];

/** Returns the finished prompt text. Missing fields are shown as clear placeholders, never invented. */
export function buildPrompt(input: PromptInput): string {
  const repo = input.repo.trim() || DEFAULT_REPO;
  const branch = input.branch.trim() || 'claude/<short-task-name>';
  const task = toPoints(input.task);
  const files = toPoints(input.files);
  const isPaeds = input.preset !== 'generic';

  const rules = [
    ...(input.preset === 'generic' ? GENERIC_RULES : PAEDS_RULES),
    ...(input.preset === 'design' ? DESIGN_RULES : []),
  ];

  const out: string[] = [];
  out.push(`Repo: ${repo}`);
  out.push(`Branch: ${branch} (create it from main if it does not exist). Never push to main.`);
  out.push('');
  out.push('Task:');
  out.push(...(task.length ? bullets(task) : ['- <describe the task here>']));
  if (files.length) {
    out.push('');
    out.push('Likely files:');
    out.push(...bullets(files));
  }
  out.push('');
  out.push('Rules:');
  out.push(...bullets(rules));
  if (input.runChecks) {
    out.push('');
    out.push('Checks:');
    out.push(...bullets(isPaeds ? PAEDS_CHECKS : GENERIC_CHECKS));
  }
  out.push('');
  out.push('Finish:');
  const finish = ['Push the branch (never main).'];
  if (input.openPr) {
    finish.push('Open a pull request into main. If gh pr create fails, use: gh api repos/<owner>/<repo>/pulls --input <json file>.');
    finish.push('Do not merge it. Tell me the PR link.');
  }
  if (input.updateTracker) finish.push('Add a dated line to the Log in claude/side-hustle-tracker.md.');
  finish.push('Reply with a short summary: what changed, test results, anything left undone.');
  out.push(...bullets(finish));
  return out.join('\n');
}
