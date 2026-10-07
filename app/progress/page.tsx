'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { daysAgoLocal, localDayKey, startOfLocalDay } from '../../lib/dates';

type MealRow = { calories: number; logged_at: string };
type ExerciseRow = { name: string; minutes: number; calories_burned: number; performed_at: string };
type DayStats = {
  key: string;
  label: string;
  weekday: string;
  eaten: number;
  burned: number;
  remaining: number;
  isToday: boolean;
};

export default function ProgressPage() {
  const [target, setTarget] = useState(2000);
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const since = daysAgoLocal(6);
        const [exRes, supabase] = await Promise.all([
          fetch('/api/exercises?days=7'),
          Promise.resolve(createClient()),
        ]);

        if (exRes.ok) {
          const exData = await exRes.json();
          setExercises(Array.isArray(exData) ? exData : []);
        } else {
          setExercises([]);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Session expired. Please sign in again.');
          setLoading(false);
          return;
        }

        const [{ data: mealRows, error: mealErr }, { data: profile }] = await Promise.all([
          supabase.from('meal_logs').select('calories,logged_at').eq('user_id', user.id).gte('logged_at', since.toISOString()),
          supabase.from('profiles').select('daily_calorie_target').eq('id', user.id).maybeSingle(),
        ]);

        if (mealErr) setError(mealErr.message);
        setMeals((mealRows ?? []) as MealRow[]);
        if (profile?.daily_calorie_target) setTarget(Number(profile.daily_calorie_target));
      } catch {
        setError('Unable to load progress. Try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const days: DayStats[] = Array.from({ length: 7 }, (_, i) => {
    const date = startOfLocalDay();
    date.setDate(date.getDate() - 6 + i);
    const key = localDayKey(date);
    const eaten = meals
      .filter(m => localDayKey(m.logged_at) === key)
      .reduce((n, m) => n + Number(m.calories), 0);
    const burned = exercises
      .filter(e => localDayKey(e.performed_at) === key)
      .reduce((n, e) => n + Number(e.calories_burned), 0);
    return {
      key,
      label: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      weekday: date.toLocaleDateString('en', { weekday: 'short' }),
      eaten,
      burned,
      remaining: target + burned - eaten,
      isToday: i === 6,
    };
  });

  const today = days[days.length - 1];
  const weekEaten = days.reduce((n, d) => n + d.eaten, 0);
  const weekBurned = days.reduce((n, d) => n + d.burned, 0);
  const todayExercises = exercises.filter(e => localDayKey(e.performed_at) === today.key);
  const allowance = target + today.burned;
  const eatenPct = Math.min(100, (today.eaten / Math.max(1, allowance)) * 100);
  const burnedPct = Math.min(100, (today.burned / Math.max(1, target)) * 100);
  const maxDayBar = Math.max(target, ...days.map(d => Math.max(d.eaten, d.burned)), 1);

  if (loading) {
    return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">Loading progress…</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard" className="inline-block text-sm text-blue-600">
          ← Back to dashboard
        </Link>

        <header>
          <h1 className="text-2xl font-bold sm:text-3xl">Progress</h1>
          <p className="mt-1 text-sm text-slate-500">
            Eaten aur burned alag. Burned calories daily allowance mein add hoti hain.
          </p>
        </header>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 sm:p-5">
            <p className="text-sm text-slate-500">Eaten today</p>
            <b className="text-2xl text-orange-500">{Math.round(today.eaten)} kcal</b>
          </div>
          <div className="rounded-2xl border bg-white p-4 sm:p-5">
            <p className="text-sm text-slate-500">Burned today</p>
            <b className="text-2xl text-green-600">{Math.round(today.burned)} kcal</b>
          </div>
          <div className="rounded-2xl border bg-white p-4 sm:p-5">
            <p className="text-sm text-slate-500">Daily target</p>
            <b className="text-2xl text-blue-600">{target} kcal</b>
          </div>
          <div className="rounded-2xl border bg-white p-4 sm:p-5">
            <p className="text-sm text-slate-500">Remaining today</p>
            <b className={`text-2xl ${today.remaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {Math.round(today.remaining)} kcal
            </b>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold">Today’s daily progress</h2>
          <p className="mt-2 rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm">
            <span className="text-slate-500">Formula: </span>
            Target <b>{target}</b>
            {' + '}
            Burned <b className="text-green-600">{Math.round(today.burned)}</b>
            {' − '}
            Eaten <b className="text-orange-500">{Math.round(today.eaten)}</b>
            {' = '}
            <b className={today.remaining >= 0 ? 'text-green-600' : 'text-red-500'}>
              {Math.round(today.remaining)} kcal left
            </b>
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Eaten vs allowance ({Math.round(allowance)} kcal)</span>
                <span>{Math.round(today.eaten)} / {Math.round(allowance)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${eatenPct}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Burned (added to daily target)</span>
                <span>+{Math.round(today.burned)} kcal</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${burnedPct}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold">Last 7 days</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
            <span>
              Week eaten: <b className="text-orange-500">{Math.round(weekEaten)} kcal</b>
            </span>
            <span>
              Week burned: <b className="text-green-600">{Math.round(weekBurned)} kcal</b>
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {days.map(day => (
              <div
                key={day.key}
                className={`rounded-xl border p-3 ${day.isToday ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 bg-slate-50/40'}`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    {day.weekday} {day.label}
                    {day.isToday ? ' · Today' : ''}
                  </span>
                  <span className={day.remaining >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {Math.round(day.remaining)} left
                  </span>
                </div>
                <div className="mb-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>
                    Eaten <b className="text-orange-500">{Math.round(day.eaten)}</b>
                  </span>
                  <span>
                    Burned <b className="text-green-600">{Math.round(day.burned)}</b>
                  </span>
                  <span>
                    Allowance <b>{Math.round(target + day.burned)}</b>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${Math.min(100, (day.eaten / maxDayBar) * 100)}%` }}
                    />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.min(100, (day.burned / maxDayBar) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Today’s workouts</h2>
            <div className="flex gap-3 text-sm">
              <Link href="/tracking" className="text-blue-600">Add burn</Link>
              <Link href="/watch" className="text-blue-600">Log exercise</Link>
            </div>
          </div>
          {todayExercises.length ? (
            <ul className="mt-3 divide-y">
              {todayExercises.map((ex, i) => (
                <li key={`${ex.performed_at}-${i}`} className="flex justify-between gap-3 py-3 text-sm">
                  <span>
                    {ex.name}
                    {ex.minutes ? <span className="text-slate-500"> · {ex.minutes} min</span> : null}
                  </span>
                  <b className="shrink-0 text-green-600">+{Math.round(Number(ex.calories_burned))} burned</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Abhi koi workout nahi. Watch / Tracking se burn add karo — ye remaining calories mein + hoga.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
