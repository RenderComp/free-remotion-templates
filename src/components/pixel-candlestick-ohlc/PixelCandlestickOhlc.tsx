// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// pixel-candlestick-ohlc — an 8-bit OHLC candlestick chart that rises column-by-column along a
// timeline: each candle pops up in turn (frame-driven visible count), bodies are quantized rects,
// wicks are quantized high/low lines, bull(green)/bear(red) bodies subtly color-cycle, and the
// latest price counts up in BitmapText. Pure-deterministic sample series ($0, seamless loop).
// Horizontal 480x270 (finance / market-data / fintech catalog binding — candlestick, not line).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  PixelStage, PixelDither, CrtScanlines, CrtVignette, CrtNoise,
  BitmapText, cyclePalette, lerpRGB, rgb, quantizeToCell, seed, type RGB,
} from "../../pixel-kit";

export const FPS = 30;
export const DURATION_FRAMES = 180; // 6s

const IW = 480;
const IH = 270;
const snap = (n: number) => Math.round(n);

// Chart plotting box (leave room for grid labels left / price tag right, header up top).
const PLOT_X0 = 30;
const PLOT_X1 = 462;
const PLOT_Y0 = 52;   // top of price area
const PLOT_Y1 = 232;  // bottom of price area
const PLOT_W = PLOT_X1 - PLOT_X0;
const PLOT_H = PLOT_Y1 - PLOT_Y0;

const hexToRgb = (h: string): RGB => {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};

export type PixelCandlestickOhlcProps = {
  backgroundColor: string; // chart panel base
  gridColor: string;       // grid + axis lines
  bullColor: string;       // up candle (close >= open)
  bearColor: string;       // down candle (close < open)
  accentColor: string;     // header / latest-price text
  candleCount: number;     // number of candles in the series
  volatility: number;      // 0..1 amplitude of the deterministic walk
  cycleSpeed: number;      // subtle body color-cycle speed
  ticker: string;          // header symbol label
};

export const defaultPixelCandlestickOhlcProps: PixelCandlestickOhlcProps = {
  backgroundColor: "#0a0f1e",
  gridColor: "#1b2942",
  bullColor: "#2ee06a",
  bearColor: "#ff4d5e",
  accentColor: "#7fe9ff",
  candleCount: 24,
  volatility: 0.5,
  // 6-stop ramp; effective cycle speed = cycleSpeed/180 steps/frame, so 180 frames advance
  // cycleSpeed steps. cycleSpeed = 6 → exactly one seamless ramp loop over the clip.
  cycleSpeed: 6,
  ticker: "BTC/USD",
};

type Ohlc = { o: number; h: number; l: number; c: number };

// Deterministic OHLC random walk (seed-based, no Math.random). Prices in a 0..1 unit band.
function buildSeries(count: number, volatility: number): Ohlc[] {
  const out: Ohlc[] = [];
  let price = 0.5;
  const amp = 0.05 + volatility * 0.09;
  for (let i = 0; i < count; i++) {
    const o = price;
    // signed step from two seeded draws (range roughly -amp..+amp, with mild trend wobble)
    const step = (seedSigned(i * 2.3 + 1.7) * 0.7 + Math.sin(i * 0.55) * 0.35) * amp;
    let c = o + step;
    if (c < 0.06) c = 0.06 + (0.06 - c) * 0.5;
    if (c > 0.94) c = 0.94 - (c - 0.94) * 0.5;
    // wicks extend beyond the body by seeded fractions of the step magnitude
    const span = Math.max(0.012, Math.abs(c - o));
    const hi = Math.max(o, c) + span * (0.25 + seedFrac(i * 3.1 + 5.0) * 0.9) + amp * 0.15;
    const lo = Math.min(o, c) - span * (0.25 + seedFrac(i * 1.9 + 9.0) * 0.9) - amp * 0.15;
    out.push({
      o,
      c,
      h: Math.min(0.99, hi),
      l: Math.max(0.01, lo),
    });
    price = c;
  }
  return out;
}
// seed() ∈ [0,1) → [0,1) frac
const seedFrac = (n: number) => seed(n);
// seeded signed value in [-1,1)
const seedSigned = (n: number) => seed(n) * 2 - 1;

// Map a 0..1 price to a plot-y (inverted: high price = small y), quantized to a 3px cell.
const priceToY = (p: number) => quantizeToCell(snap(PLOT_Y1 - p * PLOT_H), 3);

export const PixelCandlestickOhlc: React.FC<PixelCandlestickOhlcProps> = ({
  backgroundColor, gridColor, bullColor, bearColor, accentColor,
  candleCount, volatility, cycleSpeed, ticker,
}) => {
  const frame = useCurrentFrame();
  const grid = hexToRgb(gridColor);
  const bull = hexToRgb(bullColor);
  const bear = hexToRgb(bearColor);
  const accent = hexToRgb(accentColor);

  const n = Math.max(4, Math.min(40, Math.round(candleCount)));
  const series = buildSeries(n, volatility);

  // Column geometry.
  const colW = PLOT_W / n;
  const bodyW = Math.max(3, snap(colW * 0.62));

  // Draw-on timeline: candles appear column-by-column over the first ~75% of the clip, then hold.
  const introFrames = DURATION_FRAMES * 0.74;
  const perCandle = introFrames / n;
  const visibleF = frame / perCandle;             // fractional count of revealed candles
  const visibleN = Math.min(n, Math.floor(visibleF) + 1);

  // Latest revealed close, mapped to a count-up display price.
  const PRICE_BASE = 20000;   // display dollars at price=0
  const PRICE_SPAN = 60000;   // display dollars per 1.0 unit
  const lastIdx = Math.min(n - 1, visibleN - 1);
  // Count-up: the displayed price tracks the latest *revealed* close, so as candles pop in
  // column-by-column the headline price ticks up/down step-by-step (deterministic per frame).
  const dispUnit = series[lastIdx].c;
  const dispPrice = Math.round((PRICE_BASE + dispUnit * PRICE_SPAN) / 10) * 10;

  // Header direction = session change (latest revealed close vs the opening price of the
  // series), which is what the price readout above it actually measures. Candle bodies stay
  // per-period bull/bear; deriving the header from the single latest body made the label read
  // "UP" on a falling chart whenever the last candle happened to close a hair above its open.
  const openPrice = Math.round((PRICE_BASE + series[0].o * PRICE_SPAN) / 10) * 10;
  const isUp = dispPrice >= openPrice;
  const changePct = ((dispPrice - openPrice) / openPrice) * 100;
  const changeLabel = `${isUp ? "UP" : "DOWN"} ${isUp ? "+" : "-"}${Math.abs(changePct).toFixed(1)}%`;

  // ---- grid lines (horizontal price levels + faint verticals) ----
  const gridNodes: React.ReactNode[] = [];
  const ROWS = 5;
  for (let r = 0; r <= ROWS; r++) {
    const y = snap(PLOT_Y0 + (PLOT_H * r) / ROWS);
    gridNodes.push(<rect key={`gh-${r}`} x={PLOT_X0} y={y} width={PLOT_W} height={1} fill={rgb(grid, r === ROWS ? 0.9 : 0.4)} />);
    // price tick labels on the left axis
    const lvl = PRICE_BASE + (1 - r / ROWS) * PRICE_SPAN;
    const k = Math.round(lvl / 1000);
    gridNodes.push(
      <BitmapText key={`gl-${r}`} text={`${k}k`} x={PLOT_X0 - 4} y={y - 3} cell={1} color={rgb(grid, 0.95)} align="right" />
    );
  }
  for (let cI = 0; cI <= n; cI += 4) {
    const x = snap(PLOT_X0 + cI * colW);
    gridNodes.push(<rect key={`gv-${cI}`} x={x} y={PLOT_Y0} width={1} height={PLOT_H} fill={rgb(grid, 0.22)} />);
  }
  // left + bottom axis
  gridNodes.push(<rect key="ax-l" x={PLOT_X0} y={PLOT_Y0} width={1} height={PLOT_H} fill={rgb(grid, 0.9)} />);

  // ---- candles ----
  const candleNodes: React.ReactNode[] = [];
  for (let i = 0; i < visibleN; i++) {
    const d = series[i];
    const isBull = d.c >= d.o;
    const base: RGB = isBull ? bull : bear;
    // subtle per-candle color cycle (phase by index) — bull cycles up the green family, bear the red.
    // speed = cycleSpeed/DURATION_FRAMES → 180 frames advance exactly `cycleSpeed` ramp steps (seamless at 6).
    const cyc = cyclePalette(frame, i * 0.9, cycleSpeed / DURATION_FRAMES, isBull
      ? [base, lerpRGB(base, [255, 255, 255], 0.22), base, lerpRGB(base, [0, 0, 0], 0.15), base, lerpRGB(base, [255, 255, 255], 0.10)]
      : [base, lerpRGB(base, [255, 220, 220], 0.22), base, lerpRGB(base, [0, 0, 0], 0.15), base, lerpRGB(base, [255, 220, 220], 0.10)]);

    // per-candle pop: scale-in over ~6 frames as it reveals (deterministic).
    const localF = frame - i * perCandle;
    const pop = Math.max(0, Math.min(1, localF / 6));
    const ease = 1 - (1 - pop) * (1 - pop);

    const cx = snap(PLOT_X0 + (i + 0.5) * colW);
    const yO = priceToY(d.o);
    const yC = priceToY(d.c);
    const yH = priceToY(d.h);
    const yL = priceToY(d.l);

    // body rect (grow from center as it pops)
    const bodyTop = Math.min(yO, yC);
    const bodyBot = Math.max(yO, yC);
    const bodyFullH = Math.max(3, bodyBot - bodyTop);
    const bodyH = Math.max(3, snap(bodyFullH * ease));
    const bodyMid = (bodyTop + bodyBot) / 2;
    const bx = snap(cx - bodyW / 2);
    const by = snap(bodyMid - bodyH / 2);

    // wick (quantized vertical line through high/low), revealed proportionally with the pop.
    const wickH = snap((yL - yH) * ease);
    const wickY = snap(bodyMid - (bodyMid - yH) * ease);
    candleNodes.push(
      <rect key={`wk-${i}`} x={cx} y={wickY} width={1} height={Math.max(1, wickH)} fill={rgb(lerpRGB(cyc, [255, 255, 255], 0.18), 0.85)} />
    );
    // body fill + a 1px darker outline for the dot-art read
    candleNodes.push(
      <rect key={`bd-${i}`} x={bx} y={by} width={bodyW} height={bodyH} fill={rgb(cyc)} />
    );
    candleNodes.push(
      <rect key={`bo-${i}`} x={bx} y={by} width={bodyW} height={bodyH} fill="none" stroke={rgb(lerpRGB(cyc, [0, 0, 0], 0.35))} strokeWidth={1} />
    );
  }

  // ---- latest-price marker: dashed level + pulsing dot on the newest candle ----
  const markerNodes: React.ReactNode[] = [];
  if (visibleN > 0) {
    const yLast = priceToY(series[lastIdx].c);
    const markCol = isUp ? bull : bear;
    for (let x = PLOT_X0; x < PLOT_X1; x += 6) {
      markerNodes.push(<rect key={`dl-${x}`} x={x} y={yLast} width={3} height={1} fill={rgb(markCol, 0.7)} />);
    }
    const cxLast = snap(PLOT_X0 + (lastIdx + 0.5) * colW);
    const tw = 0.5 + 0.5 * Math.sin(frame * 0.5);
    markerNodes.push(<rect key="dot" x={cxLast - 1} y={yLast - 1} width={3} height={3} fill={rgb(lerpRGB(markCol, [255, 255, 255], 0.4 * tw))} />);
  }

  return (
    <>
      <PixelStage iw={IW} ih={IH} background={backgroundColor}>
        <svg width={IW} height={IH} viewBox={`0 0 ${IW} ${IH}`} style={{ position: "absolute", inset: 0, width: IW, height: IH, imageRendering: "pixelated", shapeRendering: "crispEdges" }}>
          {/* panel */}
          <rect x={0} y={0} width={IW} height={IH} fill={rgb(hexToRgb(backgroundColor))} />
          <rect x={PLOT_X0} y={PLOT_Y0} width={PLOT_W} height={PLOT_H} fill={rgb(lerpRGB(hexToRgb(backgroundColor), grid, 0.18), 0.5)} />

          {/* header: ticker (left) + live price (right, color-coded, counts up) */}
          <BitmapText text={ticker.toUpperCase()} x={PLOT_X0} y={18} cell={2} color={rgb(accent)} align="left" />
          <BitmapText text="OHLC" x={PLOT_X0} y={36} cell={1} color={rgb(lerpRGB(accent, grid, 0.5))} align="left" />
          <BitmapText text={`$${dispPrice}`} x={PLOT_X1} y={16} cell={2} color={rgb(isUp ? bull : bear)} align="right" />
          <BitmapText text={changeLabel} x={PLOT_X1} y={36} cell={1} color={rgb(isUp ? bull : bear, 0.85)} align="right" />

          {/* grid + candles + marker */}
          {gridNodes}
          {candleNodes}
          {markerNodes}
        </svg>
        <PixelDither iw={IW} ih={IH} opacity={0.06} />
      </PixelStage>
      <CrtScanlines opacity={0.35} />
      <CrtNoise opacity={0.03} />
      <CrtVignette strength={0.7} />
      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </>
  );
};

export default PixelCandlestickOhlc;
