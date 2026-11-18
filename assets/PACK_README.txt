AGENT APPETITE ASSET PACK

Everything is drawn from one shared palette. See palette/palette.txt and palette/palette_swatches.png.
Files ending in _x3, _x4, _x6, _x8 are enlarged previews. Use the files without a suffix in your game and scale them with nearest neighbor filtering.

CHARACTERS (characters/<name>/)
Each sprite is 16 wide by 25 tall with a transparent background and a shared ground line, so frames line up when you swap them.
Names: player, chef_mario, cashier_bruce, customer_matthew, waiter_leo.
Files: down_idle, up_idle, left_idle, right_idle, and for each direction down_walk_0 to down_walk_3 (idle, step, idle, step).
NPCs also have talk_0 (mouth open) and talk_1 (mouth closed). Play them back and forth for a talking pose.
spritesheet.png holds every frame in rows: down, up, left, right.

PORTRAITS (portraits/<name>/)
32 by 40. Five emotions each: neutral, happy, angry, sad, annoyed. player_avatar.png is for the profile and memory dashboard.

EMOTION INDICATORS (emotion_indicators/)
heart, anger, sweat, alert, ellipsis.

WORLD (world/)
tiles: 16 by 16 floors, walls, window, door (16 by 32), rugs, grass, street, sidewalk.
kitchen: counters, stove, fridge, prep table, sink.
front_of_house: cashier counter, register, tables, chairs in four directions, booth, menu board, plants.
decor: posters, string lights, clock, OPEN sign.
food: plate, coffee, messy drink, soda, hot dog, pizza slice, whole pizza, burger, fries, cupcake.
interaction_highlights: a glowing mint outline version of every kitchen object, front of house object and food item, plus the Press E key (two frames) and a bobbing arrow.

UI (ui/)
logo: wordmark and main menu background, plus a preview with buttons.
buttons: LOGIN, REGISTER, SETTINGS, EXIT, SAVE, BACK, GOODBYE, LOG OUT in normal, hover, pressed and disabled. Blank buttons are included for any other label.
panels: dialogue box, name tab, portrait frame, login, settings, memory and quest panels, text input in three states, a 48 by 48 panel source for nine slice stretching.
settings_controls: slider track and knob, toggle, checkbox.
quest: status badges and the two quest markers above NPCs.
dashboard: memory cards, relationship meter from minus 100 to 100 with a marker, level badge, interactions badge.
hud: name plate, controls hint, thinking bubble in three frames, error toast.
cursor: arrow and hand. The hotspot is the top left pixel.
favicon: 32 and 16 pixel PNG files and favicon.ico.
fonts: Press Start 2P and VT323. Both use the SIL Open Font License, which allows free use in games. License files are included.

AUDIO
The list had no audio items, so none are included.
