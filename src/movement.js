(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        const m = factory();
        root.movePlayer = m.movePlayer;
        root.moveWithCollision = m.moveWithCollision;
        root.stepMove = m.stepMove;
        root.directionFromVector = m.directionFromVector;
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

    // Smooth movement: apply a velocity-based delta one axis at a time so the player slides along walls.
    function stepMove(position, dx, dy, bounds, size = 32, isBlocked = defaultBlocked()) {
        const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
        let { x, y } = position;
        const nx = clamp(x + dx, bounds.minX, bounds.maxX);
        if (!isBlocked(nx + HIT_INSET, y + HIT_INSET, size - 2 * HIT_INSET)) x = nx;
        const ny = clamp(y + dy, bounds.minY, bounds.maxY);
        if (!isBlocked(x + HIT_INSET, ny + HIT_INSET, size - 2 * HIT_INSET)) y = ny;
        return { x, y };
    }

    // Facing from a movement vector; horizontal wins on diagonals. Returns previous when standing still.
    function directionFromVector(dx, dy, previous = 'down') {
        if (dx < 0) return 'left';
        if (dx > 0) return 'right';
        if (dy < 0) return 'up';
        if (dy > 0) return 'down';
        return previous;
    }

    return { movePlayer, moveWithCollision, stepMove, directionFromVector };
});
