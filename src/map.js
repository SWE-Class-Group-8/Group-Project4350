(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.GameMap = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    const TILE = 32;
    const FLOOR = 0, WALL = 1, COUNTER = 2, TABLE = 3, KITCHEN = 4;
    const BLOCKING = [WALL, COUNTER, TABLE, KITCHEN];

    // 20 columns x 12 rows of 32px tiles (640x384; the bottom 16px of the 640x400 canvas is floor).
    const ROWS = [
        '11111111111111111111',
        '44444400000022222222',
        '00000000000000000000',
        '00000000000000000000',
        '00000000000000000000',
        '00000000000000000000',
        '00000000000033000000',
        '00003300330033000000',
        '00003300330000000000',
        '00000000000000000000',
        '00000000000000000000',
        '00000000000000000000',
    ];
    const TILES = ROWS.map((r) => r.split('').map(Number));
    const COLS = TILES[0].length;
    const HEIGHT_TILES = TILES.length;

    function tileAt(col, row) {
        if (row < 0 || col < 0 || row >= HEIGHT_TILES || col >= COLS) return FLOOR;
        return TILES[row][col];
    }

    function isBlocked(x, y, size = TILE, tiles = TILES) {
        const lookup = tiles === TILES ? tileAt : (c, r) => (tiles[r] && tiles[r][c] !== undefined ? tiles[r][c] : FLOOR);
        const c0 = Math.floor(x / TILE);
        const r0 = Math.floor(y / TILE);
        const c1 = Math.floor((x + size - 1) / TILE);
        const r1 = Math.floor((y + size - 1) / TILE);
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                if (BLOCKING.includes(lookup(c, r))) return true;
            }
        }
        return false;
    }

    return { TILE, FLOOR, WALL, COUNTER, TABLE, KITCHEN, TILES, COLS, HEIGHT_TILES, tileAt, isBlocked };
});
