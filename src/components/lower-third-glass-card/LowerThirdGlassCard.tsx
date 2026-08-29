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
export const DURATION_FRAMES = 120;

export type LowerThirdGlassCardProps = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  nameText: string;
  titleText: string;
};

export const defaultLowerThirdGlassCardProps: LowerThirdGlassCardProps = {
  backgroundColor: "#0c1a2e",
  accentColor: "#06b6d4",
  textColor: "#f0f9ff",
  nameText: "Alex Morgan",
  titleText: "Head of Product, Acme Inc.",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const LowerThirdGlassCard: React.FC<LowerThirdGlassCardProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  nameText,
  titleText,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Card slides up from below the safe area
  const cardIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90 },
    durationInFrames: 28,
  });
  const nameIn = spring({
    frame: frame - 12,
    fps,
    config: { damping: 16, stiffness: 110 },
    durationInFrames: 20,
  });
  const titleIn = interpolate(frame, [24, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Hold visible; gently fade at the very end and keep terminal opacity at 0 exactly on the last frame range.
  const exitOpacity = interpolate(frame, [104, 119], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Inner glow pulse driven by sin so it never lands on a dead frame
  const glowPulse = 0.5 + 0.5 * Math.sin(frame * 0.08);

  // Card geometry (responsive)
  const cardW = width * 0.42;
  const cardH = height * 0.2;
  const cardX = width * 0.06;
  const restY = height * 0.74;
  const cardY = restY + (1 - cardIn) * height * 0.18;
  const radius = height * 0.022;

  const padX = cardW * 0.07;

  // Decode accent into rgba for translucent fills without needing a parser:
  // use the accent string directly with reduced opacity via overlay layers.
  const accentSoft = accentColor;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {/* Ambient backdrop wash so the glass reads against the bg */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(120% 90% at 22% 88%, ${accentColor}22 0%, transparent 55%)`,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: cardW,
          height: cardH,
          opacity: cardIn * exitOpacity,
        }}
      >
        {/* Glass card body */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            borderRadius: radius,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1px solid rgba(255,255,255,0.22)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: `0 ${height * 0.018}px ${height * 0.05}px rgba(0,0,0,0.45)`,
            overflow: "hidden",
          }}
        >
          {/* Inner accent glow */}
          <div
            style={{
              position: "absolute",
              left: "-10%",
              top: "-40%",
              width: "60%",
              height: "180%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accentSoft}55 0%, transparent 70%)`,
              opacity: 0.45 + glowPulse * 0.45,
              filter: "blur(8px)",
            }}
          />
          {/* Top sheen highlight */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "42%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
            }}
          />
          {/* Left accent bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "18%",
              width: cardW * 0.012,
              height: "64%",
              borderRadius: 99,
              backgroundColor: accentColor,
              boxShadow: `0 0 ${height * 0.02}px ${accentColor}`,
            }}
          />
        </div>

        {/* Name */}
        <div
          style={{
            position: "absolute",
            left: padX,
            top: cardH * 0.24,
            fontFamily: FONT,
            fontSize: height * 0.058,
            fontWeight: 800,
            color: textColor,
            opacity: nameIn,
            transform: `translateY(${(1 - nameIn) * 12}px)`,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          {nameText}
        </div>

        {/* Title */}
        <div
          style={{
            position: "absolute",
            left: padX,
            top: cardH * 0.6,
            fontFamily: FONT,
            fontSize: height * 0.026,
            fontWeight: 500,
            color: textColor,
            opacity: titleIn * 0.85,
            transform: `translateY(${(1 - titleIn) * 6}px)`,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {titleText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default LowerThirdGlassCard;
