export async function POST(request) {
  const { prompt } = await request.json();

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-3',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return Response.json({ error: data }, { status: response.status });

    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(clean);
      return Response.json(parsed);
    } catch {
      return Response.json({ primary: text, alternatives: [], tip: '' });
    }

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
