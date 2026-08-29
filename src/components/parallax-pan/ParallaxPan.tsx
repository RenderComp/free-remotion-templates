// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Parallax Pan — background/midground/foreground scroll horizontally at
// different speeds to create a layered depth (parallax) effect.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type ParallaxPanProps = {
  /** Headline */
  title: string;
  /** Sub text */
  subtitle?: string;
  /** Sky gradient top color */
  skyTop: string;
  /** Sky gradient bottom color */
  skyBottom: string;
  /** Far mountain range color */
  mountainColor: string;
  /** Mid hill color */
  hillColor: string;
  /** Foreground ground color */
  groundColor: string;
  /** Text color */
  textColor: string;
  /** Total pan distance in px (larger = faster) */
  panDistance?: number;
};

export const defaultParallaxPanProps: ParallaxPanProps = {
  title: "Beyond the Horizon",
  subtitle: "A journey through layered worlds",
  skyTop: "#1e3a8a",
  skyBottom: "#f59e0b",
  mountainColor: "#1e293b",
  hillColor: "#334155",
  groundColor: "#0f172a",
  textColor: "#fef3c7",
  panDistance: 600,
};

export const ParallaxPan: React.FC<ParallaxPanProps> = ({
  title,
  subtitle,
  skyTop,
  skyBottom,
  mountainColor,
  hillColor,
  groundColor,
  textColor,
  panDistance = 600,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // 0 → 1 progress (linear, no easing = constant pan speed)
  const t = frame / durationInFrames;

  // Per-layer speed factors (smaller = slower = further away)
  const bgSpeed = 0.15; // far mountains
  const midSpeed = 0.45; // mid hills
  const fgSpeed = 1.0; // foreground ground

  const bgX = -t * panDistance * bgSpeed;
  const midX = -t * panDistance * midSpeed;
  const fgX = -t * panDistance * fgSpeed;

  // Text fade-in
  const textOpacity = interpolate(frame, [10, 28], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [10, 28], [40, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sunY = height * 0.45;
  const sunX = width * 0.7;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Sky gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 100%)`,
        }}
      />

      {/* Sun (moves slightly slower) */}
      <div
        style={{
          position: "absolute",
          left: sunX,
          top: sunY,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,237,179,0.95) 0%, rgba(255,237,179,0.4) 50%, rgba(255,237,179,0) 80%)",
          transform: `translateX(${bgX * 0.3}px)`,
        }}
      />

      {/* Far mountains */}
      <ParallaxLayer offsetX={bgX} zIndex={1}>
        <MountainRange
          color={mountainColor}
          width={width * 3}
          height={height}
          baseLine={0.55}
          peaks={9}
          variance={0.18}
        />
      </ParallaxLayer>

      {/* Mid hills */}
      <ParallaxLayer offsetX={midX} zIndex={2}>
        <MountainRange
          color={hillColor}
          width={width * 3}
          height={height}
          baseLine={0.72}
          peaks={6}
          variance={0.1}
        />
      </ParallaxLayer>

      {/* Foreground ground */}
      <ParallaxLayer offsetX={fgX} zIndex={3}>
        <MountainRange
          color={groundColor}
          width={width * 3}
          height={height}
          baseLine={0.88}
          peaks={4}
          variance={0.05}
        />
      </ParallaxLayer>

      {/* Foreground trees (even faster) */}
      <ParallaxLayer offsetX={fgX * 1.3} zIndex={4}>
        <Trees groundColor={groundColor} width={width * 3} height={height} />
      </ParallaxLayer>

      {/* Text (does not pan, topmost layer) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          color: textColor,
          textAlign: "center",
          padding: 80,
          boxSizing: "border-box",
          zIndex: 10,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textShadow: "0 4px 24px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontSize: width >= 1920 ? 108 : 72,
            fontWeight: 900,
            letterSpacing: 4,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 24,
              fontSize: width >= 1920 ? 34 : 26,
              fontWeight: 500,
              letterSpacing: 2,
              opacity: 0.9,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const ParallaxLayer: React.FC<{
  offsetX: number;
  zIndex: number;
  children: React.ReactNode;
}> = ({ offsetX, zIndex, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex,
      transform: `translateX(${offsetX}px)`,
    }}
  >
    {children}
  </div>
);

// Deterministic pseudo-random height from a peak index
const seededHeight = (i: number, variance: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  const noise = v - Math.floor(v);
  return noise * variance;
};

const MountainRange: React.FC<{
  color: string;
  width: number;
  height: number;
  baseLine: number;
  peaks: number;
  variance: number;
}> = ({ color, width, height, baseLine, peaks, variance }) => {
  const baseY = height * baseLine;
  const segmentW = width / peaks;
  const points: string[] = [`0,${height}`, `0,${baseY}`];
  for (let i = 0; i <= peaks; i++) {
    const x = i * segmentW;
    const peakHeight = (variance + seededHeight(i, variance)) * height;
    const y = baseY - peakHeight;
    points.push(`${x - segmentW / 2},${y}`);
    points.push(`${x},${baseY}`);
  }
  points.push(`${width},${baseY}`);
  points.push(`${width},${height}`);

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polygon points={points.join(" ")} fill={color} />
    </svg>
  );
};

const Trees: React.FC<{
  groundColor: string;
  width: number;
  height: number;
}> = ({ width, height }) => {
  const treeCount = 8;
  const baseY = height * 0.86;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {Array.from({ length: treeCount }).map((_, i) => {
        const x = (i + 0.5) * (width / treeCount) + seededHeight(i * 7, 100);
        const h = 60 + seededHeight(i * 3, 40);
        return (
          <g key={i}>
            <rect x={x - 4} y={baseY} width={8} height={h * 0.4} fill="#1a1a1a" />
            <polygon
              points={`${x},${baseY - h} ${x - 22},${baseY + 4} ${x + 22},${baseY + 4}`}
              fill="#0b3d1a"
            />
            <polygon
              points={`${x},${baseY - h * 0.7} ${x - 18},${baseY - h * 0.05} ${x + 18},${baseY - h * 0.05}`}
              fill="#0a4a20"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default ParallaxPan;
