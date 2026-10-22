
export type AgeGroup = 'Neo' | 'Infant' | 'Toddler' | 'Child' | 'Adolescent';

export interface VitalSignScore {
  parameter: string;
  value: string | number;
  score: number; // 0, 1 (Yellow), 3 (Red)
}

export interface CEWTRow {
  timestamp: string;
  totalScore: number;
  scores: Record<string, VitalSignScore>;
}

export const getAgeGroup = (ageMonths: number): AgeGroup => {
  if (ageMonths < 3) return 'Neo';
  if (ageMonths < 12) return 'Infant';
  if (ageMonths < 60) return 'Toddler';
  if (ageMonths < 144) return 'Child';
  return 'Adolescent';
};

/**
 * Professional Clinical Thresholds for CEWT (Children's Early Warning Tool)
 * Zones: 
 * 0 = Normal (White)
 * 1 = Clinical Review (Yellow)
 * 3 = MET Call / Emergency (Red)
 */
export const calculateCEWT = (vitals: any, ageGroup: AgeGroup): CEWTRow => {
  const result: Record<string, VitalSignScore> = {};
  let total = 0;

  const scoreIt = (param: string, val: any, s: number) => {
    result[param] = { parameter: param, value: val, score: s };
    total += s;
  };

  // 1. RESPIRATORY RATE (RR)
  const rr = parseInt(vitals.rr) || 0;
  let rrScore = 0;
  if (rr > 0) {
    if (ageGroup === 'Neo') {
      if (rr < 20 || rr > 80) rrScore = 3;
      else if (rr < 30 || rr > 60) rrScore = 1;
    } else if (ageGroup === 'Infant') {
      if (rr < 20 || rr > 70) rrScore = 3;
      else if (rr < 25 || rr > 50) rrScore = 1;
    } else if (ageGroup === 'Toddler') {
      if (rr < 15 || rr > 60) rrScore = 3;
      else if (rr < 20 || rr > 40) rrScore = 1;
    } else if (ageGroup === 'Child') {
      if (rr < 12 || rr > 50) rrScore = 3;
      else if (rr < 16 || rr > 30) rrScore = 1;
    } else {
      if (rr < 10 || rr > 40) rrScore = 3;
      else if (rr < 12 || rr > 25) rrScore = 1;
    }
  }
  scoreIt('RR', rr || '--', rrScore);

  // 2. RESPIRATORY EFFORT (Work of Breathing)
  const effort = vitals.effort || 'Normal';
  let effortScore = 0;
  if (effort === 'Mild' || effort === 'Moderate') effortScore = 1;
  if (effort === 'Severe' || effort === 'Exhausted') effortScore = 3;
  scoreIt('Effort', effort, effortScore);

  // 3. SpO2 (Oxygen Saturation)
  const o2 = parseInt(vitals.o2) || 0;
  let o2Score = 0;
  if (o2 > 0) {
    if (o2 < 90) o2Score = 3;
    else if (o2 < 94) o2Score = 1;
  }
  scoreIt('SpO2', o2 ? `${o2}%` : '--', o2Score);

  // 4. HEART RATE (HR)
  const hr = parseInt(vitals.hr) || 0;
  let hrScore = 0;
  if (hr > 0) {
    if (ageGroup === 'Neo') {
      if (hr < 90 || hr > 200) hrScore = 3;
      else if (hr < 100 || hr > 180) hrScore = 1;
    } else if (ageGroup === 'Infant') {
      if (hr < 80 || hr > 190) hrScore = 3;
      else if (hr < 100 || hr > 170) hrScore = 1;
    } else if (ageGroup === 'Toddler') {
      if (hr < 70 || hr > 160) hrScore = 3;
      else if (hr < 80 || hr > 140) hrScore = 1;
    } else if (ageGroup === 'Child') {
      if (hr < 60 || hr > 140) hrScore = 3;
      else if (hr < 70 || hr > 120) hrScore = 1;
    } else {
      if (hr < 50 || hr > 130) hrScore = 3;
      else if (hr < 60 || hr > 110) hrScore = 1;
    }
  }
  scoreIt('HR', hr || '--', hrScore);

  // 5. BLOOD PRESSURE (Systolic)
  const sbp = parseInt(vitals.bp?.split('/')[0]) || 0;
  let bpScore = 0;
  if (sbp > 0) {
    if (ageGroup === 'Neo' && (sbp < 50 || sbp > 100)) bpScore = 3;
    else if (ageGroup === 'Infant' && (sbp < 60 || sbp > 110)) bpScore = 3;
    else if (ageGroup === 'Toddler' && (sbp < 70 || sbp > 120)) bpScore = 3;
    else if (ageGroup === 'Child' && (sbp < 80 || sbp > 130)) bpScore = 3;
    else if (ageGroup === 'Adolescent' && (sbp < 90 || sbp > 150)) bpScore = 3;
  }
  scoreIt('BP', vitals.bp || '--', bpScore);

  // 6. CAPILLARY REFILL TIME (CRT)
  const crt = vitals.crt || 'Normal';
  let crtScore = 0;
  if (crt === 'Sluggish' || crt === '2-3s') crtScore = 1;
  if (crt === 'Slow' || crt === '>3s') crtScore = 3;
  scoreIt('CRT', crt, crtScore);

  // 7. TEMPERATURE
  const temp = parseFloat(vitals.temp) || 0;
  let tScore = 0;
  if (temp > 0) {
    if (temp < 35 || temp >= 39) tScore = 3;
    else if (temp < 36 || temp >= 38.5) tScore = 1;
  }
  scoreIt('Temp', temp ? `${temp}°C` : '--', tScore);

  // 8. CNS (AVPU Consciousness)
  const avpu = vitals.avpu || 'A';
  let avpuScore = (avpu !== 'A') ? 3 : 0;
  scoreIt('CNS', avpu, avpuScore);

  return {
    timestamp: vitals.timestamp,
    totalScore: total,
    scores: result
  };
};
