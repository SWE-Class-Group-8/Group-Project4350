(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.Scene = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    // Coordinates here are in native art pixels (16px tiles, 28x16 tiles = 448x256).
    // Collision still comes from map.js, so keep furniture lined up with its blocking tiles.
    const COLS = 28;
    const ROWS = 16;
    const TILE = 16;
    const SCALE = 2;
    const W = (n) => `world/${n}`;

    // Objects are positioned by their top-left; sortY is the bottom edge used for depth ordering.
    function obj(img, x, y, h) {
        return { img: W(img), x, y, sortY: y + h };
    }

    const TABLES = [[4, 6], [10, 6], [16, 6], [4, 11], [10, 11], [16, 11], [22, 8], [22, 12]];
    const TABLE_FOOD = { '4,6': 'food/coffee', '10,6': 'food/pizza_whole', '22,8': 'food/burger', '10,11': 'food/plate' };

    const OBJECTS = [
        obj('kitchen/fridge', 0, 0, 32),
        obj('kitchen/stove', 16, 8, 24),
        obj('kitchen/counter_left', 32, 8, 24),
        obj('kitchen/sink', 48, 8, 24),
        obj('kitchen/prep_table', 64, 8, 24),
        obj('kitchen/counter_mid', 96, 8, 24),
        obj('kitchen/counter_right', 112, 8, 24),
        obj('kitchen/counter_mid', 288, 8, 24),
        obj('kitchen/counter_mid', 304, 8, 24),
        obj('front_of_house/cashier_counter', 320, 8, 24),
        obj('kitchen/counter_mid', 368, 8, 24),
        obj('kitchen/counter_mid', 384, 8, 24),
        obj('kitchen/counter_mid', 400, 8, 24),
        obj('kitchen/counter_mid', 416, 8, 24),
        obj('kitchen/counter_right', 432, 8, 24),
        obj('front_of_house/register', 336, -4, 16),
        obj('front_of_house/plant_large', 428, 208, 32),
        obj('front_of_house/plant_small', 8, 232, 16),
        obj('front_of_house/plant_large', 4, 28, 32),
        obj('front_of_house/booth', 8, 150, 28),
        obj('front_of_house/booth', 8, 180, 28),
    ];

    TABLES.forEach(([c, r]) => {
        const x = c * 16;
        const y = r * 16 + 4;
        OBJECTS.push(obj('front_of_house/table_rect_4seat', x, y, 24));
        OBJECTS.push(obj('front_of_house/chair_down', x + 10, y - 16, 16));
        OBJECTS.push(obj('front_of_house/chair_right', x - 14, y + 4, 16));
        OBJECTS.push(obj('front_of_house/chair_left', x + 34, y + 4, 16));
        const food = TABLE_FOOD[`${c},${r}`];
        if (food) OBJECTS.push(obj(food, x + 8, y - 12, 16));
    });

    const WALL_DECOR = [
        { img: W('decor/poster_pizza'), x: 140, y: 6 },
        { img: W('front_of_house/menu_board'), x: 160, y: 2 },
        { img: W('tiles/door_closed'), x: 216, y: 0 },
        { img: W('decor/poster_coffee'), x: 246, y: 6 },
        { img: W('decor/poster_star'), x: 264, y: 6 },
    ];

    const RUG = { img: W('tiles/rug_48x32'), x: 176, y: 140 };

    function floorImage(col, row) {
        if (row === 0) return W('tiles/wall_face');
        return W((col + row) % 2 === 0 ? 'tiles/floor_checker_a' : 'tiles/floor_checker_b');
    }

    function referencedImages() {
        const names = new Set([W('tiles/floor_checker_a'), W('tiles/floor_checker_b'), W('tiles/wall_face'), RUG.img]);
        OBJECTS.forEach((o) => names.add(o.img));
        WALL_DECOR.forEach((o) => names.add(o.img));
        return Array.from(names);
    }

    // Draws the static background (floor, wall decor, rug) at logical scale.
    function drawBackground(ctx, images) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const img = images[floorImage(c, r)];
                if (img) ctx.drawImage(img, c * TILE * SCALE, r * TILE * SCALE, TILE * SCALE, TILE * SCALE);
            }
        }
        [RUG].concat(WALL_DECOR).forEach((d) => {
            const img = images[d.img];
            if (img) ctx.drawImage(img, d.x * SCALE, d.y * SCALE, img.width * SCALE, img.height * SCALE);
        });
    }

    // Furniture plus characters, sorted by their bottom edge so people walk behind and in front of things.
    function drawDepthSorted(ctx, images, characters) {
        const items = OBJECTS.map((o) => ({ sortY: o.sortY * SCALE, draw: () => {
            const img = images[o.img];
            if (img) ctx.drawImage(img, o.x * SCALE, o.y * SCALE, img.width * SCALE, img.height * SCALE);
        } })).concat(characters.map((ch) => ({ sortY: ch.y + 32, draw: ch.draw })));
        items.sort((a, b) => a.sortY - b.sortY).forEach((i) => i.draw());
    }

    return { COLS, ROWS, TILE, OBJECTS, WALL_DECOR, RUG, floorImage, referencedImages, drawBackground, drawDepthSorted };
});
