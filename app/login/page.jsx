'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';
import styles from './page.module.css';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

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

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.card}>
          <Link href="/" className={styles.back}>← Back to home</Link>
          <div className={styles.logoMark}>✦</div>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className={styles.sub}>
            {mode === 'login'
              ? 'Sign in to access your tools and session history.'
              : 'Free to start — 3 sessions per month, no card required.'}
          </p>

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
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          )}

          <div className={styles.toggle}>
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => { setMode('signup'); setError(''); }}>Sign up free</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
