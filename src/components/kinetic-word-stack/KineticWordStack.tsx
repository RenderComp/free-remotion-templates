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
export const DURATION_FRAMES = 120;

export type KineticWordStackProps = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  words: string[];
};

export const defaultKineticWordStackProps: KineticWordStackProps = {
  backgroundColor: "#050818",
  accentColor: "#22d3ee",
  textColor: "#ecfeff",
  words: ["BUILD", "WHAT", "MATTERS", "NOW"],
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const KineticWordStack: React.FC<KineticWordStackProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  words,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const wordList = (words && words.length > 0 ? words : ["BUILD"]).map((w) =>
    String(w).toUpperCase()
  );
  const count = wordList.length;
  const lastIndex = count - 1;

  // Layout: vertically centered stack, sized relative to canvas.
  const lineHeight = Math.round(height * 0.155);
  const fontSize = Math.round(lineHeight * 0.74);
  const stackHeight = lineHeight * count;
  const stackTop = (height - stackHeight) / 2;

  // Each word drops on its own beat.
  const beat = 11;
  const baseDelay = 6;

  // Background accent glow that intensifies as words land.
  const lastWordStart = baseDelay + lastIndex * beat;
  const settle = spring({
    frame: frame - (lastWordStart + 6),
    fps,
    config: { damping: 18, stiffness: 90 },
    durationInFrames: 24,
  });

  // Hold opacity at the end so the final frame is never blank.
  const fadeOut = interpolate(
    frame,
    [DURATION_FRAMES - 12, DURATION_FRAMES],
    [1, 0.92],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: FONT,
        overflow: "hidden",
        opacity: fadeOut,
      }}
    >
      {/* Ambient radial glow behind the stack */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accentColor}22 0%, ${accentColor}00 55%)`,
          opacity: 0.4 + settle * 0.6,
        }}
      />

      {/* Vertical guide line that draws down through the stack */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: stackTop + lineHeight * 0.5,
          width: Math.max(2, Math.round(width * 0.0015)),
          height: (lineHeight * (count - 1)) * settle,
          transform: "translateX(-50%)",
          background: `linear-gradient(180deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
          opacity: 0.55 * settle,
          borderRadius: 999,
        }}
      />

      {wordList.map((word, i) => {
        const start = baseDelay + i * beat;
        const local = frame - start;

        const drop = spring({
          frame: local,
          fps,
          config: { damping: 13, stiffness: 170, mass: 0.7 },
          durationInFrames: 22,
        });

        // Fall in from above, slight overshoot from the spring.
        const dy = interpolate(drop, [0, 1], [-lineHeight * 1.1, 0]);
        const opacity = interpolate(drop, [0, 0.25, 1], [0, 1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(drop, [0, 1], [1.18, 1]);

        const isAccent = i === lastIndex;

        // Impact flash when the word lands.
        const flash = interpolate(local, [16, 22, 30], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const top = stackTop + i * lineHeight;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              height: lineHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity,
              transform: `translateY(${dy}px) scale(${scale})`,
            }}
          >
            <span
              style={{
                fontSize,
                fontWeight: 800,
                letterSpacing: Math.round(fontSize * 0.02),
                lineHeight: 1,
                color: isAccent ? accentColor : textColor,
                textShadow: isAccent
                  ? `0 0 ${Math.round(fontSize * (0.18 + flash * 0.35))}px ${accentColor}cc`
                  : `0 0 ${Math.round(fontSize * flash * 0.22)}px ${accentColor}66`,
              }}
            >
              {word}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export default KineticWordStack;
