// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 90; // seamless: frame 0 == frame 90

export type LoopGridWaveProps = {
  backgroundColor: string;
  dotColor: string;
  accentColor: string;
  amplitude: number;
  speed: number;
};

export const defaultLoopGridWaveProps: LoopGridWaveProps = {
  backgroundColor: "#0a0f1e",
  dotColor: "#334155",
  accentColor: "#38bdf8",
  amplitude: 1.0,
  speed: 1.0,
};

export const LoopGridWave: React.FC<LoopGridWaveProps> = ({
  backgroundColor,
  dotColor,
  accentColor,
  amplitude,
  speed,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Loop period = DURATION_FRAMES — frame 0 and frame 90 produce identical output
  const t = (frame / DURATION_FRAMES) * Math.PI * 2 * speed;

  const cols = 18;
  const rows = 12;
  const cellW = width / cols;
  const cellH = height / rows;
  const maxR = Math.min(cellW, cellH) * 0.28;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const cx = cellW * (col + 0.5);
            const cy = cellH * (row + 0.5);
            // Wave based on position + time (fully periodic)
            const wave = Math.sin(t + col * 0.38 + row * 0.48) * 0.5 + 0.5;
            const r = maxR * (0.2 + wave * 0.8) * amplitude;
            const brightness = 0.1 + wave * 0.9;
            const color = wave > 0.7 ? accentColor : dotColor;
            return (
              <circle
                key={`${row}-${col}`}
                cx={cx} cy={cy}
                r={r}
                fill={color}
                opacity={brightness}
              />
            );
          })
        )}
      </svg>
    </AbsoluteFill>
  );
};

export default LoopGridWave;
