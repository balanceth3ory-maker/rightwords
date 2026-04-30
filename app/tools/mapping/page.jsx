'use client';
import { useState } from 'react';
import Nav from '../../../components/Nav';
import UsageGate from '../../../components/UsageGate';
import { supabase } from '../../../lib/supabase';
import styles from './page.module.css';

const CONTEXT_TYPES = [
  'Workplace / colleague', 'Manager / direct report', 'Partner / spouse',
  'Family member', 'Friend', 'Team / group', 'Organization', 'Other'
];

const ROLE_TYPES = ['One of the parties', 'Observer', 'Manager or leader', 'Coach or mediator'];

const MAX_PARTIES = 5;

const REFRAME_LABELS = {
  detoxify: { label: 'Neutral version', hint: 'Same message, no emotional charge' },
  interest: { label: 'Interest-based', hint: 'Names the need underneath the statement' },
  request: { label: 'As a request', hint: 'Something concrete you can ask for' },
  mutual: { label: 'Shared problem', hint: 'Frames it as something to solve together' },
};

export default function MappingTool() {
  const [phase, setPhase] = useState(0);
  const [context, setContext] = useState('');
  const [contextType, setContextType] = useState('');
  const [role, setRole] = useState('');
  const [parties, setParties] = useState([]);
  const [partyDraft, setPartyDraft] = useState({ name: '', description: '' });
  const [userStatement, setUserStatement] = useState('');
  const [aiResponses, setAiResponses] = useState({});
  const [reframes, setReframes] = useState(null);
  const [selectedReframe, setSelectedReframe] = useState('');
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState('');

  function addParty() {
    if (!partyDraft.name.trim() || !partyDraft.description.trim()) {
      setError('Fill in both fields before adding.');
      return;
    }
    setParties(prev => [...prev, { ...partyDraft }]);
    setPartyDraft({ name: '', description: '' });
    setError('');
  }

  function removeParty(i) {
    setParties(prev => prev.filter((_, idx) => idx !== i));
  }

  async function callAI(payload) {
    const res = await fetch('/api/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.text;
  }

  async function submitPhase1() {
    if (!context.trim() || context.trim().length < 15) { setError('Describe the conflict a bit more.'); return; }
    if (!contextType) { setError('Select a context.'); return; }
    if (!role) { setError('Select your role.'); return; }
    setError('');
    setPhase(1);
  }

  async function submitPhase2() {
    if (parties.length < 2) { setError('Add at least two people to continue.'); return; }
    setError('');
    setLoading(true);
    try {
      const text = await callAI({ phase: 2, context, role, contextType, parties });
      setAiResponses(prev => ({ ...prev, 2: text }));
      setPhase(2);
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  async function submitPhase3() {
    if (!userStatement.trim() || userStatement.trim().length < 15) {
      setError('Write a bit more about what you want to say.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const text = await callAI({ phase: 3, context, role, contextType, parties, userStatement });
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setReframes(parsed);
      setPhase(3);
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  async function buildMap() {
    setLoading(true);
    setPhase(4);
    try {
      const text = await callAI({
        phase: 'map',
        context, role, contextType, parties,
        userStatement,
        selectedReframe: selectedReframe
          ? `${REFRAME_LABELS[selectedReframe]?.label}: ${reframes?.[selectedReframe]}`
          : '',
        concernsAnalysis: aiResponses[2] || ''
      });
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setMap(parsed);

      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('sessions').insert({
            user_id: session.user.id,
            tool: 'mapping',
            summary: parsed.coreIssue || 'Conflict map session'
          });
        }
      }
    } catch {
      setMap({ error: true });
    }
    setLoading(false);
  }

  async function emailMap() {
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
      body: JSON.stringify({ to, type: 'map', data: map })
    });
    setEmailStatus(res.ok ? 'sent' : 'error');
  }

  function reset() {
    setPhase(0); setContext(''); setContextType(''); setRole('');
    setParties([]); setPartyDraft({ name: '', description: '' });
    setUserStatement(''); setAiResponses({}); setReframes(null);
    setSelectedReframe(''); setMap(null); setError('');
    setEmailInput(''); setEmailStatus('');
  }

  const PHASES = [
    { num: '01', name: 'The conflict', desc: 'What happened' },
    { num: '02', name: 'The people', desc: "Who's involved" },
    { num: '03', name: 'Reframing', desc: 'How to say it' },
    { num: '04', name: 'Your plan', desc: 'What to do next' },
  ];

  return (
    <>
      <Nav />
      <UsageGate toolName="Right Idea">
        <main className={styles.main}>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <div className={styles.logoWrap}>
                <div className={styles.logoTitle}>Right<br /><em>Idea</em></div>
                <div className={styles.logoTag}>Conflict mapping</div>
              </div>
              <nav className={styles.phaseNav}>
                {PHASES.map((p, i) => (
                  <div key={i} className={`${styles.phaseItem} ${phase === i + 1 || (phase === 0 && i === 0) ? styles.phaseActive : ''} ${phase > i + 1 ? styles.phaseComplete : ''}`}>
                    <span className={styles.phaseNum}>{p.num}</span>
                    <div>
                      <div className={styles.phaseName}>{p.name}</div>
                      <div className={styles.phaseDesc}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </nav>
              {parties.length > 0 && (
                <div className={styles.partySidebar}>
                  <div className={styles.partySidebarLabel}>People added</div>
                  {parties.map((p, i) => (
                    <div key={i} className={styles.partySidebarItem}>
                      <span className={styles.partyDot} />
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </aside>

            <div className={styles.content}>
              <div className={styles.progressBar}>
                {[1,2,3,4].map(i => (
                  <div key={i} className={`${styles.seg} ${phase > i ? styles.segDone : ''} ${phase === i || (phase === 0 && i === 1) ? styles.segActive : ''}`} />
                ))}
              </div>

              {/* Phase 1: The conflict */}
              {phase <= 1 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 01 — The conflict</div>
                  <h1 className={styles.title}>What's the conflict?</h1>

                  <div className={styles.field}>
                    <label>Describe it briefly</label>
                    <textarea
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      placeholder="What's the disagreement about? Keep it factual — no need to take sides yet."
                      rows={3}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>What kind of relationship is this?</label>
                    <div className={styles.optionGrid}>
                      {CONTEXT_TYPES.map(c => (
                        <button key={c} onClick={() => setContextType(c)}
                          className={`${styles.optionBtn} ${contextType === c ? styles.optionBtnSelected : ''}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Your role</label>
                    <div className={styles.optionGrid}>
                      {ROLE_TYPES.map(r => (
                        <button key={r} onClick={() => setRole(r)}
                          className={`${styles.optionBtn} ${role === r ? styles.optionBtnSelected : ''}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  <div className={styles.btnRow}>
                    <button onClick={submitPhase1} className={styles.btnPrimary}>Add the people →</button>
                  </div>
                </div>
              )}

              {/* Phase 2: People */}
              {phase === 1 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 02 — The people</div>
                  <h2 className={styles.title}>Who's involved?</h2>
                  <p className={styles.intro}>Add up to {MAX_PARTIES} people or groups. For each, briefly describe how they see the situation.</p>

                  {parties.length > 0 && (
                    <div className={styles.partyList}>
                      {parties.map((p, i) => (
                        <div key={i} className={styles.partyCard}>
                          <div className={styles.partyCardHeader}>
                            <strong>{p.name}</strong>
                            <button onClick={() => removeParty(i)} className={styles.removeBtn}>✕</button>
                          </div>
                          <div className={styles.partyCardRow}>{p.description}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {parties.length < MAX_PARTIES && (
                    <div className={styles.addParty}>
                      <div className={styles.addPartyLabel}>Add a person or group</div>
                      <input
                        placeholder="Who are they? (e.g. 'My manager', 'The whole team')"
                        value={partyDraft.name}
                        onChange={e => setPartyDraft(d => ({ ...d, name: e.target.value }))}
                      />
                      <input
                        placeholder="How do they see this situation?"
                        value={partyDraft.description}
                        onChange={e => setPartyDraft(d => ({ ...d, description: e.target.value }))}
                      />
                      <button onClick={addParty} className={styles.btnSecondary}>+ Add</button>
                    </div>
                  )}

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  <div className={styles.btnRow}>
                    <button onClick={() => { setPhase(0); setError(''); }} className={styles.btnGhost}>← Back</button>
                    <button onClick={submitPhase2} disabled={loading || parties.length < 2} className={styles.btnPrimary}>
                      {loading ? 'Analysing…' : 'Continue →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Phase 3: Reframing */}
              {phase === 2 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 03 — Reframing</div>
                  <h2 className={styles.title}>What do you want to say?</h2>

                  {aiResponses[2] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>What we see so far</div>
                      <div className={styles.aiText}>{aiResponses[2].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>Write what you want to say or ask about this conflict</label>
                    <p className={styles.fieldHint}>Don't worry about wording — just write what's on your mind.</p>
                    <textarea
                      value={userStatement}
                      onChange={e => setUserStatement(e.target.value)}
                      placeholder="e.g. 'She never listens to my ideas' or 'I feel like I'm being left out of decisions'"
                      rows={4}
                    />
                  </div>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  <div className={styles.btnRow}>
                    <button onClick={() => { setPhase(1); setError(''); }} className={styles.btnGhost}>← Back</button>
                    <button onClick={submitPhase3} disabled={loading} className={styles.btnPrimary}>
                      {loading ? 'Reframing…' : 'See how to say it →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Phase 4: Review reframes */}
              {phase === 3 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 03 — Reframing</div>
                  <h2 className={styles.title}>Four ways to say it.</h2>
                  <p className={styles.intro}>Each version takes your original statement and shifts the approach. Pick the one that fits best, or just use them as a starting point.</p>

                  {reframes && (
                    <div className={styles.reframeGrid}>
                      {Object.entries(REFRAME_LABELS).map(([key, { label, hint }]) => (
                        reframes[key] && (
                          <div
                            key={key}
                            onClick={() => setSelectedReframe(key === selectedReframe ? '' : key)}
                            className={`${styles.reframeCard} ${selectedReframe === key ? styles.reframeSelected : ''}`}
                          >
                            <div className={styles.reframeLabel}>{label}</div>
                            <div className={styles.reframeHint}>{hint}</div>
                            <div className={styles.reframeText}>"{reframes[key]}"</div>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={() => { setPhase(2); setError(''); }} className={styles.btnGhost}>← Back</button>
                    <button onClick={buildMap} className={styles.btnPrimary}>Build my plan →</button>
                  </div>
                </div>
              )}

              {/* Phase 5: Plan output */}
              {phase === 4 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 04 — Your plan</div>
                  <h2 className={styles.title}>Your conflict map.</h2>

                  {!map ? (
                    <div className={styles.thinking}>
                      <div className={styles.dotPulse}><span /><span /><span /></div>
                      Building your plan…
                    </div>
                  ) : map.error ? (
                    <div className={styles.errorMsg}>Something went wrong. Please try again.</div>
                  ) : (
                    <>
                      <div className={styles.mapCard}>
                        <div className={styles.mapSection}>
                          <div className={styles.mapLabel}>What this is really about</div>
                          <div className={styles.mapValue}>{map.coreIssue}</div>
                        </div>

                        {map.concerns?.length > 0 && (
                          <div className={styles.mapSection}>
                            <div className={styles.mapLabel}>Core concerns at play</div>
                            <div className={styles.concernList}>
                              {map.concerns.map((c, i) => (
                                <div key={i} className={styles.concernItem}>
                                  <span className={styles.concernParty}>{c.party}</span>
                                  <span className={styles.concernType}>{c.concern}</span>
                                  <p>{c.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {map.reframe && (
                          <div className={styles.mapSection}>
                            <div className={styles.mapLabel}>How to say it</div>
                            <div className={styles.reframeOutput}>"{map.reframe}"</div>
                          </div>
                        )}

                        {map.approach && (
                          <div className={styles.mapSection}>
                            <div className={styles.mapLabel}>How to start the conversation</div>
                            <div className={styles.mapValue}>{map.approach}</div>
                          </div>
                        )}

                        {map.skills?.length > 0 && (
                          <div className={styles.mapSection}>
                            <div className={styles.mapLabel}>Skills to use</div>
                            <div className={styles.skillList}>
                              {map.skills.map((s, i) => (
                                <div key={i} className={styles.skillItem}>
                                  <div className={styles.skillName}>{s.name}</div>
                                  <p>{s.how}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {map.steps?.length > 0 && (
                          <div className={styles.mapSection}>
                            <div className={styles.mapLabel}>Your action steps</div>
                            <ol className={styles.stepList}>
                              {map.steps.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                          </div>
                        )}

                        {map.affirmation && (
                          <div className={styles.affirmation}>{map.affirmation}</div>
                        )}
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
                            <button onClick={emailMap} disabled={emailStatus === 'sending'} className={styles.btnPrimary}>
                              {emailStatus === 'sending' ? 'Sending…' : 'Send'}
                            </button>
                          </>
                        )}
                        {emailStatus === 'error' && <div className={styles.errorMsg}>Couldn't send — check the address and try again.</div>}
                      </div>

                      <div className={styles.btnRow}>
                        <button onClick={reset} className={styles.btnGhost}>Start a new map</button>
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
