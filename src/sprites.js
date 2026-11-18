(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.Sprites = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    // Art pack layout (see assets/PACK_README.txt): every sprite is its own PNG, drawn at 16px-per-tile
    // native size. The world is laid out in 2x logical units, so images are drawn at SCALE.
    const SCALE = 2;
    const CHAR_W = 16;
    const CHAR_H = 25;
    const BOX = 32;
    const DIRECTIONS = ['down', 'left', 'right', 'up'];
    const WALK_FRAMES = 4;
    const NPC_IDS = ['chef_mario', 'cashier_bruce', 'customer_matthew', 'waiter_leo'];
    const CHARACTER_IDS = ['player'].concat(NPC_IDS);
    const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'annoyed'];
    const BASE_PATH = '../assets/';
    const KEY_DIRECTION = { w: 'up', s: 'down', a: 'left', d: 'right' };
    const EMOTION_ICON = { happy: 'heart', angry: 'anger', sad: 'sweat', annoyed: 'alert', neutral: null };
    const ICONS = ['heart', 'anger', 'sweat', 'alert', 'ellipsis'];

    const WORLD_IMAGES = [
        'tiles/floor_checker_a', 'tiles/floor_checker_b', 'tiles/wall_face', 'tiles/wall_top', 'tiles/window',
        'tiles/door_closed', 'tiles/rug_48x32',
        'kitchen/counter_left', 'kitchen/counter_mid', 'kitchen/counter_right', 'kitchen/stove', 'kitchen/fridge',
        'kitchen/prep_table', 'kitchen/sink',
        'front_of_house/cashier_counter', 'front_of_house/register', 'front_of_house/table_rect_4seat',
        'front_of_house/table_round_2seat', 'front_of_house/chair_down', 'front_of_house/chair_left',
        'front_of_house/chair_right', 'front_of_house/chair_up', 'front_of_house/booth', 'front_of_house/menu_board',
        'front_of_house/plant_large', 'front_of_house/plant_small',
        'decor/wall_clock', 'decor/poster_pizza', 'decor/poster_coffee', 'decor/poster_star', 'decor/open_sign',
        'food/coffee', 'food/pizza_whole', 'food/burger', 'food/plate',
        'interaction_highlights/press_e_key_up', 'interaction_highlights/press_e_key_down',
    ].map((n) => `world/${n}`);

    function frameName(direction, steps, moving) {
        return moving ? `${direction}_walk_${Math.max(0, steps) % WALK_FRAMES}` : `${direction}_idle`;
    }

    function characterImageName(id, direction, steps, moving, talkFrame) {
        const frame = talkFrame === 0 || talkFrame === 1 ? `talk_${talkFrame}` : frameName(direction, steps, moving);
        return `characters/${id}/${frame}`;
    }

    function allAssetNames() {
        const names = [];
        CHARACTER_IDS.forEach((id) => {
            DIRECTIONS.forEach((d) => {
                names.push(`characters/${id}/${d}_idle`);
                for (let i = 0; i < WALK_FRAMES; i++) names.push(`characters/${id}/${d}_walk_${i}`);
            });
            if (id !== 'player') names.push(`characters/${id}/talk_0`, `characters/${id}/talk_1`);
            EMOTIONS.forEach((e) => names.push(`portraits/${id}/${e}`));
        });
        ICONS.forEach((i) => names.push(`emotion_indicators/${i}`));
        return names.concat(WORLD_IMAGES);
    }

    function directionFromKey(key, previous = 'down') {
        return KEY_DIRECTION[key] || previous;
    }

    function emotionIcon(emotion) {
        return EMOTION_ICON[emotion] || null;
    }

    // loadImage(src) -> Promise<image>; a missing file resolves to null so callers skip it.
    function loadSprites(loadImage, names = allAssetNames(), base = BASE_PATH) {
        return Promise.all(names.map((name) =>
            Promise.resolve().then(() => loadImage(`${base}${name}.png`)).then((img) => img || null, () => null)
        )).then((images) => {
            const out = {};
            names.forEach((n, i) => { out[n] = images[i]; });
            return out;
        });
    }

    function browserLoadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`missing ${src}`));
            img.src = src;
        });
    }

    // ---- drawing (browser only). ctx is already scaled so 1 unit = 1 logical world pixel. ----
    function drawImage(ctx, images, name, x, y) {
        const img = images[name];
        if (img) ctx.drawImage(img, Math.round(x), Math.round(y), img.width * SCALE, img.height * SCALE);
    }

    // Characters stand on the bottom of their 32px logical box.
    function drawCharacter(ctx, images, id, x, y, opts = {}) {
        const name = characterImageName(id, opts.direction || 'down', opts.steps || 0, !!opts.moving, opts.talkFrame);
        drawImage(ctx, images, name, x + (BOX - CHAR_W * SCALE) / 2, y + BOX - CHAR_H * SCALE);
    }

    function drawEmotion(ctx, images, x, y, emotion) {
        const icon = emotionIcon(emotion);
        if (!icon) return;
        const img = images[`emotion_indicators/${icon}`];
        if (img) drawImage(ctx, images, `emotion_indicators/${icon}`, x + (BOX - img.width * SCALE) / 2, y + BOX - CHAR_H * SCALE - img.height * SCALE - 2);
    }

    // Player facing/step state, updated from key presses.
    const player = { facing: 'down', steps: 0, moving: false };

    function recordMove(key, moved) {
        player.facing = directionFromKey(key, player.facing);
        player.moving = moved;
        if (moved) player.steps += 1;
        return player;
    }

    const images = {};
    function init(loader = browserLoadImage) {
        return loadSprites(loader).then((loaded) => { Object.assign(images, loaded); return images; });
    }

    return {
        SCALE, CHAR_W, CHAR_H, BOX, DIRECTIONS, EMOTIONS, NPC_IDS, CHARACTER_IDS, WORLD_IMAGES, images, player,
        frameName, characterImageName, allAssetNames, directionFromKey, emotionIcon, loadSprites, browserLoadImage,
        drawImage, drawCharacter, drawEmotion, recordMove, init,
    };
});
