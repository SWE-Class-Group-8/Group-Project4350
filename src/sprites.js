(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.Sprites = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    // Spritesheet format (see assets/README.md):
    //   characters: 32x32 frames; rows = down, left, right, up; column 0 = idle, columns 1..3 = walk.
    //   tiles: one row of 32x32 tiles: floor, wall, counter, table, kitchen.
    const FRAME = 32;
    const DIRECTIONS = ['down', 'left', 'right', 'up'];
    const WALK_COLUMNS = 4;
    const NAMES = ['player', 'chef_mario', 'cashier_bruce', 'customer_matthew', 'tiles'];
    const BASE_PATH = 'assets/sprites/';
    const KEY_DIRECTION = { w: 'up', s: 'down', a: 'left', d: 'right' };
    const EMOTION_STYLE = {
        neutral: { color: '#cccccc', icon: '...' },
        happy: { color: '#4cd964', icon: ':)' },
        sad: { color: '#5ac8fa', icon: ':(' },
        angry: { color: '#ff3b30', icon: '>:(' },
        annoyed: { color: '#ff9500', icon: '-_-' },
    };

    function directionFromKey(key, previous = 'down') {
        return KEY_DIRECTION[key] || previous;
    }

    function directionRow(direction) {
        const i = DIRECTIONS.indexOf(direction);
        return i < 0 ? 0 : i;
    }

    // Column 0 when standing; otherwise cycle columns 1..columns-1 by step count.
    function walkFrame(steps, moving, columns = WALK_COLUMNS) {
        if (!moving) return 0;
        return 1 + (Math.max(0, steps) % (columns - 1));
    }

    // Source rectangle in the sheet for a character frame.
    function frameRect(direction, steps, moving) {
        return { sx: walkFrame(steps, moving) * FRAME, sy: directionRow(direction) * FRAME, sw: FRAME, sh: FRAME };
    }

    // loadImage(src) -> Promise<image>; rejects when the file is missing.
    // Resolves to { name: image | null } so callers fall back to placeholders for nulls.
    function loadSprites(loadImage, names = NAMES, base = BASE_PATH) {
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

    // ---- drawing (browser only; ctx is a CanvasRenderingContext2D) ----
    const TILE_COLORS = ['#c9a87a', '#5b3a24', '#8b5e3c', '#a0522d', '#9aa5b1'];

    function drawTiles(ctx, images, tiles, tileSize) {
        tiles.forEach((row, r) => row.forEach((t, c) => {
            if (images.tiles) {
                ctx.drawImage(images.tiles, t * FRAME, 0, FRAME, FRAME, c * tileSize, r * tileSize, tileSize, tileSize);
            } else {
                ctx.fillStyle = TILE_COLORS[t] || TILE_COLORS[0];
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            }
        }));
    }

    function drawPlaceholderPerson(ctx, x, y, color) {
        ctx.fillStyle = '#00000044';
        ctx.fillRect(x + 4, y + FRAME - 4, FRAME - 8, 4);
        ctx.fillStyle = color;
        ctx.fillRect(x + 6, y + 12, FRAME - 12, FRAME - 16);
        ctx.fillStyle = '#ffd7b5';
        ctx.fillRect(x + 8, y, FRAME - 16, 14);
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 11, y + 5, 3, 3);
        ctx.fillRect(x + FRAME - 14, y + 5, 3, 3);
    }

    function drawCharacter(ctx, images, name, x, y, color, direction = 'down', steps = 0, moving = false) {
        const img = images[name];
        if (img) {
            const r = frameRect(direction, steps, moving);
            ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, x, y, FRAME, FRAME);
        } else {
            drawPlaceholderPerson(ctx, x, y, color);
        }
    }

    function drawEmotion(ctx, x, y, emotion) {
        const style = EMOTION_STYLE[emotion] || EMOTION_STYLE.neutral;
        const cx = x + FRAME / 2;
        const cy = y - 22;
        ctx.fillStyle = style.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(style.icon, cx, cy + 3);
        ctx.textAlign = 'start';
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
        FRAME, DIRECTIONS, NAMES, EMOTION_STYLE, images, player,
        directionFromKey, directionRow, walkFrame, frameRect, loadSprites, browserLoadImage,
        drawTiles, drawCharacter, drawEmotion, recordMove, init,
    };
});
