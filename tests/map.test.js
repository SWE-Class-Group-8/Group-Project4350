const test = require('node:test');
const assert = require('node:assert');
const { isBlocked, TILE, TILES, COLS, HEIGHT_TILES } = require('../src/map.js');
const { moveWithCollision } = require('../src/movement.js');
const { NPCS } = require('../src/world.js');

const bounds = { minX: 0, maxX: 864, minY: 0, maxY: 480 };

test('map is 28x16 tiles', () => {
    assert.strictEqual(COLS, 28);
    assert.strictEqual(HEIGHT_TILES, 16);
    assert.strictEqual(TILE, 32);
});

test('walls and tables block, open floor does not', () => {
    assert.strictEqual(isBlocked(100, 5, 16), true);
    assert.strictEqual(isBlocked(4 * 32 + 2, 7 * 32 + 2, 16), true);
    assert.strictEqual(isBlocked(450, 300, 24), false);
});

test('a box straddling a blocked tile is blocked', () => {
    assert.strictEqual(isBlocked(100, 20, 24), true);
});

test('player cannot walk into the top wall', () => {
    let pos = { x: 300, y: 100 };
    for (let i = 0; i < 40; i++) pos = moveWithCollision(pos, 'w', bounds);
    assert.ok(pos.y >= 30, `y was ${pos.y}`);
});

test('player is blocked by a table but can move on open floor', () => {
    assert.deepStrictEqual(moveWithCollision({ x: 450, y: 300 }, 'd', bounds), { x: 460, y: 300 });
    let pos = { x: 60, y: 200 };
    for (let i = 0; i < 10; i++) pos = moveWithCollision(pos, 'd', bounds);
    assert.ok(pos.x + 28 <= 4 * 32, `x was ${pos.x}`);
});

test('non-move keys return the same position', () => {
    const p = { x: 300, y: 180 };
    assert.strictEqual(moveWithCollision(p, 'x', bounds), p);
});

test('NPCs and player start are not inside blocked tiles', () => {
    assert.strictEqual(isBlocked(450, 300, 32), false);
    NPCS.forEach((n) => assert.strictEqual(isBlocked(n.x, n.y, 32), false, n.id));
    assert.ok(TILES.length > 0);
});

const { stepMove, directionFromVector } = require('../src/movement.js');

test('stepMove moves smoothly by a fractional delta', () => {
    const p = stepMove({ x: 450, y: 300 }, 2.5, 0, bounds);
    assert.deepStrictEqual(p, { x: 452.5, y: 300 });
});

test('stepMove slides along a wall instead of stopping', () => {
    const p = stepMove({ x: 450, y: 70 }, 3, -5, bounds);
    assert.strictEqual(p.x, 453);
    assert.ok(p.y >= 60 - 0.0001 && p.y <= 70);
});

test('stepMove is blocked by a table and clamped to the world', () => {
    const blocked = stepMove({ x: 90, y: 200 }, 20, 0, bounds);
    assert.ok(blocked.x + 28 <= 4 * 32 + 0.0001, `x was ${blocked.x}`);
    assert.strictEqual(stepMove({ x: 2, y: 300 }, -10, 0, bounds).x, 0);
});

test('directionFromVector picks facing and keeps previous when still', () => {
    assert.strictEqual(directionFromVector(-1, 0), 'left');
    assert.strictEqual(directionFromVector(0, -1), 'up');
    assert.strictEqual(directionFromVector(1, 1), 'right');
    assert.strictEqual(directionFromVector(0, 0, 'up'), 'up');
});
