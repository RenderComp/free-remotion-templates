// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// pixel-waterfall-cycle — a static quantized cliff with a falling-water band animated purely by
// vertical-phase color cycling (the killer technique). Mist rises on a separate phase. Seamless
// loop, pure-deterministic, $0. Reuse: pixel-kit (cyclePalette WATER_RAMP, particleField, CRT, dither).
// Vertical 1080x1920 (background-loops / vertical-social / lyric-MV backdrop).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  PixelStage, SkyBands, PixelDither, CrtScanlines, CrtVignette, CrtNoise,
  cyclePalette, rgb, lerpRGB, WATER_RAMP, particleField, type RGB,
} from "../../pixel-kit";

export const FPS = 30;
export const DURATION_FRAMES = 180; // 6s — color cycle completes integer loops for a seamless loop

const IW = 360;
const IH = 640;
const HORIZON = Math.round(IH * 0.18);
const snap = (n: number) => Math.round(n);
const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type PixelWaterfallCycleProps = {
  backgroundColor: string; // sky top
  accentColor: string;     // foam / highlight
  cliffColor: string;
  cycleSpeed: number;
  showMist: boolean;
};

export const defaultPixelWaterfallCycleProps: PixelWaterfallCycleProps = {
  backgroundColor: "#0a1430",
  accentColor: "#e6fbff",
  cliffColor: "#1a2238",
  cycleSpeed: 0.2,
  showMist: true,
};

const hexToRgb = (h: string): RGB => {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};

// Deterministic cliff silhouette columns (left + right framing the central falls).
function cliffRects(side: "l" | "r", base: RGB): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const isL = side === "l";
  const edge = isL ? 0 : IW;
  const dir = isL ? 1 : -1;
  for (let y = HORIZON; y < IH; y += 6) {
    const t = (y - HORIZON) / (IH - HORIZON);
    const w = snap(90 + t * 40 + seed(y * 0.7 + (isL ? 0 : 99)) * 24);
    const x = isL ? edge : edge - w;
    const shade = lerpRGB(base, [4, 6, 14], 0.2 + t * 0.4);
    out.push(<rect key={`${side}-${y}`} x={x} y={y} width={w} height={6} fill={rgb(shade)} />);
    // mossy edge dots toward the water
    if (seed(y * 1.3 + (isL ? 5 : 7)) > 0.6) {
      out.push(<rect key={`${side}m-${y}`} x={isL ? x + w - 2 : x} y={y} width={2} height={4} fill={rgb([40, 90, 70], 0.7)} />);
    }
    void dir;
  }
  return out;
}

export const PixelWaterfallCycle: React.FC<PixelWaterfallCycleProps> = ({
  backgroundColor, accentColor, cliffColor, cycleSpeed, showMist,
}) => {
  const frame = useCurrentFrame();
  const skyTop = hexToRgb(backgroundColor);
  const cliff = hexToRgb(cliffColor);
  const foam = hexToRgb(accentColor);

  const waterX0 = 118;
  const waterX1 = 242;
  const waterW = waterX1 - waterX0;
  const poolY = IH - 96;

  // Falling water: horizontal striations colour-cycled by their y (phase = depth) → flows down.
  const waterRows: React.ReactNode[] = [];
  for (let y = HORIZON + 6; y < poolY; y += 3) {
    const phase = y * 0.16;
    const c = cyclePalette(frame, phase, cycleSpeed * 0.06, WATER_RAMP);
    waterRows.push(<rect key={`w-${y}`} x={waterX0} y={y} width={waterW} height={3} fill={rgb(c)} />);
  }
  // Bright vertical streak lanes (deterministic), give the falls vertical structure.
  const streaks: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const sx = snap(waterX0 + 8 + i * (waterW - 16) / 6 + seed(i) * 4);
    for (let y = HORIZON + 6; y < poolY; y += 4) {
      const tw = 0.4 + 0.6 * Math.sin((y * 0.4) + frame * 0.5 + i);
      streaks.push(<rect key={`s-${i}-${y}`} x={sx} y={y} width={2} height={3} fill={rgb(foam, 0.18 + tw * 0.22)} />);
    }
  }
  // Foam spray at the impact pool (deterministic rising particles).
  const spray = particleField({ count: 46, w: waterW, h: 70, frame, speed: 1.6, swayAmp: 5, swaySpeed: 0.12, dir: -1, layerSeed: 3 });
  // Rising mist (separate, slower phase).
  const mist = particleField({ count: 30, w: IW, h: 120, frame, speed: 0.5, swayAmp: 10, swaySpeed: 0.05, sizeMin: 2, sizeMax: 4, dir: -1, layerSeed: 9 });

  const pool = cyclePalette(frame, poolY * 0.16, cycleSpeed * 0.06, WATER_RAMP);

  return (
    <>
      <PixelStage iw={IW} ih={IH} background={backgroundColor}>
        <svg width={IW} height={IH} viewBox={`0 0 ${IW} ${IH}`} style={{ position: "absolute", inset: 0, width: IW, height: IH, imageRendering: "pixelated", shapeRendering: "crispEdges" }}>
          <SkyBands iw={IW} horizon={HORIZON + 6} top={skyTop} mid={lerpRGB(skyTop, [60, 90, 130], 0.5)} hz={[120, 170, 200]} bands={10} />
          {/* falling water */}
          {waterRows}
          {streaks}
          {/* cliffs frame the falls */}
          {cliffRects("l", cliff)}
          {cliffRects("r", cliff)}
          {/* impact pool */}
          <rect x={0} y={poolY} width={IW} height={IH - poolY} fill={rgb(lerpRGB(pool, [6, 16, 36], 0.4))} />
          {Array.from({ length: 8 }).map((_, i) => {
            const y = poolY + i * 4;
            const c = cyclePalette(frame, y * 0.2, cycleSpeed * 0.05, WATER_RAMP);
            return <rect key={`pl-${i}`} x={0} y={y} width={IW} height={4} fill={rgb(c, 0.5)} />;
          })}
          {/* spray */}
          {spray.map((p, i) => (
            <rect key={`sp-${i}`} x={waterX0 + p.x} y={poolY - 10 + p.y} width={p.size} height={p.size} fill={rgb(foam, 0.5)} />
          ))}
          {/* mist */}
          {showMist && mist.map((p, i) => (
            <rect key={`mi-${i}`} x={p.x} y={poolY - 60 + p.y} width={p.size} height={p.size} fill={rgb([210, 230, 240], 0.10)} />
          ))}
        </svg>
        <PixelDither iw={IW} ih={IH} opacity={0.07} />
      </PixelStage>
      <CrtScanlines opacity={0.4} />
      <CrtNoise opacity={0.035} />
      <CrtVignette strength={0.7} />
      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </>
  );
};

export default PixelWaterfallCycle;
