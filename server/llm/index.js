'use strict';
const { callDeepseek } = require('./deepseek');
const { callGemini } = require('./gemini');
const { parseModelOutput } = require('./emotion');

const DEFAULT_MODELS = { deepseek: 'deepseek-chat', gemini: 'gemini-2.0-flash' };

function createLlmClient({ deepseekKey, geminiKey, fetch: fetchImpl, timeoutMs = 4000, models = {} } = {}) {
  const doFetch = fetchImpl || globalThis.fetch;
  const m = { ...DEFAULT_MODELS, ...models };
  const providers = [];
  if (deepseekKey) providers.push({ name: 'deepseek', call: callDeepseek, key: deepseekKey, model: m.deepseek });
  if (geminiKey) providers.push({ name: 'gemini', call: callGemini, key: geminiKey, model: m.gemini });

  async function attempt(p, system, messages) {
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs);
    });
    try {
      const raw = await Promise.race([
        p.call({ key: p.key, model: p.model, fetch: doFetch, signal: controller.signal, system, messages }),
        timeout,
      ]);
      return parseModelOutput(raw);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async generate({ system = '', messages = [] } = {}) {
      for (const p of providers) {
        try {
          const out = await attempt(p, system, messages);
          if (out) return { text: out.text, emotion: out.emotion, provider: p.name };
        } catch (_) { /* fall through to next provider; never log prompts or keys */ }
      }
      const err = new Error('All LLM providers failed');
      err.code = 'LLM_UNAVAILABLE';
      throw err;
    },
  };
}

function createLlmClientFromEnv(env = process.env, opts = {}) {
  return createLlmClient({
    deepseekKey: env.DEEPSEEK_API_KEY,
    geminiKey: env.GEMINI_API_KEY,
    ...opts,
  });
}

module.exports = { createLlmClient, createLlmClientFromEnv };
