// Vercel serverless function — powers BOTH the homepage demo widget (index.html)
// and the Rostr Agent Terminal (workspace.html) with a real LLM call.
//
// Four providers, tried cheapest/simplest-first:
//   - gateway   (default, tried first) — Vercel AI Gateway via the 'ai' package. Model is
//                whatever GATEWAY_MODEL is set to (default: deepseek/deepseek-chat). Browse
//                the exact model catalog/slugs in the Vercel dashboard under AI Gateway →
//                Models — they change over time and aren't hardcoded here beyond the default.
//                IMPORTANT — I could only verify the failure/fallback path from this sandbox,
//                not a real successful Gateway call: the installed SDK (ai@7.0.31) explicitly
//                asks for AI_GATEWAY_API_KEY in its own error when unauthenticated, even with
//                a VERCEL_OIDC_TOKEN present. If OIDC-only auth (no API key, per Vercel's own
//                "no Gateway API key needed" docs) doesn't work once actually deployed, set
//                AI_GATEWAY_API_KEY explicitly (Vercel dashboard → AI Gateway → API Keys) —
//                the router falls through to direct DeepSeek/Bedrock/Gemini either way, so
//                nothing breaks regardless, but confirm this path is truly live before relying
//                on it as your primary route.
//   - deepseek                — direct call, very cheap, OpenAI-compatible API. Fallback for
//                               when Gateway isn't enabled on this Vercel project/account.
//   - bedrock                 — Amazon Nova Micro, Bedrock's cheapest first-party model,
//                               called via Bedrock's bearer-token API keys (no SigV4 signing)
//   - gemini                  — genuine free tier, last-resort fallback
// All four are called with plain fetch()/the 'ai' package — no AWS SDK dependency.
//
// LLM_PROVIDER controls routing:
//   "router" (default)  — tries gateway, then deepseek, then bedrock, then gemini, using
//                          whichever have credentials configured, until one succeeds
//   "gateway" | "deepseek" | "bedrock" | "gemini" — pin to a single provider
//
// Required Vercel project environment variables (set in the dashboard — never commit them):
//   GATEWAY_MODEL             optional, defaults to "deepseek/deepseek-chat".
//   AI_GATEWAY_API_KEY        Vercel dashboard → AI Gateway → API Keys. Set this explicitly —
//                             see the IMPORTANT note above on why OIDC-only wasn't confirmed
//                             to be enough. For LOCAL testing instead, `vc env pull .env.local`
//                             gives you VERCEL_OIDC_TOKEN (see index.mjs for a test script).
//   DEEPSEEK_API_KEY         from https://platform.deepseek.com
//   AWS_BEARER_TOKEN_BEDROCK  a LONG-TERM Bedrock API key (IAM console → Bedrock → API keys →
//                             "long-term"). Short-term keys expire in 12h and will break in prod.
//   AWS_BEDROCK_REGION       e.g. "us-east-1" (must have Nova Micro model access enabled)
//   GEMINI_API_KEY           from https://aistudio.google.com/apikey
// You only need to set the ones for providers you actually want in the router — missing ones
// are skipped, not treated as errors.
//
// If nothing is configured, or every configured provider fails, this endpoint returns a
// non-200 and the frontend falls back to its static canned replies — the chat never breaks,
// it just degrades from "dynamic" to "static demo".
//
// Daily usage limiting: enforced client-side (localStorage) in index.html/workspace.html
// since this project has no database/KV store yet. That's a soft cap (clearable by the
// user), not real abuse protection — if this needs to be bulletproof, add Vercel KV or
// Upstash Redis and move the counter server-side, keyed by a signed anonymous user id.

const GATEWAY_MODEL = process.env.GATEWAY_MODEL || 'deepseek/deepseek-chat';
const GEMINI_MODEL = 'gemini-2.0-flash';
const DEEPSEEK_MODEL = 'deepseek-chat';
const BEDROCK_MODEL = 'amazon.nova-micro-v1:0'; // Bedrock's cheapest first-party text model
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

async function callGateway(systemPrompt, message, history) {
  // Only attempt Gateway if we have some form of credential — VERCEL_OIDC_TOKEN is what
  // `vc env pull` gives you locally; deployed Vercel functions get platform auth
  // automatically but often still expose this var, and AI_GATEWAY_API_KEY covers running
  // this endpoint somewhere other than Vercel with an explicit Gateway key.
  if (!process.env.VERCEL_OIDC_TOKEN && !process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL) {
    throw new Error('gateway_not_configured');
  }
  const { generateText } = require('ai');
  const messages = [
    ...history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.text })),
    { role: 'user', content: message },
  ];
  const { text } = await generateText({
    model: GATEWAY_MODEL,
    system: systemPrompt,
    messages,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.6,
  });
  if (!text) throw new Error('gateway_empty_response');
  return { text: text.trim(), provider: 'gateway', model: GATEWAY_MODEL };
}

async function callDeepSeek(systemPrompt, message, history) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('deepseek_not_configured');
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
  return { text: text.trim(), provider: 'deepseek', model: DEEPSEEK_MODEL };
}

async function callBedrock(systemPrompt, message, history) {
  const token = process.env.AWS_BEARER_TOKEN_BEDROCK;
  const region = process.env.AWS_BEDROCK_REGION || 'us-east-1';
  if (!token) throw new Error('bedrock_not_configured');
  const messages = [
    ...history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: [{ text: h.text }] })),
    { role: 'user', content: [{ text: message }] },
  ];
  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(BEDROCK_MODEL)}/converse`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messages,
      system: [{ text: systemPrompt }],
      inferenceConfig: { maxTokens: MAX_OUTPUT_TOKENS, temperature: 0.6 },
    }),
  });
  if (!r.ok) throw new Error(`bedrock_http_${r.status}`);
  const data = await r.json();
  const text = data?.output?.message?.content?.[0]?.text;
  if (!text) throw new Error('bedrock_empty_response');
  return { text: text.trim(), provider: 'bedrock', model: BEDROCK_MODEL };
}

async function callGemini(systemPrompt, message, history) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('gemini_not_configured');
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
  return { text: text.trim(), provider: 'gemini', model: GEMINI_MODEL };
}

// Gateway first (zero key management on Vercel, and GATEWAY_MODEL defaults to DeepSeek
// anyway); then direct DeepSeek and Bedrock Nova Micro, both fractions-of-a-cent per call;
// Gemini's paid tier is pricier per token but sits last as a free-tier-eligible safety net.
const PROVIDER_FNS = { gateway: callGateway, deepseek: callDeepSeek, bedrock: callBedrock, gemini: callGemini };
const ROUTER_ORDER = ['gateway', 'deepseek', 'bedrock', 'gemini'];

function configuredProviders() {
  return ROUTER_ORDER.filter(name => {
    if (name === 'gateway') return !!(process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL);
    if (name === 'deepseek') return !!process.env.DEEPSEEK_API_KEY;
    if (name === 'bedrock') return !!process.env.AWS_BEARER_TOKEN_BEDROCK;
    if (name === 'gemini') return !!process.env.GEMINI_API_KEY;
    return false;
  });
}

async function routeChat(systemPrompt, message, history) {
  const available = configuredProviders();
  if (!available.length) throw new Error('no_provider_configured');
  let lastErr;
  for (const name of available) {
    try {
      return await PROVIDER_FNS[name](systemPrompt, message, history);
    } catch (err) {
      lastErr = err;
      console.error('provider_failed', name, err?.message || err);
    }
  }
  throw lastErr || new Error('all_providers_failed');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const provider = (process.env.LLM_PROVIDER || 'router').toLowerCase();
  if (provider !== 'router' && !PROVIDER_FNS[provider]) {
    res.status(503).json({ error: 'unknown_provider' });
    return;
  }
  if (provider === 'router' && configuredProviders().length === 0) {
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
    const result = provider === 'router'
      ? await routeChat(systemPrompt, message, history)
      : await PROVIDER_FNS[provider](systemPrompt, message, history);
    res.status(200).json({ reply: result.text, provider: result.provider, model: result.model });
  } catch (err) {
    console.error('chat_error', err?.message || err);
    res.status(502).json({ error: 'llm_call_failed' });
  }
};
