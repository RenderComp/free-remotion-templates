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
export const DURATION_FRAMES = 100;

export type LogoMaskWipeProps = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  monogram: string;
  brandText: string;
};

export const defaultLogoMaskWipeProps: LogoMaskWipeProps = {
  backgroundColor: "#0a0800",
  accentColor: "#eab308",
  textColor: "#fefce8",
  monogram: "A",
  brandText: "ACME INC.",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const LogoMaskWipe: React.FC<LogoMaskWipeProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  monogram,
  brandText,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const cx = width / 2;
  const cy = height * 0.43;
  const R = height * 0.2; // monogram badge radius

  // --- Phase timing ---
  // 0-46: diagonal mask wipe reveals the lockup.
  // 30-60: slight scale settle after reveal.
  // 40-58: brand wordmark fades up.
  const wipe = interpolate(frame, [0, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textIn = interpolate(frame, [40, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gentle scale settle once the reveal lands (slight overshoot down to rest)
  const settle = spring({
    frame: frame - 30,
    fps,
    config: { damping: 16, stiffness: 95, mass: 0.9 },
    durationInFrames: 30,
  });
  const lockupScale = interpolate(settle, [0, 1], [1.06, 1]);

  // Hold near full opacity at the end — soft tail, no blank frames.
  const exitOpacity = interpolate(frame, [DURATION_FRAMES - 10, DURATION_FRAMES], [1, 0.94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Diagonal mask geometry ---
  // The clip is a rectangle rotated -28deg whose edge sweeps from top-left
  // to bottom-right across the lockup, revealing it along a diagonal line.
  const diag = Math.hypot(width, height);
  // Travel distance of the wipe edge (a bit past the diagonal for full reveal).
  const edge = interpolate(wipe, [0, 1], [-diag * 0.62, diag * 0.62]);
  const maskAngle = -28; // degrees

  // Leading accent line that rides the wipe edge (a sweeping highlight bar).
  const lineVisible = wipe > 0.02 && wipe < 0.985;
  const lineLen = R * 3.2;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {/* Faint backdrop glow behind the badge, follows the reveal */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${cx}px ${cy}px, ${accentColor}22 0%, transparent ${R * 2.4}px)`,
          opacity: wipe,
        }}
      />

      <AbsoluteFill style={{ opacity: exitOpacity }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            {/* Diagonal reveal mask: a big rectangle rotated and translated so
                its trailing edge wipes the lockup open along the diagonal. */}
            <clipPath
              id="lmw-wipe"
              clipPathUnits="userSpaceOnUse"
            >
              <rect
                x={cx - diag}
                y={cy - diag}
                width={diag}
                height={diag * 2}
                transform={`rotate(${maskAngle} ${cx} ${cy}) translate(${edge} 0)`}
              />
            </clipPath>
          </defs>

          <g clipPath="url(#lmw-wipe)">
            <g
              transform={`translate(${cx} ${cy}) scale(${lockupScale}) translate(${-cx} ${-cy})`}
            >
              {/* Filled badge */}
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill={accentColor}
                opacity={0.16}
              />
              {/* Badge ring outline */}
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={accentColor}
                strokeWidth={height * 0.011}
              />
              {/* Monogram letter */}
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={FONT}
                fontWeight={800}
                fontSize={R * 1.15}
                fill={accentColor}
                letterSpacing="-0.02em"
              >
                {monogram}
              </text>
            </g>
          </g>

          {/* Sweeping accent line riding the wipe edge */}
          {lineVisible && (
            <g transform={`rotate(${maskAngle} ${cx} ${cy})`}>
              <rect
                x={cx + edge - height * 0.004}
                y={cy - lineLen / 2}
                width={height * 0.008}
                height={lineLen}
                fill={textColor}
                opacity={0.85}
              />
            </g>
          )}
        </svg>

        {/* Brand wordmark */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: cy + R + height * 0.07,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: height * 0.05,
            fontWeight: 700,
            color: textColor,
            opacity: textIn,
            transform: `translateY(${(1 - textIn) * height * 0.025}px)`,
            letterSpacing: "0.22em",
          }}
        >
          {brandText}
        </div>

        {/* Underline accent under wordmark */}
        <div
          style={{
            position: "absolute",
            left: cx - (width * 0.12) / 2,
            top: cy + R + height * 0.155,
            width: width * 0.12 * textIn,
            height: height * 0.004,
            backgroundColor: accentColor,
            opacity: textIn,
            borderRadius: height * 0.004,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default LogoMaskWipe;
