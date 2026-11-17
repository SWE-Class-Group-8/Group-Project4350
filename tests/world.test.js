const test = require('node:test');
const assert = require('node:assert');
const { nearestNpc, NPCS } = require('../src/world.js');
const createMockApi = require('../src/api.js');

function memoryStorage() {
    const data = {};
    return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; } };
}

test('nearestNpc returns an NPC when the player is within range', () => {
    const npc = NPCS[0];
    assert.strictEqual(nearestNpc({ x: npc.x + 10, y: npc.y }).id, npc.id);
});

test('nearestNpc returns null when no NPC is in range', () => {
    assert.strictEqual(nearestNpc({ x: 1000, y: 1000 }), null);
});

test('register rejects a duplicate username', async () => {
    const api = createMockApi(memoryStorage());
    await api.register('sam', 'pw');
    await assert.rejects(api.register('sam', 'other'), /already taken/);
});

test('login rejects a wrong password and accepts the right one', async () => {
    const api = createMockApi(memoryStorage());
    await api.register('sam', 'pw');
    await assert.rejects(api.login('sam', 'nope'), /Incorrect/);
    assert.strictEqual((await api.login('sam', 'pw')).username, 'sam');
});

test('NPC memory is separate per player and per NPC', async () => {
    const api = createMockApi(memoryStorage());
    await api.register('a', 'pw');
    await api.register('b', 'pw');
    const first = await api.talk('a', 'chef_mario', 'I love pizza');
    assert.deepStrictEqual([first.emotion, first.provider], ['neutral', 'mock']);
    assert.match((await api.talk('a', 'chef_mario', 'What is my favorite hobby?')).reply, /pizza/);
    assert.match((await api.talk('b', 'chef_mario', 'What is my favorite hobby?')).reply, /haven't told me/);
    assert.match((await api.talk('a', 'cashier_bruce', 'What is my favorite hobby?')).reply, /haven't told me/);
    const mems = await api.memories('a');
    assert.strictEqual(mems[0].npcName, 'Chef Mario');
    assert.ok(mems[0].relationship);
});
