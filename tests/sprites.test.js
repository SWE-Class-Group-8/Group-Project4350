const test = require('node:test');
const assert = require('node:assert');
const S = require('../src/sprites.js');
const World = require('../src/world.js');
const Scene = require('../src/scene.js');
const fs = require('node:fs');
const path = require('node:path');

test('directionFromKey maps WASD and keeps previous otherwise', () => {
    assert.strictEqual(S.directionFromKey('w'), 'up');
    assert.strictEqual(S.directionFromKey('a'), 'left');
    assert.strictEqual(S.directionFromKey('d'), 'right');
    assert.strictEqual(S.directionFromKey('s'), 'down');
    assert.strictEqual(S.directionFromKey('e', 'left'), 'left');
});

test('frameName is idle when standing and cycles four walk frames', () => {
    assert.strictEqual(S.frameName('down', 5, false), 'down_idle');
    assert.deepStrictEqual([0, 1, 2, 3, 4].map((n) => S.frameName('left', n, true)),
        ['left_walk_0', 'left_walk_1', 'left_walk_2', 'left_walk_3', 'left_walk_0']);
});

test('characterImageName uses talk frames for NPCs when talking', () => {
    assert.strictEqual(S.characterImageName('chef_mario', 'down', 0, false, 1), 'characters/chef_mario/talk_1');
    assert.strictEqual(S.characterImageName('player', 'up', 2, true), 'characters/player/up_walk_2');
});

test('emotionIcon maps emotions to indicator files', () => {
    assert.strictEqual(S.emotionIcon('happy'), 'heart');
    assert.strictEqual(S.emotionIcon('angry'), 'anger');
    assert.strictEqual(S.emotionIcon('neutral'), null);
    assert.strictEqual(S.emotionIcon('weird'), null);
});

test('loadSprites falls back to null for missing images', async () => {
    const loader = (src) => (src.includes('player') ? Promise.resolve({ fake: true }) : Promise.reject(new Error('404')));
    const out = await S.loadSprites(loader, ['characters/player/down_idle', 'characters/chef_mario/down_idle']);
    assert.deepStrictEqual(out['characters/player/down_idle'], { fake: true });
    assert.strictEqual(out['characters/chef_mario/down_idle'], null);
});

test('loadSprites survives a loader that throws synchronously', async () => {
    const out = await S.loadSprites(() => { throw new Error('boom'); }, ['x']);
    assert.deepStrictEqual(out, { x: null });
});

test('every asset the game loads exists in the assets folder', () => {
    const missing = S.allAssetNames().filter((n) => !fs.existsSync(path.join(__dirname, '..', 'assets', `${n}.png`)));
    assert.deepStrictEqual(missing, []);
});

test('every image the scene draws is in the loaded asset list', () => {
    const loaded = new Set(S.allAssetNames());
    assert.deepStrictEqual(Scene.referencedImages().filter((n) => !loaded.has(n)), []);
});

test('scene objects stay inside the 20x12 tile world', () => {
    const w = Scene.COLS * Scene.TILE;
    const h = Scene.ROWS * Scene.TILE;
    Scene.OBJECTS.forEach((o) => {
        assert.ok(o.x >= 0 && o.x < w && o.sortY <= h + 16, `${o.img} at ${o.x},${o.y}`);
    });
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
    assert.strictEqual(World.setEmotion('chef_mario', 'weird', st), 'neutral');
    World.EMOTIONS.forEach((e) => assert.ok(S.EMOTIONS.includes(e)));
});
