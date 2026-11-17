# Sprite assets

Drop PNGs into `assets/sprites/`. Any missing file falls back to a drawn placeholder, so add them one at a time.
Paths are loaded relative to `src/main.html`'s page (serve `assets/` next to `src/`, or copy the folder alongside it and adjust `BASE_PATH` in `src/sprites.js`).

| File | Size | Contents |
| --- | --- | --- |
| `player.png` | 128x128 | player character sheet |
| `chef_mario.png` | 128x128 | Chef Mario sheet |
| `cashier_bruce.png` | 128x128 | Cashier Bruce sheet |
| `customer_matthew.png` | 128x128 | Customer Matthew sheet |
| `tiles.png` | 160x32 | tileset |

## Character sheet layout
32x32 pixel frames, transparent background, 4 columns x 4 rows.
- Rows (top to bottom): facing down, left, right, up.
- Column 0: idle. Columns 1-3: walk cycle.

NPCs currently use only the down-facing idle frame (row 0, column 0).

## Tileset layout
One row of 32x32 tiles, left to right: floor, wall, counter, table, kitchen.
The map is 20x12 tiles (`src/map.js`); wall, counter, table and kitchen tiles block movement.

PNG only. Keep file names exactly as listed.
