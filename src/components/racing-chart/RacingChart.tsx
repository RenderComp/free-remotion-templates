// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Racing bar chart. Horizontal bars grow and reorder by rank as the chart
// "races" through a sequence of value steps, with a title fading in on top.
// Self-contained migration of the rv-template RacingChartScene (shared organism
// O-U09 inlined): no external deps beyond react/remotion.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 210;

// ---------------------------------------------------------------------------
// Inlined design constants (from shared layouts/constants.ts)
// ---------------------------------------------------------------------------
const SPACE = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

const TYPE_SCALE = {
  LABEL: 16,
} as const;

// Inlined word-break / line-break safety styles applied to all text.
const TEXT_BREAK_STYLES: React.CSSProperties = {
  lineBreak: "strict",
  overflowWrap: "break-word",
  wordBreak: "normal",
};

const FONT_STACK = '-apple-system, "Segoe UI", Roboto, sans-serif';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export type RacingChartDatum = {
  label: string;
  values: number[];
  color: string;
};

export type RacingChartProps = {
  /** Per-series label, per-step values, and bar color. */
  data: RacingChartDatum[];
  /** Frames spent transitioning between each consecutive step. */
  frames: number;
  /** Top title. */
  title: string;
  /** Background color. */
  background?: string;
  /** Title text color. */
  titleColor?: string;
};

export const defaultRacingChartProps: RacingChartProps = {
  data: [
    { label: "Aurora", values: [22, 28, 34, 41, 48], color: "#d4af37" },
    { label: "Beacon", values: [30, 32, 33, 35, 36], color: "#2563eb" },
    { label: "Cobalt", values: [18, 24, 30, 32, 38], color: "#10b981" },
    { label: "Delta", values: [26, 25, 24, 22, 20], color: "#ef4444" },
    { label: "Echo", values: [12, 16, 20, 28, 34], color: "#a855f7" },
  ],
  frames: 36,
  title: "Market Share Race",
  background: "#0b1f3a",
  titleColor: "#ffffff",
};

// ---------------------------------------------------------------------------
// Inlined RacingChart organism (the actual animated bars)
// ---------------------------------------------------------------------------
type RacingBarsProps = {
  data: RacingChartDatum[];
  delay?: number;
  frameDuration?: number;
  fontFamily?: string;
  style?: React.CSSProperties;
};

const RacingBars: React.FC<RacingBarsProps> = ({
  data,
  delay = 0,
  frameDuration = 30,
  fontFamily = FONT_STACK,
  style,
}) => {
  const frame = useCurrentFrame();

  if (data.length === 0 || data[0].values.length === 0) return null;

  const stepCount = data[0].values.length;
  const totalFrames = (stepCount - 1) * frameDuration;

  // Current continuous step index.
  const rawStep = interpolate(
    frame,
    [delay, delay + totalFrames],
    [0, stepCount - 1],
    {
      easing: Easing.linear,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const stepFloor = Math.floor(rawStep);
  const stepCeil = Math.min(stepFloor + 1, stepCount - 1);
  const stepFraction = rawStep - stepFloor;

  // Interpolate values for each item between the two surrounding steps.
  const currentValues = data.map((item) => {
    const from = item.values[stepFloor];
    const to = item.values[stepCeil];
    return from + (to - from) * stepFraction;
  });

  const maxVal = Math.max(...currentValues, 1);

  // Sort by value to determine rank (highest = top).
  const ranked = data
    .map((item, i) => ({ ...item, currentValue: currentValues[i], index: i }))
    .sort((a, b) => b.currentValue - a.currentValue);

  const rankMap = new Map<number, number>();
  ranked.forEach((item, rank) => rankMap.set(item.index, rank));

  const barHeight = 48;
  const barGap = SPACE.sm;

  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: data.length * (barHeight + barGap),
        opacity,
        fontFamily,
        ...TEXT_BREAK_STYLES,
        ...style,
      }}
    >
      {data.map((item, i) => {
        const rank = rankMap.get(i) ?? i;
        const translateY = rank * (barHeight + barGap);
        const widthRatio = currentValues[i] / maxVal;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: barHeight,
              transform: `translateY(${translateY}px)`,
              transition: "none",
              display: "flex",
              alignItems: "center",
              gap: SPACE.sm,
            }}
          >
            {/* Label */}
            <span
              style={{
                fontSize: TYPE_SCALE.LABEL,
                fontWeight: 600,
                color: "#ffffff",
                minWidth: 100,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {item.label}
            </span>

            {/* Bar */}
            <div
              style={{
                flex: 1,
                position: "relative",
                height: barHeight,
              }}
            >
              <div
                style={{
                  width: `${widthRatio * 100}%`,
                  height: "100%",
                  backgroundColor: item.color,
                  borderRadius: barHeight / 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: SPACE.sm,
                  minWidth: 60,
                }}
              >
                <span
                  style={{
                    fontSize: TYPE_SCALE.LABEL,
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {Math.round(currentValues[i])}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene wrapper (title + racing bars), exported as RacingChart
// ---------------------------------------------------------------------------
export const RacingChart: React.FC<RacingChartProps> = ({
  data,
  frames,
  title,
  background = "#0b1f3a",
  titleColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        padding: 80,
        display: "flex",
        flexDirection: "column",
        gap: 48,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 64,
          fontWeight: 800,
          color: titleColor,
          letterSpacing: 2,
          opacity: titleOpacity,
          textAlign: "left",
          ...TEXT_BREAK_STYLES,
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <RacingBars
          data={data}
          delay={18}
          frameDuration={frames}
          fontFamily={FONT_STACK}
          style={{ width: "100%" }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default RacingChart;
