// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
/**
 * pixel-kit/particles.ts — deterministic particle library.
 *
 * Each particle's seed (initial x, speed, phase) is fixed by a hash of its index, then its
 * position loops with `frame`. No Math.random — fully reproducible (rain / snow / embers /
 * bubbles / sand / sakura). Coordinates are meant to be drawn at internal resolution and
 * integer-snapped by the caller.
 */

// Deterministic hash in [0,1) from an integer-ish seed.
export const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const seed2 = (n: number) => {
  const x = Math.sin(n * 91.3 + 47.1) * 31873.7;
  return x - Math.floor(x);
};

export type Particle = { x: number; y: number; size: number; phase: number; sway: number };

export type FieldOpts = {
  count: number;
  w: number;
  h: number;
  frame: number;
  speed?: number;     // vertical px/frame
  swayAmp?: number;   // horizontal sine sway amplitude (px)
  swaySpeed?: number; // sway angular speed
  sizeMin?: number;
  sizeMax?: number;
  dir?: 1 | -1;       // 1 = fall down, -1 = rise up
  layerSeed?: number;
};

/**
 * A looping field of particles. Returns integer-snapped positions for the current frame.
 * Deterministic: position depends only on (index, frame, fixed seeds).
 */
export function particleField(o: FieldOpts): Particle[] {
  const {
    count, w, h, frame,
    speed = 2, swayAmp = 6, swaySpeed = 0.08,
    sizeMin = 1, sizeMax = 2, dir = 1, layerSeed = 0,
  } = o;
  const span = h + 20;
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s1 = seed(i * 2.3 + layerSeed);
    const s2 = seed2(i * 1.7 + layerSeed + 11);
    const baseX = s1 * w;
    const vy = speed * (0.6 + s2 * 0.8);
    const start = s2 * span;
    let y = (start + frame * vy * dir) % span;
    if (y < 0) y += span;
    const yy = dir === 1 ? y - 10 : h + 10 - y;
    const sway = Math.sin(frame * swaySpeed + s1 * 9) * swayAmp;
    out.push({
      x: Math.round(baseX + sway),
      y: Math.round(yy),
      size: Math.max(1, Math.round(sizeMin + s1 * (sizeMax - sizeMin))),
      phase: s1 * 8,
      sway,
    });
  }
  return out;
}

/** A static twinkling starfield (fixed positions, brightness modulated by frame). */
export function starField(count: number, w: number, h: number, layerSeed = 7) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.round(seed(i * 1.7 + layerSeed) * w),
      y: Math.round(seed2(i * 4.3 + layerSeed + 3) * h),
      ph: seed(i * 9.1 + layerSeed),
    });
  }
  return stars;
}
export const starBrightness = (frame: number, ph: number) =>
  0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.15 + ph * 9));
