// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Starfield warp: stars streaming radially outward from the center.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 150;

const FONT_SANS = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Deterministic pseudo-random generator so star layout is stable across renders.
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

export type StarfieldProps = {
  /** Number of stars */
  count: number;
  /** Star color */
  starColor: string;
  /** Base background color */
  baseColor: string;
  /** Warp speed (higher is faster) */
  warpSpeed: number;
  /** Center label text */
  label?: string;
  /** Label text color */
  labelColor?: string;
};

export const defaultStarfieldProps: StarfieldProps = {
  count: 180,
  starColor: "#ffffff",
  baseColor: "#02030a",
  warpSpeed: 4,
  label: "BACKGROUND",
  labelColor: "#ffffff",
};

export const Starfield: React.FC<StarfieldProps> = ({
  count,
  starColor,
  baseColor,
  warpSpeed,
  label,
  labelColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  const labelOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stars = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      angle: seededRandom(i * 3 + 1) * Math.PI * 2,
      startOffset: seededRandom(i * 5 + 2) * maxR,
      sizeBase: 1 + seededRandom(i * 7 + 3) * 2.5,
      speedJitter: 0.7 + seededRandom(i * 11 + 4) * 0.6,
    }));
  }, [count, maxR]);

  return (
    <AbsoluteFill style={{ backgroundColor: baseColor, overflow: "hidden" }}>
      {stars.map((s, i) => {
        const dist = (s.startOffset + frame * warpSpeed * s.speedJitter) % maxR;
        const x = cx + Math.cos(s.angle) * dist;
        const y = cy + Math.sin(s.angle) * dist;
        const sizeScale = dist / maxR;
        const size = s.sizeBase * (0.5 + sizeScale * 1.5);
        const alpha = Math.min(1, sizeScale * 1.5);
        const trailLen = sizeScale * 18 * warpSpeed * 0.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size + trailLen,
              height: size,
              marginLeft: -(size + trailLen) / 2,
              marginTop: -size / 2,
              background: `linear-gradient(90deg, transparent, ${starColor})`,
              borderRadius: size / 2,
              opacity: alpha,
              transform: `rotate(${s.angle}rad)`,
              transformOrigin: "center",
              boxShadow: `0 0 ${size * 2}px ${starColor}`,
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
            fontFamily: FONT_SANS,
            fontSize: 72,
            fontWeight: 700,
            color: labelColor,
            letterSpacing: 8,
            opacity: labelOpacity,
            textShadow: "0 4px 24px rgba(0,0,0,0.7)",
          }}
        >
          {label}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export default Starfield;
