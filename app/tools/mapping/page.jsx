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

export default function MappingTool() {
  const [phase, setPhase] = useState(0);
  const [context, setContext] = useState('');
  const [contextType, setContextType] = useState('');
  const [role, setRole] = useState('');
  const [parties, setParties] = useState([]);
  const [partyDraft, setPartyDraft] = useState({ name: '', position: '', need: '' });
  const [connections, setConnections] = useState('');
  const [aiResponses, setAiResponses] = useState({});
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState('');

  function addParty() {
    if (!partyDraft.name.trim() || !partyDraft.position.trim() || !partyDraft.need.trim()) {
      setError('Fill in all three fields before adding.');
      return;
    }
    setParties(prev => [...prev, { ...partyDraft }]);
    setPartyDraft({ name: '', position: '', need: '' });
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
    if (!connections.trim() || connections.trim().length < 20) { setError('Add a bit more detail about the relationships.'); return; }
    setError('');
    setLoading(true);
    try {
      const text = await callAI({ phase: 3, context, role, contextType, parties, connections });
      setAiResponses(prev => ({ ...prev, 3: text }));
      setPhase(3);
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  async function buildMap() {
    setLoading(true);
    setPhase(4);
    try {
      const text = await callAI({ phase: 'map', context, role, contextType, parties, connections });
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
    setParties([]); setPartyDraft({ name: '', position: '', need: '' });
    setConnections(''); setAiResponses({}); setMap(null); setError('');
    setEmailInput(''); setEmailStatus('');
  }

  const PHASES = [
    { num: '01', name: 'The conflict', desc: 'What happened' },
    { num: '02', name: 'The people', desc: "Who's involved" },
    { num: '03', name: 'The relationships', desc: 'How they connect' },
    { num: '04', name: 'The map', desc: 'Full picture' },
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
                  <p className={styles.intro}>Add up to {MAX_PARTIES} people or groups. For each, note what they want and what they actually need.</p>

                  {parties.length > 0 && (
                    <div className={styles.partyList}>
                      {parties.map((p, i) => (
                        <div key={i} className={styles.partyCard}>
                          <div className={styles.partyCardHeader}>
                            <strong>{p.name}</strong>
                            <button onClick={() => removeParty(i)} className={styles.removeBtn}>✕</button>
                          </div>
                          <div className={styles.partyCardRow}><span>Wants:</span> {p.position}</div>
                          <div className={styles.partyCardRow}><span>Needs:</span> {p.need}</div>
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
                        placeholder="What do they say they want?"
                        value={partyDraft.position}
                        onChange={e => setPartyDraft(d => ({ ...d, position: e.target.value }))}
                      />
                      <input
                        placeholder="What do they actually need, underneath that?"
                        value={partyDraft.need}
                        onChange={e => setPartyDraft(d => ({ ...d, need: e.target.value }))}
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

              {/* Phase 3: Relationships */}
              {phase === 2 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 03 — The relationships</div>
                  <h2 className={styles.title}>How do these people relate to each other?</h2>

                  {aiResponses[2] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>What we see so far</div>
                      <div className={styles.aiText}>{aiResponses[2].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>Describe the relationships</label>
                    <p className={styles.fieldHint}>Who gets along? Who is in conflict? Who has more power?</p>
                    <textarea
                      value={connections}
                      onChange={e => setConnections(e.target.value)}
                      placeholder="Describe how these people relate to each other…"
                      rows={5}
                    />
                  </div>

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  <div className={styles.btnRow}>
                    <button onClick={() => { setPhase(1); setError(''); }} className={styles.btnGhost}>← Back</button>
                    <button onClick={submitPhase3} disabled={loading} className={styles.btnPrimary}>
                      {loading ? 'Analysing…' : 'Continue →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Phase 4: Build map */}
              {phase === 3 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 03 — The relationships</div>
                  <h2 className={styles.title}>Ready to build your map.</h2>

                  {aiResponses[3] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>What we see so far</div>
                      <div className={styles.aiText}>{aiResponses[3].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={() => { setPhase(2); setError(''); }} className={styles.btnGhost}>← Back</button>
                    <button onClick={buildMap} className={styles.btnPrimary}>Build my map →</button>
                  </div>
                </div>
              )}

              {/* Map output */}
              {phase === 4 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Step 04 — The map</div>
                  <h2 className={styles.title}>Your conflict map.</h2>

                  {!map ? (
                    <div className={styles.thinking}>
                      <div className={styles.dotPulse}><span /><span /><span /></div>
                      Building your map…
                    </div>
                  ) : map.error ? (
                    <div className={styles.errorMsg}>Something went wrong. Please try again.</div>
                  ) : (
                    <>
                      <div className={styles.mapCard}>
                        <div className={styles.mapSection}>
                          <div className={styles.mapLabel}>What it's really about</div>
                          <div className={styles.mapValue}>{map.coreIssue}</div>
                        </div>

                        <div className={styles.mapSection}>
                          <div className={styles.mapLabel}>The people</div>
                          <div className={styles.partyGrid}>
                            {map.parties?.map((p, i) => (
                              <div key={i} className={styles.partyMapCard}>
                                <div className={styles.partyMapName}>{p.name}</div>
                                <div className={styles.partyMapRow}><span>Says:</span> {p.position}</div>
                                <div className={styles.partyMapRow}><span>Needs:</span> {p.interest}</div>
                                {p.power && <div className={styles.partyMapPower}>{p.power} influence</div>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={styles.mapSection}>
                          <div className={styles.mapLabel}>How they relate</div>
                          <div className={styles.relationList}>
                            {map.relationships?.map((r, i) => (
                              <div key={i} className={`${styles.relationItem} ${styles['rel_' + r.type]}`}>
                                <span className={styles.relationParties}>{r.between?.join(' ↔ ')}</span>
                                <p>{r.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={styles.mapMeta}>
                          <div className={styles.mapMetaItem}>
                            <div className={styles.mapLabel}>What stands out</div>
                            <div className={styles.mapValue}>{map.insight}</div>
                          </div>
                          <div className={styles.mapMetaItem}>
                            <div className={styles.mapLabel}>Where to focus</div>
                            <div className={styles.mapValue}>{map.leverage}</div>
                          </div>
                          <div className={styles.mapMetaItem}>
                            <div className={styles.mapLabel}>First step</div>
                            <div className={styles.mapValue}>{map.recommendation}</div>
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
                            <button onClick={emailMap} disabled={emailStatus === 'sending'} className={styles.btnPrimary}>
                              {emailStatus === 'sending' ? 'Sending…' : 'Send'}
                            </button>
                          </>
                        )}
                        {emailStatus === 'error' && <div className={styles.errorMsg}>Couldn't send — check the address and try again.</div>}
                      </div>

                      <div className={styles.btnRow}>
                        <button onClick={reset} className={styles.btnGhost}>Map a new conflict</button>
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
