'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NutritionPanel, type NutritionMeal, type NutritionTargets } from '../../components/nutrition-panel';
import { resolveMacroTargets } from '../../lib/nutrition';
import { createClient } from '../../lib/supabase/client';
import { daysAgoLocal } from '../../lib/dates';

export default function NutritionPage() {
  const [mealsToday, setMealsToday] = useState<NutritionMeal[]>([]);
  const [weekMeals, setWeekMeals] = useState<NutritionMeal[]>([]);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const s = createClient();
        const { data: { user } } = await s.auth.getUser();
        if (!user) {
          setError('Session expired. Please sign in again.');
          setLoading(false);
          return;
        }

        const since = daysAgoLocal(6);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [{ data: profile }, { data: meals, error: mealErr }] = await Promise.all([
          s.from('profiles').select('daily_calorie_target,protein_target,carbs_target,fat_target,weight_kg,sex,age,height_cm,target_weight_kg,activity_level,goal').eq('id', user.id).maybeSingle(),
          s.from('meal_logs').select('food_name,calories,protein,carbs,fat,logged_at').eq('user_id', user.id).gte('logged_at', since.toISOString()),
        ]);

        if (mealErr) setError(mealErr.message);
        const all = (meals ?? []) as NutritionMeal[];
        setWeekMeals(all);
        setMealsToday(all.filter(m => new Date(m.logged_at ?? 0) >= today));
        setWeight(profile?.weight_kg ? Number(profile.weight_kg) : null);
        setTargets(resolveMacroTargets(profile ?? {}));
      } catch {
        setError('Unable to load nutrition data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">Loading nutrition…</main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard" className="inline-block text-sm text-blue-600">
          ← Back to dashboard
        </Link>

        <header className="rounded-2xl border bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-blue-600">NUTRITION DASHBOARD</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Macros & nutrients</h1>
          <p className="mt-2 text-sm text-slate-500">
            {weight
              ? `Goals set for ${weight} kg body weight — protein, carbs, fat aur micros update hote hain jab aap profile / weight change karte ho.`
              : 'Profile mein weight save karein taake protein aur nutrient goals body weight se calculate hon.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/profile" className="rounded-lg border px-3 py-2 text-sm font-semibold">
              Edit profile
            </Link>
            <Link href="/diary" className="rounded-lg border px-3 py-2 text-sm font-semibold">
              Log food
            </Link>
            <Link href="/scan" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
              Scan meal
            </Link>
          </div>
        </header>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {targets ? (
          <NutritionPanel meals={mealsToday} weekMeals={weekMeals} targets={targets} />
        ) : null}

        {targets ? (
          <section className="rounded-2xl border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-bold">Your daily targets</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl border p-3">
                <p className="text-slate-500">Calories</p>
                <b>{targets.calories} kcal</b>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-slate-500">Protein</p>
                <b>{targets.protein} g</b>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-slate-500">Carbs</p>
                <b>{targets.carbs} g</b>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-slate-500">Fat</p>
                <b>{targets.fat} g</b>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
