const test = require('node:test');
const assert = require('node:assert');
process.env.JWT_SECRET = 'test-secret';
const { createApp } = require('../server/app');
const { requireAuth, signToken } = require('../server/auth');

function fakePool() {
  const players = [];
  const npcs = [
    { slug: 'chef_mario', name: 'Chef Mario', role: 'Chef' },
    { slug: 'cashier_bruce', name: 'Cashier Bruce', role: 'Cashier' },
  ];
  return {
    players,
    async query(sql, params) {
      if (sql.startsWith('INSERT INTO player')) {
        if (players.some((p) => p.username === params[0])) {
          const e = new Error('duplicate');
          e.code = '23505';
          throw e;
        }
        const p = { player_id: players.length + 1, username: params[0], password_hash: params[1] };
        players.push(p);
        return { rows: [{ player_id: p.player_id, username: p.username }] };
      }
      if (sql.startsWith('SELECT player_id')) {
        return { rows: players.filter((p) => p.username === params[0]) };
      }
      if (sql.startsWith('SELECT slug')) return { rows: npcs };
      throw new Error('unexpected sql: ' + sql);
    },
  };
}

async function withServer(fn, pool = fakePool()) {
  const server = createApp({ pool }).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, token } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: await res.json() };
  };
  try {
    await fn(call, pool);
  } finally {
    server.close();
  }
}

const creds = { username: 'sam', password: 'secret123' };

test('register ok stores only a hash', () =>
  withServer(async (call, pool) => {
    const r = await call('/api/register', { method: 'POST', body: creds });
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.json.username, 'sam');
    assert.ok(r.json.token);
    assert.notStrictEqual(pool.players[0].password_hash, 'secret123');
    assert.match(pool.players[0].password_hash, /^\$2/);
  }));

test('register duplicate gives 409', () =>
  withServer(async (call) => {
    await call('/api/register', { method: 'POST', body: creds });
    const r = await call('/api/register', { method: 'POST', body: creds });
    assert.strictEqual(r.status, 409);
    assert.ok(r.json.error);
  }));

test('register validation gives 400', () =>
  withServer(async (call) => {
    const bad = [
      { username: 'ab', password: 'secret123' },
      { username: 'a'.repeat(31), password: 'secret123' },
      { username: 'bad name!', password: 'secret123' },
      { username: 'sam', password: 'short' },
      { username: 'sam', password: 'x'.repeat(129) },
      { username: 123, password: 'secret123' },
      {},
    ];
    for (const body of bad) {
      const r = await call('/api/register', { method: 'POST', body });
      assert.strictEqual(r.status, 400, JSON.stringify(body));
    }
  }));

test('login ok and wrong credentials share one message', () =>
  withServer(async (call) => {
    await call('/api/register', { method: 'POST', body: creds });
    const ok = await call('/api/login', { method: 'POST', body: creds });
    assert.strictEqual(ok.status, 200);
    assert.ok(ok.json.token);
    const wrongPw = await call('/api/login', { method: 'POST', body: { ...creds, password: 'wrongpass1' } });
    const wrongUser = await call('/api/login', { method: 'POST', body: { username: 'nobody', password: 'secret123' } });
    assert.strictEqual(wrongPw.status, 401);
    assert.strictEqual(wrongUser.status, 401);
    assert.strictEqual(wrongPw.json.error, wrongUser.json.error);
  }));

test('auth middleware rejects missing and bad tokens, accepts good', async () => {
  const run = (headers) =>
    new Promise((resolve) => {
      const req = { headers };
      const res = {
        status(c) { this.code = c; return this; },
        json() { resolve({ code: this.code }); },
      };
      requireAuth(req, res, () => resolve({ code: 200, req }));
    });
  assert.strictEqual((await run({})).code, 401);
  assert.strictEqual((await run({ authorization: 'Bearer garbage' })).code, 401);
  const good = await run({ authorization: 'Bearer ' + signToken({ player_id: 7, username: 'sam' }) });
  assert.strictEqual(good.code, 200);
  assert.deepStrictEqual(good.req.player, { id: 7, username: 'sam' });
});

test('GET /api/npcs requires a token and lists npcs', () =>
  withServer(async (call) => {
    assert.strictEqual((await call('/api/npcs')).status, 401);
    const reg = await call('/api/register', { method: 'POST', body: creds });
    const r = await call('/api/npcs', { token: reg.json.token });
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual(r.json.npcs[0], { id: 'chef_mario', name: 'Chef Mario', role: 'Chef' });
  }));
