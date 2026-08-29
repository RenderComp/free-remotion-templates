// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
/**
 * BounceInHeadline
 * Effect: the headline springs in with a damped abs(sin) bounce.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const FONT_SANS = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const FPS = 30;
export const DURATION_FRAMES = 120;

export type BounceInHeadlineProps = {
  headline: string;
  background: string;
  color: string;
  /** number of bounces */
  bounces: number;
  /** max bounce height (px) */
  height: number;
  /** entrance delay (frames) */
  delay: number;
  /** total effect length (frames) */
  duration: number;
};

export const defaultBounceInHeadlineProps: BounceInHeadlineProps = {
  headline: "Make It Bounce",
  background: "#111827",
  color: "#fbbf24",
  bounces: 3,
  height: 120,
  delay: 8,
  duration: 36,
};

export const BounceInHeadline: React.FC<BounceInHeadlineProps> = ({
  headline,
  background,
  color,
  bounces,
  height,
  delay,
  duration,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(progress, [0, 0.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // damped abs(sin) for multiple bounces
  const bounceY =
    progress >= 1
      ? 0
      : Math.abs(Math.sin(progress * Math.PI * bounces)) *
        height *
        (1 - progress);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_SANS,
          fontSize: 130,
          fontWeight: 900,
          color,
          letterSpacing: 6,
          opacity,
          transform: `translateY(${-bounceY}px)`,
        }}
      >
        {headline}
      </div>
    </AbsoluteFill>
  );
};

export default BounceInHeadline;
