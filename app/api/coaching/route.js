export async function POST(request) {
  const { phase, contextType, userContent, history, answers } = await request.json();

  const systemPrompt = (process.env.COACHING_SYSTEM || '')
    .replace(/\\n/g, '\n')
    .replace('{contextType}', contextType || '');

  let messages;

  if (phase === 'verdict') {
    const template = (process.env.COACHING_VERDICT || '').replace(/\\n/g, '\n');
    const verdictPrompt = template
      .replace('{contextType}', contextType || '')
      .replace('{1a}', answers?.['1a'] || '')
      .replace('{1b}', answers?.['1b'] || '')
      .replace('{2a}', answers?.['2a'] || '')
      .replace('{2b}', answers?.['2b'] || '')
      .replace('{3a}', answers?.['3a'] || '')
      .replace('{3b}', answers?.['3b'] || '')
      .replace('{4a}', answers?.['4a'] || '')
      .replace('{4b}', answers?.['4b'] || '');
    messages = [{ role: 'user', content: verdictPrompt }];
  } else {
    const instruction = (process.env[`COACHING_PHASE_${phase}`] || '').replace(/\\n/g, '\n');
    messages = [
      ...(history || []),
      { role: 'user', content: `${instruction}\n\nUser's answers: ${userContent}` }
    ];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    console.log(`[coaching] phase=${phase} messages=${messages.length} sending to xAI...`);
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    clearTimeout(timeout);
    console.log(`[coaching] xAI responded in ${Date.now() - t0}ms — HTTP ${response.status}`);
    const data = await response.json();
    if (!response.ok) return Response.json({ text: 'API error: ' + response.status }, { status: response.status });

    const text = data.choices?.[0]?.message?.content || 'No response';
    console.log(`[coaching] done in ${Date.now() - t0}ms total`);
    return Response.json({ text });

  } catch (err) {
    clearTimeout(timeout);
    console.log(`[coaching] failed after ${Date.now() - t0}ms — ${err.name}: ${err.message}`);
    const msg = err.name === 'AbortError' ? 'Request timed out — please try again.' : 'Network error: ' + err.message;
    return Response.json({ text: msg }, { status: 500 });
  }
}
