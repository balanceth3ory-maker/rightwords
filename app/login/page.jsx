'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';
import styles from './page.module.css';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const router = useRouter();

  function switchMode(next) {
    setMode(next);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://rightwords.app/reset-password',
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess('Check your email for a password reset link.');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess('Check your email for a confirmation link, then come back and sign in.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard');
  }

  const titles = { login: 'Welcome back', signup: 'Create your account', forgot: 'Reset your password' };
  const subs = {
    login: 'Sign in to access your tools and session history.',
    signup: 'Free to start — 3 sessions per month, no card required.',
    forgot: 'Enter your email and we\'ll send you a reset link.',
  };

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.card}>
          <Link href="/" className={styles.back}>← Back to home</Link>
          <div className={styles.logoMark}>✦</div>
          <h1>{titles[mode]}</h1>
          <p className={styles.sub}>{subs[mode]}</p>

          {success ? (
            <div className={styles.successBox}>{success}</div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              {mode !== 'forgot' && (
                <div className={styles.field}>
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              )}
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className={styles.toggle}>
            {mode === 'login' && (
              <>
                <button onClick={() => switchMode('forgot')} style={{ display: 'block', margin: '0 auto 8px' }}>Forgot your password?</button>
                Don't have an account? <button onClick={() => switchMode('signup')}>Sign up free</button>
              </>
            )}
            {mode === 'signup' && (
              <>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></>
            )}
            {mode === 'forgot' && (
              <>Remembered it? <button onClick={() => switchMode('login')}>Back to sign in</button></>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
