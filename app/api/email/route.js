import { Resend } from 'resend';

function verdictHtml(verdict) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #2d2926; background: #faf6f0;">
      <div style="font-size: 13px; color: #c4714a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">✦ RightWords — Right Question</div>
      <h1 style="font-size: 22px; font-weight: 600; line-height: 1.4; margin: 0 0 24px;">${verdict.title}</h1>

      <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e0d8cf;">
        ${verdict.body.split('\n\n').map(p => `<p style="font-size: 15px; line-height: 1.8; margin: 0 0 16px; color: #2d2926;">${p}</p>`).join('')}
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 16px; border-top: 1px solid #e0d8cf; vertical-align: top; width: 50%;">
            <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">The real question</div>
            <div style="font-size: 14px; font-style: italic; color: #2d2926;">${verdict.realQuestion}</div>
          </td>
          <td style="padding: 16px; border-top: 1px solid #e0d8cf; vertical-align: top; width: 50%;">
            <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Is it solvable?</div>
            <div style="font-size: 14px; color: #2d2926;">${verdict.solvable}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px; border-top: 1px solid #e0d8cf; vertical-align: top;">
            <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Do this week</div>
            <div style="font-size: 14px; color: #2d2926;">${verdict.nextStep}</div>
          </td>
          <td style="padding: 16px; border-top: 1px solid #e0d8cf; vertical-align: top;">
            <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Stop wasting energy on</div>
            <div style="font-size: 14px; color: #2d2926;">${verdict.stopDoing}</div>
          </td>
        </tr>
      </table>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0d8cf; font-size: 12px; color: #7a6f68; font-family: system-ui, sans-serif;">
        Sent from <a href="https://rightwords.app" style="color: #c4714a;">RightWords</a>
      </div>
    </div>
  `;
}

function statementHtml(result) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #2d2926; background: #faf6f0;">
      <div style="font-size: 13px; color: #c4714a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">✦ RightWords — Right Statement</div>
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 24px;">Your statement</h1>

      <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 2px solid #c4714a;">
        <p style="font-size: 17px; line-height: 1.8; margin: 0; color: #2d2926; font-style: italic;">"${result.primary}"</p>
      </div>

      ${result.alternatives?.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Other options</div>
          ${result.alternatives.map(alt => `
            <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 8px; border: 1px solid #e0d8cf; font-size: 14px; line-height: 1.7; color: #2d2926; font-style: italic;">"${alt}"</div>
          `).join('')}
        </div>
      ` : ''}

      ${result.tip ? `
        <div style="background: #f3f0eb; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.7; color: #7a6f68; font-family: system-ui, sans-serif;">
          <strong style="color: #2d2926;">Delivery tip:</strong> ${result.tip}
        </div>
      ` : ''}

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0d8cf; font-size: 12px; color: #7a6f68; font-family: system-ui, sans-serif;">
        Sent from <a href="https://rightwords.app" style="color: #c4714a;">RightWords</a>
      </div>
    </div>
  `;
}

function mapHtml(map) {
  const partiesHtml = map.parties?.map(p => `
    <div style="background: #f0f4f9; border-radius: 8px; padding: 14px; margin-bottom: 8px;">
      <div style="font-size: 14px; font-weight: 600; color: #2d4060; margin-bottom: 6px;">${p.name}</div>
      <div style="font-size: 13px; color: #3d3a34; margin-bottom: 3px;"><strong>Says:</strong> ${p.position}</div>
      <div style="font-size: 13px; color: #3d3a34;"><strong>Needs:</strong> ${p.interest}</div>
    </div>
  `).join('') || '';

  const relationsHtml = map.relationships?.map(r => `
    <div style="padding: 10px 14px; border-left: 3px solid ${r.type === 'tension' ? '#bf6a6a' : r.type === 'alliance' ? '#6abf8a' : '#7a9cbf'}; margin-bottom: 8px; background: #f8f8f8; border-radius: 0 6px 6px 0;">
      <div style="font-size: 13px; font-weight: 600; color: #2d2926; margin-bottom: 3px;">${r.between?.join(' ↔ ')}</div>
      <div style="font-size: 13px; color: #7a6f68;">${r.description}</div>
    </div>
  `).join('') || '';

  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #2d2926; background: #faf6f0;">
      <div style="font-size: 13px; color: #4a6a9c; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">✦ RightWords — Right Idea</div>
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 6px; line-height: 1.3;">Your conflict map</h1>
      <p style="font-size: 14px; color: #7a6f68; margin: 0 0 24px; font-style: italic;">${map.coreIssue}</p>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-family: system-ui;">The people</div>
        ${partiesHtml}
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-family: system-ui;">How they relate</div>
        ${relationsHtml}
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 14px; border-top: 1px solid #e0d8cf; vertical-align: top; width: 50%;">
            <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: system-ui;">What stands out</div>
            <div style="font-size: 13px; color: #2d2926; line-height: 1.5;">${map.insight}</div>
          </td>
          <td style="padding: 14px; border-top: 1px solid #e0d8cf; vertical-align: top; width: 50%;">
            <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: system-ui;">Where to focus</div>
            <div style="font-size: 13px; color: #2d2926; line-height: 1.5;">${map.leverage}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 14px; border-top: 1px solid #e0d8cf;">
            <div style="font-size: 11px; color: #7a6f68; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: system-ui;">First step</div>
            <div style="font-size: 13px; color: #2d2926; line-height: 1.5;">${map.recommendation}</div>
          </td>
        </tr>
      </table>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0d8cf; font-size: 12px; color: #7a6f68; font-family: system-ui, sans-serif;">
        Sent from <a href="https://rightwords.app" style="color: #c4714a;">RightWords</a>
      </div>
    </div>
  `;
}

export async function POST(request) {
  const { to, type, data } = await request.json();

  if (!to || !type || !data) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const emailConfig = type === 'verdict'
    ? { subject: `Your conflict reframe: "${data.title}"`, html: verdictHtml(data) }
    : type === 'map'
    ? { subject: 'Your conflict map from RightWords', html: mapHtml(data) }
    : { subject: 'Your Right Statement from RightWords', html: statementHtml(data) };

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'RightWords <onboarding@resend.dev>',
      to,
      ...emailConfig,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
