// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// End card: big title + subtitle fade in, accent line scales, expanding rings,
// and a filled CTA pill rises in from below and holds with a slow sheen sweep.
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
export const DURATION_FRAMES = 150;

const FONT_EN = '-apple-system, "Segoe UI", Roboto, sans-serif';

// --- Inlined from shared tokens (easing.out / duration.normal) ---
const EASE_OUT = Easing.out(Easing.ease);
const DUR_NORMAL = 9; // 300ms @ 30fps — standard entrance

// --- CTA button ---
// Replaces the former CTASwipeUp molecule (a bare ▲ glyph over unstyled text). Two defects
// it carried: the glyph read as a stray triangle rather than a call to action, and the block
// set no fontFamily, so the label fell back to the renderer's default serif while the title
// above it was set in the sans stack. This is a filled pill: same font stack as the card, a
// drawn chevron instead of a glyph, and a slow sheen so it stays alive through the hold.
type CtaButtonProps = {
  text: string;
  delay: number;
  fillColor: string;
  labelColor: string;
  fontSize: number;
};

const CtaButton: React.FC<CtaButtonProps> = ({
  text,
  delay,
  fillColor,
  labelColor,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance: rise + settle
  const enterProgress = interpolate(frame, [delay, delay + DUR_NORMAL * 1.6], [0, 1], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const relFrame = Math.max(0, frame - delay);

  // Sheen sweep across the pill (2.4s period), the "still alive" cue that used to be the
  // bouncing triangle.
  const sheenT = (relFrame / (fps * 2.4)) % 1;
  const sheenX = interpolate(sheenT, [0, 1], [-140, 240]);

  // Chevron nudge: a small, slow lean to the right rather than a bounce.
  const nudge = 3 * Math.sin((relFrame / fps) * Math.PI);

  const padV = fontSize * 0.66;
  const padH = fontSize * 1.5;
  const chevron = fontSize * 0.62;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: fontSize * 0.55,
        position: "relative",
        overflow: "hidden",
        padding: `${padV}px ${padH}px`,
        borderRadius: 999,
        backgroundColor: fillColor,
        boxShadow: `0 ${fontSize * 0.5}px ${fontSize * 1.4}px rgba(0,0,0,0.35)`,
        opacity: enterProgress,
        transform: `translateY(${(1 - enterProgress) * 34}px) scale(${
          0.94 + enterProgress * 0.06
        })`,
      }}
    >
      {/* Sheen */}
      <div
        style={{
          position: "absolute",
          top: "-40%",
          bottom: "-40%",
          left: `${sheenX}%`,
          width: "38%",
          background:
            "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.42) 50%, transparent 100%)",
          transform: "skewX(-18deg)",
        }}
      />
      <span
        style={{
          fontFamily: FONT_EN,
          fontSize,
          fontWeight: 700,
          letterSpacing: 1,
          lineHeight: 1,
          color: labelColor,
          position: "relative",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      {/* Drawn chevron (no bare glyph) */}
      <svg
        width={chevron}
        height={chevron}
        viewBox="0 0 24 24"
        style={{ position: "relative", transform: `translateX(${nudge}px)` }}
      >
        <polyline
          points="8,4 17,12 8,20"
          fill="none"
          stroke={labelColor}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export type EndCardProps = {
  /** Main title */
  title: string;
  /** Subtitle */
  subtitle: string;
  /** CTA text */
  ctaText: string;
  /** Background color */
  background: string;
  /** Title color */
  titleColor: string;
  /** Accent color */
  accentColor: string;
};

export const defaultEndCardProps: EndCardProps = {
  title: "Thanks for watching",
  subtitle: "LEARN MORE AT OUR SITE",
  ctaText: "Visit our website",
  background: "#0b1f3a",
  titleColor: "#ffffff",
  accentColor: "#d4af37",
};

export const EndCard: React.FC<EndCardProps> = ({
  title,
  subtitle,
  ctaText,
  background,
  titleColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Background: slowly expanding rings
  const ringScale = interpolate(frame, [0, 90], [0.3, 1.6], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(frame, [0, 30, 90], [0, 0.25, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title entrance
  const titleScale = spring({
    frame: frame - 8,
    fps,
    config: { damping: 12, mass: 1, stiffness: 80 },
  });
  const titleOpacity = interpolate(frame, [8, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subOpacity = interpolate(frame, [24, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [24, 40], [20, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isPortrait = height > width;
  const titleFontSize = isPortrait ? width * 0.075 : height * 0.075;
  const subFontSize = isPortrait ? width * 0.03 : height * 0.03;

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      {/* Expanding outer ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: Math.min(width, height) * 0.8,
          height: Math.min(width, height) * 0.8,
          marginLeft: -(Math.min(width, height) * 0.4),
          marginTop: -(Math.min(width, height) * 0.4),
          borderRadius: "50%",
          border: `2px solid ${accentColor}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />
      {/* Expanding inner ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: Math.min(width, height) * 0.5,
          height: Math.min(width, height) * 0.5,
          marginLeft: -(Math.min(width, height) * 0.25),
          marginTop: -(Math.min(width, height) * 0.25),
          borderRadius: "50%",
          border: `1px solid ${accentColor}`,
          transform: `scale(${ringScale * 0.85})`,
          opacity: ringOpacity * 0.6,
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isPortrait ? 24 : 32,
          padding: 64,
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: 80,
            height: 4,
            backgroundColor: accentColor,
            opacity: titleOpacity,
            transform: `scaleX(${titleOpacity})`,
            transformOrigin: "center",
          }}
        />

        {/* Main title */}
        <div
          style={{
            fontFamily: FONT_EN,
            fontSize: titleFontSize,
            fontWeight: 900,
            color: titleColor,
            letterSpacing: 2,
            textAlign: "center",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            lineHeight: 1.3,
            maxWidth: width * 0.85,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: FONT_EN,
            fontSize: subFontSize,
            fontWeight: 400,
            // Derived from titleColor instead of hard-coded white so the card stays
            // consistent on light palettes too.
            color: titleColor,
            opacity: subOpacity * 0.7,
            transform: `translateY(${subY}px)`,
            textAlign: "center",
            letterSpacing: 4,
          }}
        >
          {subtitle}
        </div>

        {/* CTA */}
        <div style={{ marginTop: isPortrait ? 60 : 80 }}>
          <CtaButton
            text={ctaText}
            delay={60}
            fillColor={accentColor}
            labelColor={background}
            fontSize={isPortrait ? width * 0.038 : height * 0.034}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default EndCard;
