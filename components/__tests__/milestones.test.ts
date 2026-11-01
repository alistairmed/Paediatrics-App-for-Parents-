import { describe, test, expect } from 'vitest';
import { INITIAL_DATA, syncMilestones } from '../MilestoneNavigator';

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
