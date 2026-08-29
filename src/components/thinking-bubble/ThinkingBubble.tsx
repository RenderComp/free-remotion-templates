// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// A character looks up and thinks
// Small bubbles chain up to a large thought bubble where "..." blinks in sequence
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

export type ThinkingBubbleProps = {
  backgroundColor: string;
  characterColor: string;
  bubbleColor: string;
  bubbleBorder: string;
  dotColor: string;
  thoughtText: string;
  textColor: string;
  showText: boolean;
};

export const defaultThinkingBubbleProps: ThinkingBubbleProps = {
  backgroundColor: "#fafaf9",
  characterColor: "#78716c",
  bubbleColor: "#ffffff",
  bubbleBorder: "#d6d3d1",
  dotColor: "#a8a29e",
  thoughtText: "Hmm...",
  textColor: "#44403c",
  showText: true,
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({
  backgroundColor,
  characterColor,
  bubbleColor,
  bubbleBorder,
  dotColor,
  thoughtText,
  textColor,
  showText,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scale = Math.min(width, height);
  const cx = width * 0.42;
  const groundY = height * 0.68;

  // Character dimensions
  const headR = scale * 0.07;
  const bodyW = scale * 0.09;
  const bodyH = scale * 0.12;

  // Head looks up — tilt
  const headTilt = interpolate(frame, [6, 24], [0, -12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Character entry
  const charEntry = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 18,
  });
  const charY = interpolate(charEntry, [0, 1], [scale * 0.1, 0]);

  // Trail bubbles: 3 small circles leading to main bubble
  // Each appears with stagger
  const trailBubbles = [
    { r: scale * 0.018, delay: 14, dx: scale * 0.09, dy: -scale * 0.09 },
    { r: scale * 0.028, delay: 20, dx: scale * 0.16, dy: -scale * 0.18 },
    { r: scale * 0.04, delay: 26, dx: scale * 0.22, dy: -scale * 0.3 },
  ];

  // Main bubble
  const bubbleW = scale * 0.42;
  const bubbleH = scale * 0.28;
  const bubbleX = cx + scale * 0.05;
  const bubbleY = groundY - bodyH - headR * 2 - bubbleH * 0.5 - scale * 0.38;

  const bubbleScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 9, stiffness: 120, mass: 0.8 },
    durationInFrames: 20,
  });

  // Breathing: bubble gently scales
  const breathe = 1 + Math.sin(frame * 0.08) * 0.015;

  // Dots: 3 dots appear in sequence and loop
  const dotPeriod = 24; // frames per dot cycle
  const dotsStart = 44;
  const dotProgress = (f: number, dotIndex: number) => {
    if (frame < dotsStart) return 0;
    const t = (frame - dotsStart + dotIndex * dotPeriod * 0.33) % dotPeriod;
    return interpolate(t, [0, dotPeriod * 0.3, dotPeriod * 0.6, dotPeriod], [0.3, 1, 1, 0.3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // Text fade in
  const textIn = spring({
    frame: frame - 55,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 18,
  });

  const charBodyBottom = groundY;
  const charBodyTop = charBodyBottom - bodyH;
  const charHeadCY = charBodyTop - headR * 0.9;

  // Dot positions inside bubble
  const dotSpacing = bubbleW * 0.16;
  const dotY = bubbleY;
  const dot1X = bubbleX + bubbleW / 2 - dotSpacing;
  const dot2X = bubbleX + bubbleW / 2;
  const dot3X = bubbleX + bubbleW / 2 + dotSpacing;
  const dotR = scale * 0.022;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Ground */}
      <div
        style={{
          position: "absolute",
          top: groundY,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `${characterColor}18`,
          borderTop: `2px solid ${characterColor}28`,
        }}
      />

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0, transform: `translateY(${charY}px)`, opacity: charEntry }}
      >
        {/* Shadow */}
        <ellipse
          cx={cx}
          cy={groundY + 6}
          rx={bodyW * 0.7}
          ry={scale * 0.014}
          fill={characterColor}
          opacity={0.2}
        />

        {/* Legs */}
        <rect x={cx - bodyW * 0.32} y={charBodyBottom - scale * 0.065} width={scale * 0.032} height={scale * 0.065} rx={scale * 0.016} fill={characterColor} />
        <rect x={cx + bodyW * 0.06} y={charBodyBottom - scale * 0.065} width={scale * 0.032} height={scale * 0.065} rx={scale * 0.016} fill={characterColor} />

        {/* Body */}
        <rect x={cx - bodyW / 2} y={charBodyTop} width={bodyW} height={bodyH} rx={bodyW * 0.28} fill={characterColor} />

        {/* Arms (one raised slightly — pondering pose) */}
        <rect
          x={cx - bodyW / 2 - scale * 0.04}
          y={charBodyTop + bodyH * 0.1}
          width={scale * 0.04}
          height={scale * 0.07}
          rx={scale * 0.02}
          fill={characterColor}
          transform={`rotate(-20 ${cx - bodyW / 2} ${charBodyTop + bodyH * 0.2})`}
        />
        {/* Right arm raised to chin */}
        <rect
          x={cx + bodyW / 2}
          y={charBodyTop + bodyH * 0.05}
          width={scale * 0.04}
          height={scale * 0.07}
          rx={scale * 0.02}
          fill={characterColor}
          transform={`rotate(50 ${cx + bodyW / 2} ${charBodyTop + bodyH * 0.2})`}
        />

        {/* Head (slightly tilted back) */}
        <circle
          cx={cx}
          cy={charHeadCY}
          r={headR}
          fill={characterColor}
          transform={`rotate(${headTilt} ${cx} ${charHeadCY})`}
        />
        {/* Eyes looking up */}
        <circle cx={cx - headR * 0.28} cy={charHeadCY - headR * 0.18} r={headR * 0.12} fill="#fff" />
        <circle cx={cx + headR * 0.28} cy={charHeadCY - headR * 0.18} r={headR * 0.12} fill="#fff" />
        <circle cx={cx - headR * 0.28} cy={charHeadCY - headR * 0.24} r={headR * 0.07} fill={backgroundColor === "#fafaf9" ? "#292524" : "#fff"} />
        <circle cx={cx + headR * 0.28} cy={charHeadCY - headR * 0.24} r={headR * 0.07} fill={backgroundColor === "#fafaf9" ? "#292524" : "#fff"} />
        {/* Mouth: slight "hmm" expression */}
        <path
          d={`M ${cx - headR * 0.22} ${charHeadCY + headR * 0.32} Q ${cx} ${charHeadCY + headR * 0.28} ${cx + headR * 0.22} ${charHeadCY + headR * 0.32}`}
          stroke="#fff"
          strokeWidth={headR * 0.1}
          strokeLinecap="round"
          fill="none"
        />

        {/* Trail bubbles */}
        {trailBubbles.map((b, i) => {
          const trailP = spring({ frame: frame - b.delay, fps, config: { damping: 10, stiffness: 140 }, durationInFrames: 12 });
          return (
            <circle
              key={i}
              cx={cx + b.dx}
              cy={charHeadCY - headR + b.dy}
              r={b.r * trailP}
              fill={bubbleColor}
              stroke={bubbleBorder}
              strokeWidth={1.5}
              opacity={trailP}
            />
          );
        })}

        {/* Main thought bubble */}
        {bubbleScale > 0.01 && (
          <g transform={`scale(${bubbleScale * breathe}) translate(${bubbleX + bubbleW / 2 * (1 - bubbleScale * breathe)} ${bubbleY + bubbleH / 2 * (1 - bubbleScale * breathe)})`}>
            <ellipse
              cx={bubbleX + bubbleW / 2}
              cy={bubbleY}
              rx={bubbleW / 2}
              ry={bubbleH / 2}
              fill={bubbleColor}
              stroke={bubbleBorder}
              strokeWidth={scale * 0.006}
            />
          </g>
        )}

        {/* Dots inside bubble */}
        {frame >= dotsStart && bubbleScale > 0.5 && (
          <>
            <circle cx={dot1X} cy={dotY} r={dotR * dotProgress(frame, 0)} fill={dotColor} opacity={dotProgress(frame, 0)} />
            <circle cx={dot2X} cy={dotY} r={dotR * dotProgress(frame, 1)} fill={dotColor} opacity={dotProgress(frame, 1)} />
            <circle cx={dot3X} cy={dotY} r={dotR * dotProgress(frame, 2)} fill={dotColor} opacity={dotProgress(frame, 2)} />
          </>
        )}
      </svg>

      {/* Thought text below bubble */}
      {showText && thoughtText && (
        <div
          style={{
            position: "absolute",
            top: bubbleY + bubbleH * 0.5 + scale * 0.04,
            left: bubbleX,
            width: bubbleW,
            textAlign: "center",
            opacity: textIn,
            transform: `translateY(${interpolate(textIn, [0, 1], [10, 0])}px)`,
            fontFamily: FONT,
            fontSize: scale * 0.04,
            fontWeight: 600,
            color: textColor,
            fontStyle: "italic",
          }}
        >
          {thoughtText}
        </div>
      )}
    </AbsoluteFill>
  );
};

export default ThinkingBubble;
