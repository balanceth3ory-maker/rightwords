import Link from 'next/link';
import Nav from '../components/Nav';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>✦ Communication tools powered by AI</div>
            <h1 className={styles.headline}>
              Find the <em>right words</em><br />
              when it matters most.
            </h1>
            <p className={styles.subhead}>
              Two tools. One purpose — helping you communicate with clarity,
              even when it's hard.
            </p>
            <div className={styles.heroCta}>
              <Link href="/login" className="btn btn-primary">Get started free</Link>
              <Link href="#tools" className="btn btn-ghost">See the tools ↓</Link>
            </div>
            <p className={styles.heroNote}>3 free sessions/month · No credit card required</p>
          </div>
          <div className={styles.heroOrb} aria-hidden />
        </section>

        {/* Tools */}
        <section className={styles.tools} id="tools">
          <div className={styles.toolsGrid}>
            <div className={styles.toolCard}>
              <div className={styles.toolIcon}>🕊️</div>
              <h2>Statement Builder</h2>
              <p>
                Craft a clear, non-blaming I-statement, XYZ statement, or
                Nonviolent Communication message — guided step by step,
                refined by AI.
              </p>
              <ul className={styles.toolFeatures}>
                <li>Three proven communication formats</li>
                <li>Emotion picker + guided prompts</li>
                <li>AI-crafted statement with alternatives</li>
                <li>Editable, copyable result</li>
              </ul>
              <Link href="/tools/statement" className="btn btn-primary">Try Statement Builder</Link>
            </div>

            <div className={`${styles.toolCard} ${styles.toolCardSage}`}>
              <div className={styles.toolIcon}>⚖️</div>
              <h2>Wrong Question</h2>
              <p>
                A conflict diagnostic built by a PhD organizational behaviorist.
                Find out what your conflict is really about — and what question
                you should actually be asking.
              </p>
              <ul className={styles.toolFeatures}>
                <li>Four-phase structured diagnostic</li>
                <li>Identifies the real layer driving the conflict</li>
                <li>Forces perspective-taking</li>
                <li>Ends with a sharp, plain-language reframe</li>
              </ul>
              <Link href="/tools/coaching" className="btn btn-sage">Try Wrong Question</Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className={styles.pricing}>
          <h2 className={styles.sectionTitle}>Simple pricing</h2>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <div className={styles.planName}>Free</div>
              <div className={styles.planPrice}>$0</div>
              <ul className={styles.planFeatures}>
                <li>3 sessions per month</li>
                <li>Both tools included</li>
                <li>No credit card needed</li>
              </ul>
              <Link href="/login" className="btn btn-ghost" style={{ width: '100%' }}>Get started</Link>
            </div>
            <div className={`${styles.pricingCard} ${styles.pricingCardPro}`}>
              <div className={styles.planBadge}>Most popular</div>
              <div className={styles.planName}>Pro</div>
              <div className={styles.planPrice}>$7.99<span>/mo</span></div>
              <ul className={styles.planFeatures}>
                <li>Unlimited sessions</li>
                <li>Full session history</li>
                <li>Both tools included</li>
                <li>Priority support</li>
              </ul>
              <Link href="/upgrade" className="btn btn-primary" style={{ width: '100%' }}>Upgrade to Pro</Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <span className={styles.footerLogo}>✦ RightWords</span>
          <p>Made with care for people who want to communicate better.</p>
        </footer>
      </main>
    </>
  );
}
