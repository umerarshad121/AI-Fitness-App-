'use client';

import Link from 'next/link';

const tools: [string, string, string, string][] = [
  ['📷', 'Scan meal', '/scan', 'AI photo scan'],
  ['🔎', 'Food search', '/diary', 'Database + barcode'],
  ['💧', 'Water', '/tracking?section=water', 'Hydration logs'],
  ['⌚', 'Exercise', '/watch', 'Watch + workouts'],
  ['⚖️', 'Weight', '/weight', 'Progress check-in'],
  ['🥗', 'Nutrition', '/nutrition', 'Macros + micros'],
  ['📈', 'Progress', '/progress', '7-day insights'],
  ['🍽️', 'Recipes', '/planner', 'Save your meals'],
  ['🗓️', 'Meal planner', '/planner', 'Plan your day'],
  ['🛒', 'Grocery list', '/tracking?section=grocery', 'Shopping prep'],
  ['⏱️', 'Fasting', '/planner', 'Track your fast'],
  ['📊', 'Export data', '/tracking?section=export', 'Download history'],
];

export function FeatureHub() {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tools.map(([icon, title, href, description]) => (
        <Link key={title} href={href} className="rounded-2xl border border-blue-400/30 bg-white p-3 font-bold sm:p-4">
          <span className="text-xl sm:text-2xl">{icon}</span>
          <span className="mt-2 block text-sm sm:text-base">{title}</span>
          <small className="font-normal text-slate-400">{description}</small>
        </Link>
      ))}
    </section>
  );
}
