export async function POST(request) {
  const { offense, explanation, responsibility, repentance, repair, forgiveness } = await request.json();

  const prompt = `You are helping someone write a sincere, concise apology to give to another person.
Based on their answers, write a 1-2 sentence apology that feels honest and human — not stiff or formulaic.
Weave the key elements together naturally. Do not use hollow filler phrases like "I understand" or "I realize."

What they're apologizing for: ${offense}
Why it happened (their context, not an excuse): ${explanation || 'not provided'}
What they take responsibility for: ${responsibility}
What they will do differently: ${repentance}
How they will make it right: ${repair || 'not provided'}
What they are asking for: ${forgiveness || 'not provided'}

Return ONLY valid JSON — no markdown, no explanation:
{
  "apology": "The full 1-2 sentence apology",
  "highlights": ["exact phrase 1", "exact phrase 2", "exact phrase 3"]
}

The highlights must be exact substrings of the apology text. Choose 3-5 phrases that carry the emotional weight — the specific offense named, the ownership claimed, and the commitment made.`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        max_tokens: 600,
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
      return Response.json({ apology: text, highlights: [] });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
