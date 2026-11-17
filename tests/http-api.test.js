const test = require('node:test');
const assert = require('node:assert');
const createHttpApi = require('../src/httpApi.js');

function memStorage() {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
function fakeFetch(status, body, calls = []) {
    const f = async (url, init) => { calls.push({ url, init }); return { ok: status < 400, status, json: async () => body }; };
    return f;
}
const make = (status, body, calls, storage = memStorage()) =>
    ({ storage, calls, api: createHttpApi({ baseUrl: 'http://x/', fetch: fakeFetch(status, body, calls), storage }) });

test('login stores token and later calls send it', async () => {
    const calls = [];
    const storage = memStorage();
    const l = createHttpApi({ baseUrl: 'http://x', fetch: fakeFetch(200, { token: 'tok', username: 'sam' }, calls), storage });
    assert.deepStrictEqual(await l.login('sam', 'secret123'), { username: 'sam' });
    assert.strictEqual(storage.getItem('agent-appetite-token'), 'tok');
    assert.strictEqual(calls[0].url, 'http://x/api/login');
    assert.strictEqual(calls[0].init.headers.Authorization, undefined);
    const calls2 = [];
    const a = createHttpApi({ baseUrl: 'http://x', fetch: fakeFetch(200, { memories: [] }, calls2), storage });
    await a.memories();
    assert.strictEqual(calls2[0].init.headers.Authorization, 'Bearer tok');
    a.logout();
    assert.strictEqual(storage.getItem('agent-appetite-token'), null);
});

test('register stores token', async () => {
    const { api, storage } = make(201, { token: 't2', username: 'sam' });
    await api.register('sam', 'secret123');
    assert.strictEqual(storage.getItem('agent-appetite-token'), 't2');
});

test('error statuses map to friendly messages', async () => {
    await assert.rejects(make(401, { error: 'x' }).api.login('a', 'b'), /Incorrect username or password\./);
    await assert.rejects(make(409, { error: 'x' }).api.register('a', 'b'), /already taken/);
    await assert.rejects(make(502, { error: 'x' }).api.talk('a', 'chef_mario', 'hi'), /lost for words/);
    await assert.rejects(make(400, { error: 'Bad input' }).api.register('a', 'b'), /Bad input/);
});

test('network error', async () => {
    const api = createHttpApi({ baseUrl: 'http://x', storage: memStorage(), fetch: async () => { throw new TypeError('fail'); } });
    await assert.rejects(api.login('a', 'b'), /Cannot reach the server\./);
});

test('talk and memories shapes', async () => {
    const calls = [];
    const t = make(200, { reply: 'Hi', emotion: 'happy', provider: 'gemini', extra: 1 }, calls);
    assert.deepStrictEqual(await t.api.talk('sam', 'chef_mario', 'hello'), { reply: 'Hi', emotion: 'happy', provider: 'gemini' });
    assert.strictEqual(calls[0].url, 'http://x/api/npcs/chef_mario/talk');
    assert.deepStrictEqual(JSON.parse(calls[0].init.body), { message: 'hello' });
    const mem = [{ npcId: 'chef_mario', npcName: 'Chef Mario', facts: { name: 'Sam' }, relationship: { score: 20, status: 'Friendly' } }];
    assert.deepStrictEqual(await make(200, { memories: mem }).api.memories(), mem);
});
