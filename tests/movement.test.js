const test = require('node:test');
const assert = require('node:assert');
const { movePlayer } = require('../src/movement.js');

const bounds = { minX: 0, maxX: 300, minY: 0, maxY: 260 };

test('pressing d moves the player 10 pixels to the right', () => {
    const result = movePlayer({ x: 100, y: 100 }, 'd', bounds);
    assert.deepStrictEqual(result, { x: 110, y: 100 });
});

test('pressing a at the left edge leaves x unchanged', () => {
    const result = movePlayer({ x: bounds.minX, y: 100 }, 'a', bounds);
    assert.strictEqual(result.x, bounds.minX);
});
