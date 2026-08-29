// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// =====================================================
// logo-split-reveal — self-contained RenderComp template
// Logo's left half / right half converge from the outside
// toward the center.
//
// Original effect (rv-template-logo-split-reveal):
// - Same text drawn as two layers, each clipped (left / right half)
//   via clip-path inset.
// - Each half starts at an outer offset position and converges to
//   translateX(0) using Easing.out(cubic).
// - Opacity fades in over the first 40% of the reveal; the assembled wordmark
//   then settles and is held to the final frame (no fade-out: the last frame is
//   the catalog thumbnail and must show the logo).
// - The requested font size is clamped so the wordmark always stays inside the
//   title-safe area, whatever text is passed in.
// - useCurrentFrame + interpolate only (no CSS transition / keyframes).
// =====================================================

export const FPS = 30;
export const DURATION_FRAMES = 120;

// Western font stack (display text is English only).
const FONT_STACK = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type LogoSplitRevealProps = {
  /** Logo text to display. */
  logoText: string;
  /** Start offset in px for each half (each half starts this far outside). */
  splitOffset: number;
  /** Reveal (entrance) duration in seconds. */
  revealDuration: number;
  /** Logo color. */
  logoColor: string;
  /** Background color. */
  backgroundColor: string;
  /** Font size in px. */
  fontSize: number;
  /** Total length in seconds. */
  duration: number;
};

export const defaultLogoSplitRevealProps: LogoSplitRevealProps = {
  logoText: "RENDERCOMP",
  splitOffset: 960,
  revealDuration: 1.4,
  logoColor: "#0F172A",
  backgroundColor: "#F8FAFC",
  fontSize: 260,
  duration: 4,
};

export const LogoSplitReveal: React.FC<LogoSplitRevealProps> = ({
  logoText,
  splitOffset,
  revealDuration,
  logoColor,
  backgroundColor,
  fontSize,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const revealFrames = Math.max(1, Math.floor(revealDuration * fps));

  // Keep the wordmark inside the title-safe area (>= 5% margin each side is the
  // hard limit; this targets ~7%). Uppercase display glyphs at weight 900 with
  // 0.06em tracking advance ~0.74em per character.
  const safeWidth = width * 0.86;
  const estimatedWidth = Math.max(1, logoText.length * fontSize * 0.74);
  const safeFontSize =
    fontSize * Math.min(1, safeWidth / estimatedWidth);

  const progress = interpolate(frame, [0, revealFrames], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Left half: -splitOffset -> 0
  const leftX = interpolate(progress, [0, 1], [-splitOffset, 0]);
  // Right half: +splitOffset -> 0
  const rightX = interpolate(progress, [0, 1], [splitOffset, 0]);

  // Fade in over the first 40% of the reveal. Starts partly visible so the
  // first frame is not a blank plate.
  const opacity = interpolate(progress, [0, 0.4], [0.22, 1], {
    extrapolateRight: "clamp",
  });

  // The assembled wordmark settles instead of fading out: tracking eases to its
  // final value over the second half of the clip and the logo is still on screen
  // at the last frame.
  const settleStart = revealFrames;
  const settleEnd = Math.max(settleStart + 1, totalFrames - Math.floor(fps * 0.3));
  const tracking = interpolate(frame, [settleStart, settleEnd], [0.085, 0.06], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Accent flash on the seam at the moment the two halves meet.
  const seamOpacity = interpolate(
    progress,
    [0.72, 0.94, 1],
    [0, 0.85, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const seamHeight = interpolate(progress, [0.72, 1], [1.35, 0.75], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textStyle: React.CSSProperties = {
    fontFamily: FONT_STACK,
    fontSize: safeFontSize,
    fontWeight: 900,
    color: logoColor,
    letterSpacing: `${tracking.toFixed(4)}em`,
    lineHeight: 1,
    userSelect: "none",
    position: "absolute",
    top: "50%",
    left: "50%",
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      {/* Left half */}
      <div
        style={{
          ...textStyle,
          transform: `translate(calc(-50% + ${leftX}px), -50%)`,
          opacity,
          clipPath: "inset(0 50% 0 0)",
          WebkitClipPath: "inset(0 50% 0 0)",
        }}
      >
        {logoText}
      </div>
      {/* Right half */}
      <div
        style={{
          ...textStyle,
          transform: `translate(calc(-50% + ${rightX}px), -50%)`,
          opacity,
          clipPath: "inset(0 0 0 50%)",
          WebkitClipPath: "inset(0 0 0 50%)",
        }}
      >
        {logoText}
      </div>
      {/* Seam flash where the two halves meet. */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: Math.max(2, safeFontSize * 0.012),
          height: safeFontSize * seamHeight,
          transform: "translate(-50%, -50%)",
          backgroundColor: logoColor,
          opacity: seamOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

export default LogoSplitReveal;
