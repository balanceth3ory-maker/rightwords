'use client';
import { useState } from 'react';
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

const PHASE_INSTRUCTIONS = {
  1: `The user has described their situation and what outcome they want. Your job:
1. In one short paragraph, name what you notice about how they've framed the problem. What does their language tell you about how they see it? Keep it simple and direct.
2. In a second short paragraph, note whether their desired outcome is about the surface issue, the relationship, their sense of self, or who has control. Don't name these categories — just describe what you observe naturally.
3. End with one simple question: something like "When did this start feeling like more than just a disagreement about X?"
Keep the whole response to 4-6 sentences total.`,

  2: `The user has answered questions about how the conflict has affected the relationship and what it says about them. Your job:
1. In one short paragraph, tell them directly which seems more true: that this conflict is mainly hurting the relationship, or mainly threatening something about how they see themselves. Be specific about what you see.
2. In a second short paragraph, note if these two things are connected — often the relationship feels damaged because of what the other person's behavior seems to say about us.
3. End with one pointed question about what would have to happen for them to feel okay — not just for the conflict to end, but for them to feel respected or valued again.
Keep it to 5-7 sentences total.`,

  3: `The user has tried to take the other person's perspective and identified what that person might be protecting. Your job:
1. In one paragraph, be honest: did they really switch sides, or are they still centering themselves? Tell them plainly.
2. In a second paragraph, compare what the user wants versus what the other person seems to want. Are they actually fighting about the same thing, or about two completely different things?
3. End with: "Given what they seem to need — and what you seem to need — where do those things actually conflict, and where might they not?"
Keep it to 5-7 sentences total.`,

  4: `The user has answered whether decision-making process is part of the conflict, and what they could change themselves. Your job:
1. In one paragraph, identify whether the process/fairness issue is real or secondary. If it IS the real issue, name that directly.
2. In a second paragraph, reflect their own-actions answer back to them honestly. Is what they named actually within their control? Are they avoiding something harder?
3. End with one direct question that sets up the reframe: something like "If you couldn't change anything about the other person or the outcome — only your own choices — what would you do?"
Keep it to 5-7 sentences total.`
};

function getSystemPrompt(contextType) {
  return `You are the analytical engine behind "Right Question," a conflict coaching guide built by a PhD organizational behaviorist and trained mediator. Your job is to help people think through the issue, shift their perspective, and move past surface arguments to find the real question underneath.

CONTEXT: ${contextType}

YOUR ANALYTICAL FRAMEWORK (use this privately — never name it):
Every conflict involves multiple layers of motivation. As you analyze responses, identify which layer is dominant:
- The surface issue: what the conflict appears to be about on the surface
- The relationship layer: what the conflict is doing to trust, respect, closeness
- The identity layer: what the conflict is saying about who they are — competence, worth, or values being threatened
- The process layer: whether the real issue is about fairness, voice, or who has the right to make decisions

The surface issue is rarely the real driver.

YOUR TONE AND STYLE:
- Short. Two paragraphs maximum per response. Never more.
- Direct and plain — 9th grade reading level. No academic language.
- Name what you see without cushioning it. Be honest, not harsh.
- Never use therapy language. You're an analyst, not a counselor.
- Ask one sharp follow-up question at the end of each response.
- Never use bullet points, headers, or lists. Plain prose only.`;
}

export default function CoachingTool() {
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
    const newHistory = [...conversationHistory, {
      role: 'user',
      content: `${PHASE_INSTRUCTIONS[phaseNum]}\n\nUser's answers: ${userContent}`
    }];

    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          systemPrompt: getSystemPrompt(contextType)
        })
      });
      const data = await res.json();
      const text = data.text;
      const updatedHistory = [...newHistory, { role: 'assistant', content: text }];
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

    const summaryPrompt = `You've now seen all four phases of this person's conflict. Synthesize everything into a final reframe.

Context: ${contextType}
What they said the conflict is about: ${answers['1a']}
What outcome they want: ${answers['1b']}
How the relationship has been affected: ${answers['2a']}
What it says about them: ${answers['2b']}
Their perspective-taking attempt: ${answers['3a']}
What they think the other person is protecting: ${answers['3b']}
Whether process/decision-making is the real issue: ${answers['4a']}
What they can personally change: ${answers['4b']}

SYNTHESIS TASK:
Identify which layer is actually driving this conflict — surface disagreement, relationship issue, identity issue, or process issue. Don't name the layer academically — describe it plainly.

Give them a sharp, plain-language reframe: what is this really about, and what is the right question to be asking?

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "title": "one sharp sentence (10-15 words) naming what this is really about",
  "body": "exactly 2 short paragraphs. First: what layer is driving this and why. Second: what to do with that insight. Plain language, 9th grade reading level.",
  "realQuestion": "The real question is... (1 plain sentence)",
  "solvable": "one of: Yes — there are clear steps | Partly — some things can change, some can't | Not directly — this needs to be managed, not fixed",
  "nextStep": "one concrete action they can take this week (1 sentence)",
  "stopDoing": "one thing to stop wasting energy on (1 sentence)"
}`;

    const newHistory = [{ role: 'user', content: summaryPrompt }];

    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          systemPrompt: getSystemPrompt(contextType)
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
                <div className={styles.logoTitle}>Wrong<br /><em>Question</em></div>
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
