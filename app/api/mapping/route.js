export async function POST(request) {
  const { phase, context, role, contextType, parties, userStatement, selectedReframe, concernsAnalysis } = await request.json();

  const systemPrompt = (process.env.MAPPING_SYSTEM || '').replace(/\\n/g, '\n');

  let userMessage;
  let maxTokens = 800;

  if (phase === 2) {
    const instruction = (process.env.MAPPING_PHASE_2 || '').replace(/\\n/g, '\n');
    const partiesList = parties.map(p => `${p.name}: ${p.description}`).join('\n');
    userMessage = `${instruction}\n\nConflict: ${context}\nYour role: ${role}\nContext: ${contextType}\n\nPeople involved:\n${partiesList}`;
  } else if (phase === 3) {
    const instruction = (process.env.MAPPING_PHASE_3 || '').replace(/\\n/g, '\n');
    const partiesList = parties.map(p => `${p.name}: ${p.description}`).join('\n');
    userMessage = `${instruction}\n\nConflict: ${context}\nContext: ${contextType}\n\nPeople:\n${partiesList}\n\nWhat the user wants to say:\n"${userStatement}"`;
    maxTokens = 600;
  } else if (phase === 'map') {
    const instruction = (process.env.MAPPING_VERDICT || '').replace(/\\n/g, '\n');
    const partiesList = parties.map(p => `${p.name}: ${p.description}`).join('\n');
    userMessage = `${instruction}\n\nConflict: ${context}\nRole: ${role}\nContext: ${contextType}\n\nPeople:\n${partiesList}\n\nCore concerns analysis:\n${concernsAnalysis || 'Not provided'}\n\nUser's original statement: "${userStatement || ''}"\nUser's chosen reframe: "${selectedReframe || 'None selected'}"`;
    maxTokens = 1600;
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
        max_tokens: maxTokens,
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
