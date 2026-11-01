import { describe, test, expect } from 'vitest';
import { deidentifiedSummary, scrubText } from '../deidentify';

const history: any = {
  pastMedicalHistory: 'Mia Smith had bronchiolitis. Call mum on 0412 345 678 or mum@example.com.',
  surgicalHistory: '',
  allergies: ['Penicillin'],
  conditions: [{ id: '1', name: 'Asthma', status: 'Active' }],
  currentMedications: [{ id: 'm', name: 'Salbutamol', dose: '2 puffs', indication: 'Wheeze' }],
  specialists: [{ id: 's', name: 'Dr Jane Doe', phone: '03 9345 5522', email: 'jane@rch.org.au' }],
  familyHistory: { members: [{ id: 'f', name: 'Grandma Smith', relation: 'Grandmother' }] },
  appointments: [{ id: 'a', provider: 'Dr Jane Doe', specialty: 'Respiratory' }],
  medicalReports: [{ id: 'r', imageUrl: 'data:image/jpeg;base64,AAAA' }],
  acuteLogs: [{ id: 'l', timestamp: new Date().toISOString(), type: 'Temperature', value: '38.4', notes: 'Mia was grizzly' }],
  growthRecords: [{ age: 12, weight: 9.6, height: 75, date: '2026-09-15' }],
  vaccinations: [{ id: 'v', name: '12 months', status: 'completed' }],
};

describe('De-identified summary for premium AI', () => {
  const linkedEvents = [{ id: 'e', source: 'Acute Log', description: 'Mia had a fever, seen by Dr Doe', date: '2026-10-30', severity: 'Medium' as const, media: 'data:image/png;base64,BBBB' }];
  const summary = deidentifiedSummary({ history, childName: 'Mia Smith', age: '1 year, 1 month', sex: 'Female', linkedEvents });
  const sent = JSON.stringify(summary);

  test('Leaves out names, contact details, dates of birth and attachments', () => {
    expect(sent).not.toMatch(/Mia|Smith|Jane|Doe|Grandma|0412|9345|@|base64|2025-09/);
  });

  test('Keeps the clinical facts', () => {
    expect(summary.child).toEqual({ age: '1 year, 1 month', sex: 'Female' });
    expect(summary.allergies).toEqual(['Penicillin']);
    expect(summary.conditions).toEqual([{ name: 'Asthma', status: 'Active' }]);
    expect(summary.currentMedicines[0]).toEqual({ name: 'Salbutamol', dose: '2 puffs', reason: 'Wheeze' });
    expect(summary.pastMedicalHistory).toBe('the child had bronchiolitis. Call mum on [number removed] or [email removed].');
    expect(summary.recentLog[0]).toMatchObject({ type: 'Temperature', value: '38.4', notes: 'the child was grizzly' });
    expect(summary.parentAddedEvents).toEqual([{ source: 'Acute Log', details: 'the child had a fever, seen by Dr [name removed]', date: '2026-10-30', severity: 'Medium' }]);
    expect(summary.growth).toEqual([{ ageMonths: 12, weightKg: 9.6, lengthCm: 75, headCm: undefined }]);
  });

  test('scrubText replaces the name case-insensitively and only as a whole word', () => {
    expect(scrubText('MIA and Miami', 'Mia')).toBe('the child and Miami');
    expect(scrubText('Saw Dr Jane Doe, then Jane again', undefined, ['Dr Jane Doe'])).toBe('Saw [name removed], then [name removed] again');
  });
});
