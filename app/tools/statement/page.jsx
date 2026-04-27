'use client';
import { useState } from 'react';
import Nav from '../../../components/Nav';
import UsageGate from '../../../components/UsageGate';
import { supabase } from '../../../lib/supabase';
import styles from './page.module.css';

const FORMATS = {
  i: {
    title: 'I-Statement',
    formula: '"I feel [emotion] when [behavior] because [impact]."',
    desc: 'Shifts focus from blame to your own experience — disarming and easier for the other person to hear.',
    step4label: 'The impact',
    step4title: 'Why did it matter to you?',
    step4hint: 'What need, value, or expectation was affected?',
  },
  xyz: {
    title: 'XYZ Statement',
    formula: '"When you did X, in situation Y, I felt Z."',
    desc: 'Anchors your message to a specific moment — the other person can\'t argue with a fact.',
    step4label: 'Your reaction',
    step4title: 'What was your emotional reaction in that moment?',
    step4hint: 'Describe your inner experience right when it happened.',
  },
  nvc: {
    title: 'NVC Format',
    formula: '"I observe [fact]. I feel [emotion]. I need [need]. Would you be willing to [request]?"',
    desc: 'Nonviolent Communication — the most thorough framework for deep mutual understanding.',
    step4label: 'Your underlying need',
    step4title: 'What universal need is at the root of this?',
    step4hint: 'Examples: belonging, autonomy, respect, safety, understanding, connection…',
  }
};

const EMOTIONS = [
  'hurt', 'frustrated', 'dismissed', 'anxious', 'overwhelmed',
  'disrespected', 'lonely', 'unappreciated', 'confused', 'sad',
  'angry', 'disappointed', 'embarrassed', 'scared', 'left out', 'invisible'
];

export default function StatementTool() {
  const [format, setFormat] = useState('i');
  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState('');
  const [behavior, setBehavior] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [customEmotion, setCustomEmotion] = useState('');
  const [impact, setImpact] = useState('');
  const [request, setRequest] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;
  const fmt = FORMATS[format];

  function toggleEmotion(e) {
    setSelectedEmotions(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  }

  function allEmotions() {
    return [...selectedEmotions, customEmotion].filter(Boolean).join(', ');
  }

  async function generate() {
    setLoading(true);
    setResult(null);

    const feelings = allEmotions();
    const prompt = `You are a compassionate communication coach. Help craft a ${fmt.title} to resolve a conflict.

Format: ${fmt.title}
Formula: ${fmt.formula}

User's input:
- Situation: ${situation}
- Specific behavior: ${behavior}
- Feelings: ${feelings}
- Impact/need: ${impact}
${request ? `- Request: ${request}` : ''}

Respond ONLY with a valid JSON object, no markdown:
{
  "primary": "Main statement — warm, clear, non-blaming, natural to say aloud",
  "alternatives": ["Alternative phrasing 1", "Alternative phrasing 2"],
  "tip": "One practical delivery tip about timing, tone, or emotional preparation (2 sentences)"
}`;

    try {
      const res = await fetch('/api/statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setResult(data);

      // Log session
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('sessions').insert({
            user_id: session.user.id,
            tool: 'statement',
            summary: data.primary?.slice(0, 120) || 'Statement generated'
          });
        }
      }
    } catch (err) {
      setResult({
        primary: `I feel ${feelings} when ${behavior}, because ${impact}.${request ? ` I'd appreciate it if ${request}.` : ''}`,
        alternatives: [],
        tip: 'Choose a calm moment when neither of you is tired or rushed.'
      });
    }
    setLoading(false);
  }

  async function rephrase() {
    setLoading(true);
    const res = await fetch('/api/statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Rephrase this ${fmt.title} with a meaningfully different structure and tone: "${result.primary}". Context: feelings: ${allEmotions()}, impact: ${impact}. Respond ONLY with JSON: {"primary": "new version"}`
      })
    });
    const data = await res.json();
    setResult(prev => ({ ...prev, primary: data.primary || prev.primary }));
    setLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(result?.primary || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setStep(1); setSituation(''); setBehavior('');
    setSelectedEmotions([]); setCustomEmotion('');
    setImpact(''); setRequest(''); setResult(null);
  }

  return (
    <>
      <Nav />
      <UsageGate toolName="Statement Builder">
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>🕊️ Statement Builder</h1>
              <p>Turn a difficult moment into a clear, caring message.</p>
            </div>

            {/* Format tabs */}
            <div className={styles.formatTabs}>
              {Object.entries(FORMATS).map(([key, f]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={`${styles.formatTab} ${format === key ? styles.active : ''}`}
                >
                  {f.title}
                </button>
              ))}
            </div>

            {/* Format explainer */}
            <div className={styles.explainer}>
              <div className={styles.formula}>{fmt.formula}</div>
              <p>{fmt.desc}</p>
            </div>

            {/* Steps or Result */}
            {!result ? (
              <div className={styles.card}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <div className={styles.step}>
                    <div className={styles.stepBadge}><span className={styles.num}>1</span> Set the scene</div>
                    <h2>What's the situation?</h2>
                    <p className={styles.hint}>Briefly describe what happened — just the facts, no judgment yet.</p>
                    <textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="e.g. My partner made plans without checking with me first…" />
                    <div className={styles.nav}>
                      <span />
                      <button className="btn btn-primary" onClick={() => situation.trim() && setStep(2)}>Continue →</button>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className={styles.step}>
                    <div className={styles.stepBadge}><span className={styles.num}>2</span> The behavior</div>
                    <h2>What specific action triggered this?</h2>
                    <p className={styles.hint}>Describe what you observed — something you could capture on video. Avoid interpretations.</p>
                    <textarea value={behavior} onChange={e => setBehavior(e.target.value)} placeholder="e.g. When they made plans for Saturday without asking me…" />
                    <div className={styles.nav}>
                      <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                      <button className="btn btn-primary" onClick={() => behavior.trim() && setStep(3)}>Continue →</button>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className={styles.step}>
                    <div className={styles.stepBadge}><span className={styles.num}>3</span> Your feelings</div>
                    <h2>How did it make you feel?</h2>
                    <p className={styles.hint}>Choose one or more — or type your own.</p>
                    <div className={styles.emotionGrid}>
                      {EMOTIONS.map(e => (
                        <button
                          key={e}
                          onClick={() => toggleEmotion(e)}
                          className={`${styles.chip} ${selectedEmotions.includes(e) ? styles.chipSelected : ''}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={customEmotion} onChange={e => setCustomEmotion(e.target.value)} placeholder="Or type your own feeling…" />
                    <div className={styles.nav}>
                      <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                      <button className="btn btn-primary" onClick={() => allEmotions() && setStep(4)}>Continue →</button>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <div className={styles.step}>
                    <div className={styles.stepBadge}><span className={styles.num}>4</span> {fmt.step4label}</div>
                    <h2>{fmt.step4title}</h2>
                    <p className={styles.hint}>{fmt.step4hint}</p>
                    <textarea value={impact} onChange={e => setImpact(e.target.value)} placeholder="e.g. …because I need us to make decisions together as a team." />
                    <div className={styles.nav}>
                      <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
                      <button className="btn btn-primary" onClick={() => impact.trim() && setStep(5)}>Continue →</button>
                    </div>
                  </div>
                )}

                {/* Step 5 */}
                {step === 5 && (
                  <div className={styles.step}>
                    <div className={styles.stepBadge}><span className={styles.num}>5</span> Your request</div>
                    <h2>What would you like to happen? <em style={{ fontStyle: 'italic', fontWeight: 400, fontSize: '15px', color: 'var(--warm-gray)' }}>(optional)</em></h2>
                    <p className={styles.hint}>A concrete, positive, doable request — not a demand.</p>
                    <textarea value={request} onChange={e => setRequest(e.target.value)} placeholder="e.g. I'd love it if we could check in with each other before making weekend plans…" style={{ minHeight: '80px' }} />
                    <div className={styles.nav}>
                      <button className="btn btn-ghost" onClick={() => setStep(4)}>← Back</button>
                      <button className="btn btn-sage" onClick={generate}>✦ Craft my statement</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.resultCard}>
                {loading ? (
                  <div className={styles.loadingWrap}>
                    <div className={styles.dots}>
                      <span /><span /><span />
                    </div>
                    <p>Crafting your statement…</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.resultLabel}>Your statement</div>
                    <textarea
                      className={styles.statementEdit}
                      value={result.primary || ''}
                      onChange={e => setResult(prev => ({ ...prev, primary: e.target.value }))}
                    />
                    <div className={styles.resultActions}>
                      <button onClick={copy} className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}>
                        {copied ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button onClick={rephrase} className="btn btn-ghost" style={{ fontSize: '14px' }}>↻ Rephrase</button>
                      <button onClick={reset} className="btn btn-ghost" style={{ fontSize: '14px' }}>Start over</button>
                    </div>

                    {result.alternatives?.length > 0 && (
                      <div className={styles.alts}>
                        <div className={styles.altsLabel}>Other options</div>
                        {result.alternatives.map((alt, i) => (
                          <div key={i} className={styles.altItem} onClick={() => setResult(prev => ({ ...prev, primary: alt }))}>
                            {alt}
                          </div>
                        ))}
                      </div>
                    )}

                    {result.tip && (
                      <div className={styles.tip}>
                        <strong>💡 Delivery tip</strong>
                        {result.tip}
                      </div>
                    )}
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
