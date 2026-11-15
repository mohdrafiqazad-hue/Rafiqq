// Frame numbers of the main beats (30 fps). Keep in sync with audio/make_sfx.py
export const FPS = 30;
export const DURATION = 180; // 6 s
export const F_EMBLEM = 50; // emblem lands (big impact)
export const F_LETTERS = 52; // title letters start flying in
export const LETTER_GAP = 2.6;
export const F_TITLE = 84; // last letter lands (second impact)
export const F_SWEEP = 92; // light sweep across the metal
export const F_NEWS = 112; // NEWS TV plate lands (stinger)

// World layout (camera fov 35, z = 20 -> visible height ~12.6 units)
export const EMBLEM_Y = 2.25;
export const TITLE_Y = -1.25;
export const NEWS_Y = -2.6;
