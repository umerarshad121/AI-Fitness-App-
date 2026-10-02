'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [message, setMessage] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); if (password !== confirm) return setMessage('Passwords match nahi karte.'); const { error } = await createClient().auth.updateUser({ password }); setMessage(error ? error.message : 'Password update ho gaya. Ab sign in karein.'); }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border space-y-5"><h1 className="text-2xl font-bold">Set new password</h1><input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg border p-3" /><input required minLength={6} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password" className="w-full rounded-lg border p-3" /><button className="w-full rounded-lg bg-blue-600 text-white p-3 font-semibold">Update password</button>{message && <p className="text-sm text-slate-600">{message}</p>}</form></main>;
}
