// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Welcome animation: a character waves hello
// Phase 1: character enters (0-18f) / Phase 2: waving (10-80f) / Phase 3: text appears (30-55f)
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 90;

export type WaveHelloProps = {
  backgroundColor: string;
  skinColor: string;
  bodyColor: string;
  accentColor: string;
  textColor: string;
  title: string;
  subtitle: string;
};

export const defaultWaveHelloProps: WaveHelloProps = {
  backgroundColor: "#e0f2fe",
  skinColor: "#fbbf24",
  bodyColor: "#3b82f6",
  accentColor: "#1d4ed8",
  textColor: "#1e3a5f",
  title: "Hello!",
  subtitle: "Welcome aboard",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const WaveHello: React.FC<WaveHelloProps> = ({
  backgroundColor,
  skinColor,
  bodyColor,
  accentColor,
  textColor,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scale = Math.min(width, height);
  const cx = width * 0.38;

  // Character slide up from below
  const charIn = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
    durationInFrames: 20,
  });

  const charOffsetY = interpolate(charIn, [0, 1], [height * 0.18, 0]);

  // Gentle idle bounce after entry
  const bounce = charIn >= 0.99 ? Math.sin((frame - 18) * 0.22) * scale * 0.008 : 0;

  const cy = height * 0.5 + charOffsetY + bounce;

  // Arm wave: oscillate via sin after frame 10
  const waveStarted = frame > 10;
  const waveAngle = waveStarted
    ? interpolate(Math.sin((frame - 10) * 0.3), [-1, 1], [-25, 50])
    : 0;

  // Text slide in
  const textIn = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 90 },
    durationInFrames: 20,
  });

  // Body dimensions
  const headR = scale * 0.09;
  const bodyW = scale * 0.13;
  const bodyH = scale * 0.17;
  const armW = scale * 0.042;
  const armH = scale * 0.11;
  const legW = scale * 0.042;
  const legH = scale * 0.11;

  // Right arm shoulder pivot
  const shoulderX = cx + bodyW * 0.48;
  const shoulderY = cy - bodyH * 0.32;

  // Head center
  const headCY = cy - bodyH * 0.5 - headR * 0.65;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Ground shadow */}
        <ellipse
          cx={cx}
          cy={cy + bodyH * 0.5 + legH + scale * 0.008}
          rx={bodyW * 0.75}
          ry={scale * 0.016}
          fill="rgba(0,0,0,0.08)"
        />

        {/* Legs */}
        <rect
          x={cx - bodyW * 0.28 - legW / 2}
          y={cy + bodyH * 0.44}
          width={legW}
          height={legH}
          rx={legW / 2}
          fill={accentColor}
        />
        <rect
          x={cx + bodyW * 0.28 - legW / 2}
          y={cy + bodyH * 0.44}
          width={legW}
          height={legH}
          rx={legW / 2}
          fill={accentColor}
        />

        {/* Body */}
        <rect
          x={cx - bodyW / 2}
          y={cy - bodyH * 0.5}
          width={bodyW}
          height={bodyH}
          rx={bodyW * 0.22}
          fill={bodyColor}
        />

        {/* Left arm (resting down) */}
        <rect
          x={cx - bodyW * 0.5 - armW}
          y={cy - bodyH * 0.28}
          width={armW}
          height={armH}
          rx={armW / 2}
          fill={skinColor}
        />

        {/* Right arm (waving) — rotated around shoulder */}
        <g transform={`rotate(${waveAngle} ${shoulderX} ${shoulderY})`}>
          <rect
            x={shoulderX}
            y={shoulderY}
            width={armW}
            height={armH}
            rx={armW / 2}
            fill={skinColor}
          />
          {/* Hand knob */}
          <circle
            cx={shoulderX + armW / 2}
            cy={shoulderY + armH}
            r={armW * 0.65}
            fill={skinColor}
          />
        </g>

        {/* Head */}
        <circle cx={cx} cy={headCY} r={headR} fill={skinColor} />

        {/* Eyes */}
        <circle
          cx={cx - headR * 0.3}
          cy={headCY - headR * 0.12}
          r={headR * 0.1}
          fill="#1e1e2e"
        />
        <circle
          cx={cx + headR * 0.3}
          cy={headCY - headR * 0.12}
          r={headR * 0.1}
          fill="#1e1e2e"
        />

        {/* Smile */}
        <path
          d={`M ${cx - headR * 0.28} ${headCY + headR * 0.18} Q ${cx} ${headCY + headR * 0.45} ${cx + headR * 0.28} ${headCY + headR * 0.18}`}
          stroke="#1e1e2e"
          strokeWidth={scale * 0.007}
          strokeLinecap="round"
          fill="none"
        />

        {/* Hair tuft */}
        <path
          d={`M ${cx - headR * 0.15} ${headCY - headR * 0.88} Q ${cx} ${headCY - headR * 1.18} ${cx + headR * 0.15} ${headCY - headR * 0.88}`}
          stroke={accentColor}
          strokeWidth={scale * 0.01}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
      </svg>

      {/* Text block */}
      <div
        style={{
          position: "absolute",
          left: width * 0.54,
          top: "50%",
          transform: `translateY(-50%) translateX(${interpolate(
            textIn,
            [0, 1],
            [50, 0]
          )}px)`,
          opacity: textIn,
          display: "flex",
          flexDirection: "column",
          gap: scale * 0.014,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: scale * 0.1,
            fontWeight: 800,
            color: accentColor,
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: scale * 0.038,
              fontWeight: 400,
              color: textColor,
              opacity: 0.72,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default WaveHello;
