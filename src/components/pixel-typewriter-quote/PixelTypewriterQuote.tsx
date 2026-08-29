// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// pixel-typewriter-quote — a kinetic-type quote where self-made 5x7 bitmap glyphs light up one
// character at a time (visibleChars = floor(frame*cps)). Each lit char briefly flares to the accent
// then settles to ink; a block cursor blinks at the write head; big bitmap quotation marks frame the
// passage; the attribution types in after the body. Word-wrapped to a column width, all rect dots,
// pure-deterministic. Distinct from a system-font typewriter: the glyphs ARE rect bitmaps (font.ts).
// Horizontal 480x270 (lyric card / quote-of-the-day / kinetic-type intro).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  PixelStage, PixelDither, CrtScanlines, CrtVignette, CrtNoise,
  layoutText, GLYPH_W, GLYPH_H, lerpRGB, rgb, type RGB,
} from "../../pixel-kit";

export const FPS = 30;
export const DURATION_FRAMES = 180;

const IW = 480;
const IH = 270;
const snap = (n: number) => Math.round(n);

export type PixelTypewriterQuoteProps = {
  quote: string;        // body text (English glyph set)
  attribution: string;  // who said it ("- NAME")
  backgroundColor: string;
  inkColor: string;     // settled glyph color
  accentColor: string;  // fresh-strike flare + quote marks + cursor
  cps: number;          // characters revealed per frame
};

export const defaultPixelTypewriterQuoteProps: PixelTypewriterQuoteProps = {
  quote: "Make it work, make it right, make it fast.",
  attribution: "- Kent Beck",
  backgroundColor: "#0c0e1a",
  inkColor: "#dfe7ff",
  accentColor: "#39e0c8",
  cps: 0.55,
};

const hexToRgb = (h: string): RGB => {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};

// Greedy word-wrap into lines no wider than maxChars characters.
function wrapWords(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur.length === 0 ? w : cur + " " + w;
    if (candidate.length > maxChars && cur.length > 0) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur.length > 0) lines.push(cur);
  return lines;
}

// Draw a single character's lit bitmap cells at a cell origin, with per-char color + opacity.
function drawChar(
  ch: string, originX: number, originY: number, cell: number, color: string, opacity: number, keyPrefix: string,
): React.ReactNode[] {
  if (opacity <= 0.01) return [];
  const { cells } = layoutText(ch);
  return cells.map((c, i) => (
    <rect
      key={`${keyPrefix}-${i}`}
      x={snap(originX + c.x * cell)}
      y={snap(originY + c.y * cell)}
      width={cell}
      height={cell}
      fill={color}
      opacity={opacity}
    />
  ));
}

export const PixelTypewriterQuote: React.FC<PixelTypewriterQuoteProps> = ({
  quote, attribution, backgroundColor, inkColor, accentColor, cps,
}) => {
  const frame = useCurrentFrame();
  const bg = hexToRgb(backgroundColor);
  const ink = hexToRgb(inkColor);
  const accent = hexToRgb(accentColor);

  const cell = 3;                       // internal pixels per glyph dot
  const charW = (GLYPH_W + 1) * cell;   // advance per character (incl. 1-col gap)
  const charH = GLYPH_H * cell;
  const lineGap = charH + 6 * cell;     // generous leading between lines

  // Layout the body into wrapped lines, then build a flat list of revealable glyph slots
  // (each carries its absolute pixel origin + the global reveal index).
  const colCount = Math.floor((IW - 96) / charW); // text column width in chars
  const lines = wrapWords(quote, Math.max(8, colCount));

  type Slot = { ch: string; x: number; y: number; idx: number; line: number };
  const slots: Slot[] = [];

  const blockH = lines.length * charH + (lines.length - 1) * (lineGap - charH);
  const startY = snap((IH - blockH) / 2) - 6;
  let globalIdx = 0;

  lines.forEach((ln, li) => {
    const lineW = ln.length * charW - cell; // drop trailing gap
    const sx = snap((IW - lineW) / 2);
    const ly = snap(startY + li * lineGap);
    for (let ci = 0; ci < ln.length; ci++) {
      slots.push({ ch: ln[ci], x: snap(sx + ci * charW), y: ly, idx: globalIdx, line: li });
      globalIdx++;
    }
  });
  const totalBody = globalIdx;

  // Reveal head — characters appear left-to-right, one at a time.
  const revealed = Math.floor(frame * cps);

  // Attribution starts after the whole body is typed (+ a short pause).
  const attrStartChar = totalBody + 8; // 8 "chars" of pause
  const attrRevealed = Math.max(0, Math.floor(frame * cps) - attrStartChar);

  const nodes: React.ReactNode[] = [];

  // --- Body glyphs ---
  for (const s of slots) {
    if (s.idx > revealed) continue;
    const age = revealed - s.idx; // frames-ish since this char struck (in reveal units)
    // Fresh strike flares to accent, then settles to ink over a few reveal steps.
    const settle = Math.min(1, age / 4);
    const color = rgb(lerpRGB(accent, ink, settle));
    // Newest char pops slightly brighter (full), older chars at full ink too.
    const opacity = s.idx === revealed ? 1 : 1;
    nodes.push(...drawChar(s.ch, s.x, s.y, cell, color, opacity, `b-${s.idx}`));
  }

  // --- Blinking write-head cursor (block), follows the next unwritten slot ---
  const headSlot = slots.find((s) => s.idx === Math.min(revealed + 1, totalBody - 1));
  const bodyDone = revealed >= totalBody - 1;
  if (!bodyDone && headSlot) {
    const blink = Math.floor(frame / 8) % 2 === 0 ? 0.9 : 0.25;
    nodes.push(
      <rect key="cursor" x={headSlot.x} y={headSlot.y} width={GLYPH_W * cell} height={charH} fill={rgb(accent, blink)} />,
    );
  }

  // --- Attribution (smaller cell), types in below the body, right-aligned ---
  const aCell = 2;
  const aCharW = (GLYPH_W + 1) * aCell;
  const aCharH = GLYPH_H * aCell;
  const attrW = attribution.length * aCharW - aCell;
  const attrX = snap(IW - 64 - attrW);
  const attrY = snap(startY + lines.length * lineGap + 10);
  for (let ci = 0; ci < attribution.length; ci++) {
    if (ci >= attrRevealed) break;
    const x = snap(attrX + ci * aCharW);
    nodes.push(...drawChar(attribution[ci], x, attrY, aCell, rgb(accent), 0.85, `a-${ci}`));
  }
  // Attribution cursor while it types
  const attrDone = attrRevealed >= attribution.length;
  if (bodyDone && !attrDone) {
    const cx = snap(attrX + Math.min(attrRevealed, attribution.length) * aCharW);
    const blink = Math.floor(frame / 7) % 2 === 0 ? 0.8 : 0.2;
    nodes.push(<rect key="acursor" x={cx} y={attrY} width={GLYPH_W * aCell} height={aCharH} fill={rgb(accent, blink)} />);
  }

  // --- Big decorative opening/closing quotation marks (bitmap, framing the block) ---
  const qCell = 4;
  const qm = '"';
  const qmTop = snap(startY - GLYPH_H * qCell - 4);
  // Opening quote, top-left of the text column
  const leftX = snap((IW - (lines[0]?.length ?? 8) * charW) / 2) - GLYPH_W * qCell - 6;
  const qOpacity = 0.5;
  const qColor = rgb(accent, qOpacity);
  layoutText(qm).cells.forEach((c, i) => {
    nodes.push(
      <rect key={`qo-${i}`} x={snap(Math.max(8, leftX) + c.x * qCell)} y={snap(qmTop + c.y * qCell)} width={qCell} height={qCell} fill={qColor} />,
    );
  });
  // Closing quote, bottom-right — appears once body finished typing
  if (bodyDone) {
    const lastLine = lines[lines.length - 1] ?? "";
    const lastW = lastLine.length * charW - cell;
    const rightX = snap((IW - lastW) / 2 + lastW + 6);
    const qmBot = snap(startY + (lines.length - 1) * lineGap + charH - GLYPH_H * qCell + 6);
    layoutText(qm).cells.forEach((c, i) => {
      nodes.push(
        <rect key={`qc-${i}`} x={snap(Math.min(IW - GLYPH_W * qCell - 8, rightX) + c.x * qCell)} y={snap(qmBot + c.y * qCell)} width={qCell} height={qCell} fill={qColor} />,
      );
    });
  }

  // Subtle accent underline rule beneath the body block (draws in with the reveal).
  const ruleProgress = Math.min(1, revealed / Math.max(1, totalBody));
  const ruleY = snap(startY + lines.length * lineGap + 4);
  const ruleFullW = IW - 128;
  const ruleW = snap(ruleFullW * ruleProgress);
  nodes.push(
    <rect key="rule" x={snap((IW - ruleFullW) / 2)} y={ruleY} width={ruleW} height={1} fill={rgb(accent, 0.55)} />,
  );

  // Background gradient bands (static, calm) so the kinetic text reads cleanly.
  const bgBands: React.ReactNode[] = [];
  const bandCount = 9;
  for (let i = 0; i < bandCount; i++) {
    const t = i / (bandCount - 1);
    const c = lerpRGB(bg, lerpRGB(bg, accent, 0.06), t);
    const y = snap((IH * i) / bandCount);
    const h = Math.ceil(IH / bandCount) + 1;
    bgBands.push(<rect key={`bg-${i}`} x={0} y={y} width={IW} height={h} fill={rgb(c)} />);
  }

  return (
    <>
      <PixelStage iw={IW} ih={IH} background={backgroundColor}>
        <svg
          width={IW}
          height={IH}
          viewBox={`0 0 ${IW} ${IH}`}
          style={{ position: "absolute", inset: 0, width: IW, height: IH, imageRendering: "pixelated", shapeRendering: "crispEdges" }}
        >
          {bgBands}
          {nodes}
        </svg>
        <PixelDither iw={IW} ih={IH} opacity={0.06} />
      </PixelStage>
      <CrtScanlines opacity={0.4} />
      <CrtNoise opacity={0.03} />
      <CrtVignette strength={0.7} />
      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </>
  );
};

export default PixelTypewriterQuote;
