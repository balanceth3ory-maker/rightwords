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

const ROLE_TYPES = ['One of the parties', 'Observer / third party', 'Manager or leader', 'Coach or mediator'];

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

  function addParty() {
    if (!partyDraft.name.trim() || !partyDraft.position.trim() || !partyDraft.need.trim()) {
      setError('Fill in the name, position, and need before adding.');
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
    if (!contextType) { setError('Select a context type.'); return; }
    if (!role) { setError('Select your role.'); return; }
    setError('');
    setPhase(1);
  }

  async function submitPhase2() {
    if (parties.length < 2) { setError('Add at least two parties to map.'); return; }
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
    if (!connections.trim() || connections.trim().length < 20) { setError('Describe the relationships in a bit more detail.'); return; }
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

  function reset() {
    setPhase(0); setContext(''); setContextType(''); setRole('');
    setParties([]); setPartyDraft({ name: '', position: '', need: '' });
    setConnections(''); setAiResponses({}); setMap(null); setError('');
  }

  const PHASES = [
    { num: '01', name: 'The conflict', desc: 'What and who' },
    { num: '02', name: 'The parties', desc: 'Nodes in the network' },
    { num: '03', name: 'The connections', desc: 'Edges and tensions' },
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
                  <div className={styles.partySidebarLabel}>Parties mapped</div>
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

              {/* Phase 0/1: The conflict */}
              {phase <= 1 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 01 — The conflict</div>
                  <h1 className={styles.title}>What's the conflict, and where do you stand?</h1>
                  <p className={styles.intro}>Describe the situation as neutrally as you can — no blame, just facts.</p>

                  <div className={styles.field}>
                    <label>The conflict</label>
                    <textarea
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      placeholder="In one or two sentences, what is this conflict about?"
                      rows={3}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Context</label>
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
                    <label>Your role in this</label>
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
                    <button onClick={submitPhase1} className={styles.btnPrimary}>Add parties →</button>
                  </div>
                </div>
              )}

              {/* Phase 2: Parties */}
              {phase === 1 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 02 — The parties</div>
                  <h2 className={styles.title}>Who is in this network?</h2>
                  <p className={styles.intro}>Add the key people or groups — up to {MAX_PARTIES}. For each, note what they say they want and what they actually need.</p>

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
                      <div className={styles.addPartyLabel}>Add a party</div>
                      <input
                        placeholder="Name or role (e.g. 'My manager', 'The team')"
                        value={partyDraft.name}
                        onChange={e => setPartyDraft(d => ({ ...d, name: e.target.value }))}
                      />
                      <input
                        placeholder="Their position — what do they say they want?"
                        value={partyDraft.position}
                        onChange={e => setPartyDraft(d => ({ ...d, position: e.target.value }))}
                      />
                      <input
                        placeholder="Their interest — what do they actually need?"
                        value={partyDraft.need}
                        onChange={e => setPartyDraft(d => ({ ...d, need: e.target.value }))}
                      />
                      <button onClick={addParty} className={styles.btnSecondary}>+ Add party</button>
                    </div>
                  )}

                  {error && <div className={styles.errorMsg}>{error}</div>}
                  <div className={styles.btnRow}>
                    <button onClick={() => { setPhase(0); setError(''); }} className={styles.btnGhost}>← Back</button>
                    <button onClick={submitPhase2} disabled={loading || parties.length < 2} className={styles.btnPrimary}>
                      {loading ? 'Analysing…' : 'Map connections →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Phase 3: Connections */}
              {phase === 2 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 03 — The connections</div>
                  <h2 className={styles.title}>How are these people connected?</h2>

                  {aiResponses[2] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>Party analysis</div>
                      <div className={styles.aiText}>{aiResponses[2].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>Relationships and tensions</label>
                    <p className={styles.fieldHint}>Who is allied with whom? Where is the tension? Who has power over whom? Who is being left out?</p>
                    <textarea
                      value={connections}
                      onChange={e => setConnections(e.target.value)}
                      placeholder="Describe the web of relationships as you see it…"
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
                  <div className={styles.eyebrow}>Phase 03 — The connections</div>
                  <h2 className={styles.title}>Ready to build the map.</h2>

                  {aiResponses[3] && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiLabel}>Relationship analysis</div>
                      <div className={styles.aiText}>{aiResponses[3].split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={() => { setPhase(2); setError(''); }} className={styles.btnGhost}>← Back</button>
                    <button onClick={buildMap} className={styles.btnPrimary}>Build my map →</button>
                  </div>
                </div>
              )}

              {/* Phase 5: Map output */}
              {phase === 4 && (
                <div className={styles.phase}>
                  <div className={styles.eyebrow}>Phase 04 — The map</div>
                  <h2 className={styles.title}>Your conflict map.</h2>

                  {!map ? (
                    <div className={styles.thinking}>
                      <div className={styles.dotPulse}><span /><span /><span /></div>
                      Mapping the network…
                    </div>
                  ) : map.error ? (
                    <div className={styles.errorMsg}>Something went wrong generating the map. Please try again.</div>
                  ) : (
                    <>
                      <div className={styles.mapCard}>
                        <div className={styles.mapSection}>
                          <div className={styles.mapLabel}>Core issue</div>
                          <div className={styles.mapValue}>{map.coreIssue}</div>
                        </div>

                        <div className={styles.mapSection}>
                          <div className={styles.mapLabel}>The parties</div>
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
                          <div className={styles.mapLabel}>Relationship dynamics</div>
                          <div className={styles.relationList}>
                            {map.relationships?.map((r, i) => (
                              <div key={i} className={`${styles.relationItem} ${styles['rel_' + r.type]}`}>
                                <span className={styles.relationParties}>{r.between?.join(' ↔ ')}</span>
                                <span className={styles.relationType}>{r.type}</span>
                                <p>{r.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={styles.mapMeta}>
                          <div className={styles.mapMetaItem}>
                            <div className={styles.mapLabel}>Key insight</div>
                            <div className={styles.mapValue}>{map.insight}</div>
                          </div>
                          <div className={styles.mapMetaItem}>
                            <div className={styles.mapLabel}>Where change is possible</div>
                            <div className={styles.mapValue}>{map.leverage}</div>
                          </div>
                          <div className={styles.mapMetaItem}>
                            <div className={styles.mapLabel}>Suggested first step</div>
                            <div className={styles.mapValue}>{map.recommendation}</div>
                          </div>
                        </div>
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
