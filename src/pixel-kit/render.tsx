// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
/**
 * pixel-kit/render.tsx — the crisp-pixel render harness + shared motion engines.
 *
 * Render contract (the source of pixel sharpness, from the verified PixelMV reference):
 *   1. Draw the scene at a low INTERNAL resolution (iw x ih) as <rect>/<svg>.
 *   2. Upscale it with transform: scale(N) + image-rendering: pixelated (nearest-neighbour).
 *   3. Lay CRT / scanline / chroma overlays at FINAL resolution on top.
 *
 * Also exports the shared engines: computePulse / idlePulse (beat drive) and GridFloor
 * (perspective neon grid). pulse is the orthogonal join point for Club x Pixel composites.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { cyclePalette, rgb, type RGB } from "./palette";

const snap = (n: number) => Math.round(n);

// ---------------------------------------------------------------------------
// PixelStage — wrap an internal-resolution scene and upscale it crisply.
// children should render within an iw x ih coordinate space (e.g. an <svg width={iw} height={ih}>).
// ---------------------------------------------------------------------------
export const PixelStage: React.FC<{
  iw: number;
  ih: number;
  background?: string;
  zoom?: number; // >1 = slight camera push (kept edge-safe by centering)
  children: React.ReactNode;
}> = ({ iw, ih, background = "#04001A", zoom = 1, children }) => {
  const { width, height } = useVideoConfig();
  const scaleX = width / iw;
  const scaleY = height / ih;
  const scale = Math.min(scaleX, scaleY);
  // center the scaled scene
  const drawW = iw * scale * zoom;
  const drawH = ih * scale * zoom;
  const left = (width - drawW) / 2;
  const top = (height - drawH) / 2;
  return (
    <AbsoluteFill style={{ width, height, backgroundColor: background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top,
          left,
          width: iw,
          height: ih,
          transform: `scale(${scale * zoom})`,
          transformOrigin: "top left",
          imageRendering: "pixelated",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Beat drive.
// ---------------------------------------------------------------------------
export type BeatEvent = { frame: number; kind?: "boom" | "kira" | "hit"; strength: number };

/** Attack -> decay pulse from explicit beat events (MV dual-use: inject real onsets). */
export function computePulse(beats: BeatEvent[], frame: number, idle = 0.08): number {
  let v = 0;
  for (const b of beats) {
    if (b.kind === "kira") continue;
    const df = frame - b.frame;
    if (df < -1 || df > 14) continue;
    const env = df < 2 ? Math.max(0, (df + 1) / 3) : Math.exp(-(df - 2) / 5);
    v = Math.max(v, env * b.strength);
  }
  const idleWave = idle * (0.5 + 0.5 * Math.sin(frame * 0.45));
  return Math.min(1, v * 0.92 + idleWave);
}

/** Deterministic 4-on-the-floor pulse for catalog (no audio) versions. */
export function idlePulse(frame: number, fps: number, bpm = 120): number {
  const beatLen = (60 / bpm) * fps;
  const phase = frame % beatLen;
  const env = phase < 2 ? Math.max(0, (phase + 1) / 3) : Math.exp(-(phase - 2) / (beatLen * 0.45));
  return Math.min(1, env * 0.85 + 0.08 * (0.5 + 0.5 * Math.sin(frame * 0.3)));
}

/** Generate evenly-spaced beat events (for catalog idle drive of beat-synced templates). */
export function idleBeats(totalFrames: number, fps: number, bpm = 120, strength = 1): BeatEvent[] {
  const beatLen = (60 / bpm) * fps;
  const out: BeatEvent[] = [];
  for (let f = 0; f < totalFrames; f += beatLen) out.push({ frame: Math.round(f), kind: "boom", strength });
  return out;
}

// ---------------------------------------------------------------------------
// GridFloor — perspective neon grid converging to a horizon. The synthwave engine.
// columns (0..1 each) optionally drive per-lane brightness (EQ / waveform floor).
// ---------------------------------------------------------------------------
export const GridFloor: React.FC<{
  iw: number;
  ih: number;
  horizon: number;
  frame: number;
  pulse?: number;
  ramp?: RGB[];
  rowSpeed?: number;
  cycleSpeed?: number;
  rows?: number;
  cols?: number;
  columns?: number[]; // per-lane level 0..1 (EQ mode)
}> = ({ iw, ih, horizon, frame, pulse = 0, ramp, rowSpeed = 0.9, cycleSpeed = 0.05, rows = 14, cols = 12, columns }) => {
  const lines: React.ReactNode[] = [];
  const rowScroll = (frame * rowSpeed) % 1;
  const glow = 0.4 + pulse * 0.6;
  const col = cyclePalette(frame, 0, cycleSpeed, ramp);
  // horizontal rows (wider spacing toward the viewer = quadratic perspective)
  for (let i = 0; i < rows; i++) {
    const t = (i + rowScroll) / rows;
    const y = snap(horizon + (ih - horizon) * (t * t));
    const op = (0.12 + t * 0.5) * glow;
    lines.push(<rect key={`gr-${i}`} x={0} y={y} width={iw} height={Math.max(1, snap(1 + t * 2))} fill={rgb(col, Math.min(0.9, op))} />);
  }
  // vertical lanes converging to the centre of the horizon
  for (let i = 0; i <= cols; i++) {
    const f = i / cols;
    const bottomX = (f - 0.5) * iw * 2.2 + iw / 2;
    let laneCol = col;
    let laneOp = 0.4 * glow;
    if (columns && columns.length === cols) {
      const lv = columns[Math.min(cols - 1, i)] ?? 0;
      laneCol = cyclePalette(frame, i * 0.6, cycleSpeed, ramp);
      laneOp = (0.25 + lv * 0.7) * glow;
    }
    lines.push(
      <line key={`gc-${i}`} x1={snap(iw / 2)} y1={horizon} x2={snap(bottomX)} y2={ih} stroke={rgb(laneCol, Math.min(0.95, laneOp))} strokeWidth={1} />
    );
  }
  return <>{lines}</>;
};

// Quantized vertical sky bands (pixel-style banded gradient). top -> mid -> horizon.
export const SkyBands: React.FC<{ iw: number; horizon: number; top: RGB; mid: RGB; hz: RGB; bands?: number }> = ({
  iw, horizon, top, mid, hz, bands = 16,
}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    let c: RGB;
    if (t < 0.6) {
      const u = t / 0.6;
      c = [Math.round(top[0] + (mid[0] - top[0]) * u), Math.round(top[1] + (mid[1] - top[1]) * u), Math.round(top[2] + (mid[2] - top[2]) * u)];
    } else {
      const u = (t - 0.6) / 0.4;
      c = [Math.round(mid[0] + (hz[0] - mid[0]) * u), Math.round(mid[1] + (hz[1] - mid[1]) * u), Math.round(mid[2] + (hz[2] - mid[2]) * u)];
    }
    const y = Math.round((horizon * i) / bands);
    const h = Math.ceil(horizon / bands) + 1;
    out.push(<rect key={`sky-${i}`} x={0} y={y} width={iw} height={h} fill={rgb(c)} />);
  }
  return <>{out}</>;
};
