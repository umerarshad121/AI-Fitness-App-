'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('');
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` });
    setMessage(error ? error.message : 'Password reset link email par bhej diya gaya hai.'); setLoading(false);
  }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border space-y-5"><h1 className="text-2xl font-bold">Forgot password?</h1><p className="text-slate-500 text-sm">Apna account email enter karein.</p><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border p-3" /><button disabled={loading} className="w-full rounded-lg bg-blue-600 text-white p-3 font-semibold">{loading ? 'Sending...' : 'Send reset link'}</button>{message && <p className="text-sm text-slate-600">{message}</p>}<Link href="/auth" className="block text-center text-sm text-blue-600">Back to sign in</Link></form></main>;
}
