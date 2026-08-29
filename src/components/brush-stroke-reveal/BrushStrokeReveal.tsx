// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Brush-stroke reveal: paints the title onto the canvas in horizontal
// brush-stroke bands (scaleX wipe per band), then fades in an accent dot and
// the description line. Ported self-contained from rv-template (shared atom +
// tokens inlined; no external/relative imports).
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

const FONT_STACK = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Default easing token from the source library: easing.out = Easing.out(Easing.ease)
const EASE_OUT = Easing.out(Easing.ease);

export type BrushStrokeRevealProps = {
  /** Large catch phrase */
  title: string;
  /** Supporting line below the title */
  description?: string;
  /** Number of horizontal brush bands */
  strokes?: number;
  /** Stroke wipe direction */
  direction?: "left" | "right";
  /** Text color */
  textColor?: string;
  /** Background color */
  background?: string;
  /** Accent color (the dot) */
  accentColor?: string;
};

export const defaultBrushStrokeRevealProps: BrushStrokeRevealProps = {
  title: "Brush Stroke",
  description: "painted on, stroke by stroke",
  strokes: 3,
  direction: "left",
  textColor: "#1a1a1a",
  background: "#fffdf6",
  accentColor: "#a93226",
};

/**
 * Inlined brush-stroke reveal atom.
 * Splits children into `strokes` horizontal bands; each band is clipped to its
 * slice and revealed with a slightly staggered scaleX wipe, so the content
 * appears to be painted on by successive brush passes.
 */
const BrushReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  strokes?: number;
  direction?: "left" | "right";
  style?: React.CSSProperties;
}> = ({
  children,
  delay = 0,
  duration = 12,
  strokes = 1,
  direction = "left",
  style,
}) => {
  const frame = useCurrentFrame();

  const strokeHeight = 100 / strokes;

  return (
    <div style={{ position: "relative", ...style }}>
      {Array.from({ length: strokes }, (_, i) => {
        const strokeDelay = delay + i * 3;
        const progress = interpolate(
          frame,
          [strokeDelay, strokeDelay + duration],
          [0, 1],
          {
            easing: EASE_OUT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );

        const scaleX = progress;
        const originX = direction === "left" ? "left" : "right";

        const top = i * strokeHeight;
        const bottom = 100 - (i + 1) * strokeHeight;

        return (
          <div
            key={i}
            style={{
              position: i === 0 ? "relative" : "absolute",
              inset: i === 0 ? undefined : 0,
              clipPath: `inset(${top}% 0 ${bottom}% 0)`,
            }}
          >
            <div
              style={{
                transform: `scaleX(${scaleX})`,
                transformOrigin: `${originX} center`,
              }}
            >
              {children}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const BrushStrokeReveal: React.FC<BrushStrokeRevealProps> = ({
  title,
  description,
  strokes = 3,
  direction = "left",
  textColor = "#1a1a1a",
  background = "#fffdf6",
  accentColor = "#a93226",
}) => {
  const frame = useCurrentFrame();

  const descOpacity = interpolate(frame, [44, 64], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dotOpacity = interpolate(frame, [54, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        padding: 64,
      }}
    >
      <BrushReveal delay={2} duration={28} strokes={strokes} direction={direction}>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 160,
            fontWeight: 900,
            color: textColor,
            letterSpacing: 12,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </BrushReveal>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: accentColor,
          opacity: dotOpacity,
        }}
      />
      {description ? (
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 32,
            color: textColor,
            opacity: descOpacity * 0.7,
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          {description}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default BrushStrokeReveal;
