// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// pixel-mosaic-transition — a two-screen state-machine stinger. Block size sweeps coarse->fine->coarse
// while a state machine switches from screen A to screen B at the midpoint (under maximum coarseness,
// the swap is hidden). Each scene is procedurally drawn, then re-sampled into quantizeToCell blocks
// (NES attribute-clamp look) for the chunky mosaic dissolve. Pure-deterministic, $0, seamless A->B->A.
// Horizontal 480x270 (transitions / scene-switch stinger / before-after reveal).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  PixelStage, PixelDither, CrtScanlines, CrtVignette, CrtNoise,
  quantizeToCell, lerpRGB, rgb, lerp, type RGB,
} from "../../pixel-kit";

export const FPS = 30;
export const DURATION_FRAMES = 90; // 3s: A coarsens (0-45) -> swap -> B refines (45-90). Loops A->A.

const IW = 480;
const IH = 270;
const snap = (n: number) => Math.round(n);

export type PixelMosaicTransitionProps = {
  backgroundColor: string; // outer letterbox / stage fill
  screenAColor: string;    // screen A primary (sky / theme A)
  screenAAccent: string;   // screen A accent (sun / motif A)
  screenBColor: string;    // screen B primary (sky / theme B)
  screenBAccent: string;   // screen B accent (moon / motif B)
  maxCell: number;         // coarsest block size at the swap midpoint (px at internal res)
  ditherOpacity: number;   // Bayer dither strength over dark areas
};

export const defaultPixelMosaicTransitionProps: PixelMosaicTransitionProps = {
  backgroundColor: "#05060f",
  screenAColor: "#ff8a3d",   // warm day sky
  screenAAccent: "#fff0c2",  // bright sun
  screenBColor: "#1b2b66",   // deep night sky
  screenBAccent: "#cfe0ff",  // cool moon
  maxCell: 48,
  ditherOpacity: 0.08,
};

const hexToRgb = (h: string): RGB => {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};

// Smooth ease for the cell-size sweep (no jitter, pure function of frame).
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// ---------------------------------------------------------------------------
// Scene sampler: each scene is a deterministic color FIELD evaluated at any (x,y).
// State machine: scene "A" = day (sun, low warm horizon), scene "B" = night (moon, stars).
// We sample the field at the CENTER of each quantized cell -> chunky pixel-mosaic of that scene.
// ---------------------------------------------------------------------------
function sceneField(
  state: "A" | "B",
  x: number, y: number,
  primary: RGB, accent: RGB,
): RGB {
  const cx = IW * (state === "A" ? 0.5 : 0.62);
  const cy = state === "A" ? IH * 0.34 : IH * 0.30;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (state === "A") {
    // Day: vertical warm gradient sky + glowing sun disc + ground band.
    const groundY = IH * 0.72;
    if (y >= groundY) {
      // ground: darkened primary, banded by depth
      const t = (y - groundY) / (IH - groundY);
      return lerpRGB(lerpRGB(primary, [120, 50, 20], 0.55), [30, 14, 8], t * 0.7);
    }
    // sky gradient: deep top -> warm primary near horizon
    const skyT = y / groundY;
    const sky = lerpRGB(lerpRGB(primary, [60, 30, 80], 0.5), primary, skyT);
    // sun disc with soft glow
    const sunR = IW * 0.11;
    if (dist < sunR) return accent;
    const glow = Math.max(0, 1 - (dist - sunR) / (sunR * 1.6));
    return lerpRGB(sky, accent, glow * 0.7);
  } else {
    // Night: cool vertical gradient + crescent moon + deterministic star dots.
    const skyT = y / IH;
    const sky = lerpRGB(lerpRGB([6, 8, 26], primary, 0.85), lerpRGB(primary, [8, 12, 36], 0.4), skyT);
    // moon disc with a crescent shadow (offset cutout)
    const moonR = IW * 0.095;
    const sdx = x - (cx + moonR * 0.55);
    const sdy = y - (cy - moonR * 0.12);
    const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
    if (dist < moonR) {
      if (sDist < moonR * 0.92) return sky; // carve the crescent
      return accent;
    }
    const halo = Math.max(0, 1 - (dist - moonR) / (moonR * 1.3));
    let col = lerpRGB(sky, accent, halo * 0.45);
    // stars: hashed lattice, sparse, twinkle-free (deterministic per cell sampled point)
    const gx = Math.floor(x / 7), gy = Math.floor(y / 7);
    const h = Math.abs(Math.sin(gx * 91.7 + gy * 47.3) * 4391.13) % 1;
    if (h > 0.965 && y < IH * 0.78) col = lerpRGB(col, [240, 245, 255], 0.85);
    return col;
  }
}

export const PixelMosaicTransition: React.FC<PixelMosaicTransitionProps> = ({
  backgroundColor, screenAColor, screenAAccent, screenBColor, screenBAccent,
  maxCell, ditherOpacity,
}) => {
  const frame = useCurrentFrame();

  const aP = hexToRgb(screenAColor);
  const aA = hexToRgb(screenAAccent);
  const bP = hexToRgb(screenBColor);
  const bA = hexToRgb(screenBAccent);

  // --- Cell-size sweep: 1 -> maxCell (at mid) -> 1. Coarse->fine->coarse. ---
  const mid = DURATION_FRAMES / 2;
  // 0 at edges, 1 at midpoint
  const coarseT = 1 - Math.abs(frame - mid) / mid;
  const cellF = 1 + easeInOut(Math.max(0, Math.min(1, coarseT))) * (maxCell - 1);
  const cell = Math.max(1, snap(cellF));

  // --- State machine: switch A->B exactly at the midpoint (peak coarseness hides the swap). ---
  const state: "A" | "B" = frame < mid ? "A" : "B";
  const primary = state === "A" ? aP : bP;
  const accent = state === "A" ? aA : bA;

  // --- Resample the active scene into quantized cells, fully covering IWxIH. ---
  const blocks: React.ReactNode[] = [];
  for (let by = 0; by < IH; by += cell) {
    const qy = quantizeToCell(by + cell / 2, cell);
    const sy = Math.min(IH - 1, qy + Math.floor(cell / 2));
    const h = Math.min(cell, IH - by);
    for (let bx = 0; bx < IW; bx += cell) {
      const sx = Math.min(IW - 1, quantizeToCell(bx + cell / 2, cell) + Math.floor(cell / 2));
      const c = sceneField(state, sx, sy, primary, accent);
      const w = Math.min(cell, IW - bx);
      blocks.push(
        <rect key={`b-${bx}-${by}`} x={bx} y={by} width={w} height={h} fill={rgb(c)} />
      );
    }
  }

  // --- Block-grid seam lines while coarse (sells the "mosaic" structure; fade out when fine). ---
  const seamA = coarseT > 0.25 ? (coarseT - 0.25) / 0.75 * 0.22 : 0;
  const seams: React.ReactNode[] = [];
  if (seamA > 0.01 && cell >= 6) {
    for (let gx = cell; gx < IW; gx += cell)
      seams.push(<rect key={`gv-${gx}`} x={gx} y={0} width={1} height={IH} fill={rgb([0, 0, 0], seamA)} />);
    for (let gy = cell; gy < IH; gy += cell)
      seams.push(<rect key={`gh-${gy}`} x={0} y={gy} width={IW} height={1} fill={rgb([0, 0, 0], seamA)} />);
  }

  // --- Swap flash: a brief bright pulse at the exact handoff for a punchy stinger feel. ---
  const swapDist = Math.abs(frame - mid);
  const flashA = swapDist <= 4 ? (1 - swapDist / 4) * 0.35 : 0;

  // Letterbox-safe overscan fill behind blocks (in case cell rounding leaves a sliver).
  const baseFill = rgb(lerpRGB(primary, [0, 0, 0], 0.5));

  return (
    <>
      <PixelStage iw={IW} ih={IH} background={backgroundColor}>
        <svg
          width={IW}
          height={IH}
          viewBox={`0 0 ${IW} ${IH}`}
          style={{ position: "absolute", inset: 0, width: IW, height: IH, imageRendering: "pixelated", shapeRendering: "crispEdges" }}
        >
          <rect x={0} y={0} width={IW} height={IH} fill={baseFill} />
          {blocks}
          {seams}
          {flashA > 0 && <rect x={0} y={0} width={IW} height={IH} fill={rgb([255, 255, 255], flashA)} />}
        </svg>
        <PixelDither iw={IW} ih={IH} opacity={lerp(ditherOpacity, ditherOpacity * 0.4, coarseT)} />
      </PixelStage>
      <CrtScanlines opacity={0.32} />
      <CrtNoise opacity={0.03} />
      <CrtVignette strength={0.72} />
      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </>
  );
};

export default PixelMosaicTransition;
