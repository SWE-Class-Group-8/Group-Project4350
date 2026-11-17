(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.Scene = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    // Coordinates here are in native art pixels (16px tiles, 20x12 tiles = 320x192).
    // Collision still comes from map.js, so keep furniture lined up with its blocking tiles.
    const COLS = 20;
    const ROWS = 12;
    const TILE = 16;
    const SCALE = 2;
    const W = (n) => `world/${n}`;

    // Objects are positioned by their top-left; sortY is the bottom edge used for depth ordering.
    function obj(img, x, y, h) {
        return { img: W(img), x, y, sortY: y + h };
    }

    const OBJECTS = [
        obj('kitchen/fridge', 0, 0, 32),
        obj('kitchen/stove', 16, 8, 24),
        obj('kitchen/counter_left', 32, 8, 24),
        obj('kitchen/sink', 48, 8, 24),
        obj('kitchen/prep_table', 64, 8, 24),
        obj('kitchen/counter_mid', 192, 8, 24),
        obj('kitchen/counter_mid', 208, 8, 24),
        obj('front_of_house/cashier_counter', 224, 8, 24),
        obj('kitchen/counter_mid', 272, 8, 24),
        obj('kitchen/counter_mid', 288, 8, 24),
        obj('kitchen/counter_right', 304, 8, 24),
        obj('front_of_house/register', 240, -4, 16),
        obj('front_of_house/table_rect_4seat', 64, 116, 24),
        obj('front_of_house/table_rect_4seat', 128, 116, 24),
        obj('front_of_house/table_rect_4seat', 192, 100, 24),
        obj('front_of_house/chair_down', 74, 104, 16),
        obj('front_of_house/chair_down', 138, 104, 16),
        obj('front_of_house/chair_down', 202, 88, 16),
        obj('front_of_house/chair_right', 50, 120, 16),
        obj('front_of_house/chair_right', 114, 120, 16),
        obj('front_of_house/chair_right', 178, 104, 16),
        obj('front_of_house/chair_left', 98, 120, 16),
        obj('front_of_house/chair_left', 162, 120, 16),
        obj('front_of_house/chair_left', 226, 104, 16),
        obj('food/coffee', 72, 108, 16),
        obj('food/pizza_whole', 140, 108, 16),
        obj('food/burger', 200, 92, 16),
        obj('front_of_house/plant_large', 300, 150, 32),
        obj('front_of_house/plant_small', 4, 160, 16),
        obj('front_of_house/booth', 4, 124, 28),
    ];

    const WALL_DECOR = [
        { img: W('decor/poster_pizza'), x: 98, y: 6 },
        { img: W('front_of_house/menu_board'), x: 116, y: 2 },
        { img: W('tiles/door_closed'), x: 170, y: 0 },
    ];

    const RUG = { img: W('tiles/rug_48x32'), x: 136, y: 56 };

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
