// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Bokeh background: floating soft circles drift via multiple sin/cos waves.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 150;

const FONT_STACK = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type BokehCirclesProps = {
  /** Circle colors (assigned pseudo-randomly) */
  colors: string[];
  /** Base background color */
  baseColor: string;
  /** Number of circles */
  count: number;
  /** Centered label text (optional) */
  label?: string;
  /** Label color */
  labelColor?: string;
};

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

export const defaultBokehCirclesProps: BokehCirclesProps = {
  colors: ["#ffd1a4", "#ffe6c7", "#fff3d6", "#ffc89e"],
  baseColor: "#1a0f1f",
  count: 24,
  label: "Background Demo",
  labelColor: "#ffffff",
};

export const BokehCircles: React.FC<BokehCirclesProps> = ({
  colors,
  baseColor,
  count,
  label,
  labelColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const labelOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const circles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      seedX: seededRandom(i * 3 + 1),
      seedY: seededRandom(i * 5 + 2),
      sizeBase: 80 + seededRandom(i * 7 + 3) * 240,
      speed: 0.4 + seededRandom(i * 11 + 4) * 0.8,
      phase: seededRandom(i * 13 + 5) * Math.PI * 2,
      color: colors[Math.floor(seededRandom(i * 17 + 6) * colors.length)],
      opacity: 0.25 + seededRandom(i * 19 + 7) * 0.45,
    }));
  }, [count, colors]);

  return (
    <AbsoluteFill style={{ backgroundColor: baseColor, overflow: "hidden" }}>
      {circles.map((c, i) => {
        const t = frame * 0.02 * c.speed + c.phase;
        const x = c.seedX * 100 + Math.sin(t) * 8;
        const y = c.seedY * 100 + Math.cos(t * 0.8) * 8;
        const pulse = 1 + Math.sin(t * 1.2) * 0.15;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: c.sizeBase * pulse,
              height: c.sizeBase * pulse,
              marginLeft: -(c.sizeBase * pulse) / 2,
              marginTop: -(c.sizeBase * pulse) / 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${c.color} 0%, transparent 70%)`,
              opacity: c.opacity,
              filter: "blur(20px)",
              mixBlendMode: "screen",
            }}
          />
        );
      })}
      {label ? (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_STACK,
            fontSize: 72,
            fontWeight: 700,
            color: labelColor,
            letterSpacing: 4,
            opacity: labelOpacity,
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {label}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export default BokehCircles;
