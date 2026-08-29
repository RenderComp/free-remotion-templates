// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
/**
 * pixel-kit/fx.tsx — beat-driven pixel FX + the CRT / scanline / chroma / dither "skin".
 *
 * Two kinds of layer, kept separate (this separation is what keeps pixels crisp):
 *   1. Internal-resolution FX (drawn in the IWxIH scene, then nearest-upscaled): BitmapText,
 *      PixelBeatFlash, PixelSparkle, PixelDither.
 *   2. Final-resolution overlays (laid over the upscaled pixels): CrtScanlines, CrtVignette,
 *      CrtNoise, ChromaShift, ApertureGrille.
 *
 * All deterministic. Reuse origin: rv-template-crt-boot / 8bit-rpg-dialog / dither-floyd.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cyclePalette, rgb, type RGB } from "./palette";
import { layoutText, measureText, GLYPH_H } from "./font";

const snap = (n: number) => Math.round(n);
const hseed = (n: number) => {
  const x = Math.sin(n * 91.3 + 47.1) * 31873.7;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// BitmapText — draw a string with the 5x7 self-made font as <rect> dots.
// Cell = internal pixels per dot. Place inside an internal-resolution <svg>/scene.
// ---------------------------------------------------------------------------
export const BitmapText: React.FC<{
  text: string;
  x: number;
  y: number;
  cell?: number;
  color?: string;
  align?: "left" | "center" | "right";
  opacity?: number;
}> = ({ text, x, y, cell = 1, color = "#fff", align = "left", opacity = 1 }) => {
  const { cells } = layoutText(text);
  const w = measureText(text) * cell;
  const ox = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  return (
    <g opacity={opacity}>
      {cells.map((c, i) => (
        <rect key={i} x={snap(ox + c.x * cell)} y={snap(y + c.y * cell)} width={cell} height={cell} fill={color} />
      ))}
    </g>
  );
};

export const TEXT_H = GLYPH_H;

// ---------------------------------------------------------------------------
// PixelBeatFlash — full-screen flash + quantized concentric rings on a beat hit.
// ---------------------------------------------------------------------------
export const PixelBeatFlash: React.FC<{ iw: number; ih: number; intensity: number; cy?: number }> = ({
  iw, ih, intensity, cy = 0.42,
}) => {
  if (intensity <= 0.02) return null;
  const a = Math.min(0.5, intensity * 0.5);
  return (
    <svg width={iw} height={ih} viewBox={`0 0 ${iw} ${ih}`} style={fxSvgStyle("screen", iw, ih)}>
      <rect x={0} y={0} width={iw} height={ih} fill={rgb([255, 255, 255], a * 0.4)} />
      {[0, 1, 2].map((i) => {
        const r = snap((iw * 0.18 + i * iw * 0.16) * (0.6 + intensity));
        return (
          <rect
            key={i}
            x={iw / 2 - r}
            y={ih * cy - r}
            width={r * 2}
            height={r * 2}
            fill="none"
            stroke={rgb([255, 255, 255], a * (1 - i * 0.25))}
            strokeWidth={Math.max(1, snap(3 * intensity))}
          />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// PixelSparkle — kira twinkle: a cross + dot cluster sprite.
// ---------------------------------------------------------------------------
export const PixelSparkle: React.FC<{
  iw: number; ih: number; localFrame: number; spanFrames: number;
  cx: number; cy: number; seedKey: number; strength: number; ramp?: RGB[];
}> = ({ iw, ih, localFrame, spanFrames, cx, cy, seedKey, strength, ramp }) => {
  const frame = useCurrentFrame();
  if (localFrame < 0 || localFrame > spanFrames) return null;
  const t = localFrame / spanFrames;
  const ease = 1 - Math.pow(1 - t, 2);
  const fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
  const ox = cx * iw, oy = cy * ih;
  const count = 8 + Math.round(strength * 6);
  const col = cyclePalette(frame, seedKey * 1.7, 0.1, ramp);
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const ang = hseed(seedKey * 10 + i) * Math.PI * 2;
    const dist = (8 + hseed(seedKey + i * 3.1) * 60) * ease;
    const x = snap(ox + Math.cos(ang) * dist);
    const y = snap(oy + Math.sin(ang) * dist);
    const sz = Math.max(1, snap(1 + hseed(seedKey + i) * 2));
    const tw = 0.5 + 0.5 * Math.sin(localFrame * 0.9 + i);
    dots.push(<rect key={i} x={x} y={y} width={sz} height={sz} fill={rgb(col, fade * tw)} />);
  }
  const armLen = snap(4 + strength * 6);
  const ca = fade * (0.8 + 0.2 * Math.sin(localFrame));
  dots.push(<rect key="hx" x={snap(ox) - armLen} y={snap(oy)} width={armLen * 2} height={1} fill={rgb([255, 255, 255], ca)} />);
  dots.push(<rect key="vx" x={snap(ox)} y={snap(oy) - armLen} width={1} height={armLen * 2} fill={rgb([255, 255, 255], ca)} />);
  return <svg width={iw} height={ih} viewBox={`0 0 ${iw} ${ih}`} style={fxSvgStyle("screen", iw, ih)}>{dots}</svg>;
};

// ---------------------------------------------------------------------------
// PixelDither — ordered Bayer 4x4 dither over dark areas (retro tonal feel).
// staticThreshold = frame-independent (structural). Pass scrollFrame to animate a dissolve.
// ---------------------------------------------------------------------------
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export const PixelDither: React.FC<{ iw: number; ih: number; opacity?: number; threshold?: number }> = ({
  iw, ih, opacity = 0.1, threshold = 6,
}) => {
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++)
      if (BAYER4[y][x] < threshold)
        dots.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000" />);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "multiply" }}>
      <svg width={iw} height={ih} viewBox={`0 0 ${iw} ${ih}`} style={{ position: "absolute", inset: 0, width: iw, height: ih, imageRendering: "pixelated" }}>
        <defs>
          <pattern id="bayer4" width={4} height={4} patternUnits="userSpaceOnUse">{dots}</pattern>
        </defs>
        <rect x={0} y={0} width={iw} height={ih} fill="url(#bayer4)" />
      </svg>
    </AbsoluteFill>
  );
};

export function fxSvgStyle(blend: React.CSSProperties["mixBlendMode"], iw: number, ih: number): React.CSSProperties {
  return {
    position: "absolute", inset: 0, width: iw, height: ih,
    imageRendering: "pixelated", shapeRendering: "crispEdges",
    mixBlendMode: blend, pointerEvents: "none",
  };
}

// ===========================================================================
// Final-resolution CRT overlays (laid over the upscaled pixel layer).
// ===========================================================================
export const CrtScanlines: React.FC<{ opacity?: number; gap?: number }> = ({ opacity = 0.55, gap = 5 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0px, rgba(0,0,0,0.32) 2px, transparent 2px, transparent ${gap}px)`,
      mixBlendMode: "multiply",
      opacity,
    }}
  />
);

export const CrtVignette: React.FC<{ strength?: number }> = ({ strength = 0.85 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 78% 72% at 50% 48%, transparent 52%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

export const CrtNoise: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity, mixBlendMode: "screen" }}>
      <defs>
        <filter id="px-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 64} />
          <feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.35 0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#px-noise)" />
    </svg>
  );
};

export const ChromaShift: React.FC<{ amount: number }> = ({ amount }) => {
  const frame = useCurrentFrame();
  const dx = (1 + amount * 4) * Math.sin(frame / 5);
  return (
    <>
      <AbsoluteFill style={{ pointerEvents: "none", background: `linear-gradient(90deg, rgba(255,0,80,0.05), transparent ${20 + dx}%)`, mixBlendMode: "screen", transform: `translateX(${dx}px)` }} />
      <AbsoluteFill style={{ pointerEvents: "none", background: `linear-gradient(270deg, rgba(0,200,255,0.05), transparent ${20 - dx}%)`, mixBlendMode: "screen", transform: `translateX(${-dx}px)` }} />
    </>
  );
};

// Trinitron-style vertical RGB aperture grille (final-res overlay).
export const ApertureGrille: React.FC<{ opacity?: number }> = ({ opacity = 0.22 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      mixBlendMode: "multiply",
      opacity,
      background:
        "repeating-linear-gradient(90deg, rgba(255,0,0,0.5) 0px, rgba(255,0,0,0.5) 1px, rgba(0,255,0,0.5) 1px, rgba(0,255,0,0.5) 2px, rgba(0,0,255,0.5) 2px, rgba(0,0,255,0.5) 3px)",
    }}
  />
);
