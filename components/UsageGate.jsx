'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import styles from './UsageGate.module.css';

const FREE_LIMIT = 3;

export default function UsageGate({ children, toolName }) {
  const [status, setStatus] = useState('loading'); // loading | allowed | blocked | unauthenticated
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setStatus('unauthenticated'); return; }

    const userId = session.user.id;

    // Check if pro
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .single();

    if (profile?.is_pro) { setStatus('allowed'); return; }

    // Check monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    setUsageCount(count || 0);
    setStatus(count >= FREE_LIMIT ? 'blocked' : 'allowed');
  }

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.gate}>
        <div className={styles.gateContent}>
          <span className={styles.gateIcon}>🔒</span>
          <h2>Sign in to use {toolName}</h2>
          <p>Create a free account to get started — no credit card required.</p>
          <Link href="/login" className="btn btn-primary">Sign in or create account</Link>
        </div>
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div className={styles.gate}>
        <div className={styles.gateContent}>
          <span className={styles.gateIcon}>✦</span>
          <h2>You've used your {FREE_LIMIT} free sessions this month</h2>
          <p>Upgrade to RightWords Pro for unlimited access to both tools, plus your full session history.</p>
          <div className={styles.pricing}>
            <div className={styles.price}>$7.99<span>/month</span></div>
            <div className={styles.priceNote}>Unlimited sessions · Full history · Both tools</div>
          </div>
          <Link href="/upgrade" className="btn btn-primary">Upgrade to Pro</Link>
          <p className={styles.resetNote}>Your free sessions reset on the 1st of each month. ({usageCount}/{FREE_LIMIT} used)</p>
        </div>
      </div>
    );
  }

  return children;
}
