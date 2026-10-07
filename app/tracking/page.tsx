'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readApiError } from '../../lib/http';

type GroceryItem = { id: string; name: string; quantity: string | null };

export default function TrackingPage() {
  const [section, setSection] = useState('burn');
  const [calories, setCalories] = useState('');
  const [waterMl, setWaterMl] = useState('250');
  const [groceryName, setGroceryName] = useState('');
  const [groceryQty, setGroceryQty] = useState('');
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('section');
    if (param) setSection(param);
  }, []);

  useEffect(() => {
    if (section !== 'grocery') return;
    void (async () => {
      const response = await fetch('/api/grocery');
      if (!response.ok) return;
      const data = await response.json();
      setItems(data.items ?? []);
    })();
  }, [section]);

  async function saveBurn() {
    setMsg('');
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Manual calories burned', minutes: 0, calories_burned: Number(calories) }),
    });
    setMsg(response.ok ? 'Burned calories added to today’s progress.' : await readApiError(response));
    if (response.ok) setCalories('');
  }

  async function saveWater() {
    setMsg('');
    const amount = Number(waterMl);
    if (!amount || amount < 1) {
      setMsg('Enter a valid amount in ml.');
      return;
    }
    const response = await fetch('/api/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_ml: amount }),
    });
    setMsg(response.ok ? `${amount} ml logged.` : await readApiError(response));
  }

  async function addGrocery(event: React.FormEvent) {
    event.preventDefault();
    setMsg('');
    if (!groceryName.trim()) {
      setMsg('Enter an item name.');
      return;
    }
    const response = await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groceryName.trim(), quantity: groceryQty.trim() || null }),
    });
    if (response.ok) {
      const row = await response.json();
      setItems(current => [row, ...current]);
      setGroceryName('');
      setGroceryQty('');
      setMsg('Item added to grocery list.');
    } else {
      setMsg(await readApiError(response));
    }
  }

  const tabs = [
    ['burn', 'Burn calories'],
    ['water', 'Water'],
    ['grocery', 'Grocery'],
    ['export', 'Export'],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-xl space-y-5">
        <Link href="/dashboard" className="inline-block text-sm text-blue-600">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">Tracking center</h1>

        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSection(id);
                setMsg('');
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${section === id ? 'bg-blue-600 text-white' : 'border bg-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'burn' && (
          <section className="rounded-2xl border bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Burn calories manually</h2>
            <p className="mt-2 text-sm text-slate-500">Apni burned calories enter karein. Ye daily progress mein add hongi.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="number"
                min="1"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                placeholder="e.g. 350 kcal"
                className="w-full rounded-lg border p-3"
              />
              <button type="button" onClick={saveBurn} className="rounded-lg bg-blue-600 px-4 py-3 text-white sm:shrink-0">
                Add
              </button>
            </div>
          </section>
        )}

        {section === 'water' && (
          <section className="rounded-2xl border bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Water intake</h2>
            <p className="mt-2 text-sm text-slate-500">Log glasses or bottles in milliliters (250 ml ≈ one glass).</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['250', '500', '750'].map(preset => (
                <button key={preset} type="button" onClick={() => setWaterMl(preset)} className="rounded-lg border px-3 py-2 text-sm">
                  {preset} ml
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input type="number" min="1" value={waterMl} onChange={e => setWaterMl(e.target.value)} className="w-full rounded-lg border p-3" />
              <button type="button" onClick={saveWater} className="rounded-lg bg-blue-600 px-4 py-3 text-white">
                Log water
              </button>
            </div>
          </section>
        )}

        {section === 'grocery' && (
          <section className="rounded-2xl border bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Grocery list</h2>
            <form onSubmit={addGrocery} className="mt-4 space-y-3">
              <input value={groceryName} onChange={e => setGroceryName(e.target.value)} placeholder="Item name" className="w-full rounded-lg border p-3" />
              <input value={groceryQty} onChange={e => setGroceryQty(e.target.value)} placeholder="Quantity (optional)" className="w-full rounded-lg border p-3" />
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white sm:w-auto">
                Add item
              </button>
            </form>
            <ul className="mt-4 divide-y">
              {items.map(item => (
                <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                  <span>{item.name}</span>
                  <span className="text-slate-500">{item.quantity ?? '—'}</span>
                </li>
              ))}
              {!items.length && <p className="py-3 text-sm text-slate-500">No items yet.</p>}
            </ul>
          </section>
        )}

        {section === 'export' && (
          <section className="rounded-2xl border bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Export your data</h2>
            <p className="mt-2 text-sm text-slate-500">Download meals, weight and exercise history as JSON.</p>
            <a href="/api/export" className="mt-4 inline-block w-full rounded-lg border border-blue-600 px-4 py-3 text-center text-blue-600 sm:w-auto">
              Download JSON export
            </a>
          </section>
        )}

        {msg && <p className="rounded-lg bg-white p-3 text-sm">{msg}</p>}

        <Link href="/watch" className="inline-block rounded-lg border border-green-600 px-4 py-2 text-green-700">
          Manage watch & exercise
        </Link>
      </div>
    </main>
  );
}
