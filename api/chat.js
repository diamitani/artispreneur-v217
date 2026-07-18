// Vercel serverless function — powers BOTH the homepage demo widget (index.html)
// and the Rostr Agent Terminal (workspace.html) with a real LLM call.
//
// Provider: Gemini by default (genuine free tier — cheapest option), DeepSeek as a
// paid-but-very-cheap alternative. No AWS/Bedrock account needed, no new npm deps —
// both providers are called with plain fetch(), which Vercel's Node runtime has built in.
//
// To activate, set these as Vercel project environment variables (never commit them):
//   LLM_PROVIDER        "gemini" (default) or "deepseek"
//   GEMINI_API_KEY       from https://aistudio.google.com/apikey — free tier
//   DEEPSEEK_API_KEY     from https://platform.deepseek.com — only needed if LLM_PROVIDER=deepseek
//
// If no key is configured, or the call fails for any reason, this endpoint returns a
// non-200 and the frontend falls back to its static canned replies — the chat never
// breaks, it just degrades from "dynamic" to "static demo".
//
// Daily usage limiting: enforced client-side (localStorage) in index.html/workspace.html
// since this project has no database/KV store yet. That's a soft cap (clearable by the
// user), not real abuse protection — if this needs to be bulletproof, add Vercel KV or
// Upstash Redis and move the counter server-side, keyed by a signed anonymous user id.

const GEMINI_MODEL = 'gemini-2.0-flash';
const DEEPSEEK_MODEL = 'deepseek-chat';
const MAX_MESSAGE_LEN = 500;
const MAX_HISTORY_TURNS = 6;
const MAX_OUTPUT_TOKENS = 300;

const HOMEPAGE_PROMPT = `You are the Artispreneur homepage demo agent. Artispreneur is an AI operating
system for independent musicians, with specialist agents for PRO registration/royalties,
distribution, sync licensing, legal/business setup (LLC, EIN, contracts), and finance/taxes.
Answer briefly (under 120 words), in a friendly, direct tone. When relevant, end by inviting
the user to create a free workspace at /signup.html. Never invent specific numbers, legal
advice, or guarantees — this is a marketing demo, not the real agent workspace.`;

const AGENT_CONTEXT = {
  manager: 'Manager — orchestrator: business plans, calendar, projects, strategy.',
  rostr: 'ROSTR PAL — compiles onboarding answers into soul.md, a bio, and a 30-day plan.',
  legal: 'Legal — LLC/EIN formation, contracts, trademarks.',
  business: 'Business — business-structure education, EIN checklist, contractor docs.',
  finance: 'Finance — banking, taxes, quarterly estimates, revenue analysis.',
  outreach: 'Outreach — pitches to blogs, playlists, radio, venues; CRM tracking.',
  distribution: 'Distribution — DSP accounts, playlisting strategy, ad campaigns.',
  tutor: 'Tutor — Academy guide, turns lessons into projects, accountability.',
  catalog: 'Catalog — publishing, ISRC/UPC tracking, splitsheets, discography.',
  pro: 'PRO Agent — BMI/ASCAP/SESAC registration, royalties, splitsheets.',
  licensing: 'Licensing — sync opportunities, music libraries, supervisor pitches.',
};

function workspacePrompt(agentKey) {
  const role = AGENT_CONTEXT[agentKey] || AGENT_CONTEXT.manager;
  return `You are the Rostr Agent — Artispreneur's AI music-business workspace — currently acting as
the ${role}
Answer briefly (under 150 words) and practically. Ask for the specific missing details you'd need
to actually do the task (song title, state, dollar amount, etc.) rather than inventing facts.
Never claim to have registered, filed, submitted, or paid anything — only a connected human/service
can confirm a real-world action completed. This is a demo workspace, not a real production system yet.`;
}

async function callGemini(apiKey, systemPrompt, message, history) {
  const contents = [
    ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] },
  ];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.6 },
    }),
  });
  if (!r.ok) throw new Error(`gemini_http_${r.status}`);
  const data = await r.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini_empty_response');
  return text.trim();
}

async function callDeepSeek(apiKey, systemPrompt, message, history) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.text })),
    { role: 'user', content: message },
  ];
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, messages, max_tokens: MAX_OUTPUT_TOKENS, temperature: 0.6 }),
  });
  if (!r.ok) throw new Error(`deepseek_http_${r.status}`);
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('deepseek_empty_response');
  return text.trim();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if ((provider === 'gemini' && !geminiKey) || (provider === 'deepseek' && !deepseekKey)) {
    res.status(503).json({ error: 'llm_not_configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const message = String(body?.message || '').slice(0, MAX_MESSAGE_LEN).trim();
  if (!message) {
    res.status(400).json({ error: 'empty_message' });
    return;
  }
  const history = (Array.isArray(body?.history) ? body.history : [])
    .filter(h => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'assistant'))
    .slice(-MAX_HISTORY_TURNS)
    .map(h => ({ role: h.role, text: String(h.text).slice(0, MAX_MESSAGE_LEN) }));

  const surface = body?.surface === 'workspace' ? 'workspace' : 'homepage';
  const systemPrompt = surface === 'workspace' ? workspacePrompt(body?.agent) : HOMEPAGE_PROMPT;

  try {
    const reply = provider === 'deepseek'
      ? await callDeepSeek(deepseekKey, systemPrompt, message, history)
      : await callGemini(geminiKey, systemPrompt, message, history);
    res.status(200).json({ reply, provider, model: provider === 'deepseek' ? DEEPSEEK_MODEL : GEMINI_MODEL });
  } catch (err) {
    console.error('chat_error', err?.message || err);
    res.status(502).json({ error: 'llm_call_failed' });
  }
};
