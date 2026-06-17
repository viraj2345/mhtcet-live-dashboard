// =============================================================
// FILE: api/chat.js
// PURPOSE: Vercel Serverless Function — proxies requests to
//          Anthropic API so the API key is NEVER exposed in
//          the browser. Also scrapes cetcell.mahacet.org live.
// DEPLOY:  Push to GitHub → connect to Vercel → set env var
//          ANTHROPIC_API_KEY = sk-ant-...
// =============================================================

export default async function handler(req, res) {

  // ── CORS headers so your frontend (any origin) can call this ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { type, userMessage } = req.body;

    // ── Pick the right system prompt based on request type ──
    let systemPrompt = '';
    let userContent  = '';

    if (type === 'live_updates') {
      // Fetches cetcell.mahacet.org and returns structured JSON
      systemPrompt = `You are a data extraction assistant for MHT-CET students.
Your job: visit cetcell.mahacet.org, read the latest notifications table, and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

Return this exact shape:
{
  "fetchedAt": "<ISO timestamp>",
  "latestNotifications": [
    { "date": "DD/MM/YYYY", "course": "...", "title": "...", "url": "..." }
  ],
  "importantAnnouncements": ["...", "..."],
  "upcomingEvents": ["...", "..."],
  "cetPortalUrl": "https://portal-2026.maharashtracet.org/",
  "capPageUrl": "https://cetcell.mahacet.org/cap-_2026-27/"
}

Fetch https://cetcell.mahacet.org/ now and fill in the real data. Include up to 10 notifications.`;
      userContent = 'Fetch cetcell.mahacet.org right now and return the latest notifications as JSON.';

    } else if (type === 'college_suggest') {
      systemPrompt = `You are an MHT-CET expert counsellor for Maharashtra engineering admissions.
Based on the student's percentile, category, and interest, suggest suitable colleges and courses.
Respond ONLY with valid JSON — no markdown, no extra text.

Return this shape:
{
  "percentile": <number>,
  "category": "<string>",
  "interest": "<string>",
  "recommendation": "<2-3 sentence personalised advice>",
  "colleges": [
    {
      "rank": 1,
      "name": "...",
      "city": "...",
      "type": "Government/Autonomous/Private",
      "branches": ["CS", "IT"],
      "approxCutoff": "99.5+",
      "whyGood": "...",
      "website": "https://..."
    }
  ],
  "courses": [
    { "name": "...", "why": "...", "avgPackage": "..." }
  ],
  "capAdvice": "..."
}`;
      userContent = userMessage; // e.g. "Percentile: 97.5, Category: OBC, Interest: CS"

    } else if (type === 'ask_cet') {
      // General CET Q&A
      systemPrompt = `You are an expert on MHT-CET 2026 examinations conducted by the State Common Entrance Test Cell, Maharashtra (cetcell.mahacet.org).
Answer the student's question accurately and concisely. Use web search if needed for latest info.
Respond in plain text (not JSON). Keep answers under 200 words. Be friendly and helpful.
Always cite cetcell.mahacet.org as the authoritative source.`;
      userContent = userMessage;

    } else if (type === 'scorecard') {
      systemPrompt = `You are an MHT-CET PCM 2026 scorecard analyst for Maharashtra students.
Parse the student's scorecard details from the message and return ONLY valid JSON — no markdown.

Return this shape:
{
  "physics": { "marks": <number>, "percentile": <number> },
  "chemistry": { "marks": <number>, "percentile": <number> },
  "mathematics": { "marks": <number>, "percentile": <number> },
  "totalPercentile": <number>,
  "approxRank": <number or null>,
  "summary": "<2-3 sentence analysis>",
  "nextSteps": ["...", "..."]
}`;
      userContent = userMessage;

    } else {
      return res.status(400).json({ error: 'Unknown request type' });
    }

    // ── Call Anthropic API with web_search tool enabled ──
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            process.env.ANTHROPIC_API_KEY,
        'anthropic-version':    '2023-06-01',
        'anthropic-beta':       'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 2000,
        system:     systemPrompt,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 3
          }
        ],
        messages: [{ role: 'user', content: userContent }]
      })
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'Upstream API error', detail: err });
    }

    const data = await anthropicRes.json();

    // Extract text from all content blocks (text + tool_result)
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    return res.status(200).json({ result: text, usage: data.usage });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
