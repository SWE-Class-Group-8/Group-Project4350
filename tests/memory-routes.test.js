'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'test-memory-secret';
const { createApp } = require('../server/app');
const { signToken } = require('../server/auth');

function fakePool() {
  const memories = [];
  const facts = [];
  const npc = { npc_id: 1, slug: 'chef_mario', name: 'Chef Mario', role: 'Chef', personality: 'Warm', description: 'Restaurant chef' };
  return {
    memories, facts,
    async query(sql, params) {
      if (sql.includes('FROM npc WHERE slug')) return { rows: params[0] === npc.slug ? [npc] : [] };
      if (sql.includes('SELECT player_message, npc_response FROM memory'))
        return { rows: memories.filter(m => m.player_id === params[0] && m.npc_id === params[1]).slice().reverse() };
      if (sql.includes('SELECT fact_key, fact_value FROM player_fact'))
        return { rows: facts.filter(f => f.player_id === params[0] && f.npc_id === params[1]).slice().reverse() };
      if (sql.includes('SELECT relationship_score, relationship_status FROM npc_relationship')) return { rows: [] };
      if (sql.startsWith('INSERT INTO memory')) {
        memories.push({ player_id: params[0], npc_id: params[1], player_message: params[2], npc_response: params[3] });
        return { rowCount: 1, rows: [] };
      }
      if (sql.startsWith('UPDATE player_fact')) {
        const matching = facts.filter(f => f.player_id === params[0] && f.npc_id === params[1] && f.fact_key === params[2]);
        matching.forEach(f => { f.fact_value = params[3]; });
        return { rowCount: matching.length };
      }
      if (sql.startsWith('INSERT INTO player_fact')) {
        facts.push({ player_id: params[0], npc_id: params[1], fact_key: params[2], fact_value: params[3] });
        return { rowCount: 1 };
      }
      if (sql.includes('SELECT DISTINCT n.npc_id')) {
        const id = params[0];
        return { rows: memories.some(m => m.player_id === id) || facts.some(f => f.player_id === id) ? [npc] : [] };
      }
      if (sql.includes('SELECT npc_id, fact_key, fact_value FROM player_fact'))
        return { rows: facts.filter(f => f.player_id === params[0]) };
      if (sql.includes('SELECT npc_id, relationship_score, relationship_status FROM npc_relationship')) return { rows: [] };
      throw new Error('Unexpected query: ' + sql);
    }
  };
}

test('talk saves a reply and facts, and memory stays isolated per authenticated player', async () => {
  const pool = fakePool();
  const observed = [];
  const llm = { generate: async (context) => {
    observed.push(context);
    return { text: 'Welcome back!', emotion: 'happy', provider: 'deepseek' };
  }};
  const server = createApp({ pool, llm }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token1 = signToken({ player_id: 1, username: 'alice' });
  const token2 = signToken({ player_id: 2, username: 'bob' });
  async function call(path, token, body) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }
  try {
    const bad = await call('/api/npcs/chef_mario/talk', token1, { message: '' });
    assert.equal(bad.status, 400);
    const missing = await call('/api/npcs/unknown/talk', token1, { message: 'hello' });
    assert.equal(missing.status, 404);
    const talk = await call('/api/npcs/chef_mario/talk', token1, { message: 'My favorite food is tacos.' });
    assert.equal(talk.status, 200);
    assert.equal(talk.data.reply, 'Welcome back!');
    assert.equal(pool.memories.length, 1);
    assert.equal(pool.facts[0].fact_value, 'tacos');
    const alice = await call('/api/memories', token1);
    assert.equal(alice.data.memories[0].facts.favorite_food, 'tacos');
    const bob = await call('/api/memories', token2);
    assert.deepEqual(bob.data.memories, []);
    await call('/api/npcs/chef_mario/talk', token1, { message: 'Remember my favorite food?' });
    assert.match(observed.at(-1).system, /tacos/);
    assert.equal(pool.memories.length, 2);
  } finally {
    server.close();
  }
});
