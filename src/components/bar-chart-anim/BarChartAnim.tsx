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
export const DURATION_FRAMES = 150;

// Western font stack per RenderComp convention (display text is English only).
const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Spacing scale inlined from the original shared layout constants (8px grid).
const SPACE = { xs: 8, md: 24 } as const;

// Bar item type (inlined from the original ../types BarItem).
type BarItem = {
  label: string;
  value: number;
  color?: string;
};

export type BarChartAnimProps = {
  title: string;
  subtitle?: string;
  bars: BarItem[];
  background: string;
  titleColor: string;
  accentColor: string;
};

export const defaultBarChartAnimProps: BarChartAnimProps = {
  title: "Quarterly Revenue",
  subtitle: "Year over year +28%",
  bars: [
    { label: "Q1", value: 120, color: "#60a5fa" },
    { label: "Q2", value: 180, color: "#34d399" },
    { label: "Q3", value: 240, color: "#fbbf24" },
    { label: "Q4", value: 320, color: "#f472b6" },
  ],
  background: "#0f172a",
  titleColor: "#ffffff",
  accentColor: "#60a5fa",
};

export const BarChartAnim: React.FC<BarChartAnimProps> = ({
  title,
  subtitle,
  bars,
  background,
  titleColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // Keep the original look but scale relative to the canvas for resolution safety.
  const scale = Math.min(width, height) / 1080;

  // Title rises and fades in over the first 14 frames (cubic ease-out).
  const titleOpacity = interpolate(frame, [0, 14], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 14], [-20, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart geometry (matches the original: bars normalized to a fixed chart height).
  const maxValue = Math.max(...bars.map((b) => b.value), 1);
  const chartHeight = 420 * scale;

  // Bar animation params (inlined from the shared BarChart organism).
  const delay = 20;
  const stagger = 8;
  const barWidth = 120 * scale;
  const damping = 16;
  const stiffness = 200;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80 * scale,
        gap: 56 * scale,
        fontFamily: FONT,
      }}
    >
      {/* Title + subtitle block */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12 * scale,
        }}
      >
        <div
          style={{
            fontSize: 60 * scale,
            fontWeight: 900,
            color: titleColor,
            letterSpacing: 2 * scale,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 28 * scale,
              fontWeight: 600,
              color: accentColor,
              letterSpacing: 1 * scale,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Bars grow up from the baseline, staggered (inlined BarChart organism) */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: SPACE.md * scale,
          height: chartHeight,
        }}
      >
        {bars.map((b, i) => {
          const barHeight = (b.value / maxValue) * chartHeight;
          const barColor = b.color ?? accentColor;
          const barProgress = spring({
            frame: frame - delay - i * stagger,
            fps,
            config: { damping, stiffness },
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: SPACE.xs * scale,
              }}
            >
              <div
                style={{
                  width: barWidth,
                  height: barHeight * barProgress,
                  borderRadius: `${SPACE.xs * scale}px ${SPACE.xs * scale}px 0 0`,
                  background: barColor,
                  opacity: barProgress,
                }}
              />
              {b.label ? (
                <span
                  style={{
                    fontSize: 14 * scale,
                    color: barColor,
                    opacity: barProgress,
                    fontWeight: 600,
                  }}
                >
                  {b.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default BarChartAnim;
