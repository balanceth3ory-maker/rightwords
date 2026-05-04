'use client';
import { useState } from 'react';
import Nav from '../../../components/Nav';
import UsageGate from '../../../components/UsageGate';
import { supabase } from '../../../lib/supabase';
import styles from './page.module.css';

const STEPS = [
  {
    key: 'offense',
    label: 'The apology',
    title: 'What are you apologizing for?',
    hint: 'Be specific — the clearer you are, the more it will land.',
    placeholder: "e.g. I'm sorry for how I spoke to you during our argument on Friday…",
    optional: false,
  },
  {
    key: 'explanation',
    label: 'The context',
    title: 'What was going on for you when it happened?',
    hint: 'Honest context helps them understand — this is not an excuse, just the truth.',
    placeholder: 'e.g. I was overwhelmed at work and took it out on you instead of dealing with it…',
    optional: false,
  },
  {
    key: 'responsibility',
    label: 'Ownership',
    title: 'What do you take responsibility for?',
    hint: 'Say it plainly, without “but.” This is the heart of the apology.',
    placeholder: 'e.g. I was wrong to raise my voice. I should have walked away and calmed down…',
    optional: false,
  },
  {
    key: 'repentance',
    label: 'Your commitment',
    title: 'What will you do differently?',
    hint: 'A real commitment, not a vague promise.',
    placeholder: "e.g. When I'm feeling overwhelmed I'll take a break before responding…",
    optional: false,
  },
  {
    key: 'repair',
    label: 'Making it right',
    title: 'Is there anything you can do to make it right?',
    hint: "A specific action if there is one. It's fine if there isn't.",
    placeholder: "e.g. I'd like to sit down and talk it through whenever you're ready…",
    optional: true,
  },
  {
    key: 'forgiveness',
    label: "What you're asking for",
    title: 'What are you hoping for from them?',
    hint: "It's okay to ask. What do you need to move forward together?",
    placeholder: 'e.g. I hope we can work through this and move forward…',
    optional: true,
  },
];

function renderHighlighted(text, highlights, className) {
  if (!highlights?.length) return text;
  let parts = [{ text, highlighted: false }];
  for (const phrase of highlights) {
    parts = parts.flatMap(part => {
      if (part.highlighted) return [part];
      const idx = part.text.indexOf(phrase);
      if (idx === -1) return [part];
      return [
        { text: part.text.slice(0, idx), highlighted: false },
        { text: phrase, highlighted: true },
        { text: part.text.slice(idx + phrase.length), highlighted: false },
      ].filter(p => p.text);
    });
  }
  return parts.map((p, i) =>
    p.highlighted
      ? <mark key={i} className={className}>{p.text}</mark>
      : <span key={i}>{p.text}</span>
  );
}

export default function ApologyTool() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ offense: '', explanation: '', responsibility: '', repentance: '', repair: '', forgiveness: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalSteps = STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const current = STEPS[step];

  function setValue(val) {
    setAnswers(prev => ({ ...prev, [current.key]: val }));
  }

  function canAdvance() {
    if (current.optional) return true;
    return answers[current.key].trim().length > 0;
  }

  async function generate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/apology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      const data = await res.json();
      setResult(data);

      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('sessions').insert({
            user_id: session.user.id,
            tool: 'apology',
            summary: data.apology?.slice(0, 120) || 'Apology generated'
          });
        }
      }
    } catch {
      setResult({ apology: `I'm sorry for ${answers.offense}. I take full responsibility and I'm committed to ${answers.repentance}.`, highlights: [] });
    }
    setLoading(false);
  }

  function next() {
    if (step < totalSteps - 1) setStep(s => s + 1);
    else generate();
  }

  function copy() {
    navigator.clipboard.writeText(result?.apology || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setStep(0);
    setAnswers({ offense: '', explanation: '', responsibility: '', repentance: '', repair: '', forgiveness: '' });
    setResult(null);
    setCopied(false);
  }

  return (
    <>
      <Nav />
      <UsageGate toolName="Right Apology">
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>🤝 Right Apology</h1>
              <p>Six honest answers. One apology worth giving.</p>
            </div>

            {!result ? (
              <div className={styles.card}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>

                <div className={styles.step}>
                  <div className={styles.stepBadge}>
                    <span className={styles.num}>{step + 1}</span>
                    {current.label}
                    {current.optional && <span className={styles.optionalTag}>optional</span>}
                  </div>
                  <h2>{current.title}</h2>
                  <p className={styles.hint}>{current.hint}</p>
                  <textarea
                    value={answers[current.key]}
                    onChange={e => setValue(e.target.value)}
                    placeholder={current.placeholder}
                  />
                  <div className={styles.nav}>
                    {step > 0
                      ? <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
                      : <span />
                    }
                    <button
                      className={step === totalSteps - 1 ? 'btn btn-sage' : 'btn btn-primary'}
                      onClick={next}
                      disabled={!canAdvance()}
                    >
                      {step === totalSteps - 1 ? '✦ Write my apology' : 'Continue →'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.resultCard}>
                {loading ? (
                  <div className={styles.loadingWrap}>
                    <div className={styles.dots}><span /><span /><span /></div>
                    <p>Crafting your apology…</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.resultLabel}>Your apology</div>
                    <div className={styles.apologyText}>
                      {renderHighlighted(result.apology || '', result.highlights || [], styles.highlight)}
                    </div>
                    <div className={styles.highlightNote}>
                      Highlighted phrases are the ones that will matter most to them.
                    </div>
                    <div className={styles.resultActions}>
                      <button onClick={copy} className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}>
                        {copied ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button onClick={reset} className="btn btn-ghost" style={{ fontSize: '14px' }}>Start over</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </UsageGate>
    </>
  );
}
