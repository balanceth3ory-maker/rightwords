'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../components/Nav';
import { supabase } from '../../lib/supabase';
import styles from './page.module.css';

export default function Upgrade() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      setUser(session.user);
    });
  }, []);

  async function handleUpgrade() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>✦ Upgrade</div>
          <h1>RightWords Pro</h1>
          <p className={styles.sub}>Unlimited access to both tools, your full session history, and everything we build next.</p>

          <div className={styles.pricingCard}>
            <div className={styles.price}>$7.99<span>/month</span></div>
            <ul className={styles.features}>
              <li>✓ Unlimited Statement Builder sessions</li>
              <li>✓ Unlimited Conflict Coaching sessions</li>
              <li>✓ Full session history saved</li>
              <li>✓ Cancel anytime</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading || !user}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              {loading ? 'Redirecting to checkout…' : 'Upgrade now — $7.99/mo'}
            </button>
            <p className={styles.note}>Secure payment via Stripe. Cancel anytime from your account settings.</p>
          </div>

          <div className={styles.compare}>
            <div className={styles.compareCol}>
              <div className={styles.compareHeader}>Free</div>
              <div className={styles.compareItem}>3 sessions/month</div>
              <div className={styles.compareItem}>Both tools</div>
              <div className={`${styles.compareItem} ${styles.dim}`}>No session history</div>
            </div>
            <div className={`${styles.compareCol} ${styles.compareColPro}`}>
              <div className={styles.compareHeader}>Pro ✦</div>
              <div className={styles.compareItem}>Unlimited sessions</div>
              <div className={styles.compareItem}>Both tools</div>
              <div className={styles.compareItem}>Full session history</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
