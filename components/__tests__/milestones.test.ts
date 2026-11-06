import { describe, test, expect } from 'vitest';
import { INITIAL_DATA, syncMilestones, REGRESSION_IDS, REGRESSION_LINE, DISCUSS_LINE } from '../MilestoneNavigator';
import { appointmentQuestionsPrompt } from '../../services/ai';

describe('Milestone list', () => {
  test('Built-in items use plain wording, with no alarm labels', () => {
    const text = JSON.stringify(INITIAL_DATA);
    expect(text).not.toMatch(/red flag|critical|urgent|clinical action/i);
  });

  test('Saved lists get the new wording and keep what the parent recorded', () => {
    const saved = [
      { ...INITIAL_DATA.find(m => m.id === '9m-rf3')!, description: 'Red Flag: Not responding to name. Example: old text.', completed: true, notes: 'Mentioned at 9-month check' },
      { id: 'mine-1', ageRange: '9 Months', category: 'Social' as const, description: 'Waves bye-bye', completed: true, isRedFlag: false },
    ];
    const synced = syncMilestones(saved);
    const item = synced.find(m => m.id === '9m-rf3')!;
    expect(item.description).toBe(INITIAL_DATA.find(m => m.id === '9m-rf3')!.description);
    expect(item).toMatchObject({ completed: true, notes: 'Mentioned at 9-month check' });
    expect(synced.find(m => m.id === 'mine-1')).toMatchObject({ description: 'Waves bye-bye', completed: true });
    expect(synced).toHaveLength(INITIAL_DATA.length + 1);
  });

  test('Syncing twice changes nothing more', () => {
    const once = syncMilestones([]);
    expect(syncMilestones(once)).toEqual(once);
  });
});

describe('Milestone guidance lines', () => {
  const ALARM = /red flag|urgent|critical|clinical action/i;

  test('Losing skills gets the firmer "see your GP soon" line', () => {
    const regression = INITIAL_DATA.filter(m => REGRESSION_IDS.has(m.id));
    expect(regression.map(m => m.id)).toEqual(['loss-skills']);
    expect(regression[0].description).toMatch(/Loses skills they used to have/);
    expect(REGRESSION_LINE).toBe("If your child has stopped doing things they could do before, see your GP soon. Don't wait for the next routine check.");
  });

  test('No alarm words in any line the screen can show', () => {
    for (const text of [REGRESSION_LINE, DISCUSS_LINE, ...INITIAL_DATA.map(m => m.description)]) {
      expect(text).not.toMatch(ALARM);
    }
  });

  test('Appointment questions are practical questions for the parent', () => {
    const prompt = appointmentQuestionsPrompt(
      { pastMedicalHistory: '', currentMedications: [], acuteLogs: [] } as any,
      { provider: 'Dr A', specialty: 'Paediatrics', purpose: 'Review' } as any,
      ['Not babbling'],
    );
    expect(prompt).toContain('practical questions for the parent to ask');
    expect(prompt).not.toMatch(/clinical questions/i);
    expect(prompt).not.toMatch(ALARM);
  });
});
