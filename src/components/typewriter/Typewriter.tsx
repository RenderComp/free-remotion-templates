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

export type TypewriterProps = {
  backgroundColor: string;
  machineColor: string;
  machineDarkColor: string;
  keyColor: string;
  ribbonColor: string;
  paperColor: string;
  textColor: string;
  subColor: string;
  messageText: string;
  subText: string;
};

export const defaultTypewriterProps: TypewriterProps = {
  backgroundColor: "#0f0c00",
  machineColor: "#374151",
  machineDarkColor: "#1f2937",
  keyColor: "#4b5563",
  ribbonColor: "#dc2626",
  paperColor: "#f8fafc",
  textColor: "#fef9c3",
  subColor: "#d97706",
  messageText: "Written",
  subText: "Words on paper",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const Typewriter: React.FC<TypewriterProps> = ({
  backgroundColor,
  machineColor,
  machineDarkColor,
  keyColor,
  ribbonColor,
  paperColor,
  textColor,
  subColor,
  messageText,
  subText,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = Math.min(width, height);

  const machineIn = spring({ frame, fps, config: { damping: 11, stiffness: 80 }, durationInFrames: 22 });

  // Carriage moves left to right as typing happens
  const carriageProgress = interpolate(frame, [20, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Paper moves up as lines are typed
  const paperLines = Math.floor(carriageProgress * 3);
  const paperY = -paperLines * scale * 0.018;

  const textIn = spring({ frame: frame - 74, fps, config: { damping: 12, stiffness: 120 }, durationInFrames: 18 });
  const subIn = interpolate(frame, [88, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cx = width / 2;
  const cy = height * 0.46;
  const mw = scale * 0.44;
  const mh = scale * 0.26;

  const keyRows = [
    'QWERTYUIOP',
    'ASDFGHJKL',
    'ZXCVBNM',
  ];

  // Currently pressed key based on frame
  const keyIdx = Math.floor(carriageProgress * 20) % 27;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <g transform={`translate(${cx}, ${cy}) scale(${machineIn}) translate(${-cx}, ${-cy})`}>
          {/* Machine body */}
          <rect x={cx - mw / 2} y={cy - mh * 0.1}
            width={mw} height={mh * 1.1}
            rx={scale * 0.018} fill={machineColor}
          />
          <rect x={cx - mw / 2} y={cy - mh * 0.1}
            width={mw} height={mh * 0.28}
            rx={scale * 0.018} fill={machineDarkColor}
          />

          {/* Platen (paper roller) */}
          <rect x={cx - mw * 0.42} y={cy - mh * 0.38}
            width={mw * 0.84} height={scale * 0.028}
            rx={scale * 0.01} fill={machineDarkColor}
          />

          {/* Paper */}
          <g transform={`translate(0, ${paperY})`}>
            <rect x={cx - mw * 0.24} y={cy - mh * 0.7}
              width={mw * 0.48} height={mh * 0.55}
              rx={scale * 0.004} fill={paperColor}
            />
            {/* Typed lines */}
            {Array.from({ length: paperLines }, (_, i) => (
              <rect key={i}
                x={cx - mw * 0.2}
                y={cy - mh * 0.62 + i * scale * 0.022}
                width={mw * 0.35 * ((i === paperLines - 1) ? carriageProgress % (1 / 3) * 3 : 1)}
                height={scale * 0.006}
                rx={scale * 0.002}
                fill={ribbonColor} opacity={0.6}
              />
            ))}
          </g>

          {/* Ribbon */}
          <rect x={cx - mw * 0.3} y={cy - mh * 0.22}
            width={mw * 0.6} height={scale * 0.01}
            fill={ribbonColor} opacity={0.6}
          />

          {/* Carriage indicator */}
          <rect
            x={cx - mw * 0.38 + carriageProgress * mw * 0.76}
            y={cy - mh * 0.28}
            width={scale * 0.012}
            height={scale * 0.016}
            rx={scale * 0.002}
            fill={ribbonColor} opacity={0.8}
          />

          {/* Keys */}
          {keyRows.map((row, ri) => {
            const kw = mw * 0.07;
            const kh = mw * 0.055;
            const gap = mw * 0.005;
            const startX = cx - mw * 0.38 + ri * scale * 0.014;
            const startY = cy + mh * 0.12 + ri * (kh + gap);
            return row.split('').map((key, ci) => {
              const kx = startX + ci * (kw + gap);
              const globalIdx = ri * 10 + ci;
              const isPressed = globalIdx === keyIdx % 27;
              return (
                <g key={`${ri}-${ci}`}>
                  <rect x={kx} y={startY}
                    width={kw} height={kh}
                    rx={scale * 0.005}
                    fill={isPressed ? ribbonColor : keyColor}
                    opacity={isPressed ? 0.9 : 0.8}
                  />
                </g>
              );
            });
          })}

          {/* Space bar */}
          <rect x={cx - mw * 0.22} y={cy + mh * 0.62}
            width={mw * 0.44} height={mw * 0.052}
            rx={scale * 0.005} fill={keyColor} opacity={0.8}
          />
        </g>
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

export default Typewriter;
