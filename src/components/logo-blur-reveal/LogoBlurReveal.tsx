// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Animation essence: a wordmark resolves from a heavy out-of-focus blur to a
// crisp, sharp logo — paired with a subtle 1.08 -> 1.0 "lens focusing" scale
// and a fade-out at the very end.
// Fully self-contained: original `../types` definition is inlined below; no
// external/shared imports beyond react + remotion.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

const FONT_FAMILY = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type LogoBlurRevealProps = {
  /** Logo wordmark text to display */
  logoText: string;
  /** Starting blur amount (px) that resolves toward 0 */
  blurAmount: number;
  /** Reveal duration in seconds */
  revealDuration: number;
  /** Logo color */
  logoColor: string;
  /** Background color */
  backgroundColor: string;
  /** Font size (px) */
  fontSize: number;
  /** Overall duration in seconds */
  duration: number;
};

export const defaultLogoBlurRevealProps: LogoBlurRevealProps = {
  logoText: "HELLO",
  blurAmount: 40,
  revealDuration: 1.6,
  logoColor: "#0F172A",
  backgroundColor: "#F8FAFC",
  fontSize: 260,
  duration: 4,
};

export const LogoBlurReveal: React.FC<LogoBlurRevealProps> = ({
  logoText,
  blurAmount,
  revealDuration,
  logoColor,
  backgroundColor,
  fontSize,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const revealFrames = Math.max(1, Math.floor(revealDuration * fps));

  const progress = interpolate(frame, [0, revealFrames], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Blur amount: blurAmount -> 0
  const blur = (1 - progress) * blurAmount;

  // Opacity: 0 -> 1
  const opacity = progress;

  // Subtle lens-focusing scale: 1.08 -> 1.0
  const scale = interpolate(progress, [0, 1], [1.08, 1.0]);

  // Fade-out over the final 0.4 seconds
  const fadeOutStart = totalFrames - Math.floor(fps * 0.4);
  const fadeOut = interpolate(frame, [fadeOutStart, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          opacity,
          filter: `blur(${blur}px)`,
          transform: `scale(${scale})`,
          fontFamily: FONT_FAMILY,
          fontSize,
          fontWeight: 900,
          color: logoColor,
          letterSpacing: "0.06em",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {logoText}
      </div>
    </AbsoluteFill>
  );
};

export default LogoBlurReveal;
