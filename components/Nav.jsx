'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import styles from './Nav.module.css';

export default function Nav() {
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkPro(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkPro(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkPro(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .single();
    setIsPro(data?.is_pro ?? false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const isHome = pathname === '/';

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoMark}>✦</span>
        <span className={styles.logoText}>RightWords</span>
      </Link>

      <div className={styles.links}>
        {user ? (
          <>
            <Link href="/dashboard" className={`${styles.link} ${pathname === '/dashboard' ? styles.active : ''}`}>
              Dashboard
            </Link>
            <Link href="/tools/statement" className={`${styles.link} ${pathname.includes('statement') ? styles.active : ''}`}>
              Right Statement
            </Link>
            <Link href="/tools/coaching" className={`${styles.link} ${pathname.includes('coaching') ? styles.active : ''}`}>
              Right Question
            </Link>
            <Link href="/tools/mapping" className={`${styles.link} ${pathname.includes('mapping') ? styles.active : ''}`}>
              Right Idea
            </Link>
            {!isPro && (
              <Link href="/upgrade" className={styles.upgradeBadge}>
                Go Pro
              </Link>
            )}
            {isPro && <span className={styles.proBadge}>Pro ✦</span>}
            <button onClick={signOut} className={styles.signOut}>Sign out</button>
          </>
        ) : (
          <>
            {!isHome && (
              <Link href="/" className={styles.link}>Home</Link>
            )}
            <Link href="/login" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
              Sign in
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
