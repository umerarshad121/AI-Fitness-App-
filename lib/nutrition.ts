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
  const protein = Math.round(input.weightKg * (input.goal === 'lose' ? 1.8 : 1.6));
  const carbs = Math.round((calories * 0.4) / 4);
  const fat = Math.round((calories * 0.3) / 9);
  return {
    bmr,
    tdee,
    calories,
    protein,
    carbs,
    fat,
    ...micronutrientTargets({ calories, sex: input.sex, weightKg: input.weightKg, age: input.age }),
  };
}

/** Daily micronutrient goals — weight / sex / calorie aware (MFP-style). */
export function micronutrientTargets({
  calories,
  sex,
  weightKg,
  age = 30,
}: {
  calories: number;
  sex: Sex | null | undefined;
  weightKg: number;
  age?: number;
}) {
  const isMale = sex !== 'female';
  const fiber = Math.max(20, Math.round((calories / 1000) * 14));
  const sugar = Math.round((calories * 0.1) / 4);
  const satFat = Math.round((calories * 0.1) / 9);
  const sodium = 2300;
  const cholesterol = 300;
  const potassium = isMale ? 3400 : 2600;
  const calcium = age >= 50 ? 1200 : 1000;
  const iron = isMale ? 8 : 18;
  const vitaminC = isMale ? 90 : 75;
  const waterMl = Math.round(Math.max(2000, weightKg * 35));
  return { fiber, sugar, satFat, sodium, cholesterol, potassium, calcium, iron, vitaminC, waterMl };
}

/** Estimate micros from macros when food DB / logs don't store them. */
export function estimateMicrosFromMacros(meal: { calories: number; protein: number; carbs: number; fat: number }) {
  const carbs = Number(meal.carbs) || 0;
  const fat = Number(meal.fat) || 0;
  const calories = Number(meal.calories) || 0;
  return {
    fiber: Math.round(carbs * 0.12 * 10) / 10,
    sugar: Math.round(carbs * 0.35 * 10) / 10,
    satFat: Math.round(fat * 0.35 * 10) / 10,
    sodium: Math.round(calories * 1.2),
    cholesterol: Math.round(fat * 4),
    potassium: Math.round(calories * 1.5),
    calcium: Math.round(calories * 0.25),
    iron: Math.round(calories * 0.004 * 10) / 10,
    vitaminC: Math.round(calories * 0.03),
  };
}

export function resolveMacroTargets(profile: {
  daily_calorie_target?: number | null;
  protein_target?: number | null;
  carbs_target?: number | null;
  fat_target?: number | null;
  weight_kg?: number | null;
  sex?: Sex | null;
  age?: number | null;
  height_cm?: number | null;
  target_weight_kg?: number | null;
  activity_level?: ActivityLevel | null;
  goal?: Goal | null;
}) {
  const weight = Number(profile.weight_kg) || 70;
  const hasFull =
    profile.age &&
    profile.sex &&
    profile.height_cm &&
    profile.weight_kg &&
    profile.target_weight_kg &&
    profile.activity_level &&
    profile.goal;

  if (hasFull) {
    return calculateTargets({
      age: Number(profile.age),
      sex: profile.sex as Sex,
      heightCm: Number(profile.height_cm),
      weightKg: weight,
      targetWeightKg: Number(profile.target_weight_kg),
      activity: profile.activity_level as ActivityLevel,
      goal: profile.goal as Goal,
    });
  }

  const calories = Number(profile.daily_calorie_target) || 2000;
  const protein = Number(profile.protein_target) || Math.round(weight * 1.6);
  const carbs = Number(profile.carbs_target) || Math.round((calories * 0.4) / 4);
  const fat = Number(profile.fat_target) || Math.round((calories * 0.3) / 9);
  return {
    bmr: 0,
    tdee: calories,
    calories,
    protein,
    carbs,
    fat,
    ...micronutrientTargets({ calories, sex: profile.sex, weightKg: weight, age: Number(profile.age) || 30 }),
  };
}

export function estimateWorkout(calories: number, weightKg: number) {
  const safeWeight = Math.max(40, weightKg);
  return {
    briskWalkMinutes: Math.ceil((calories / (4.5 * safeWeight / 60))),
    moderateRunMinutes: Math.ceil((calories / (9 * safeWeight / 60))),
    cyclingMinutes: Math.ceil((calories / (7.5 * safeWeight / 60))),
  };
}
