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

export type GradientTextSweepProps = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  headline: string;
  subline: string;
};

export const defaultGradientTextSweepProps: GradientTextSweepProps = {
  backgroundColor: "#050818",
  accentColor: "#22d3ee",
  textColor: "#ecfeff",
  headline: "BUILD BOLD",
  subline: "ACME INC.",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const GradientTextSweep: React.FC<GradientTextSweepProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  headline,
  subline,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const title = String(headline || "BUILD BOLD").toUpperCase();
  const sub = String(subline || "").toUpperCase();

  // Headline sizing relative to canvas; shrink slightly for long strings.
  const baseFont = Math.round(height * 0.155);
  const lenAdj = Math.min(1, 14 / Math.max(title.length, 1));
  const fontSize = Math.round(baseFont * (0.7 + 0.3 * lenAdj));
  const subFontSize = Math.round(fontSize * 0.2);

  // Entrance: subtle scale-in + fade as the headline settles.
  const enter = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 90 },
    durationInFrames: 26,
  });
  const scale = interpolate(enter, [0, 1], [0.86, 1]);
  const enterOpacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const dy = interpolate(enter, [0, 1], [height * 0.04, 0]);

  // Animated gradient sheen sweeping L->R across the glyphs, looping.
  const sweepStart = 14;
  const sweepPeriod = 56;
  const sweepLocal = ((frame - sweepStart) % sweepPeriod + sweepPeriod) % sweepPeriod;
  const sweepActive = frame >= sweepStart;
  // Position of the bright band as a percentage across the text (-20% .. 120%).
  const bandPos = interpolate(sweepLocal, [0, sweepPeriod], [-20, 120]);

  // The text gradient: base text color with a moving accent-colored highlight.
  const sheen = sweepActive ? 1 : 0;
  const textGradient = `linear-gradient(100deg, ${textColor} 0%, ${textColor} ${Math.max(
    0,
    bandPos - 18
  )}%, ${accentColor} ${bandPos}%, ${textColor} ${Math.min(
    100,
    bandPos + 18
  )}%, ${textColor} 100%)`;

  // Underline accent that draws in after the headline lands.
  const underline = spring({
    frame: frame - 22,
    fps,
    config: { damping: 20, stiffness: 80 },
    durationInFrames: 24,
  });

  // Subline rises from below once the headline is set.
  const subEnter = spring({
    frame: frame - 30,
    fps,
    config: { damping: 20, stiffness: 90 },
    durationInFrames: 22,
  });
  const subDy = interpolate(subEnter, [0, 1], [subFontSize * 1.2, 0]);
  const subOpacity = interpolate(subEnter, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Hold opacity near the end so the final frame is never blank.
  const fadeOut = interpolate(
    frame,
    [DURATION_FRAMES - 10, DURATION_FRAMES],
    [1, 0.94],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const underlineW = Math.round(fontSize * 3.2);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: FONT,
        overflow: "hidden",
        opacity: fadeOut,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ambient radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, ${accentColor}26 0%, ${accentColor}00 58%)`,
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${dy}px) scale(${scale})`,
          opacity: enterOpacity,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 800,
            letterSpacing: Math.round(fontSize * 0.01),
            lineHeight: 1,
            textAlign: "center",
            color: textColor,
            backgroundImage: textGradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: sheen ? "transparent" : textColor,
            textShadow: `0 0 ${Math.round(fontSize * 0.18)}px ${accentColor}55`,
          }}
        >
          {title}
        </span>

        {/* Accent underline drawing L->R */}
        <div
          style={{
            marginTop: Math.round(fontSize * 0.16),
            width: Math.round(underlineW * underline),
            height: Math.max(3, Math.round(fontSize * 0.045)),
            background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
            borderRadius: 999,
            opacity: 0.9,
          }}
        />

        {sub.length > 0 ? (
          <span
            style={{
              marginTop: Math.round(fontSize * 0.22),
              fontSize: subFontSize,
              fontWeight: 600,
              letterSpacing: Math.round(subFontSize * 0.35),
              color: accentColor,
              transform: `translateY(${subDy}px)`,
              opacity: subOpacity,
            }}
          >
            {sub}
          </span>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default GradientTextSweep;
