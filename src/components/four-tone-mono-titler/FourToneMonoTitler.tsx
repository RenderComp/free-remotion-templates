// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// four-tone-mono-titler — a handheld 4-tone (16-bit-era retro console) lower-third titler.
// Topology: reveal / text / MONOCHROME hard-edged left-to-right WIPE (no colour cycling) over an
// ordered-Bayer shading band, then hold with a subtle tone-3 specular shimmer across the title.
// Surface is STRICTLY 4 opaque tones (public-domain greenish LCD ramp), distinct vs neon color-cycling.
// Duration: 120f @30fps one-shot — wipe 0->wipeFrames, hold to 120; first frame empty => NON-looping.
import React from "react";
import { useCurrentFrame } from "remotion";
import {
  PixelStage, layoutText, measureText, seed, seed2, rgb, type RGB,
} from "../../pixel-kit";

export const FPS = 30;
export const DURATION_FRAMES = 120;

const IW = 480;
const IH = 270;
const snap = (n: number) => Math.round(n);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Ordered Bayer 4x4 threshold matrix (public-domain dithering pattern).
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
// True where the LIGHT tone should be placed for the requested coverage (0..1).
const ditherOn = (cx: number, ry: number, coverage: number) =>
  coverage > (BAYER4[ry & 3][cx & 3] + 0.5) / 16;

const hexToRgb = (h: string): RGB => {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};
const rgbToHex = (c: RGB) =>
  "#" + c.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");

// Layout constants (internal-res 480x270 lower-third band).
const PANEL_TOP = 170;
const PANEL_BOT = 248;
const SHADE_Y0 = 171;
const SHADE_H = 40;
const KICKER_X = 40;
const TITLE_X0 = 56;
const TITLE_Y0 = 178;
const DIVIDER_Y = 210;
const SUB_X0 = 58;
const SUB_Y0 = 218;
const DUST_COUNT = 46;

export type FourToneMonoTitlerProps = {
  title: string;
  subtitle: string;
  tone0: string; // darkest LCD tone (screen base)
  tone1: string; // dark-mid (dither light dots + subtitle-shadow + dust)
  tone2: string; // bright (title baseline + borders)
  tone3: string; // brightest (shimmer highlight + wipe head + kicker)
  titleCell: number; // internal px per title dot
  subtitleCell: number; // internal px per subtitle dot
  wipeFrames: number; // frames for the left-to-right reveal
  shimmerSpeed: number; // idle specular sweep speed (internal px / frame)
  ditherDensity: number; // 0..1 shading-band coverage bias
  showAmbient: boolean; // ambient top glow + twinkling pixel dust
};

// Public-domain greenish handheld LCD 4-tone values (16-bit-era retro console ramp).
// Colour values are facts, not protected expression — inlined here so no brand/trademark token
// appears in this file. Every on-screen pixel is exactly one of these four tones.
const HANDHELD_4TONE: RGB[] = [
  [15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15],
];

// Defaults derive the 4 tones from the public-domain greenish handheld LCD 4-tone ramp above.
export const defaultFourToneMonoTitlerProps: FourToneMonoTitlerProps = {
  // Editorial example copy (fictional title — not a real product or brand).
  title: "LANTERN HOLLOW",
  subtitle: "STAGE 01 - THE QUIET MARSH",
  tone0: rgbToHex(HANDHELD_4TONE[0]),
  tone1: rgbToHex(HANDHELD_4TONE[1]),
  tone2: rgbToHex(HANDHELD_4TONE[2]),
  tone3: rgbToHex(HANDHELD_4TONE[3]),
  titleCell: 4,
  subtitleCell: 2,
  wipeFrames: 72,
  shimmerSpeed: 3.2,
  ditherDensity: 0.6,
  showAmbient: true,
};

export const FourToneMonoTitler: React.FC<FourToneMonoTitlerProps> = ({
  title, subtitle, tone0, tone1, tone2, tone3,
  titleCell, subtitleCell, wipeFrames, shimmerSpeed, ditherDensity, showAmbient,
}) => {
  const frame = useCurrentFrame();

  // Parse the 4 tones once; every fill is one of these at FULL opacity (strict 4-colour surface).
  const T0 = hexToRgb(tone0);
  const T1 = hexToRgb(tone1);
  const T2 = hexToRgb(tone2);
  const T3 = hexToRgb(tone3);
  const c0 = rgb(T0);
  const c1 = rgb(T1);
  const c2 = rgb(T2);
  const c3 = rgb(T3);

  // --- Reveal edge: hard-clip x. Everything in the lower-third is drawn only where x < edge. ---
  const wipeN = Math.max(1, wipeFrames);
  const prog = clamp01(frame / wipeN);
  const edge = easeInOutCubic(prog) * IW;
  const wiping = edge < IW - 0.5;

  // --- Idle specular shimmer: a narrow bright band sweeps across the title (promotes to tone 3). ---
  const tCells = measureText(title);
  const titleW = tCells * titleCell;
  const sweepSpan = titleW + 64;
  const shimmerX = TITLE_X0 - 24 + ((frame * shimmerSpeed) % sweepSpan);
  const SHIMMER_HALF = 9;

  const bg: React.ReactNode[] = [];
  const panel: React.ReactNode[] = [];

  // ------------------------------------------------------------------ ambient screen (always on)
  // Base "screen" fill = darkest tone.
  bg.push(<rect key="scr" x={0} y={0} width={IW} height={IH} fill={c0} />);

  if (showAmbient) {
    // Soft top-centre glow, ordered-dithered tone1 over tone0 (coarse cells, runs merged, breathing).
    const gcell = 4;
    const gCols = Math.floor(IW / gcell);
    const gRows = Math.floor((PANEL_TOP - 6) / gcell);
    const breathe = 0.5 + 0.5 * Math.sin(frame * 0.03);
    for (let ry = 0; ry < gRows; ry++) {
      const py = ry * gcell;
      let run = -1;
      for (let cx = 0; cx <= gCols; cx++) {
        const px = cx * gcell;
        const dx = (px - IW * 0.5) / (IW * 0.5);
        const dy = py / (PANEL_TOP - 6);
        const rad = 1 - Math.min(1, Math.sqrt(dx * dx * 0.55 + dy * dy));
        const cov = clamp01(0.32 * rad * (0.7 + 0.5 * breathe));
        const on = cx < gCols && ditherOn(cx, ry, cov);
        if (on && run < 0) run = cx;
        if ((!on || cx === gCols) && run >= 0) {
          bg.push(<rect key={`g-${ry}-${run}`} x={run * gcell} y={py} width={(cx - run) * gcell} height={gcell} fill={c1} />);
          run = -1;
        }
      }
    }
    // Two thin frame rules (top + above the panel) for structure.
    bg.push(<rect key="fr-t" x={0} y={24} width={IW} height={1} fill={c1} />);
    // Twinkling pixel dust (deterministic; toggles between two real tones — never a 5th colour).
    for (let i = 0; i < DUST_COUNT; i++) {
      const x = snap(seed(i * 2.7 + 3) * IW);
      const y = snap(seed2(i * 1.9 + 5) * (PANEL_TOP - 30)) + 8;
      const tw = Math.sin(frame * 0.08 + seed(i * 5.1) * 6.283);
      const sz = seed(i * 3.3 + 1) > 0.86 ? 2 : 1;
      bg.push(<rect key={`d-${i}`} x={x} y={y} width={sz} height={sz} fill={tw > 0.55 ? c2 : c1} />);
    }
  }

  // ------------------------------------------------------------------ lower-third panel (wipes in)
  const clipW = Math.min(IW, Math.max(0, edge));
  // Panel base (darkest tone), hard-clipped to the wipe edge.
  panel.push(<rect key="pbase" x={0} y={PANEL_TOP} width={clipW} height={PANEL_BOT - PANEL_TOP} fill={c0} />);

  // Ordered-dither shading band behind the title: top-weighted coverage + slow horizontal ripple.
  {
    const dcell = 3;
    const cols = Math.floor(IW / dcell);
    const rows = Math.floor(SHADE_H / dcell);
    const base = 0.18 + ditherDensity * 0.55;
    for (let ry = 0; ry < rows; ry++) {
      const py = SHADE_Y0 + ry * dcell;
      const vfall = 1 - ry / rows;
      let run = -1;
      for (let cx = 0; cx <= cols; cx++) {
        const px = cx * dcell;
        const along = 0.5 + 0.5 * Math.sin(px * 0.045 + frame * 0.05);
        const cov = clamp01(base * (0.45 + 0.85 * vfall) * (0.65 + 0.5 * along));
        const beyond = cx === cols || px >= edge;
        const on = !beyond && ditherOn(cx, ry, cov);
        if (on && run < 0) run = cx;
        if ((!on) && run >= 0) {
          panel.push(<rect key={`sb-${ry}-${run}`} x={run * dcell} y={py} width={(cx - run) * dcell} height={dcell} fill={c1} />);
          run = -1;
        }
        if (beyond) break;
      }
    }
  }

  // Kicker accent bar (brightest) leading the reveal, left of the title.
  if (KICKER_X < edge) {
    panel.push(<rect key="kick" x={KICKER_X} y={TITLE_Y0 - 2} width={7} height={30} fill={c3} />);
  }
  // Panel borders: bright top rule + brightest bevel highlight + bottom rule (clipped to edge).
  panel.push(<rect key="bt" x={0} y={PANEL_TOP} width={clipW} height={2} fill={c2} />);
  panel.push(<rect key="bh" x={0} y={PANEL_TOP + 2} width={clipW} height={1} fill={c3} />);
  panel.push(<rect key="bb" x={0} y={PANEL_BOT - 2} width={clipW} height={2} fill={c2} />);
  // Thin divider between title and subtitle.
  {
    const dvW = Math.min(clipW - SUB_X0, 210);
    if (dvW > 0) panel.push(<rect key="dv" x={SUB_X0} y={DIVIDER_Y} width={dvW} height={1} fill={c1} />);
  }

  // Title glyphs: baseline tone2, promoted to tone3 inside the sweeping shimmer band. Hard wipe clip.
  {
    const { cells } = layoutText(title);
    for (let i = 0; i < cells.length; i++) {
      const cx = TITLE_X0 + cells[i].x * titleCell;
      if (cx >= edge) continue;
      const mid = cx + titleCell / 2;
      const lit = Math.abs(mid - shimmerX) < SHIMMER_HALF;
      panel.push(
        <rect key={`ti-${i}`} x={snap(cx)} y={snap(TITLE_Y0 + cells[i].y * titleCell)} width={titleCell} height={titleCell} fill={lit ? c3 : c2} />
      );
    }
  }
  // Subtitle glyphs: steady bright tone2. Hard wipe clip.
  {
    const { cells } = layoutText(subtitle);
    for (let i = 0; i < cells.length; i++) {
      const cx = SUB_X0 + cells[i].x * subtitleCell;
      if (cx >= edge) continue;
      panel.push(
        <rect key={`su-${i}`} x={snap(cx)} y={snap(SUB_Y0 + cells[i].y * subtitleCell)} width={subtitleCell} height={subtitleCell} fill={c2} />
      );
    }
  }

  // Scanning write-head at the wipe edge (brightest leading bar + tone2 trail). Only while wiping.
  if (wiping && edge > 1) {
    const hx = snap(Math.min(IW - 2, edge));
    panel.push(<rect key="wh0" x={hx} y={PANEL_TOP} width={2} height={PANEL_BOT - PANEL_TOP} fill={c3} />);
    panel.push(<rect key="wh1" x={Math.max(0, hx - 3)} y={PANEL_TOP} width={2} height={PANEL_BOT - PANEL_TOP} fill={c2} />);
  }

  return (
    <PixelStage iw={IW} ih={IH} background={tone0}>
      <svg
        width={IW}
        height={IH}
        viewBox={`0 0 ${IW} ${IH}`}
        style={{ position: "absolute", inset: 0, width: IW, height: IH, imageRendering: "pixelated", shapeRendering: "crispEdges" }}
      >
        {bg}
        {panel}
      </svg>
    </PixelStage>
  );
};

export default FourToneMonoTitler;
