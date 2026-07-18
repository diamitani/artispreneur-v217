// Vercel AI Gateway quickstart / local test script.
//
// Setup:
//   1. npm install
//   2. vc env pull .env.local     (pulls VERCEL_OIDC_TOKEN — no Gateway API key needed
//                                  when this project is linked to your Vercel account)
//   3. node --env-file=.env.local index.mjs
//
// This is a scratch/test file to confirm Gateway auth works from your machine — the real
// integration for the site lives in api/chat.js, which uses the same 'ai' package.
//
// Model is 'deepseek/deepseek-chat' by default (cheap, matches the rest of this project's
// provider choices — you told me to avoid OpenAI/Anthropic on cost). Browse the full model
// catalog + exact slugs in the Vercel dashboard under AI Gateway → Models, since slugs do
// change over time and I can't verify them live from here. Swap the string below to try
// another one, e.g. 'google/gemini-2.0-flash' or 'amazon/nova-micro'.

import { streamText } from 'ai';

const result = streamText({
  model: 'deepseek/deepseek-chat',
  prompt: 'Explain quantum computing in simple terms.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
