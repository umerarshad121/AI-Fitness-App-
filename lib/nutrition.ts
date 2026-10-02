import type { ActivityLevel, Goal, Sex } from './types';

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

export function calculateBMR({ age, sex, heightCm, weightKg }: { age: number; sex: Sex; heightCm: number; weightKg: number }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : sex === 'female' ? base - 161 : base - 78);
}

export function calculateTargets(input: { age: number; sex: Sex; heightCm: number; weightKg: number; targetWeightKg: number; activity: ActivityLevel; goal: Goal }) {
  const bmr = calculateBMR({ age: input.age, sex: input.sex, heightCm: input.heightCm, weightKg: input.weightKg });
  const tdee = Math.round(bmr * activityMultipliers[input.activity]);
  const weeklyDelta = Math.max(0, Math.min(500, Math.round(Math.abs(input.weightKg - input.targetWeightKg) * 110)));
  const calories = Math.max(1200, Math.round(tdee + (input.goal === 'lose' ? -weeklyDelta : input.goal === 'gain' ? weeklyDelta * 0.6 : 0)));
  return { bmr, tdee, calories, protein: Math.round(input.weightKg * (input.goal === 'lose' ? 1.8 : 1.6)), carbs: Math.round((calories * 0.4) / 4), fat: Math.round((calories * 0.3) / 9) };
}

export function estimateWorkout(calories: number, weightKg: number) {
  const safeWeight = Math.max(40, weightKg);
  return {
    briskWalkMinutes: Math.ceil((calories / (4.5 * safeWeight / 60))),
    moderateRunMinutes: Math.ceil((calories / (9 * safeWeight / 60))),
    cyclingMinutes: Math.ceil((calories / (7.5 * safeWeight / 60))),
  };
}
