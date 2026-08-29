// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// KPI numbers land on a business card with rolling digit drums.
// Cards slide in on a stagger, then each figure counts up on an odometer: the ones wheel spins
// continuously and every wheel above it turns only as the one below rolls 9 -> 0, so the digits
// rotate and lock in place one column at a time.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

export type KpiMetric = {
  label: string;
  value: number;
  prefix: string;
  suffix: string;
  decimals: number;
  color: string;
  icon: string; // single emoji or text character
};

export type KpiCounterProps = {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  metrics: KpiMetric[];
};

export const defaultKpiCounterProps: KpiCounterProps = {
  backgroundColor: "#0f172a",
  cardColor: "#1e293b",
  textColor: "#f8fafc",
  subtextColor: "#94a3b8",
  accentColor: "#6366f1",
  title: "Q4 Results",
  subtitle: "2024 Performance",
  metrics: [
    { label: "Revenue", value: 2840000, prefix: "$", suffix: "", decimals: 0, color: "#22c55e", icon: "+" },
    { label: "Growth", value: 127, prefix: "+", suffix: "%", decimals: 0, color: "#6366f1", icon: "^" },
    { label: "Clients", value: 384, prefix: "", suffix: "", decimals: 0, color: "#f59e0b", icon: "#" },
    { label: "NPS Score", value: 72, prefix: "", suffix: "", decimals: 0, color: "#ec4899", icon: "★" },
  ],
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// ============================================
// Rolling digits (odometer)
// ============================================
// The number is not re-formatted per frame. The unit (M / K / none) and the decimal count are
// resolved once from the metric's final value, so the readout never changes width or shape
// mid-count; only the digit drums move. Formatting per frame used to make the card jump from
// "333.8K" to "1.1M" to "2.8M" on the way up.

type NumberFormat = {
  /** Divisor applied to the raw value */
  div: number;
  /** Unit shown after the digits */
  unit: string;
  /** Decimal places kept after dividing */
  dec: number;
};

function formatFor(finalValue: number, decimals: number): NumberFormat {
  if (finalValue >= 1_000_000) {
    return { div: 1_000_000, unit: "M", dec: decimals > 0 ? decimals : 1 };
  }
  if (finalValue >= 1_000) {
    return { div: 1_000, unit: "K", dec: decimals > 0 ? decimals : 1 };
  }
  return { div: 1, unit: "", dec: decimals };
}

/** Drum window height and column advance, as multiples of the font size. */
const DIGIT_CELL_RATIO = 1.2;
const DIGIT_WIDTH_RATIO = 0.62;
const DRUM_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)";

/**
 * One digit column. `pos` is a continuous wheel position in [0,10): the strip holds 0-9 plus a
 * repeated 0 so the wrap from 9 back to 0 is seamless.
 */
const DigitDrum: React.FC<{
  pos: number;
  fontSize: number;
  color: string;
}> = ({ pos, fontSize, color }) => {
  const cell = fontSize * DIGIT_CELL_RATIO;
  const wheel = ((pos % 10) + 10) % 10;

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        overflow: "hidden",
        width: fontSize * DIGIT_WIDTH_RATIO,
        height: cell,
        maskImage: DRUM_MASK,
        WebkitMaskImage: DRUM_MASK,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          transform: `translateY(${-wheel * cell}px)`,
        }}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <span
            key={i}
            style={{
              display: "block",
              height: cell,
              lineHeight: `${cell}px`,
              textAlign: "center",
              color,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
};

/**
 * Mechanical-odometer wheel position for the digit at decimal place `p`.
 * The ones wheel turns continuously with the value; every wheel above it only turns during the
 * last tenth of the wheel below (9 -> 0), so each digit rotates and then locks. At progress 1
 * every fraction is zero, which means all wheels rest exactly on their final digit.
 */
function wheelPos(value: number, p: number): number {
  const q = Math.max(0, value) / 10 ** p;
  const whole = Math.floor(q);
  const frac = q - whole;
  const carry = p === 0 ? frac : Math.min(1, Math.max(0, frac * 10 - 9));
  return (whole % 10) + carry;
}

const RollingNumber: React.FC<{
  /** 0..1 count-up progress */
  progress: number;
  /** Final value expressed in the smallest displayed unit (i.e. scaled by 10^dec) */
  targetUnits: number;
  dec: number;
  unit: string;
  fontSize: number;
  color: string;
}> = ({ progress, targetUnits, dec, unit, fontSize, color }) => {
  const value = targetUnits * progress;
  const template = (targetUnits / 10 ** dec).toFixed(dec);
  const digitCount = template.replace(/[^0-9]/g, "").length;

  let digitIndex = 0;
  const cell = fontSize * DIGIT_CELL_RATIO;

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {template.split("").map((char, i) => {
        if (char < "0" || char > "9") {
          // Separator (decimal point) — static, and narrow so the group stays tight.
          return (
            <span
              key={`sep-${i}`}
              style={{
                display: "inline-block",
                height: cell,
                lineHeight: `${cell}px`,
                width: fontSize * 0.26,
                textAlign: "center",
                color,
              }}
            >
              {char}
            </span>
          );
        }
        const place = digitCount - 1 - digitIndex;
        digitIndex += 1;
        return (
          <DigitDrum
            key={`d-${i}`}
            pos={wheelPos(value, place)}
            fontSize={fontSize}
            color={color}
          />
        );
      })}
      {unit ? (
        <span
          style={{
            display: "inline-block",
            height: cell,
            lineHeight: `${cell}px`,
            color,
          }}
        >
          {unit}
        </span>
      ) : null}
    </span>
  );
};

const MetricCard: React.FC<{
  metric: KpiMetric;
  delay: number;
  width: number;
  height: number;
  cardColor: string;
  textColor: string;
  subtextColor: string;
}> = ({ metric, delay, width, height, cardColor, textColor, subtextColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = Math.min(width, height);

  // Card slide in
  const cardIn = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.9 },
    durationInFrames: 22,
  });
  const slideX = interpolate(cardIn, [0, 1], [-40, 0]);
  const cardOpacity = Math.min(cardIn * 1.5, 1);

  // Number count up (starts 6 frames after card appears)
  const countStart = delay + 6;
  const countEnd = delay + 55;
  const countProgress = interpolate(frame, [countStart, countEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Unit and decimal count are fixed by the final value, so the drums have a stable column
  // template from frame one.
  const fmt = formatFor(metric.value, metric.decimals);
  const targetUnits = Math.round((metric.value / fmt.div) * 10 ** fmt.dec);

  // Accent bar width
  const barProgress = interpolate(frame, [countStart, countEnd + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const cardPad = scale * 0.025;
  const cardH = scale * 0.14;

  return (
    <div
      style={{
        backgroundColor: cardColor,
        borderRadius: scale * 0.022,
        padding: cardPad,
        opacity: cardOpacity,
        transform: `translateX(${slideX}px)`,
        position: "relative",
        overflow: "hidden",
        border: `1px solid rgba(255,255,255,0.06)`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Accent bar on left */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: cardH * 0.15,
          bottom: cardH * 0.15,
          width: scale * 0.007,
          backgroundColor: metric.color,
          borderRadius: scale * 0.004,
          transform: `scaleY(${barProgress})`,
          transformOrigin: "bottom center",
        }}
      />

      {/* Content */}
      <div
        style={{
          paddingLeft: scale * 0.022,
          display: "flex",
          flexDirection: "column",
          gap: scale * 0.008,
        }}
      >
        {/* Label row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: scale * 0.01,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: scale * 0.025,
              color: metric.color,
              fontWeight: 700,
            }}
          >
            {metric.icon}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: scale * 0.027,
              fontWeight: 500,
              color: subtextColor,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {metric.label}
          </span>
        </div>

        {/* Value */}
        <div
          style={{
            fontFamily: FONT,
            fontSize: scale * 0.072,
            fontWeight: 800,
            color: textColor,
            letterSpacing: -1.5,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: scale * 0.006,
          }}
        >
          {metric.prefix && (
            <span style={{ fontSize: scale * 0.042, fontWeight: 600, color: metric.color }}>
              {metric.prefix}
            </span>
          )}
          <RollingNumber
            progress={countProgress}
            targetUnits={targetUnits}
            dec={fmt.dec}
            unit={fmt.unit}
            fontSize={scale * 0.072}
            color={textColor}
          />
          {metric.suffix && (
            <span style={{ fontSize: scale * 0.042, fontWeight: 600, color: metric.color }}>
              {metric.suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const KpiCounter: React.FC<KpiCounterProps> = ({
  backgroundColor,
  cardColor,
  textColor,
  subtextColor,
  accentColor,
  title,
  subtitle,
  metrics,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scale = Math.min(width, height);
  const isWide = width > height;

  // Title entry
  const titleIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 18,
  });
  const titleY = interpolate(titleIn, [0, 1], [-20, 0]);

  // Separator line draw
  const lineProgress = interpolate(frame, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const cols = isWide ? 4 : 2;
  const cardDelay = 14;
  const cardStagger = 8;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: scale * 0.06,
        gap: scale * 0.04,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: scale * 0.07,
            fontWeight: 800,
            color: textColor,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: scale * 0.033,
              fontWeight: 400,
              color: subtextColor,
              marginTop: scale * 0.008,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Separator */}
      <div
        style={{
          width: scale * 0.35 * lineProgress,
          height: 2,
          backgroundColor: accentColor,
          borderRadius: 2,
          opacity: 0.6,
        }}
      />

      {/* Metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: scale * 0.022,
          width: "100%",
        }}
      >
        {metrics.map((metric, i) => (
          <MetricCard
            key={i}
            metric={metric}
            delay={cardDelay + i * cardStagger}
            width={width}
            height={height}
            cardColor={cardColor}
            textColor={textColor}
            subtextColor={subtextColor}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default KpiCounter;
