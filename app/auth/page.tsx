'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { useToast } from '../../components/toast-provider';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setMessage('');
    try {
      const supabase = createClient();
      // A failed/blocked request must not leave the button stuck forever.
      const authRequest = mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 15000)
      );
      const result = await Promise.race([authRequest, timeout]);
      if (result.error) { setMessage(result.error.message); showToast(result.error.message, 'error'); }
      else if (mode === 'signup') { setMessage('Account created. Email verification complete karke sign in karein.'); showToast('Account created successfully.', 'success'); }
      else window.location.assign('/dashboard');
    } catch (caught) {
      console.error('Authentication request failed:', caught);
      const detail = caught instanceof Error ? caught.message : String(caught);
      const error = detail === 'AUTH_TIMEOUT'
        ? 'Login server se response nahi aa raha (15 seconds timeout). Supabase configuration ya server check karein.'
        : detail.includes('Missing Supabase')
          ? 'Supabase configuration missing hai. Hosting environment mein NEXT_PUBLIC_SUPABASE_URL aur NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY add karein.'
          : `Login failed: ${detail || 'Unknown authentication error'}`;
      setMessage(error); showToast(error, 'error');
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-5"><div><p className="text-sm font-semibold text-blue-600">AI CALORIE TRACKER</p><h1 className="text-3xl font-bold mt-2">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1><p className="text-slate-500 mt-2">Personalized nutrition, goals aur progress.</p></div><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border p-3" /><input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (minimum 6 characters)" className="w-full rounded-lg border p-3" /><button disabled={loading} className="w-full rounded-lg bg-blue-600 text-white p-3 font-semibold disabled:opacity-60">{loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Sign up'}</button>{mode === 'signin' && <Link href="/auth/forgot-password" className="block text-center text-sm text-blue-600">Forgot password?</Link>}{message && <p className="text-sm text-slate-600">{message}</p>}<button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="w-full text-sm text-blue-600">{mode === 'signin' ? 'New user? Create account' : 'Already have an account? Sign in'}</button></form></main>;
}
