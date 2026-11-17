const test = require('node:test');
const assert = require('node:assert');
const S = require('../src/sprites.js');
const World = require('../src/world.js');

test('directionFromKey maps WASD and keeps previous otherwise', () => {
    assert.strictEqual(S.directionFromKey('w'), 'up');
    assert.strictEqual(S.directionFromKey('a'), 'left');
    assert.strictEqual(S.directionFromKey('d'), 'right');
    assert.strictEqual(S.directionFromKey('s'), 'down');
    assert.strictEqual(S.directionFromKey('e', 'left'), 'left');
});

test('walkFrame is 0 when idle and cycles 1..3 when moving', () => {
    assert.strictEqual(S.walkFrame(5, false), 0);
    assert.deepStrictEqual([0, 1, 2, 3, 4].map((n) => S.walkFrame(n, true)), [1, 2, 3, 1, 2]);
});

test('frameRect uses row per direction and column per frame', () => {
    assert.deepStrictEqual(S.frameRect('right', 1, true), { sx: 64, sy: 64, sw: 32, sh: 32 });
    assert.strictEqual(S.frameRect('up', 0, false).sy, 96);
    assert.strictEqual(S.directionRow('bogus'), 0);
});

test('loadSprites falls back to null for missing images', async () => {
    const seen = [];
    const loader = (src) => {
        seen.push(src);
        return src.includes('player') ? Promise.resolve({ fake: true }) : Promise.reject(new Error('404'));
    };
    const out = await S.loadSprites(loader);
    assert.deepStrictEqual(out.player, { fake: true });
    assert.strictEqual(out.tiles, null);
    assert.strictEqual(out.chef_mario, null);
    assert.ok(seen.includes('assets/sprites/tiles.png'));
});

test('loadSprites survives a loader that throws synchronously', async () => {
    const out = await S.loadSprites(() => { throw new Error('boom'); }, ['player']);
    assert.deepStrictEqual(out, { player: null });
});

test('recordMove tracks facing and steps', () => {
    S.recordMove('a', true);
    assert.strictEqual(S.player.facing, 'left');
    const steps = S.player.steps;
    S.recordMove('w', false);
    assert.strictEqual(S.player.facing, 'up');
    assert.strictEqual(S.player.steps, steps);
    assert.strictEqual(S.player.moving, false);
});

test('emotion defaults to neutral and setter validates', () => {
    const st = { emotions: {} };
    assert.strictEqual(World.getEmotion('chef_mario', st), 'neutral');
    assert.strictEqual(World.setEmotion('chef_mario', 'angry', st), 'angry');
    assert.strictEqual(World.getEmotion('chef_mario', st), 'angry');
    assert.strictEqual(World.setEmotion('chef_mario', 'weird', st), 'neutral');
    World.EMOTIONS.forEach((e) => assert.ok(S.EMOTION_STYLE[e]));
});
