// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 90;

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type LogoBounceDropProps = {
  /** Logo text shown when svgPath is empty */
  logoText: string;
  /** SVG path data ("||"-separated for multiple). Empty = text mode */
  svgPath: string;
  /** viewBox used in SVG mode */
  viewBox: string;
  /** Drop height as a fraction of screen height (1.0 = one screen above) */
  dropHeight: number;
  /** Bounce strength (smaller bounces more). 1-10 range */
  bounceStrength: number;
  /** Logo color */
  logoColor: string;
  /** Background color */
  backgroundColor: string;
  /** Font size in px (text mode) */
  fontSize: number;
  /** Total length in seconds */
  duration: number;
};

export const defaultLogoBounceDropProps: LogoBounceDropProps = {
  logoText: "RENDERCOMP",
  svgPath: "",
  viewBox: "0 0 300 300",
  dropHeight: 0.6,
  bounceStrength: 4,
  logoColor: "#0F172A",
  backgroundColor: "#F8FAFC",
  fontSize: 240,
  duration: 3,
};

/**
 * Logo drops in from above and bounces on landing.
 *
 * - Remotion spring() gives a physics-like bounce (damping controls rebound)
 * - svgPath present => SVG mode, otherwise text mode
 * - Pure useCurrentFrame() + spring + interpolate (no CSS transition / keyframes)
 * - System fonts only (no external CDN reference)
 */
export const LogoBounceDrop: React.FC<LogoBounceDropProps> = ({
  logoText,
  svgPath,
  viewBox,
  dropHeight,
  bounceStrength,
  logoColor,
  backgroundColor,
  fontSize,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const totalFrames = Math.max(1, Math.floor(duration * fps));

  // Map bounceStrength to damping (smaller = more bounce). 1-10 => damping 6-18
  const damping = Math.max(4, Math.min(20, 4 + bounceStrength * 1.5));

  // spring: 0 -> 1. 0 = off-screen top, 1 = final position
  const progress = spring({
    frame,
    fps,
    config: {
      damping,
      mass: 1,
      stiffness: 80,
    },
  });

  const startY = -dropHeight * height; // off-screen top
  const endY = 0;
  const y = interpolate(progress, [0, 1], [startY, endY]);

  // Squash on landing: once progress passes 0.85, compress vertically a touch
  const squashPhase = interpolate(progress, [0.85, 1.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scaleY = 1 - 0.06 * Math.sin(squashPhase * Math.PI);
  const scaleX = 1 + 0.04 * Math.sin(squashPhase * Math.PI);

  // Fade out over the last 0.5 second
  const fadeOut = interpolate(
    frame,
    [totalFrames - Math.floor(fps * 0.5), totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const paths = useMemo(
    () =>
      svgPath
        .split(/\s*\|\|\s*/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
    [svgPath]
  );

  const useSvg = paths.length > 0;

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
          transform: `translateY(${y}px) scale(${scaleX}, ${scaleY})`,
          transformOrigin: "center bottom",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {useSvg ? (
          <svg
            viewBox={viewBox}
            style={{ width: "40%", height: "40%", minWidth: 400 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {paths.map((d, i) => (
              <path key={i} d={d} fill={logoColor} />
            ))}
          </svg>
        ) : (
          <div
            style={{
              fontFamily: FONT,
              fontSize,
              fontWeight: 900,
              color: logoColor,
              letterSpacing: "0.04em",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {logoText}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default LogoBounceDrop;
