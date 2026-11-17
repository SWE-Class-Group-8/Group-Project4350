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

test('register rejects a duplicate username', () => {
    const api = createMockApi(memoryStorage());
    api.register('sam', 'pw');
    assert.throws(() => api.register('sam', 'other'), /already taken/);
});

test('login rejects a wrong password and accepts the right one', () => {
    const api = createMockApi(memoryStorage());
    api.register('sam', 'pw');
    assert.throws(() => api.login('sam', 'nope'), /Incorrect/);
    assert.strictEqual(api.login('sam', 'pw').username, 'sam');
});

test('NPC memory is separate per player and per NPC', async () => {
    const api = createMockApi(memoryStorage());
    api.register('a', 'pw');
    api.register('b', 'pw');
    await api.talk('a', 'chef_mario', 'I love pizza');
    assert.match(await api.talk('a', 'chef_mario', 'What is my favorite hobby?'), /pizza/);
    assert.match(await api.talk('b', 'chef_mario', 'What is my favorite hobby?'), /haven't told me/);
    assert.match(await api.talk('a', 'cashier_bruce', 'What is my favorite hobby?'), /haven't told me/);
});
