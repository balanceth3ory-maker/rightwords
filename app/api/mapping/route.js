export async function POST(request) {
  const { phase, context, role, contextType, parties, connections } = await request.json();

  const systemPrompt = (process.env.MAPPING_SYSTEM || '').replace(/\\n/g, '\n');

  let userMessage;

  if (phase === 2) {
    const instruction = (process.env.MAPPING_PHASE_2 || '').replace(/\\n/g, '\n');
    const partiesList = parties.map((p, i) =>
      `Party ${i + 1}: ${p.name}\n  Position (what they say they want): ${p.position}\n  Interest (what they actually need): ${p.need}`
    ).join('\n\n');
    userMessage = `${instruction}\n\nConflict: ${context}\nYour role: ${role}\nContext: ${contextType}\n\nParties:\n${partiesList}`;
  } else if (phase === 3) {
    const instruction = (process.env.MAPPING_PHASE_3 || '').replace(/\\n/g, '\n');
    userMessage = `${instruction}\n\nConflict: ${context}\nYour role: ${role}\nConnections described: ${connections}`;
  } else if (phase === 'map') {
    const template = (process.env.MAPPING_VERDICT || '').replace(/\\n/g, '\n');
    const partiesList = parties.map((p, i) =>
      `Party ${i + 1}: ${p.name} | Position: ${p.position} | Interest: ${p.need}`
    ).join('\n');
    userMessage = template
      .replace('{context}', context || '')
      .replace('{role}', role || '')
      .replace('{contextType}', contextType || '')
      .replace('{parties}', partiesList || '')
      .replace('{connections}', connections || '');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        max_tokens: 1200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) return Response.json({ text: 'API error: ' + response.status }, { status: response.status });

    const text = data.choices?.[0]?.message?.content || '';
    return Response.json({ text });

  } catch (err) {
    clearTimeout(timeout);
    const msg = err.name === 'AbortError' ? 'Request timed out — please try again.' : 'Something went wrong.';
    return Response.json({ text: msg }, { status: 500 });
  }
}
