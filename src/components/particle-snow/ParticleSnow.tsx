// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Snow particle system — three parallax layers for depth
// Front / middle / back layers differ in particle size, speed and opacity
// Text fades in at the lower center
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 150;

export type ParticleSnowProps = {
  backgroundColor: string;
  snowColor: string;
  accentColor: string;
  flakeCount: number;
  title: string;
  subtitle: string;
  textColor: string;
};

export const defaultParticleSnowProps: ParticleSnowProps = {
  backgroundColor: "#0f172a",
  snowColor: "#e2e8f0",
  accentColor: "#38bdf8",
  flakeCount: 70,
  title: "Winter Magic",
  subtitle: "Season's Greetings",
  textColor: "#f8fafc",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

type Flake = {
  xNorm: number;
  size: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  layer: number;
  opacity: number;
  startY: number;
};

function buildFlakes(count: number, height: number): Flake[] {
  return Array.from({ length: count }, (_, i) => {
    const r1 = Math.abs(Math.sin(i * 1.6180339887)) ;
    const r2 = Math.abs(Math.sin(i * 2.7182818284));
    const r3 = Math.abs(Math.sin(i * 3.1415926535));
    const layer = i % 3;
    return {
      xNorm: r1,
      size:
        layer === 0 ? 2 + r2 * 2
        : layer === 1 ? 3 + r2 * 3
        : 4 + r2 * 4,
      speed:
        layer === 0 ? 0.7 + r3 * 0.5
        : layer === 1 ? 1.1 + r3 * 0.7
        : 1.5 + r3 * 0.9,
      swayAmp: (r2 - 0.5) * 0.06,
      swayFreq: 0.025 + r3 * 0.04,
      phase: r1 * Math.PI * 2,
      layer,
      opacity:
        layer === 0 ? 0.25 + r2 * 0.2
        : layer === 1 ? 0.45 + r2 * 0.2
        : 0.65 + r2 * 0.3,
      startY: -(r3 * height),
    };
  });
}

export const ParticleSnow: React.FC<ParticleSnowProps> = ({
  backgroundColor,
  snowColor,
  accentColor,
  flakeCount,
  title,
  subtitle,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = Math.min(width, height);

  const flakes = useMemo(
    () => buildFlakes(flakeCount, height),
    [flakeCount, height]
  );

  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textIn = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0, opacity: fadeIn }}
      >
        {/* Night sky gradient */}
        <defs>
          <linearGradient id="snow-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#snow-sky)" />

        {/* Stars (background) */}
        {Array.from({ length: 40 }, (_, i) => {
          const sx = (Math.abs(Math.sin(i * 7.3)) * width);
          const sy = (Math.abs(Math.sin(i * 5.1)) * height * 0.6);
          const sOpacity = 0.3 + Math.abs(Math.sin(i * 2.3 + frame * 0.05)) * 0.4;
          return (
            <circle
              key={`star-${i}`}
              cx={sx}
              cy={sy}
              r={Math.abs(Math.sin(i * 3.7)) * 1.5 + 0.5}
              fill={snowColor}
              opacity={sOpacity}
            />
          );
        })}

        {/* Snowflakes — back first, then mid, then front */}
        {[0, 1, 2].flatMap((layer) =>
          flakes
            .filter((f) => f.layer === layer)
            .map((flake, i) => {
              const totalDist = height + flake.size * 2;
              const rawY =
                flake.startY +
                frame * flake.speed +
                flake.phase * (height / (Math.PI * 2));
              const y = ((rawY % totalDist) + totalDist) % totalDist;
              const x =
                flake.xNorm * width +
                Math.sin(frame * flake.swayFreq + flake.phase) *
                  flake.swayAmp *
                  width;
              return (
                <circle
                  key={`${layer}-${i}`}
                  cx={x}
                  cy={y}
                  r={flake.size}
                  fill={snowColor}
                  opacity={flake.opacity}
                />
              );
            })
        )}
      </svg>

      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          bottom: height * 0.14,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: scale * 0.012,
          opacity: textIn,
          transform: `translateY(${interpolate(textIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: scale * 0.085,
            fontWeight: 800,
            color: textColor,
            textShadow: `0 0 30px ${accentColor}88`,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: scale * 0.034,
              fontWeight: 400,
              color: textColor,
              opacity: 0.65,
              letterSpacing: 1,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default ParticleSnow;
