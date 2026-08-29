// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 100;

export type PencilDrawProps = {
  backgroundColor: string;
  pencilColor: string;
  lineColor: string;
  eraserColor: string;
  textColor: string;
  subColor: string;
  messageText: string;
  subText: string;
};

export const defaultPencilDrawProps: PencilDrawProps = {
  backgroundColor: "#fffbeb",
  pencilColor: "#fbbf24",
  lineColor: "#1e293b",
  eraserColor: "#fca5a5",
  textColor: "#1e293b",
  subColor: "#64748b",
  messageText: "Creating...",
  subText: "Design in progress",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const PencilDraw: React.FC<PencilDrawProps> = ({
  backgroundColor,
  pencilColor,
  lineColor,
  eraserColor,
  textColor,
  subColor,
  messageText,
  subText,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = Math.min(width, height);

  const cx = width / 2;
  const cy = height * 0.42;

  // Drawing progress
  const drawProgress = interpolate(frame, [5, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Star/checkmark being drawn: 5 points of a star
  const starR = scale * 0.14;
  const innerR = scale * 0.06;
  const starPts: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? starR : innerR;
    starPts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  starPts.push(starPts[0]); // close

  // Build partial path
  const totalPts = starPts.length;
  const visibleLen = drawProgress * (totalPts - 1);
  const fullIdx = Math.floor(visibleLen);
  const frac = visibleLen - fullIdx;
  const visiblePts = starPts.slice(0, fullIdx + 1);
  if (fullIdx < starPts.length - 1 && frac > 0) {
    visiblePts.push({
      x: starPts[fullIdx].x + (starPts[fullIdx + 1].x - starPts[fullIdx].x) * frac,
      y: starPts[fullIdx].y + (starPts[fullIdx + 1].y - starPts[fullIdx].y) * frac,
    });
  }
  const pathD = visiblePts.length > 1
    ? `M ${visiblePts[0].x} ${visiblePts[0].y} ` + visiblePts.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  // Pencil position follows drawing tip
  const tip = visiblePts.length > 0 ? visiblePts[visiblePts.length - 1] : { x: cx, y: cy };
  const pencilAngle = 45; // degrees
  const pencilL = scale * 0.18;
  const pencilX = tip.x + Math.cos((pencilAngle + 180) * Math.PI / 180) * pencilL * 0.15;
  const pencilY = tip.y + Math.sin((pencilAngle + 180) * Math.PI / 180) * pencilL * 0.15;

  const pencilIn = spring({ frame, fps, config: { damping: 12, stiffness: 100 }, durationInFrames: 14 });
  const textIn = spring({ frame: frame - 75, fps, config: { damping: 12, stiffness: 120 }, durationInFrames: 18 });
  const subIn = interpolate(frame, [88, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pencil body direction
  const pAngle = pencilAngle * Math.PI / 180;
  const px1 = pencilX + Math.cos(pAngle) * pencilL;
  const py1 = pencilY + Math.sin(pAngle) * pencilL;
  const perpX = Math.cos(pAngle + Math.PI / 2) * scale * 0.016;
  const perpY = Math.sin(pAngle + Math.PI / 2) * scale * 0.016;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Drawn path */}
        {pathD && (
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth={scale * 0.012} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Pencil */}
        <g opacity={pencilIn}>
          {/* Body */}
          <polygon
            points={`${pencilX + perpX},${pencilY + perpY} ${pencilX - perpX},${pencilY - perpY} ${px1 - perpX},${py1 - perpY} ${px1 + perpX},${py1 + perpY}`}
            fill={pencilColor}
          />
          {/* Tip */}
          <polygon
            points={`${pencilX + perpX * 0.6},${pencilY + perpY * 0.6} ${pencilX - perpX * 0.6},${pencilY - perpY * 0.6} ${tip.x},${tip.y}`}
            fill="#d97706"
          />
          {/* Lead tip */}
          <polygon
            points={`${pencilX + perpX * 0.2},${pencilY + perpY * 0.2} ${pencilX - perpX * 0.2},${pencilY - perpY * 0.2} ${tip.x},${tip.y}`}
            fill={lineColor}
          />
          {/* Eraser end */}
          <rect
            x={px1 - perpX - scale * 0.006} y={py1 - perpY - scale * 0.006}
            width={scale * 0.012 + Math.abs(perpX) * 2} height={scale * 0.012 + Math.abs(perpY) * 2}
            fill={eraserColor}
          />
        </g>
      </svg>

      {/* Text */}
      <div style={{
        position: "absolute", bottom: height * 0.1,
        left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: scale * 0.01,
      }}>
        <div style={{ fontFamily: FONT, fontSize: scale * 0.09, fontWeight: 900, color: textColor, opacity: textIn, transform: `scale(${0.75 + textIn * 0.25})` }}>
          {messageText}
        </div>
        <div style={{ fontFamily: FONT, fontSize: scale * 0.034, fontWeight: 500, color: subColor, opacity: subIn }}>
          {subText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default PencilDraw;
