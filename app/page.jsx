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

        {/* Recommended Flow */}
        <section className={styles.flow}>
          <div className={styles.flowInner}>
            <div className={styles.flowHeading}>
              <div className={styles.flowLabel}>Recommended path</div>
              <p className={styles.flowSub}>Use these tools in order to work through any difficult conversation.</p>
            </div>
            <div className={styles.flowSteps}>
              <Link href="/tools/coaching" className={styles.flowStep}>
                <div className={styles.flowNum}>1</div>
                <span className={styles.flowStepIcon}>⚖️</span>
                <div className={styles.flowStepName}>Right Question</div>
                <div className={styles.flowStepDesc}>Find the real problem</div>
              </Link>
              <span className={styles.flowArrow}>→</span>
              <Link href="/tools/mapping" className={styles.flowStep}>
                <div className={styles.flowNum}>2</div>
                <span className={styles.flowStepIcon}>🗺️</span>
                <div className={styles.flowStepName}>Right Idea</div>
                <div className={styles.flowStepDesc}>Map everyone involved</div>
              </Link>
              <span className={styles.flowArrow}>→</span>
              <Link href="/tools/statement" className={styles.flowStep}>
                <div className={styles.flowNum}>3</div>
                <span className={styles.flowStepIcon}>🕊️</span>
                <div className={styles.flowStepName}>Right Statement</div>
                <div className={styles.flowStepDesc}>Say what needs to be said</div>
              </Link>
              <span className={styles.flowArrow}>→</span>
              <Link href="/tools/apology" className={styles.flowStep}>
                <div className={styles.flowNum}>4</div>
                <span className={styles.flowStepIcon}>🤝</span>
                <div className={styles.flowStepName}>Right Apology</div>
                <div className={styles.flowStepDesc}>Close the loop with honesty</div>
              </Link>
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className={styles.tools} id="tools">
          <div className={styles.toolsGrid}>
            <div className={styles.toolCard}>
              <div className={styles.toolIcon}>🕊️</div>
              <h2>Right Statement</h2>
              <p>Turn your raw feelings into a respectful message you can actually deliver.</p>
              <ul className={styles.toolFeatures}>
                <li>Three proven communication formats</li>
                <li>Guided prompts for feelings and needs</li>
                <li>AI-crafted statement, ready to copy</li>
                <li>Editable result</li>
              </ul>
              <Link href="/tools/statement" className="btn btn-primary">Try Right Statement</Link>
            </div>

            <div className={`${styles.toolCard} ${styles.toolCardSage}`}>
              <div className={styles.toolIcon}>⚖️</div>
              <h2>Right Question</h2>
              <p>Stop fighting the wrong battle. Discover the real question driving the conflict.</p>
              <ul className={styles.toolFeatures}>
                <li>Four-phase conflict diagnostic</li>
                <li>Finds the real layer driving the conflict</li>
                <li>Forces honest perspective-taking</li>
                <li>Plain-language reframe of the real question</li>
              </ul>
              <Link href="/tools/coaching" className="btn btn-sage">Try Right Question</Link>
            </div>

            <div className={`${styles.toolCard} ${styles.toolCardBlue}`}>
              <div className={styles.toolIcon}>🗺️</div>
              <h2>Right Idea</h2>
              <p>Map the full picture and build a practical, neutral action plan.</p>
              <ul className={styles.toolFeatures}>
                <li>Maps everyone involved and their core concerns</li>
                <li>Identifies what each person is really protecting</li>
                <li>Reframes what you want to say — four ways</li>
                <li>Concrete, personalized action plan</li>
              </ul>
              <Link href="/tools/mapping" className="btn btn-blue">Try Right Idea</Link>
            </div>

            <div className={styles.toolCard}>
              <div className={styles.toolIcon}>🤝</div>
              <h2>Right Apology</h2>
              <p>Six honest answers. One apology worth giving — and worth receiving.</p>
              <ul className={styles.toolFeatures}>
                <li>Guided by the six elements of a complete apology</li>
                <li>Concise, human result — not a script</li>
                <li>Key phrases highlighted for the recipient</li>
                <li>Copy and send when you're ready</li>
              </ul>
              <Link href="/tools/apology" className="btn btn-primary">Try Right Apology</Link>
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
              <div className={styles.planPrice}>$2.99<span>/mo</span></div>
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
