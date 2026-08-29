// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 110;

export type FireworksBurstProps = {
  backgroundColor: string;
  burstColors: string[];
  trailColor: string;
  sparkColor: string;
  textColor: string;
  subColor: string;
  messageText: string;
  subText: string;
};

export const defaultFireworksBurstProps: FireworksBurstProps = {
  backgroundColor: "#0f172a",
  burstColors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"],
  trailColor: "#fef08a",
  sparkColor: "#fbbf24",
  textColor: "#f8fafc",
  subColor: "#fbbf24",
  messageText: "Boom!",
  subText: "Celebration time",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const FireworksBurst: React.FC<FireworksBurstProps> = ({
  backgroundColor,
  burstColors,
  trailColor,
  sparkColor,
  textColor,
  subColor,
  messageText,
  subText,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = Math.min(width, height);

  const textIn = spring({ frame: frame - 68, fps, config: { damping: 12, stiffness: 120 }, durationInFrames: 18 });
  const subIn = interpolate(frame, [82, 96], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cx = width / 2;
  const cy = height * 0.42;

  // Three bursts at different times
  const bursts = [
    { startFrame: 0, x: cx, y: cy, colorOffset: 0 },
    { startFrame: 20, x: cx - scale * 0.18, y: cy + scale * 0.05, colorOffset: 3 },
    { startFrame: 35, x: cx + scale * 0.18, y: cy - scale * 0.03, colorOffset: 5 },
  ];

  const numPetals = 12;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {bursts.map((burst, bi) => {
          const localFrame = frame - burst.startFrame;
          if (localFrame < 0) return null;
          const burstProgress = Math.min(1, localFrame / 30);
          const fadeOut = localFrame > 50 ? Math.max(0, 1 - (localFrame - 50) / 30) : 1;
          if (fadeOut <= 0) return null;

          const maxRadius = scale * 0.14;
          const radius = maxRadius * burstProgress;

          return (
            <g key={bi} opacity={fadeOut}>
              {/* Trail */}
              {localFrame < 15 && (
                <line
                  x1={burst.x} y1={burst.y + scale * 0.15}
                  x2={burst.x} y2={burst.y + scale * 0.01}
                  stroke={trailColor}
                  strokeWidth={scale * 0.006}
                  opacity={1 - localFrame / 15}
                  strokeLinecap="round"
                />
              )}

              {/* Burst petals */}
              {Array.from({ length: numPetals }, (_, i) => {
                const angle = (i / numPetals) * Math.PI * 2;
                const colorIdx = (i + burst.colorOffset) % burstColors.length;
                const px = burst.x + Math.cos(angle) * radius;
                const py = burst.y + Math.sin(angle) * radius;
                const tailX = burst.x + Math.cos(angle) * radius * 0.4;
                const tailY = burst.y + Math.sin(angle) * radius * 0.4;
                return (
                  <g key={i}>
                    <line
                      x1={tailX} y1={tailY}
                      x2={px} y2={py}
                      stroke={burstColors[colorIdx]}
                      strokeWidth={scale * 0.007}
                      strokeLinecap="round"
                    />
                    <circle
                      cx={px} cy={py}
                      r={scale * 0.012 * (1 - burstProgress * 0.4)}
                      fill={burstColors[colorIdx]}
                    />
                  </g>
                );
              })}

              {/* Sparks */}
              {Array.from({ length: 8 }, (_, i) => {
                const angle = (i / 8) * Math.PI * 2 + 0.2;
                const sr = radius * 1.2;
                return (
                  <circle key={i}
                    cx={burst.x + Math.cos(angle) * sr}
                    cy={burst.y + Math.sin(angle) * sr}
                    r={scale * 0.006}
                    fill={sparkColor}
                    opacity={0.7}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

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

export default FireworksBurst;
