// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// pourover-drip-fill-gauge — a centered pour-over apparatus (dripper + cone + glass carafe) where hot
// water drips through and the carafe fills as a DETERMINISTIC volume gauge: one progress value 0→100%
// drives BOTH the rising liquid-level (clip-rect fill draw-on) AND the count-up '63%' readout in the
// lower-third dashboard. Four-tone mono amber (GameBoy-style LUT, amber hue). $0 self-driving via idle
// pulse; optional beats/waveform for MV use. Reuse: pixel-kit (BitmapText count, particleField drips,
// CRT/dither skin). Horizontal 480x270 (data-pack readout loop).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  PixelStage, BitmapText, PixelDither, CrtScanlines, CrtVignette, CrtNoise,
  particleField, idlePulse, computePulse, rgb, lerpRGB, type RGB, type BeatEvent,
} from "../../pixel-kit";

export const FPS = 30;
export const DURATION_FRAMES = 180; // 6s — fill rises 0→100% then holds, seamless count-up gauge

const IW = 480;
const IH = 270;
const snap = (n: number) => Math.round(n);
const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type PouroverDripFillGaugeProps = {
  toneBg: string;       // four-tone amber: darkest (background / shadow)
  toneDark: string;     // mid-dark (apparatus body, gauge frame)
  toneMid: string;      // mid-light (liquid, accents)
  toneLight: string;    // lightest (highlights, readout text)
  fillSpeed: number;    // fraction of duration spent rising (0..1); rest holds full
  showDrips: boolean;   // animated drip particles falling into the cone
  beats?: BeatEvent[];      // MV: real onsets (pulse on readout). idle when absent.
  waveform?: number[];      // MV: 0..1 levels to pace the fill. linear ramp when absent.
};

export const defaultPouroverDripFillGaugeProps: PouroverDripFillGaugeProps = {
  toneBg: "#1c1206",
  toneDark: "#6b4410",
  toneMid: "#c88a1e",
  toneLight: "#f6d27a",
  fillSpeed: 0.78,
  showDrips: true,
};

const hexToRgb = (h: string): RGB => {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};

// Quantize a continuous colour to the nearest of the four amber tones (locks the GameBoy 4-tone look).
function quantize4(c: RGB, ramp: RGB[]): RGB {
  let best = ramp[0], bestD = Infinity;
  for (const r of ramp) {
    const d = (c[0] - r[0]) ** 2 + (c[1] - r[1]) ** 2 + (c[2] - r[2]) ** 2;
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}

export const PouroverDripFillGauge: React.FC<PouroverDripFillGaugeProps> = ({
  toneBg, toneDark, toneMid, toneLight, fillSpeed, showDrips, beats, waveform,
}) => {
  const frame = useCurrentFrame();
  const RAMP4: RGB[] = [hexToRgb(toneBg), hexToRgb(toneDark), hexToRgb(toneMid), hexToRgb(toneLight)];
  const cBg = RAMP4[0], cDark = RAMP4[1], cMid = RAMP4[2], cLight = RAMP4[3];

  // --- single deterministic progress 0..1 drives EVERYTHING (fill height + number) ---
  const riseFrames = Math.max(1, Math.round(DURATION_FRAMES * fillSpeed));
  let progress: number;
  if (waveform && waveform.length > 1) {
    // MV: integrate the waveform so louder passages pour faster (still monotone, deterministic).
    const idx = Math.min(waveform.length - 1, Math.floor((frame / DURATION_FRAMES) * waveform.length));
    let acc = 0, tot = 0;
    for (let i = 0; i < waveform.length; i++) { tot += 0.3 + waveform[i]; if (i <= idx) acc += 0.3 + waveform[i]; }
    progress = Math.min(1, acc / tot);
  } else {
    const t = Math.min(1, frame / riseFrames);
    progress = t * t * (3 - 2 * t); // smoothstep ease for a natural pour
  }
  const pct = Math.round(progress * 100);
  const pulse = beats && beats.length ? computePulse(beats, frame) : idlePulse(frame, FPS, 96);

  // --- apparatus geometry (centered) ---
  const cx = IW / 2;            // 240
  const dripTopY = 30;          // dripper bottle bottom (water source)
  const coneTopY = 64;          // open top of the filter cone
  const coneBotY = 110;         // tip of the cone (where it meets the carafe neck)
  const coneHalfTop = 56;       // cone half-width at top
  // carafe (glass vessel) bounds — the gauge body
  const carTop = 122;
  const carBot = 214;
  const carHalfTop = 38;
  const carHalfBot = 54;        // wider at the base (carafe shape)
  const carH = carBot - carTop;

  // liquid surface y inside the carafe, driven by progress (full = carTop, empty = carBot)
  const liqY = snap(carBot - carH * progress);

  // half-width of the carafe at a given y (linear taper) — keeps the fill inside the glass shape.
  const halfAt = (y: number) => carHalfTop + (carHalfBot - carHalfTop) * ((y - carTop) / carH);

  // --- liquid fill: horizontal striations from surface to base (clip to carafe shape) ---
  const liquidRows: React.ReactNode[] = [];
  for (let y = Math.max(carTop, liqY); y < carBot; y += 2) {
    const hw = snap(halfAt(y)) - 4; // inset from glass wall
    // gentle banding: alternate mid/dark for a liquid stratification feel
    const band = ((y - liqY) >> 1) % 5 === 0 ? lerpRGB(cMid, cLight, 0.4) : cMid;
    liquidRows.push(
      <rect key={`lq-${y}`} x={snap(cx - hw)} y={y} width={hw * 2} height={2} fill={rgb(quantize4(band, RAMP4))} />
    );
  }
  // surface meniscus highlight (sloshes very slightly with the pulse, integer-snapped)
  if (progress > 0.01) {
    const slosh = snap(Math.sin(frame * 0.18) * (0.6 + pulse) );
    const hw = snap(halfAt(liqY)) - 3;
    liquidRows.push(
      <rect key="meniscus" x={snap(cx - hw)} y={snap(liqY + slosh)} width={hw * 2} height={2} fill={rgb(cLight, 0.9)} />
    );
  }

  // --- drip particles: water droplets falling from dripper bottle into the cone ---
  const drips = particleField({
    count: 7, w: 14, h: coneTopY - dripTopY + 6, frame, speed: 3.2,
    swayAmp: 1, swaySpeed: 0.1, sizeMin: 1, sizeMax: 2, dir: 1, layerSeed: 4,
  });

  // --- count-up readout dashboard (lower-third, bottom-left) ---
  const readout = `${pct}%`;
  const gaugeBarX = 300, gaugeBarY = 236, gaugeBarW = 150, gaugeBarH = 8;
  const fillW = snap(gaugeBarW * progress);

  // carafe glass outline rows (left + right walls)
  const glassWalls: React.ReactNode[] = [];
  for (let y = carTop; y <= carBot; y += 2) {
    const hw = snap(halfAt(y));
    glassWalls.push(<rect key={`gw-l-${y}`} x={snap(cx - hw)} y={y} width={2} height={2} fill={rgb(cDark)} />);
    glassWalls.push(<rect key={`gw-r-${y}`} x={snap(cx + hw - 2)} y={y} width={2} height={2} fill={rgb(cDark)} />);
    // faint inner glass highlight on the left wall
    if (((y - carTop) >> 1) % 3 === 0) {
      glassWalls.push(<rect key={`gw-h-${y}`} x={snap(cx - hw + 3)} y={y} width={1} height={2} fill={rgb(cMid, 0.4)} />);
    }
  }

  return (
    <>
      <PixelStage iw={IW} ih={IH} background={toneBg}>
        <svg width={IW} height={IH} viewBox={`0 0 ${IW} ${IH}`} style={{ position: "absolute", inset: 0, width: IW, height: IH, imageRendering: "pixelated", shapeRendering: "crispEdges" }}>
          {/* background tonal wash + subtle floor shadow under the apparatus */}
          <rect x={0} y={0} width={IW} height={IH} fill={rgb(cBg)} />
          <rect x={0} y={IH - 30} width={IW} height={30} fill={rgb(lerpRGB(cBg, cDark, 0.35))} />
          <rect x={snap(cx - 70)} y={carBot + 2} width={140} height={5} fill={rgb(lerpRGB(cBg, [0, 0, 0], 0.4), 0.6)} />

          {/* dripper bottle (water source) — stout pixel kettle/dripper at top */}
          <rect x={snap(cx - 16)} y={dripTopY - 18} width={32} height={16} fill={rgb(cDark)} />
          <rect x={snap(cx - 16)} y={dripTopY - 18} width={32} height={3} fill={rgb(cMid)} />
          <rect x={snap(cx + 16)} y={dripTopY - 14} width={8} height={3} fill={rgb(cDark)} /> {/* spout */}
          <rect x={snap(cx - 4)} y={dripTopY - 2} width={8} height={4} fill={rgb(cMid)} /> {/* nozzle */}

          {/* drip particles falling into the cone */}
          {showDrips && drips.map((p, i) => (
            <rect key={`dr-${i}`} x={snap(cx - 1 + (p.x - 7))} y={snap(dripTopY + p.y)} width={1} height={p.size + 1} fill={rgb(cMid, 0.85)} />
          ))}

          {/* filter cone (trapezoid via stacked rows) */}
          {Array.from({ length: Math.ceil((coneBotY - coneTopY) / 2) }).map((_, i) => {
            const y = coneTopY + i * 2;
            const tt = (y - coneTopY) / (coneBotY - coneTopY);
            const hw = snap(coneHalfTop * (1 - tt) + 6 * tt);
            const wallShade = i % 3 === 0 ? cMid : cDark;
            return (
              <g key={`cone-${i}`}>
                <rect x={snap(cx - hw)} y={y} width={2} height={2} fill={rgb(wallShade)} />
                <rect x={snap(cx + hw - 2)} y={y} width={2} height={2} fill={rgb(wallShade)} />
                {/* wet filter paper tint inside */}
                <rect x={snap(cx - hw + 2)} y={y} width={hw * 2 - 4} height={2} fill={rgb(lerpRGB(cBg, cDark, 0.55), 0.5)} />
              </g>
            );
          })}
          {/* cone rim */}
          <rect x={snap(cx - coneHalfTop)} y={coneTopY - 2} width={coneHalfTop * 2} height={2} fill={rgb(cLight)} />
          {/* thin stream from cone tip into the carafe */}
          <rect x={snap(cx - 1)} y={coneBotY} width={2} height={carTop - coneBotY + 2} fill={rgb(cMid, 0.7 + pulse * 0.3)} />

          {/* carafe neck */}
          <rect x={snap(cx - 14)} y={carTop - 8} width={28} height={8} fill="none" stroke={rgb(cDark)} strokeWidth={2} />

          {/* liquid fill (data-bound) clipped to glass shape */}
          {liquidRows}
          {/* carafe glass walls (drawn over liquid edges) */}
          {glassWalls}
          {/* carafe base */}
          <rect x={snap(cx - carHalfBot)} y={carBot} width={carHalfBot * 2} height={3} fill={rgb(cDark)} />

          {/* ---- dashboard readout (lower-third) ---- */}
          {/* big count-up percent, bottom-left */}
          <BitmapText text={readout} x={18} y={IH - 40} cell={4} color={rgb(boostLight(cLight, pulse))} align="left" />
          <BitmapText text="VOLUME" x={18} y={IH - 52} cell={1} color={rgb(cMid)} align="left" />

          {/* gauge bar bottom-right, mirrors the same progress */}
          <rect x={gaugeBarX} y={gaugeBarY} width={gaugeBarW} height={gaugeBarH} fill="none" stroke={rgb(cDark)} strokeWidth={1} />
          <rect x={gaugeBarX + 1} y={gaugeBarY + 1} width={Math.max(0, fillW - 2)} height={gaugeBarH - 2} fill={rgb(cMid)} />
          {/* tick marks at 25/50/75 */}
          {[0.25, 0.5, 0.75].map((t) => (
            <rect key={`tk-${t}`} x={snap(gaugeBarX + gaugeBarW * t)} y={gaugeBarY - 2} width={1} height={2} fill={rgb(cLight, 0.7)} />
          ))}
          <BitmapText text="FULL" x={gaugeBarX + gaugeBarW} y={gaugeBarY - 11} cell={1} color={rgb(cMid)} align="right" />
        </svg>
        <PixelDither iw={IW} ih={IH} opacity={0.08} />
      </PixelStage>
      <CrtScanlines opacity={0.42} />
      <CrtNoise opacity={0.035} />
      <CrtVignette strength={0.75} />
      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </>
  );
};

// Brighten the lightest tone toward white on a pulse hit (readout "tick" feel).
function boostLight(c: RGB, pulse: number): RGB {
  return lerpRGB(c, [255, 255, 255], Math.min(0.5, pulse * 0.5));
}

export default PouroverDripFillGauge;
