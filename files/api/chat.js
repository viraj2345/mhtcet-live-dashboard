// Vercel serverless — Anthropic proxy + free CET Cell scrape for live_updates

const CET_URL = 'https://cetcell.mahacet.org/';

function decodeHtml(s) {
  return s
    .replace(/&#038;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

async function fetchCetLiveUpdates() {
  const res = await fetch(CET_URL, {
    headers: { 'User-Agent': 'MHT-CET-Live-Dashboard/1.0' },
  });
  if (!res.ok) throw new Error(`CET Cell fetch failed: ${res.status}`);

  const html = await res.text();
  const rowRe =
    /<tr><td data-column="SN">\d+<\/td><td data-column="Course Name">([^<]*)<\/td><td data-column="Subject">([^<]*)<\/td><td data-column="Date">([^<]*)<\/td><td data-column="Download"><a href="([^"]*)"/g;

  const latestNotifications = [];
  let m;
  while ((m = rowRe.exec(html)) !== null && latestNotifications.length < 12) {
    const course = decodeHtml(m[1]);
    const title = decodeHtml(m[2]);
    latestNotifications.push({
      date: m[3].trim(),
      course: course || 'CET',
      title: title || course,
      url: m[4],
    });
  }

  const pcm = latestNotifications.filter(
    (n) =>
      /PCM|PCB|MHT-CET|CAP|portal-2026/i.test(n.course + n.title)
  );

  const importantAnnouncements = (pcm.length ? pcm : latestNotifications)
    .slice(0, 6)
    .map((n) => `${n.date}: ${n.title}`);

  const upcomingEvents = latestNotifications
    .filter((n) => /CAP|Registration|Schedule|Objection/i.test(n.title))
    .slice(0, 4)
    .map((n) => `${n.date} — ${n.title}`);

  return {
    fetchedAt: new Date().toISOString(),
    latestNotifications,
    importantAnnouncements,
    upcomingEvents,
    cetPortalUrl: 'https://portal-2026.maharashtracet.org/',
    capPageUrl: 'https://cetcell.mahacet.org/cap-_2026-27/',
    source: 'cetcell.mahacet.org',
  };
}

async function callAnthropic(systemPrompt, userContent) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      body: {
        error: 'ANTHROPIC_API_KEY is not set',
        hint: 'Add it in Vercel → Environment Variables for AI chat features.',
      },
    };
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text();
    return { ok: false, status: 502, body: { error: 'Upstream API error', detail } };
  }

  const data = await anthropicRes.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  return { ok: true, body: { result: text, usage: data.usage } };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { type, userMessage } = req.body;

    // Free path — no Anthropic key needed
    if (type === 'live_updates') {
      const data = await fetchCetLiveUpdates();
      return res.status(200).json({ result: JSON.stringify(data, null, 2) });
    }

    let systemPrompt = '';
    let userContent = '';

    if (type === 'college_suggest') {
      systemPrompt = `You are an MHT-CET expert counsellor for Maharashtra engineering admissions.
Based on the student's percentile, category, and interest, suggest suitable colleges and courses.
Respond ONLY with valid JSON — no markdown, no extra text.

Return this shape:
{
  "percentile": <number>,
  "category": "<string>",
  "interest": "<string>",
  "recommendation": "<2-3 sentence personalised advice>",
  "colleges": [{"rank": 1, "name": "...", "city": "...", "type": "Government/Autonomous/Private", "branches": ["CS"], "approxCutoff": "99.5+", "whyGood": "...", "website": "https://..."}],
  "courses": [{"name": "...", "why": "...", "avgPackage": "..."}],
  "capAdvice": "..."
}`;
      userContent = userMessage;
    } else if (type === 'ask_cet') {
      systemPrompt = `You are an expert on MHT-CET 2026 examinations conducted by the State Common Entrance Test Cell, Maharashtra (cetcell.mahacet.org).
Answer accurately and concisely. Keep answers under 200 words. Cite cetcell.mahacet.org as the authoritative source.`;
      userContent = userMessage;
    } else if (type === 'scorecard') {
      systemPrompt = `Parse MHT-CET PCM scorecard details and return ONLY valid JSON with physics, chemistry, mathematics marks/percentiles, totalPercentile, approxRank, summary, nextSteps.`;
      userContent = userMessage;
    } else {
      return res.status(400).json({ error: 'Unknown request type' });
    }

    const out = await callAnthropic(systemPrompt, userContent);
    if (!out.ok) return res.status(out.status).json(out.body);
    return res.status(200).json(out.body);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
