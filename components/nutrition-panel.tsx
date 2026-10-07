'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { estimateMicrosFromMacros } from '../lib/nutrition';

export type NutritionMeal = {
  food_name?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at?: string;
};

export type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  satFat: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  calcium: number;
  iron: number;
  vitaminC: number;
};

type MetricKey = 'calories' | 'protein' | 'carbs' | 'fat';

function pct(value: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

function Ring({ value, goal, color, label, unit }: { value: number; goal: number; color: string; label: string; unit: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, goal ? value / goal : 0);
  const dash = c * p;
  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 100 100" className="h-28 w-28 sm:h-32 sm:w-32">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(148,163,184,.25)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="48" textAnchor="middle" className="fill-current text-[14px] font-bold">
          {Math.round(value)}
        </text>
        <text x="50" y="64" textAnchor="middle" className="fill-slate-400 text-[9px]">
          / {Math.round(goal)} {unit}
        </text>
      </svg>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      <p className="text-xs text-slate-500">{pct(value, goal)}%</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  goal,
  unit,
  color,
  hint,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  hint?: string;
}) {
  const left = Math.max(0, goal - value);
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-slate-500">
          <b className="text-inherit">{Math.round(value * 10) / 10}</b> / {Math.round(goal)} {unit}
          <span className="ml-2 text-xs">· {Math.round(left * 10) / 10} left</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct(value, goal)}%`, background: color }} />
      </div>
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function NutritionPanel({
  meals,
  targets,
  weekMeals = [],
  compact = false,
}: {
  meals: NutritionMeal[];
  targets: NutritionTargets;
  weekMeals?: NutritionMeal[];
  compact?: boolean;
}) {
  const [metric, setMetric] = useState<MetricKey>('calories');
  const [tab, setTab] = useState<'macros' | 'micros'>('macros');

  const totals = useMemo(() => {
    const base = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + Number(m.calories),
        protein: acc.protein + Number(m.protein),
        carbs: acc.carbs + Number(m.carbs),
        fat: acc.fat + Number(m.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    const micros = meals.reduce(
      (acc, m) => {
        const e = estimateMicrosFromMacros(m);
        return {
          fiber: acc.fiber + e.fiber,
          sugar: acc.sugar + e.sugar,
          satFat: acc.satFat + e.satFat,
          sodium: acc.sodium + e.sodium,
          cholesterol: acc.cholesterol + e.cholesterol,
          potassium: acc.potassium + e.potassium,
          calcium: acc.calcium + e.calcium,
          iron: acc.iron + e.iron,
          vitaminC: acc.vitaminC + e.vitaminC,
        };
      },
      { fiber: 0, sugar: 0, satFat: 0, sodium: 0, cholesterol: 0, potassium: 0, calcium: 0, iron: 0, vitaminC: 0 },
    );
    return { ...base, ...micros };
  }, [meals]);

  const days = useMemo(() => {
    const source = weekMeals.length ? weekMeals : meals;
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - 6 + i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayMeals = source.filter(m => {
        if (!m.logged_at) return i === 6;
        const d = new Date(m.logged_at);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return k === key;
      });
      const sum = dayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + Number(m.calories),
          protein: acc.protein + Number(m.protein),
          carbs: acc.carbs + Number(m.carbs),
          fat: acc.fat + Number(m.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );
      return {
        key,
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        day: date.getDate(),
        isToday: i === 6,
        ...sum,
      };
    });
  }, [weekMeals, meals]);

  const maxBar = Math.max(1, ...days.map(d => d[metric]), targets[metric] * 0.4);
  const metricOptions: { key: MetricKey; label: string; color: string }[] = [
    { key: 'calories', label: 'Calories', color: '#f97316' },
    { key: 'protein', label: 'Protein', color: '#22c55e' },
    { key: 'carbs', label: 'Carbs', color: '#3b82f6' },
    { key: 'fat', label: 'Fat', color: '#eab308' },
  ];
  const activeColor = metricOptions.find(m => m.key === metric)?.color ?? '#3b82f6';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Nutrition</h2>
          <p className="text-sm text-slate-500">Targets weight / goal se dynamic. Macros + micros MyFitnessPal style.</p>
        </div>
        {compact ? (
          <Link href="/nutrition" className="rounded-lg border px-3 py-2 text-sm font-semibold">
            Full nutrition →
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Ring value={totals.calories} goal={targets.calories} color="#f97316" label="Calories" unit="kcal" />
        <Ring value={totals.protein} goal={targets.protein} color="#22c55e" label="Protein" unit="g" />
        <Ring value={totals.carbs} goal={targets.carbs} color="#3b82f6" label="Carbs" unit="g" />
        <Ring value={totals.fat} goal={targets.fat} color="#eab308" label="Fat" unit="g" />
      </div>

      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {metricOptions.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMetric(opt.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${metric === opt.key ? 'text-white' : 'border bg-transparent'}`}
              style={metric === opt.key ? { background: opt.color } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mb-3 text-sm text-slate-500">Last 7 days · {metricOptions.find(m => m.key === metric)?.label}</p>
        <div className="flex h-44 items-end gap-2 sm:gap-3">
          {days.map(day => {
            const value = day[metric];
            const height = `${Math.max(6, (value / maxBar) * 100)}%`;
            return (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] text-slate-500 sm:text-xs">{Math.round(value)}</span>
                <div className="flex h-32 w-full items-end rounded-lg bg-slate-100/80 px-1">
                  <div
                    className={`w-full rounded-md transition-all ${day.isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent' : ''}`}
                    style={{ height, background: activeColor }}
                    title={`${day.label}: ${Math.round(value)}`}
                  />
                </div>
                <span className={`text-[10px] sm:text-xs ${day.isToday ? 'font-bold text-blue-400' : 'text-slate-500'}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('macros')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'macros' ? 'bg-blue-600 text-white' : 'border'}`}
          >
            Macros
          </button>
          <button
            type="button"
            onClick={() => setTab('micros')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'micros' ? 'bg-blue-600 text-white' : 'border'}`}
          >
            Nutrients
          </button>
        </div>

        {tab === 'macros' ? (
          <div className="space-y-4">
            <ProgressRow label="Calories" value={totals.calories} goal={targets.calories} unit="kcal" color="#f97316" />
            <ProgressRow label="Protein" value={totals.protein} goal={targets.protein} unit="g" color="#22c55e" hint="Based on your body weight" />
            <ProgressRow label="Carbohydrates" value={totals.carbs} goal={targets.carbs} unit="g" color="#3b82f6" />
            <ProgressRow label="Fat" value={totals.fat} goal={targets.fat} unit="g" color="#eab308" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Micronutrients estimated from logged macros (Open Food Facts style breakdown). Targets follow your weight, sex and calorie goal.
            </p>
            <ProgressRow label="Fiber" value={totals.fiber} goal={targets.fiber} unit="g" color="#84cc16" />
            <ProgressRow label="Sugars" value={totals.sugar} goal={targets.sugar} unit="g" color="#f43f5e" />
            <ProgressRow label="Saturated fat" value={totals.satFat} goal={targets.satFat} unit="g" color="#f59e0b" />
            <ProgressRow label="Sodium" value={totals.sodium} goal={targets.sodium} unit="mg" color="#a855f7" />
            <ProgressRow label="Cholesterol" value={totals.cholesterol} goal={targets.cholesterol} unit="mg" color="#ec4899" />
            <ProgressRow label="Potassium" value={totals.potassium} goal={targets.potassium} unit="mg" color="#14b8a6" />
            <ProgressRow label="Calcium" value={totals.calcium} goal={targets.calcium} unit="mg" color="#64748b" />
            <ProgressRow label="Iron" value={totals.iron} goal={targets.iron} unit="mg" color="#b45309" />
            <ProgressRow label="Vitamin C" value={totals.vitaminC} goal={targets.vitaminC} unit="mg" color="#06b6d4" />
          </div>
        )}
      </div>
    </section>
  );
}
