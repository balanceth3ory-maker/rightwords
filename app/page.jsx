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
              RightWords helps you find the right words to turn conflict into connection.
              Our tools don't hand you answers — they guide you to think through issues,
              reframe your perspective, and communicate more clearly with partners,
              colleagues, family, or friends.
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
              <h2>Right Statement</h2>
              <p>
                Your conflict coaching guide for words. It doesn't give you ready-made answers —
                it helps you think through your feelings and needs to craft a clear, non-blaming
                message. Using I-statements, XYZ statements, or Nonviolent Communication, it
                guides you step-by-step so you can refine your own perspective and say what matters.
              </p>
              <ul className={styles.toolFeatures}>
                <li>Three proven communication formats</li>
                <li>Emotion picker + guided prompts</li>
                <li>AI-crafted statement with alternatives</li>
                <li>Editable, copyable result</li>
              </ul>
              <Link href="/tools/statement" className="btn btn-primary">Try Right Statement</Link>
            </div>

            <div className={`${styles.toolCard} ${styles.toolCardSage}`}>
              <div className={styles.toolIcon}>⚖️</div>
              <h2>Right Question</h2>
              <p>
                Your personal conflict coaching guide. Instead of giving you answers, it helps
                you think through the issue, shift your perspective, and move past surface
                arguments. Its simple four-phase process reveals the real question underneath
                so you can approach the conflict with clarity.
              </p>
              <ul className={styles.toolFeatures}>
                <li>Four-phase structured diagnostic</li>
                <li>Identifies the real layer driving the conflict</li>
                <li>Forces perspective-taking</li>
                <li>Ends with a sharp, plain-language reframe</li>
              </ul>
              <Link href="/tools/coaching" className="btn btn-sage">Try Right Question</Link>
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
