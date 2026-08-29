// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
/**
 * pixel-kit/palette.ts — Color-cycling palette engine (the killer technique).
 *
 * Recreates the Amiga-era "color cycling" (Mark Ferrari / Living Worlds) deterministically:
 * a STATIC quantized structure whose PALETTE is rotated per-frame makes water / rain / neon /
 * fire / lava / auroras appear to flow — at $0, with zero jitter.
 *
 * Pure deterministic: every value is a function of `frame` + fixed constants. No Math.random,
 * no Date, no external input. Hardware/classic palettes (NES/GameBoy/PICO-8) use public-domain
 * colour values, so ramps can be extended without limit.
 *
 * Self-contained: no external CDN, no runtime fetch.
 */

export type RGB = [number, number, number];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerpRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

export const rgb = (c: RGB, a = 1) =>
  a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ---------------------------------------------------------------------------
// Ramps (palettes v2). Each is a cyclic list of RGB stops.
// NEON is the synthwave default; the rest extend color cycling to nature / RPG / horror.
// ---------------------------------------------------------------------------
export const NEON_RAMP: RGB[] = [
  [255, 46, 166], [255, 120, 60], [255, 226, 80], [120, 255, 180],
  [34, 224, 255], [90, 130, 255], [200, 96, 255], [255, 80, 200],
];

export const WATER_RAMP: RGB[] = [
  [10, 40, 90], [20, 90, 150], [40, 150, 200], [120, 210, 230], [200, 245, 250], [40, 150, 200],
];
export const OCEAN_RAMP: RGB[] = [
  [6, 30, 70], [12, 70, 120], [24, 120, 165], [80, 180, 205], [150, 225, 235], [24, 120, 165],
];
export const RIVER_RAMP: RGB[] = [
  [18, 60, 80], [30, 110, 130], [70, 160, 170], [150, 210, 205], [70, 160, 170], [30, 110, 130],
];
export const LAKE_RAMP: RGB[] = [
  [16, 36, 66], [28, 78, 120], [60, 140, 175], [140, 200, 220], [60, 140, 175], [28, 78, 120],
];
export const RAIN_RAMP: RGB[] = [
  [40, 56, 84], [70, 92, 130], [120, 150, 190], [180, 205, 235], [120, 150, 190], [70, 92, 130],
];
export const AURORA_RAMP: RGB[] = [
  [10, 40, 30], [30, 200, 140], [120, 255, 200], [40, 220, 230], [120, 110, 240], [180, 90, 220], [30, 120, 90],
];
export const LAVA_RAMP: RGB[] = [
  [60, 8, 4], [140, 20, 6], [220, 60, 10], [255, 130, 20], [255, 220, 90], [255, 130, 20], [140, 20, 6],
];
export const FIRE_RAMP: RGB[] = [
  [30, 4, 2], [120, 16, 6], [220, 70, 12], [255, 150, 30], [255, 230, 120], [255, 150, 30],
];
export const CAMPFIRE_RAMP: RGB[] = [
  [40, 10, 4], [150, 40, 10], [240, 110, 20], [255, 180, 60], [255, 235, 150], [240, 110, 20],
];
export const VOLCANO_RAMP: RGB[] = [
  [20, 4, 6], [90, 12, 10], [180, 30, 12], [240, 80, 16], [255, 160, 40], [180, 30, 12],
];
export const FOREST_RAMP: RGB[] = [
  [10, 36, 20], [22, 70, 36], [40, 110, 54], [90, 160, 80], [150, 200, 120], [40, 110, 54],
];
export const DESERT_HEAT_RAMP: RGB[] = [
  [120, 80, 40], [180, 130, 70], [230, 185, 110], [250, 225, 170], [230, 185, 110], [180, 130, 70],
];
export const CITYPOP_SUNSET_RAMP: RGB[] = [
  [40, 18, 70], [120, 40, 120], [220, 70, 130], [255, 130, 110], [255, 200, 120], [220, 70, 130],
];
export const BLOOD_RAMP: RGB[] = [
  [20, 0, 0], [60, 4, 6], [110, 8, 10], [160, 14, 16], [110, 8, 10], [60, 4, 6],
];
export const HORROR_DARK_RAMP: RGB[] = [
  [6, 8, 10], [18, 22, 26], [40, 30, 30], [70, 40, 36], [40, 30, 30], [18, 22, 26],
];
export const ARCANE_RAMP: RGB[] = [
  [40, 10, 80], [110, 40, 200], [180, 110, 255], [120, 220, 255], [220, 140, 255], [110, 40, 200],
];
export const METAL_REFLECT_RAMP: RGB[] = [
  [40, 44, 60], [110, 120, 150], [200, 210, 235], [255, 255, 255], [200, 210, 235], [110, 120, 150],
];

// Public-domain hardware palettes (colour values are facts, not protected expression).
export const GAMEBOY_4: RGB[] = [
  [15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15],
];
// PICO-8 16-colour LUT (public-domain colour values).
export const PICO8_LUT: RGB[] = [
  [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
  [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
  [255, 0, 77], [255, 163, 0], [255, 236, 39], [0, 228, 54],
  [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170],
];

export const RAMPS: Record<string, RGB[]> = {
  neon: NEON_RAMP, water: WATER_RAMP, ocean: OCEAN_RAMP, river: RIVER_RAMP, lake: LAKE_RAMP,
  rain: RAIN_RAMP, aurora: AURORA_RAMP, lava: LAVA_RAMP, fire: FIRE_RAMP, campfire: CAMPFIRE_RAMP,
  volcano: VOLCANO_RAMP, forest: FOREST_RAMP, desert: DESERT_HEAT_RAMP, citypop: CITYPOP_SUNSET_RAMP,
  blood: BLOOD_RAMP, horror: HORROR_DARK_RAMP, arcane: ARCANE_RAMP, metal: METAL_REFLECT_RAMP,
  gameboy: GAMEBOY_4, pico8: PICO8_LUT,
};

/**
 * Color cycling: scroll along a ramp by `frame`, offset per cell by `phase`, return the colour.
 * `speed` = ramp steps advanced per frame. Continuous (lerp) interpolation.
 * Map `phase` to a spatial coordinate (vertical / horizontal / depth / path / reflection)
 * to set the FLOW DIRECTION — that spatial binding is what makes it distinct, not the ramp itself.
 */
export function cyclePalette(frame: number, phase: number, speed = 0.06, ramp: RGB[] = NEON_RAMP): RGB {
  const n = ramp.length;
  const pos = (((frame * speed + phase) % n) + n) % n;
  const i = Math.floor(pos);
  const f = pos - i;
  return lerpRGB(ramp[i % n], ramp[(i + 1) % n], f);
}

/**
 * Locked-LUT variant: snap to the nearest ramp index (no lerp) for a strict colour-count look
 * (PICO-8 / GameBoy aesthetic). Distinct motion grammar from cyclePalette's continuous blend.
 */
export function cyclePaletteLocked(frame: number, phase: number, speed = 0.06, ramp: RGB[] = PICO8_LUT): RGB {
  const n = ramp.length;
  const pos = (((frame * speed + phase) % n) + n) % n;
  return ramp[Math.floor(pos) % n];
}

// ---------------------------------------------------------------------------
// Sky helpers (a neon-sunset horizon that gently "breathes").
// ---------------------------------------------------------------------------
export function skyHorizon(frame: number, a: RGB = [255, 46, 166], b: RGB = [34, 224, 255]): RGB {
  const t = 0.5 + 0.5 * Math.sin(frame * 0.012);
  return lerpRGB(a, b, t);
}

// Boost a colour toward a target (e.g. white on a beat hit).
export function boostToward(c: RGB, target: RGB, amt: number): RGB {
  return lerpRGB(c, target, Math.max(0, Math.min(1, amt)));
}
export const WHITE: RGB = [255, 255, 255];
export const BLACK: RGB = [0, 0, 0];

// ---------------------------------------------------------------------------
// Quantization helpers (NES-style attribute clamp + nearest-palette index).
// ---------------------------------------------------------------------------
// Snap a continuous coordinate to a CELL grid (NES 16x16 attribute look at internal res).
export const quantizeToCell = (v: number, cell: number) => Math.floor(v / cell) * cell;

// Nearest colour index in a LUT (for colour-count-locked rendering).
export function nearestIndex(c: RGB, ramp: RGB[] = PICO8_LUT): number {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < ramp.length; i++) {
    const d = (c[0] - ramp[i][0]) ** 2 + (c[1] - ramp[i][1]) ** 2 + (c[2] - ramp[i][2]) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
