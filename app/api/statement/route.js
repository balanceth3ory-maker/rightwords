export async function POST(request) {
  const { formatTitle, formula, situation, behavior, feelings, impact, request: userRequest } = await request.json();

  const template = (process.env.STATEMENT_SYSTEM || '').replace(/\\n/g, '\n');
  const prompt = template
    .replace('{formatTitle}', formatTitle || '')
    .replace('{formula}', formula || '')
    .replace('{situation}', situation || '')
    .replace('{behavior}', behavior || '')
    .replace('{feelings}', feelings || '')
    .replace('{impact}', impact || '')
    .replace('{requestLine}', userRequest ? `- Request: ${userRequest}` : '');

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return Response.json({ error: data }, { status: response.status });

    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();

    try {
      return Response.json(JSON.parse(clean));
    } catch {
      return Response.json({ primary: text, alternatives: [], tip: '' });
    }

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
