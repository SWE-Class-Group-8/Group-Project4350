'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createLlmClient, createLlmClientFromEnv } = require('../server/llm');

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const ds = (content) => ok({ choices: [{ message: { content } }] });
const gm = (text) => ok({ candidates: [{ content: { parts: [{ text }] } }] });
const input = { system: 'You are Mario', messages: [{ role: 'user', content: 'hi' }] };

function make(handler, extra = {}) {
  const calls = [];
  const fetch = async (url, opts) => {
    const which = url.includes('deepseek') ? 'deepseek' : 'gemini';
    calls.push(which);
    return handler(which, opts);
  };
  return { calls, client: createLlmClient({ deepseekKey: 'd', geminiKey: 'g', fetch, timeoutMs: 50, ...extra }) };
}
const hang = (opts) => new Promise((_, rej) => opts.signal.addEventListener('abort', () => rej(new Error('abort'))));

test('deepseek success', async () => {
  const { client, calls } = make(() => ds('{"reply":"Hello!","emotion":"happy"}'));
  assert.deepStrictEqual(await client.generate(input), { text: 'Hello!', emotion: 'happy', provider: 'deepseek' });
  assert.deepStrictEqual(calls, ['deepseek']);
});
test('deepseek 500 -> gemini', async () => {
  const { client } = make((w) => (w === 'deepseek' ? { ok: false, status: 500 } : gm('{"reply":"Hi","emotion":"sad"}')));
  const r = await client.generate(input);
  assert.strictEqual(r.provider, 'gemini');
  assert.strictEqual(r.emotion, 'sad');
});
test('network error -> gemini', async () => {
  const { client } = make((w) => { if (w === 'deepseek') throw new Error('net'); return gm('{"reply":"Hi"}'); });
  assert.strictEqual((await client.generate(input)).provider, 'gemini');
});
test('deepseek timeout -> gemini', async () => {
  const { client } = make((w, o) => (w === 'deepseek' ? hang(o) : gm('{"reply":"Hi","emotion":"neutral"}')));
  assert.strictEqual((await client.generate(input)).provider, 'gemini');
});
test('deepseek empty -> gemini', async () => {
  const { client } = make((w) => (w === 'deepseek' ? ds('  ') : gm('{"reply":"Hi","emotion":"angry"}')));
  const r = await client.generate(input);
  assert.deepStrictEqual([r.provider, r.emotion], ['gemini', 'angry']);
});
test('both fail -> LLM_UNAVAILABLE', async () => {
  const { client } = make(() => ({ ok: false, status: 500 }));
  await assert.rejects(client.generate(input), (e) => e.code === 'LLM_UNAVAILABLE');
});
test('code fences stripped and invalid emotion falls back', async () => {
  const { client } = make(() => ds('```json\n{"reply":"Grr","emotion":"furious"}\n```'));
  const r = await client.generate(input);
  assert.deepStrictEqual([r.text, r.emotion], ['Grr', 'neutral']);
});
test('non-JSON text kept raw with neutral', async () => {
  const { client } = make(() => ds('Just words'));
  const r = await client.generate(input);
  assert.deepStrictEqual([r.text, r.emotion], ['Just words', 'neutral']);
});
test('missing deepseek key skips it', async () => {
  const calls = [];
  const client = createLlmClient({ geminiKey: 'g', fetch: async (u) => { calls.push(u); return gm('{"reply":"Hi"}'); } });
  assert.strictEqual((await client.generate(input)).provider, 'gemini');
  assert.strictEqual(calls.length, 1);
});
test('no keys -> LLM_UNAVAILABLE; env helper reads keys', async () => {
  await assert.rejects(createLlmClient({ fetch: async () => ds('x') }).generate(input), (e) => e.code === 'LLM_UNAVAILABLE');
  const c = createLlmClientFromEnv({ GEMINI_API_KEY: 'g' }, { fetch: async () => gm('{"reply":"yo","emotion":"happy"}') });
  assert.strictEqual((await c.generate(input)).provider, 'gemini');
});
