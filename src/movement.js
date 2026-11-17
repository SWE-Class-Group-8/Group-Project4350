(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        const m = factory();
        root.movePlayer = m.movePlayer;
        root.moveWithCollision = m.moveWithCollision;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    const STEP = 10;

    function movePlayer(position, key, bounds) {
        let { x, y } = position;
        if (key === 'w') y -= STEP;
        else if (key === 's') y += STEP;
        else if (key === 'a') x -= STEP;
        else if (key === 'd') x += STEP;
        else return position;

        return {
            x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
            y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
        };
    }

    // Hitbox is the player square shrunk by HIT_INSET on each side so 10px steps
    // do not snag on tile corners.
    const HIT_INSET = 4;

    function defaultBlocked() {
        if (typeof GameMap !== 'undefined') return GameMap.isBlocked;
        return require('./map.js').isBlocked;
    }

    function moveWithCollision(position, key, bounds, size = 32, isBlocked = defaultBlocked()) {
        const next = movePlayer(position, key, bounds);
        if (next === position) return position;
        if (isBlocked(next.x + HIT_INSET, next.y + HIT_INSET, size - 2 * HIT_INSET)) return position;
        return next;
    }

    return { movePlayer, moveWithCollision };
});
