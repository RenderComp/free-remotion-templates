// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 90;

export type EyeRevealProps = {
  backgroundColor: string;
  scleraColor: string;
  irisColor: string;
  pupilColor: string;
  lidColor: string;
  textColor: string;
  subColor: string;
  messageText: string;
  subText: string;
};

export const defaultEyeRevealProps: EyeRevealProps = {
  backgroundColor: "#0f172a",
  scleraColor: "#f8fafc",
  irisColor: "#3b82f6",
  pupilColor: "#0f172a",
  lidColor: "#1e293b",
  textColor: "#f8fafc",
  subColor: "#94a3b8",
  messageText: "Revealed",
  subText: "See the truth",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const EyeReveal: React.FC<EyeRevealProps> = ({
  backgroundColor,
  scleraColor,
  irisColor,
  pupilColor,
  lidColor,
  textColor,
  subColor,
  messageText,
  subText,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = Math.min(width, height);

  // Eye opens (lids retract)
  const eyeOpen = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Iris grows
  const irisIn = spring({ frame: frame - 25, fps, config: { damping: 11, stiffness: 100 }, durationInFrames: 20 });

  // Blink at frame 60
  const blinkClose = interpolate(frame, [60, 64], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blinkOpen = interpolate(frame, [64, 70], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lidProgress = frame < 64 ? 1 - eyeOpen : (frame < 70 ? blinkClose : blinkOpen) > 0.5 ? blinkOpen : blinkClose;
  const openAmount = frame >= 60 ? (frame >= 64 ? blinkOpen : 1 - blinkClose) : eyeOpen;

  const textIn = spring({ frame: frame - 52, fps, config: { damping: 12, stiffness: 120 }, durationInFrames: 18 });
  const subIn = interpolate(frame, [66, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cx = width / 2;
  const cy = height * 0.42;
  const ew = scale * 0.30;
  const eh = scale * 0.14;

  // Lid openness: 0=closed, 1=fully open
  const lidGap = openAmount * eh;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <clipPath id="eyeClip">
            <path d={`M ${cx - ew / 2} ${cy} Q ${cx} ${cy - lidGap} ${cx + ew / 2} ${cy} Q ${cx} ${cy + lidGap} ${cx - ew / 2} ${cy} Z`} />
          </clipPath>
        </defs>

        {/* Eye white */}
        <path
          d={`M ${cx - ew / 2} ${cy} Q ${cx} ${cy - lidGap} ${cx + ew / 2} ${cy} Q ${cx} ${cy + lidGap} ${cx - ew / 2} ${cy} Z`}
          fill={scleraColor}
        />

        {/* Iris */}
        <circle cx={cx} cy={cy} r={eh * 0.9 * irisIn * openAmount}
          fill={irisColor} clipPath="url(#eyeClip)" />

        {/* Iris pattern */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r1 = eh * 0.35 * irisIn * openAmount;
          const r2 = eh * 0.85 * irisIn * openAmount;
          return (
            <line key={i}
              x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
              stroke="white" strokeWidth={scale * 0.003} opacity={0.2}
              clipPath="url(#eyeClip)"
            />
          );
        })}

        {/* Pupil */}
        <circle cx={cx} cy={cy} r={eh * 0.42 * irisIn * openAmount}
          fill={pupilColor} clipPath="url(#eyeClip)" />

        {/* Highlight */}
        <circle cx={cx - eh * 0.18} cy={cy - eh * 0.2}
          r={eh * 0.12 * irisIn * openAmount}
          fill="white" opacity={0.7} clipPath="url(#eyeClip)" />

        {/* Upper lid */}
        <path
          d={`M ${cx - ew / 2 - scale * 0.02} ${cy - eh * 0.5} L ${cx + ew / 2 + scale * 0.02} ${cy - eh * 0.5} L ${cx + ew / 2} ${cy} Q ${cx} ${cy - lidGap} ${cx - ew / 2} ${cy} Z`}
          fill={lidColor}
        />
        {/* Lower lid */}
        <path
          d={`M ${cx - ew / 2 - scale * 0.02} ${cy + eh * 0.5} L ${cx + ew / 2 + scale * 0.02} ${cy + eh * 0.5} L ${cx + ew / 2} ${cy} Q ${cx} ${cy + lidGap} ${cx - ew / 2} ${cy} Z`}
          fill={lidColor}
        />

        {/* Eyelash lines (top) */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((t, i) => {
          const lx = cx + t * ew * 0.9;
          const ly1 = cy - lidGap;
          const ly2 = ly1 - scale * (0.016 + Math.abs(t) * 0.008);
          return (
            <line key={i}
              x1={lx} y1={ly1} x2={lx + t * scale * 0.008} y2={ly2}
              stroke={lidColor} strokeWidth={scale * 0.006} strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div style={{
        position: "absolute", bottom: height * 0.1,
        left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: scale * 0.01,
      }}>
        <div style={{ fontFamily: FONT, fontSize: scale * 0.09, fontWeight: 900, color: textColor, opacity: textIn, transform: `scale(${0.75 + textIn * 0.25})` }}>
          {messageText}
        </div>
        <div style={{ fontFamily: FONT, fontSize: scale * 0.034, fontWeight: 500, color: subColor, opacity: subIn }}>
          {subText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default EyeReveal;
