// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// A character jumps with squash-and-stretch physics
// Stretches at the apex, squashes on landing. The shadow moves along the ground.
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

export type CharacterJumpingProps = {
  backgroundColor: string;
  characterColor: string;
  shadowColor: string;
  accentColor: string;
  groundColor: string;
  label: string;
  textColor: string;
  jumpCount: number;
};

export const defaultCharacterJumpingProps: CharacterJumpingProps = {
  backgroundColor: "#e0f2fe",
  characterColor: "#0ea5e9",
  shadowColor: "#0369a1",
  accentColor: "#fbbf24",
  groundColor: "#bae6fd",
  label: "Let's Go!",
  textColor: "#0c4a6e",
  jumpCount: 3,
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Eased bounce curve: t=0 ground → t=0.5 peak → t=1 ground
function jumpHeight(t: number): number {
  // Parabolic: -4t^2+4t (returns 0→1→0)
  return Math.max(0, -4 * t * t + 4 * t);
}

export const CharacterJumping: React.FC<CharacterJumpingProps> = ({
  backgroundColor,
  characterColor,
  shadowColor,
  accentColor,
  groundColor,
  label,
  textColor,
  jumpCount,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scale = Math.min(width, height);
  const cx = width / 2;

  // Ground line position
  const groundY = height * 0.62;

  // Character base dimensions
  const headR = scale * 0.075;
  const bodyW = scale * 0.1;
  const bodyH = scale * 0.14;
  const legW = scale * 0.035;
  const legH = scale * 0.07;

  // Jump period: first jump starts at frame 8
  const jumpPeriod = Math.round((DURATION_FRAMES - 8) / jumpCount);

  // Current jump state
  const frameInCycle = (frame - 8) % jumpPeriod;
  const cycleNumber = Math.floor((frame - 8) / jumpPeriod);
  const t = Math.max(0, Math.min(1, frameInCycle / (jumpPeriod * 0.85)));
  const rawJump = frame >= 8 ? jumpHeight(t) : 0;

  // Jump height in pixels
  const maxJumpH = scale * 0.28;
  const jumpOffset = rawJump * maxJumpH;

  // Squash & stretch
  // At peak (rawJump≈1): stretch vertically (scaleY > 1, scaleX < 1)
  // At landing (rawJump≈0, coming down): squash (scaleY < 1, scaleX > 1)
  const isAscending = frameInCycle < jumpPeriod * 0.42;
  const stretchY = 1 + rawJump * 0.32;
  const stretchX = 1 - rawJump * 0.18;
  // Squash on landing impact
  const landProgress = isAscending
    ? 0
    : interpolate(rawJump, [0, 0.12], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const squashY = 1 - landProgress * 0.28;
  const squashX = 1 + landProgress * 0.22;

  const finalScaleX = stretchX * squashX;
  const finalScaleY = stretchY * squashY;

  // Character feet Y: always on ground when not jumping
  const feetY = groundY;
  const bodyBottom = feetY - jumpOffset;

  // Leg bend: legs stretch down when in air
  const legBend = rawJump * 0.5;

  // Shadow: smaller + more transparent when character is high
  const shadowWidth = (bodyW * 1.4 + legW * 2.4) * (1 - rawJump * 0.55);
  const shadowOpacity = 0.35 * (1 - rawJump * 0.65);

  // Sparkles at peak
  const sparkleActive = rawJump > 0.88;
  const sparkleT = frame * 0.2;

  // Entry animation (slide in from bottom)
  const entryProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 1 },
    durationInFrames: 14,
  });
  const entryY = interpolate(entryProgress, [0, 1], [scale * 0.2, 0]);

  // Label fade
  const labelProgress = spring({
    frame: frame - 4,
    fps,
    config: { damping: 14, stiffness: 70 },
    durationInFrames: 18,
  });

  // Character center X and Y (based on body bottom)
  const charCenterX = cx;
  const bodyTopY = bodyBottom - bodyH;
  const headCenterY = bodyTopY - headR * 0.9;
  const legBaseY = bodyBottom;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: height * 0.08,
      }}
    >
      {/* Ground strip */}
      <div
        style={{
          position: "absolute",
          bottom: height - groundY,
          left: 0,
          right: 0,
          top: groundY,
          backgroundColor: groundColor,
          borderRadius: "50% 50% 0 0 / 10% 10% 0 0",
        }}
      />

      {/* Sparkles at peak */}
      {sparkleActive && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2 + sparkleT;
            const dist = scale * 0.14;
            const sx = charCenterX + Math.cos(angle) * dist - jumpOffset * 0.05;
            const sy = headCenterY - jumpOffset + Math.sin(angle) * dist * 0.6;
            const sz = scale * 0.015;
            return (
              <circle
                key={i}
                cx={sx}
                cy={sy}
                r={sz}
                fill={accentColor}
                opacity={0.8 + Math.sin(sparkleT + i) * 0.2}
              />
            );
          })}
        </svg>
      )}

      {/* Character SVG */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translateY(${entryY}px)`,
          opacity: entryProgress,
        }}
      >
        {/* Shadow */}
        <ellipse
          cx={charCenterX}
          cy={groundY + 8}
          rx={shadowWidth / 2}
          ry={scale * 0.018}
          fill={shadowColor}
          opacity={shadowOpacity}
        />

        {/* Legs */}
        {/* Left leg */}
        <rect
          x={charCenterX - bodyW * 0.3 - legW}
          y={legBaseY - jumpOffset - legH * (1 + legBend)}
          width={legW}
          height={legH * (1 + legBend)}
          rx={legW / 2}
          fill={characterColor}
          style={{ transform: `scaleY(${finalScaleY}) scaleX(${finalScaleX})`, transformOrigin: `${charCenterX - bodyW * 0.3 - legW / 2}px ${legBaseY - jumpOffset}px` }}
        />
        {/* Right leg */}
        <rect
          x={charCenterX + bodyW * 0.3}
          y={legBaseY - jumpOffset - legH * (1 + legBend)}
          width={legW}
          height={legH * (1 + legBend)}
          rx={legW / 2}
          fill={characterColor}
          style={{ transform: `scaleY(${finalScaleY}) scaleX(${finalScaleX})`, transformOrigin: `${charCenterX + bodyW * 0.3 + legW / 2}px ${legBaseY - jumpOffset}px` }}
        />

        {/* Body (squash/stretch applied) */}
        <g
          transform={`
            translate(${charCenterX} ${bodyBottom - jumpOffset})
            scale(${finalScaleX} ${finalScaleY})
            translate(${-charCenterX} ${-(bodyBottom - jumpOffset)})
          `}
        >
          {/* Body rect */}
          <rect
            x={charCenterX - bodyW / 2}
            y={bodyTopY - jumpOffset}
            width={bodyW}
            height={bodyH}
            rx={bodyW * 0.28}
            fill={characterColor}
          />
          {/* Head */}
          <circle
            cx={charCenterX}
            cy={headCenterY - jumpOffset}
            r={headR}
            fill={characterColor}
          />
          {/* Eyes */}
          <circle cx={charCenterX - headR * 0.28} cy={headCenterY - jumpOffset - headR * 0.08} r={headR * 0.14} fill="#fff" />
          <circle cx={charCenterX + headR * 0.28} cy={headCenterY - jumpOffset - headR * 0.08} r={headR * 0.14} fill="#fff" />
          {/* Pupils */}
          <circle cx={charCenterX - headR * 0.28} cy={headCenterY - jumpOffset - headR * 0.04} r={headR * 0.07} fill={shadowColor} />
          <circle cx={charCenterX + headR * 0.28} cy={headCenterY - jumpOffset - headR * 0.04} r={headR * 0.07} fill={shadowColor} />
          {/* Smile (flattens during squash) */}
          <path
            d={`M ${charCenterX - headR * 0.3} ${headCenterY - jumpOffset + headR * 0.22} Q ${charCenterX} ${headCenterY - jumpOffset + headR * (0.42 + rawJump * 0.18)} ${charCenterX + headR * 0.3} ${headCenterY - jumpOffset + headR * 0.22}`}
            stroke="#fff"
            strokeWidth={headR * 0.12}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>

      {/* Label */}
      {label && (
        <div
          style={{
            position: "absolute",
            bottom: height * 0.05,
            opacity: labelProgress,
            transform: `translateY(${interpolate(labelProgress, [0, 1], [16, 0])}px)`,
            fontFamily: FONT,
            fontSize: scale * 0.065,
            fontWeight: 800,
            color: textColor,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
};

export default CharacterJumping;
