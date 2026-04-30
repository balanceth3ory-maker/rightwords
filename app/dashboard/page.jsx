'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';
import styles from './page.module.css';

const FREE_LIMIT = 3;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    setUser(session.user);

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    setProfile(prof);

    const { data: sess } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setSessions(sess || []);

    // Monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .gte('created_at', startOfMonth.toISOString());
    setUsageCount(count || 0);
    setLoading(false);
  }

  if (loading) return (
    <>
      <Nav />
      <div className={styles.loading}><div className={styles.spinner} /></div>
    </>
  );

  const isPro = profile?.is_pro;
  const usagePercent = Math.min((usageCount / FREE_LIMIT) * 100, 100);

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1>Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}</h1>
              <p>What do you need help communicating today?</p>
            </div>
            {isPro && <span className={styles.proBadge}>✦ Pro</span>}
          </div>

          {/* Usage bar for free users */}
          {!isPro && (
            <div className={styles.usageCard}>
              <div className={styles.usageTop}>
                <span>Free sessions this month</span>
                <span>{usageCount} / {FREE_LIMIT}</span>
              </div>
              <div className={styles.usageBar}>
                <div
                  className={styles.usageFill}
                  style={{ width: `${usagePercent}%`, background: usageCount >= FREE_LIMIT ? '#c0392b' : 'var(--clay)' }}
                />
              </div>
              {usageCount >= FREE_LIMIT && (
                <p className={styles.usageWarning}>
                  You've used all your free sessions. <Link href="/upgrade">Upgrade to Pro</Link> for unlimited access.
                </p>
              )}
            </div>
          )}

          {/* Tool cards */}
          <div className={styles.toolsGrid}>
            <Link href="/tools/statement" className={styles.toolCard}>
              <span className={styles.toolIcon}>🕊️</span>
              <div>
                <h3>Right Statement</h3>
                <p>Craft an I-statement, XYZ statement, or NVC message with AI guidance.</p>
              </div>
              <span className={styles.toolArrow}>→</span>
            </Link>
            <Link href="/tools/coaching" className={`${styles.toolCard} ${styles.toolCardSage}`}>
              <span className={styles.toolIcon}>⚖️</span>
              <div>
                <h3>Right Question</h3>
                <p>A conflict diagnostic that finds what your conflict is really about.</p>
              </div>
              <span className={styles.toolArrow}>→</span>
            </Link>
          </div>

          {/* Session history */}
          <div className={styles.historySection}>
            <h2>Recent sessions</h2>
            {sessions.length === 0 ? (
              <div className={styles.emptyHistory}>
                <p>No sessions yet — pick a tool above to get started.</p>
              </div>
            ) : (
              <div className={styles.sessionList}>
                {sessions.map(s => (
                  <div key={s.id} className={styles.sessionItem}>
                    <span className={styles.sessionTool}>
                      {s.tool === 'statement' ? '🕊️ Right Statement' : '⚖️ Right Question'}
                    </span>
                    <p className={styles.sessionSnippet}>{s.summary || 'Session completed'}</p>
                    <span className={styles.sessionDate}>
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
