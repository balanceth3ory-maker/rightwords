'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '../../../components/Nav';
import UsageGate from '../../../components/UsageGate';
import { supabase } from '../../../lib/supabase';
import styles from './page.module.css';

const CONTEXT_TYPES = [
  'Workplace / colleague', 'Manager / direct report', 'Partner / spouse',
  'Family member', 'Friend', 'Client / customer', 'Other'
];

const PHASES = [
  { num: '00', name: 'Start', desc: 'Set the context' },
  { num: '01', name: 'The situation', desc: 'What happened' },
  { num: '02', name: 'The stakes', desc: "What it's doing to you" },
  { num: '03', name: 'Their side', desc: 'Switch seats' },
  { num: '04', name: 'Your move', desc: 'What you can control' },
  { num: '05', name: 'The reframe', desc: 'The real question' },
];


export default function CoachingTool() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [contextType, setContextType] = useState('');
  const [answers, setAnswers] = useState({});
  const [aiResponses, setAiResponses] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'

  function updateAnswer(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  async function submitPhase(phaseNum) {
    setError('');
    let userContent = '';

    if (phaseNum === 1) {
      const a = answers['1a']?.trim(), b = answers['1b']?.trim();
      if (!a || a.length < 15) { setError('Describe what\'s happening a bit more — a sentence or two at least.'); return; }
      if (!b || b.length < 10) { setError('What outcome are you hoping for?'); return; }
      userContent = `Situation: ${a}\n\nWhat they want: ${b}`;
    } else if (phaseNum === 2) {
      const a = answers['2a']?.trim(), b = answers['2b']?.trim();
      if (!a || a.length < 15) { setError('Say a bit more about how the relationship has been affected.'); return; }
      if (!b || b.length < 10) { setError('What would it say about you if this doesn\'t go your way?'); return; }
      userContent = `How the conflict has affected the relationship: ${a}\n\nWhat it would say about them if this doesn't resolve well: ${b}`;
    } else if (phaseNum === 3) {
      const a = answers['3a']?.trim(), b = answers['3b']?.trim();
      if (!a || a.length < 15) { setError('Try to write more from their perspective.'); return; }
      if (!b || b.length < 10) { setError('What do you think they\'re really trying to protect?'); return; }
      userContent = `How the other person would tell this story: ${a}\n\nWhat they're really protecting: ${b}`;
    } else if (phaseNum === 4) {
      const a = answers['4a']?.trim(), b = answers['4b']?.trim();
      if (!a || a.length < 10) { setError('Is there a disagreement about how decisions get made?'); return; }
      if (!b || b.length < 10) { setError('What could you personally do differently?'); return; }
      userContent = `Whether process/decision-making is part of the conflict: ${a}\n\nWhat they can personally change: ${b}`;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: phaseNum,
          contextType,
          userContent,
          history: conversationHistory
        })
      });
      const data = await res.json();
      const text = data.text;
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: userContent },
        { role: 'assistant', content: text }
      ];
      setConversationHistory(updatedHistory);
      setAiResponses(prev => ({ ...prev, [phaseNum]: text }));
      if (phaseNum < 4) setPhase(phaseNum + 1);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function buildVerdict() {
    setLoading(true);
    setPhase(5);

    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'verdict',
          contextType,
          answers
        })
      });
      const data = await res.json();
      const clean = data.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setVerdict(parsed);

      // Log session
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('sessions').insert({
            user_id: session.user.id,
            tool: 'coaching',
            summary: parsed.title || 'Conflict coaching session'
          });
        }
      }
    } catch (err) {
      setVerdict({
        title: 'Something went wrong building your reframe.',
        body: 'The analysis encountered an error. Your answers have been preserved — please try again.',
        realQuestion: '—', solvable: '—', nextStep: 'Retry the reframe.', stopDoing: '—'
      });
    }
    setLoading(false);
  }

  async function emailVerdict() {
    setEmailStatus('sending');
    let to = emailInput.trim();
    if (!to && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      to = session?.user?.email || '';
    }
    if (!to) { setEmailStatus('error'); return; }
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, type: 'verdict', data: verdict })
    });
    setEmailStatus(res.ok ? 'sent' : 'error');
  }

  function continueToRightIdea() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rw_prefill', JSON.stringify({
        context: answers['1a'] || '',
        contextType,
        fromTool: 'Right Question',
      }));
    }
    router.push('/tools/mapping');
  }

  function reset() {
    setPhase(0); setContextType(''); setAnswers({});
    setAiResponses({}); setConversationHistory([]); setVerdict(null); setError('');
  }

  return (
    <>
      <Nav />
      <UsageGate toolName="Conflict Coaching">
        <main className={styles.main}>
          <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <div className={styles.logoWrap}>
                <div className={styles.logoTitle}>Right<br /><em>Question</em></div>
                <div className={styles.logoTag}>Conflict diagnostic</div>
              </div>
              <nav className={styles.phaseNav}>
                {PHASES.map((p, i) => (
                  <div key={i} className={`${styles.phaseItem} ${phase === i ? styles.phaseActive : ''} ${phase > i ? styles.phaseComplete : ''}`}>
                    <span className={styles.phaseNum}>{p.num}</span>
                    <div>
                      <div className={styles.phaseName}>{p.name}</div>
                      <div className={styles.phaseDesc}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </nav>
              <div className={styles.sidebarNote}>
                The wrong question is usually the one you started with.
              </div>
            </aside>

            {/* Content */}
            <div className={styles.content}>
              {/* Progress */}
              <div className={styles.progressBar}>
                {PHASES.map((_, i) => (
                  <div key={i} className={`${styles.seg} ${phase > i ? styles.segDone : ''} ${phase === i ? styles.segActive : ''}`} />
                ))}
              </div>

              {/* Phase 0: Welcome */}
              {phase === 0 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Conflict diagnostic</div>
                  <h1 className={styles.title}>Are you asking the <em>right question?</em></h1>
                  <p className={styles.contextText}>Most conflicts aren't about what they appear to be about. This tool helps you find what's actually driving yours — and what question you should really be asking.</p>

                  <div className={styles.rulesGrid}>
                    {[
                      ['01', 'Be specific. Vague in, vague out. The more concrete your answers, the sharper the analysis.'],
                      ['02', "Be honest. Especially about your own role. The tool can't help you if you're performing."],
                      ['03', 'Expect discomfort. The reframe at the end may not be what you wanted to hear.'],
                      ['04', 'No fix guaranteed. Some conflicts can be resolved. Some need to be managed. You\'ll find out which.'],
                    ].map(([num, text]) => (
                      <div key={num} className={styles.ruleCard}>
                        <div className={styles.ruleNum}>{num}</div>
                        <p className={styles.ruleText}>{text}</p>
                      </div>
                    ))}
                  </div>

                  <div className={styles.contextSelector}>
                    <div className={styles.csLabel}>What kind of conflict is this?</div>
                    <div className={styles.csOptions}>
                      {CONTEXT_TYPES.map(c => (
                        <button key={c} onClick={() => setContextType(c)}
                          className={`${styles.csBtn} ${contextType === c ? styles.csBtnSelected : ''}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => contextType && setPhase(1)}
                    disabled={!contextType}
                    className={styles.btnPrimary}
                  >
                    Begin the diagnostic →
                  </button>
                </div>
              )}

              {/* Phase 1: The situation */}
              {phase === 1 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 01 — The situation</div>
                  <h2 className={styles.title}>What's the conflict, and what do you want?</h2>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>The situation</div>
                    <p className={styles.qText}>What's the conflict about? Describe what happened and who's involved.</p>
                    <textarea value={answers['1a'] || ''} onChange={e => updateAnswer('1a', e.target.value)}
                      placeholder="Be specific. Who did what? When? What's the disagreement?" rows={4} />
                  </div>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>Your desired outcome</div>
                    <p className={styles.qText}>If this resolved tomorrow, what would that look like?</p>
                    <textarea value={answers['1b'] || ''} onChange={e => updateAnswer('1b', e.target.value)}
                      placeholder="What do you actually want to happen?" rows={3} />
                  </div>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  {aiResponses[1] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>Analysis</div>
                      <div className={styles.aiText}>{aiResponses[1].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={() => setPhase(0)} className={styles.btnGhost}>← Back</button>
                    {!aiResponses[1] ? (
                      <button onClick={() => submitPhase(1)} disabled={loading} className={styles.btnPrimary}>
                        {loading ? 'Analysing…' : 'Submit →'}
                      </button>
                    ) : (
                      <button onClick={() => setPhase(2)} className={styles.btnPrimary}>Continue →</button>
                    )}
                  </div>
                </div>
              )}

              {/* Phase 2: The stakes */}
              {phase === 2 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 02 — The stakes</div>
                  <h2 className={styles.title}>What is this conflict <em>doing</em> to you?</h2>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>The relationship</div>
                    <p className={styles.qText}>How has this conflict affected how you see the other person — or how you think they see you?</p>
                    <textarea value={answers['2a'] || ''} onChange={e => updateAnswer('2a', e.target.value)}
                      placeholder="Has trust broken down? Do you feel disrespected? Dismissed?" rows={4} />
                  </div>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>Your identity</div>
                    <p className={styles.qText}>What would it say about you — your competence, your worth, your values — if this doesn't go your way?</p>
                    <textarea value={answers['2b'] || ''} onChange={e => updateAnswer('2b', e.target.value)}
                      placeholder="What's at stake for how you see yourself?" rows={3} />
                  </div>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  {aiResponses[2] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>Analysis</div>
                      <div className={styles.aiText}>{aiResponses[2].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={() => setPhase(1)} className={styles.btnGhost}>← Back</button>
                    {!aiResponses[2] ? (
                      <button onClick={() => submitPhase(2)} disabled={loading} className={styles.btnPrimary}>
                        {loading ? 'Analysing…' : 'Submit →'}
                      </button>
                    ) : (
                      <button onClick={() => setPhase(3)} className={styles.btnPrimary}>Continue →</button>
                    )}
                  </div>
                </div>
              )}

              {/* Phase 3: Their side */}
              {phase === 3 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 03 — Their side</div>
                  <h2 className={styles.title}>Now switch seats.</h2>
                  <p className={styles.contextText}>This is the hardest phase. Actually try to inhabit their perspective — not to excuse them, but to understand what's driving them.</p>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>Their story</div>
                    <p className={styles.qText}>How would the other person describe this conflict if they were being honest? Write it from their point of view.</p>
                    <textarea value={answers['3a'] || ''} onChange={e => updateAnswer('3a', e.target.value)}
                      placeholder="Write as them, not about them. First person." rows={4} />
                  </div>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>What they're protecting</div>
                    <p className={styles.qText}>Underneath their behavior — what do you think they're actually trying to protect or preserve?</p>
                    <textarea value={answers['3b'] || ''} onChange={e => updateAnswer('3b', e.target.value)}
                      placeholder="Their reputation? Their authority? A relationship? Their sense of fairness?" rows={3} />
                  </div>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  {aiResponses[3] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>Analysis</div>
                      <div className={styles.aiText}>{aiResponses[3].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={() => setPhase(2)} className={styles.btnGhost}>← Back</button>
                    {!aiResponses[3] ? (
                      <button onClick={() => submitPhase(3)} disabled={loading} className={styles.btnPrimary}>
                        {loading ? 'Analysing…' : 'Submit →'}
                      </button>
                    ) : (
                      <button onClick={() => setPhase(4)} className={styles.btnPrimary}>Continue →</button>
                    )}
                  </div>
                </div>
              )}

              {/* Phase 4: Your move */}
              {phase === 4 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 04 — Your move</div>
                  <h2 className={styles.title}>What can you actually control?</h2>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>Process & fairness</div>
                    <p className={styles.qText}>Is part of the conflict about how decisions are made — who has a voice, who gets to decide, whether the process feels fair?</p>
                    <textarea value={answers['4a'] || ''} onChange={e => updateAnswer('4a', e.target.value)}
                      placeholder="Yes, no, or describe the dynamic…" rows={3} />
                  </div>

                  <div className={styles.qCard}>
                    <div className={styles.qLabel}>Your agency</div>
                    <p className={styles.qText}>Setting aside what the other person should do — what could you personally do differently?</p>
                    <textarea value={answers['4b'] || ''} onChange={e => updateAnswer('4b', e.target.value)}
                      placeholder="Be honest. Not 'nothing' — there's always something." rows={3} />
                  </div>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  {aiResponses[4] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>Analysis</div>
                      <div className={styles.aiText}>{aiResponses[4].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={() => setPhase(3)} className={styles.btnGhost}>← Back</button>
                    {!aiResponses[4] ? (
                      <button onClick={() => submitPhase(4)} disabled={loading} className={styles.btnPrimary}>
                        {loading ? 'Analysing…' : 'Submit →'}
                      </button>
                    ) : (
                      <button onClick={buildVerdict} className={styles.btnPrimary}>Build my reframe →</button>
                    )}
                  </div>
                </div>
              )}

              {/* Phase 5: Verdict */}
              {phase === 5 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 05 — The reframe</div>
                  <h2 className={styles.title}>The real question.</h2>

                  {!verdict ? (
                    <div className={styles.thinking}>
                      <div className={styles.dotPulse}><span /><span /><span /></div>
                      Synthesizing all four phases…
                    </div>
                  ) : (
                    <>
                      <div className={styles.verdictCard}>
                        <div className={styles.verdictEyebrow}>What this is really about</div>
                        <div className={styles.verdictTitle}>{verdict.title}</div>
                        <div className={styles.verdictBody}>
                          {verdict.body?.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                        <div className={styles.verdictMeta}>
                          <div>
                            <div className={styles.vmLabel}>The real question</div>
                            <div className={styles.vmValue}>{verdict.realQuestion}</div>
                          </div>
                          <div>
                            <div className={styles.vmLabel}>Is it solvable?</div>
                            <div className={styles.vmValue}>{verdict.solvable}</div>
                          </div>
                          <div>
                            <div className={styles.vmLabel}>Do this week</div>
                            <div className={styles.vmValue}>{verdict.nextStep}</div>
                          </div>
                          <div>
                            <div className={styles.vmLabel}>Stop wasting energy on</div>
                            <div className={styles.vmValue}>{verdict.stopDoing}</div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.emailRow}>
                        {emailStatus === 'sent' ? (
                          <div className={styles.emailSent}>✓ Sent to your inbox</div>
                        ) : (
                          <>
                            <input
                              type="email"
                              placeholder="Email this to me…"
                              value={emailInput}
                              onChange={e => setEmailInput(e.target.value)}
                              className={styles.emailInput}
                            />
                            <button
                              onClick={emailVerdict}
                              disabled={emailStatus === 'sending'}
                              className={styles.btnPrimary}
                            >
                              {emailStatus === 'sending' ? 'Sending…' : 'Send'}
                            </button>
                          </>
                        )}
                        {emailStatus === 'error' && <div className={styles.errorMsg}>Couldn't send — check the address and try again.</div>}
                      </div>

                      <div className={styles.btnRow}>
                        <button onClick={reset} className={styles.btnGhost}>Start a new conflict</button>
                      </div>

                      <div className={styles.nextTools}>
                        <div className={styles.nextToolsLabel}>Take it further</div>
                        <button onClick={continueToRightIdea} className={styles.nextToolPrimary}>
                          Map everyone involved with Right Idea →
                        </button>
                        <Link href="/tools/statement" className={styles.nextToolSecondary}>
                          Draft your message with Right Statement →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </UsageGate>
    </>
  );
}
