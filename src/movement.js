(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.movePlayer = factory().movePlayer;
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

    return { movePlayer };
});
