'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { calculateTargets } from '../../lib/nutrition';
import { useToast } from '../../components/toast-provider';

export default function ProfilePage() {
  const [form, setForm] = useState({ age: '', sex: 'male', heightCm: '', weightKg: '', targetWeightKg: '', activity: 'moderate', goal: 'lose' });
  const [message, setMessage] = useState('');
  const { showToast } = useToast();
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('age,sex,height_cm,weight_kg,target_weight_kg,activity_level,goal').eq('id', user.id).maybeSingle();
      if (data) setForm({ age: String(data.age ?? ''), sex: data.sex ?? 'male', heightCm: String(data.height_cm ?? ''), weightKg: String(data.weight_kg ?? ''), targetWeightKg: String(data.target_weight_kg ?? ''), activity: data.activity_level ?? 'moderate', goal: data.goal ?? 'lose' });
    }
    loadProfile();
  }, []);
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  async function save(event: FormEvent) {
    event.preventDefault(); setMessage('Saving...');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage('Please sign in first.');
    const input = { age: Number(form.age), sex: form.sex as 'male' | 'female' | 'other', heightCm: Number(form.heightCm), weightKg: Number(form.weightKg), targetWeightKg: Number(form.targetWeightKg), activity: form.activity as 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete', goal: form.goal as 'lose' | 'maintain' | 'gain' };
    const targets = calculateTargets(input);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, age: input.age, sex: input.sex, height_cm: input.heightCm, weight_kg: input.weightKg, target_weight_kg: input.targetWeightKg, activity_level: input.activity, goal: input.goal, daily_calorie_target: targets.calories, protein_target: targets.protein, carbs_target: targets.carbs, fat_target: targets.fat });
    setMessage(error ? error.message : `Saved. Daily target: ${targets.calories} kcal`);
    showToast(error ? error.message : 'Profile saved successfully.', error ? 'error' : 'success');
  }
  return <main className="min-h-screen bg-slate-50 p-6"><form onSubmit={save} className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-sm border space-y-5"><h1 className="text-3xl font-bold">Your health profile</h1><p className="text-slate-500">Accurate calorie targets ke liye details complete karein.</p><div className="grid sm:grid-cols-2 gap-4">{[['age','Age'],['heightCm','Height (cm)'],['weightKg','Current weight (kg)'],['targetWeightKg','Target weight (kg)']].map(([key,label]) => <label key={key} className="space-y-1 text-sm font-medium">{label}<input required type="number" min="1" value={form[key as keyof typeof form]} onChange={e => update(key,e.target.value)} className="w-full border rounded-lg p-3" /></label>)}<label className="space-y-1 text-sm font-medium">Sex<select value={form.sex} onChange={e=>update('sex',e.target.value)} className="w-full border rounded-lg p-3"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label><label className="space-y-1 text-sm font-medium">Goal<select value={form.goal} onChange={e=>update('goal',e.target.value)} className="w-full border rounded-lg p-3"><option value="lose">Lose weight</option><option value="maintain">Maintain</option><option value="gain">Gain weight</option></select></label><label className="space-y-1 text-sm font-medium sm:col-span-2">Activity level<select value={form.activity} onChange={e=>update('activity',e.target.value)} className="w-full border rounded-lg p-3"><option value="sedentary">Sedentary</option><option value="light">Lightly active</option><option value="moderate">Moderately active</option><option value="very_active">Very active</option><option value="athlete">Athlete</option></select></label></div><button className="bg-blue-600 text-white rounded-lg px-5 py-3 font-semibold">Save profile</button>{message && <p className="text-sm text-slate-600">{message}</p>}</form></main>;
}
