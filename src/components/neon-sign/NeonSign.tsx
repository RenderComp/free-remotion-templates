// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 100;

export type NeonSignProps = {
  backgroundColor: string;
  neonColor: string;
  glowColor: string;
  flickerColor: string;
  frameColor: string;
  textColor: string;
  subColor: string;
  signText: string;
  subText: string;
};

export const defaultNeonSignProps: NeonSignProps = {
  backgroundColor: "#080010",
  neonColor: "#f0abfc",
  glowColor: "#c026d3",
  flickerColor: "#e879f9",
  frameColor: "#3f3f46",
  textColor: "#fae8ff",
  subColor: "#a21caf",
  signText: "OPEN",
  subText: "Now serving",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const NeonSign: React.FC<NeonSignProps> = ({
  backgroundColor,
  neonColor,
  glowColor,
  flickerColor,
  frameColor,
  textColor,
  subColor,
  signText,
  subText,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = Math.min(width, height);

  // Sign flickers on: rapid flicker phase (0-25), then solid with occasional flicker
  const flickerPhase = frame < 25;
  const flickerOn = flickerPhase
    ? Math.sin(frame * 3.7) > -0.2 && Math.sin(frame * 7.1) > -0.3
    : true;

  // Occasional blink after sign is on
  const occasionalBlink = frame > 25 && (frame === 38 || frame === 39 || frame === 55);
  const signOn = flickerOn && !occasionalBlink;

  const signOpacity = signOn ? 1 : 0.05;
  const glowOpacity = signOn ? 0.6 : 0;

  const frameIn = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subIn = interpolate(frame, [30, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cx = width / 2;
  const cy = height * 0.42;
  const sw = scale * 0.50;
  const sh = scale * 0.20;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Glow on background */}
      <div style={{
        position: "absolute",
        left: "50%", top: `${height * 0.42}px`,
        transform: "translate(-50%, -50%)",
        width: sw * 1.5, height: sh * 2,
        borderRadius: "50%",
        background: `radial-gradient(ellipse, ${glowColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        transition: "opacity 0.02s",
      }} />

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Sign frame */}
        <rect x={cx - sw / 2 - scale * 0.02} y={cy - sh / 2 - scale * 0.02}
          width={sw + scale * 0.04} height={sh + scale * 0.04}
          rx={scale * 0.02}
          fill="none" stroke={frameColor} strokeWidth={scale * 0.012}
          opacity={frameIn}
        />

        {/* Neon text glow (multi-layered) */}
        <text x={cx} y={cy + sh * 0.2}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={scale * 0.10}
          fontWeight={900}
          letterSpacing={scale * 0.018}
          fill={glowColor}
          opacity={glowOpacity * 0.4}
          style={{ filter: `blur(${scale * 0.02}px)` }}
        >{signText}</text>
        <text x={cx} y={cy + sh * 0.2}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={scale * 0.10}
          fontWeight={900}
          letterSpacing={scale * 0.018}
          fill={glowColor}
          opacity={glowOpacity * 0.3}
          style={{ filter: `blur(${scale * 0.008}px)` }}
        >{signText}</text>
        {/* Main neon text */}
        <text x={cx} y={cy + sh * 0.2}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={scale * 0.10}
          fontWeight={900}
          letterSpacing={scale * 0.018}
          fill={neonColor}
          opacity={signOpacity}
        >{signText}</text>

        {/* Mounting screws */}
        {[-0.46, 0.46].map((t, i) => (
          <circle key={i} cx={cx + t * sw} cy={cy}
            r={scale * 0.01} fill={frameColor} opacity={frameIn} />
        ))}
      </svg>

      <div style={{
        position: "absolute", bottom: height * 0.1,
        left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: scale * 0.01,
      }}>
        <div style={{ fontFamily: FONT, fontSize: scale * 0.034, fontWeight: 500, color: subColor, opacity: subIn }}>
          {subText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NeonSign;
