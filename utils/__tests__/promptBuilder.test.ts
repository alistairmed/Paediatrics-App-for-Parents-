import { describe, it, expect } from 'vitest';
import { buildPrompt, toPoints, DEFAULT_REPO, PromptInput } from '../promptBuilder';

const base: PromptInput = {
  preset: 'paeds-fix', repo: '', branch: 'claude/example', task: '', files: '',
  runChecks: true, openPr: true, updateTracker: false,
};

describe('toPoints', () => {
  it('splits lines, strips bullets and numbers, drops blanks', () => {
    expect(toPoints('- one\n* two\n\n3. three\n  four ')).toEqual(['one', 'two', 'three', 'four']);
  });
});

describe('buildPrompt', () => {
  it('Paeds Pouch fix: repo, branch, task points, rules, checks and PR steps', () => {
    const p = buildPrompt({ ...base, task: 'Fix the header\nAdd a test' });
    expect(p).toContain(`Repo: ${DEFAULT_REPO}`);
    expect(p).toContain('Branch: claude/example');
    expect(p).toContain('Never push to main.');
    expect(p).toContain('- Fix the header\n- Add a test');
    expect(p).toContain('No emoji.');
    expect(p).toContain('npx tsc --noEmit');
    expect(p).toContain('Do not merge it. Tell me the PR link.');
    expect(p).not.toContain('Likely files:');
  });

  it('design preset adds brand colours and the strict CSP rule', () => {
    const p = buildPrompt({ ...base, preset: 'design', task: 'Use the logo in the header' });
    expect(p).toContain('#C2603C');
    expect(p).toContain('Fraunces');
    expect(p).toContain('CSP');
  });

  it('generic preset has no Paeds Pouch rules and uses generic checks', () => {
    const p = buildPrompt({ ...base, preset: 'generic', repo: 'me/other', task: 'Add a README' });
    expect(p).toContain('Repo: me/other');
    expect(p).not.toContain('medical advice');
    expect(p).not.toContain('vite preview');
    expect(p).toContain('full test suite');
  });

  it('shows a placeholder instead of inventing a task, and omits switched-off sections', () => {
    const p = buildPrompt({ ...base, branch: '', runChecks: false, openPr: false, updateTracker: true });
    expect(p).toContain('- <describe the task here>');
    expect(p).toContain('Branch: claude/<short-task-name>');
    expect(p).not.toContain('Checks:');
    expect(p).not.toContain('Open a pull request');
    expect(p).toContain('side-hustle-tracker.md');
  });

  it('lists likely files when given', () => {
    expect(buildPrompt({ ...base, files: 'components/Layout.tsx' })).toContain('Likely files:\n- components/Layout.tsx');
  });
});
