'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { FeatureHub } from '../../components/feature-hub';

type Profile = { daily_calorie_target: number | null; weight_kg: number | null };
type Meal = { food_name: string; meal_type: string; calories: number };

export default function DashboardPage() {
  const [p, setP] = useState<Profile | null>(null);
  const [m, setM] = useState<Meal[]>([]);
  const [burned, setBurned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) {
        setError('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }
      // meal_logs FK needs a profiles row — create defaults if missing.
      await s.from('profiles').upsert({
        id: user.id,
        daily_calorie_target: 2000,
        protein_target: 150,
        carbs_target: 200,
        fat_target: 65,
        activity_level: 'moderate',
        goal: 'lose',
      }, { onConflict: 'id', ignoreDuplicates: true });
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const [{ data: profile, error: pe }, { data: meals, error: me }, exRes] = await Promise.all([
        s.from('profiles').select('daily_calorie_target,weight_kg').eq('id', user.id).maybeSingle(),
        s.from('meal_logs').select('food_name,meal_type,calories').eq('user_id', user.id).gte('logged_at', d.toISOString()),
        fetch('/api/exercises?days=1'),
      ]);
      if (pe || me) setError(pe?.message || me?.message || 'Unable to load data');
      setP(profile);
      setM((meals ?? []) as Meal[]);
      if (exRes.ok) {
        const exercises = await exRes.json();
        setBurned((exercises ?? []).reduce((n: number, x: { calories_burned: number }) => n + Number(x.calories_burned), 0));
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">Loading your diary...</main>;

  const target = Number(p?.daily_calorie_target ?? 2000);
  const consumed = m.reduce((n, x) => n + Number(x.calories), 0);
  const remaining = target + burned - consumed;
  const sections = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-blue-600">AI CAL FIT COUNT</p>
            <h1 className="text-2xl font-bold sm:text-3xl">Today</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href="/watch" className="rounded-lg border border-green-600 bg-white px-4 py-2 text-center text-green-700">Connect watch</Link>
            <Link href="/diary" className="rounded-lg border bg-white px-4 py-2 text-center">Search food</Link>
            <Link href="/profile" className="rounded-lg border bg-white px-4 py-2 text-center">Edit profile</Link>
          </div>
        </header>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 6 + i);
            return (
              <div key={i} className={`min-w-0 rounded-xl border p-1.5 text-center sm:p-2 ${i === 6 ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white'}`}>
                <p className="text-[10px] sm:text-xs">{date.toLocaleDateString('en', { weekday: 'short' })}</p>
                <b className="text-sm sm:text-base">{date.getDate()}</b>
              </div>
            );
          })}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-slate-500">Eaten today</p>
            <b className="text-3xl text-orange-500">{Math.round(consumed)} kcal</b>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-slate-500">Burned today</p>
            <b className="text-3xl text-green-600">{Math.round(burned)} kcal</b>
            <p className="mt-1 text-xs text-slate-500">Adds to your daily allowance</p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-slate-500">Daily target</p>
            <b className="text-3xl text-blue-600">{target} kcal</b>
            <p className="mt-1 text-xs text-slate-500">Allowance {Math.round(target + burned)} kcal</p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-slate-500">Remaining</p>
            <b className={`text-3xl ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.round(remaining)} kcal</b>
            <p className="mt-1 text-xs text-slate-500">{target} + {Math.round(burned)} burned − {Math.round(consumed)} eaten</p>
          </div>
        </section>

        <FeatureHub />

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(section => {
            const list = m.filter(x => x.meal_type === section);
            return (
              <section key={section} className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold capitalize">{section}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{Math.round(list.reduce((n, x) => n + Number(x.calories), 0))} kcal</span>
                    <Link href={`/diary?meal=${section}`} className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">+</Link>
                  </div>
                </div>
                {list.length ? list.map((x, i) => (
                  <div key={i} className="mt-3 flex justify-between border-t pt-3 text-sm">
                    <span>{x.food_name}</span>
                    <span>{x.calories} kcal</span>
                  </div>
                )) : <p className="mt-3 text-sm text-slate-400">No food logged yet.</p>}
              </section>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/scan" className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-center font-semibold text-white">Scan a meal</Link>
          <Link href="/progress" className="inline-block rounded-lg border px-5 py-3 text-center font-semibold">View progress</Link>
        </div>
      </div>
    </main>
  );
}
