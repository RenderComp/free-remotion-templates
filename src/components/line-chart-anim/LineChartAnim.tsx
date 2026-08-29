// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Line chart. Draws a polyline left-to-right via SVG stroke-dasharray/dashoffset
// tied to the frame, with dots and X-axis labels popping in as the line reaches them.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 150;

const FONT_STACK = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Inlined from ../types (LinePoint)
export type LinePoint = {
  label: string;
  value: number;
};

// Inlined from ../types (LineChartAnimSceneProps), renamed for RenderComp
export type LineChartAnimProps = {
  title: string;
  subtitle?: string;
  points: LinePoint[];
  background: string;
  titleColor: string;
  lineColor: string;
  gridColor: string;
};

export const defaultLineChartAnimProps: LineChartAnimProps = {
  title: "Monthly Active Users",
  subtitle: "Last six months (thousands)",
  points: [
    { label: "Jan", value: 40 },
    { label: "Feb", value: 55 },
    { label: "Mar", value: 50 },
    { label: "Apr", value: 72 },
    { label: "May", value: 88 },
    { label: "Jun", value: 95 },
  ],
  background: "#0b1220",
  titleColor: "#ffffff",
  lineColor: "#22d3ee",
  gridColor: "rgba(255,255,255,0.08)",
};

export const LineChartAnim: React.FC<LineChartAnimProps> = ({
  title,
  subtitle,
  points,
  background,
  titleColor,
  lineColor,
  gridColor,
}) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 14], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart drawing area
  const width = 1000;
  const height = 460;
  const padX = 60;
  const padY = 40;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const maxV = Math.max(...points.map((p) => p.value), 1);
  const minV = 0;
  const span = maxV - minV;

  const coords = points.map((p, i) => {
    const x = padX + (innerW * i) / Math.max(points.length - 1, 1);
    const y = padY + innerH - ((p.value - minV) / span) * innerH;
    return { x, y, label: p.label, value: p.value };
  });

  const pathD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  // Approximate path length (sum of segment lengths)
  let pathLen = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    pathLen += Math.sqrt(dx * dx + dy * dy);
  }

  const drawStart = 20;
  const drawEnd = 110;
  const drawProgress = interpolate(frame, [drawStart, drawEnd], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dashOffset = pathLen * (1 - drawProgress);

  // Dot appearance timing (follows the draw order)
  const dotShownFrames = coords.map((_, i) => {
    return (
      drawStart + (drawEnd - drawStart) * (i / Math.max(coords.length - 1, 1))
    );
  });

  // Grid lines
  const gridLines = 4;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        gap: 40,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: titleColor,
            letterSpacing: 2,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: lineColor,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <svg
        width={width}
        height={height + 40}
        viewBox={`0 0 ${width} ${height + 40}`}
      >
        {/* Grid */}
        {Array.from({ length: gridLines }, (_, i) => {
          const y = padY + (innerH * i) / (gridLines - 1);
          return (
            <line
              key={`g-${i}`}
              x1={padX}
              y1={y}
              x2={padX + innerW}
              y2={y}
              stroke={gridColor}
              strokeWidth={1}
            />
          );
        })}

        {/* Polyline */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          strokeDashoffset={dashOffset}
        />

        {/* Dots */}
        {coords.map((c, i) => {
          const appearFrame = dotShownFrames[i];
          const dotScale = interpolate(
            frame,
            [appearFrame - 2, appearFrame + 6],
            [0, 1],
            {
              easing: Easing.out(Easing.back(1.5)),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          return (
            <circle
              key={`d-${i}`}
              cx={c.x}
              cy={c.y}
              r={10 * dotScale}
              fill={lineColor}
              stroke={background}
              strokeWidth={3}
            />
          );
        })}

        {/* X-axis labels */}
        {coords.map((c, i) => {
          const labelOp = interpolate(
            frame,
            [dotShownFrames[i], dotShownFrames[i] + 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <text
              key={`l-${i}`}
              x={c.x}
              y={padY + innerH + 28}
              textAnchor="middle"
              fill="rgba(255,255,255,0.7)"
              fontSize={18}
              fontFamily={FONT_STACK}
              opacity={labelOp}
            >
              {c.label}
            </text>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export default LineChartAnim;
