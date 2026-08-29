// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Camera Shake — impact-driven full-frame shake
// Based on a simple shake primitive, with a decay curve and an impact flash added
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

const FONT_EN = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type CameraShakeProps = {
  /** Main headline */
  title: string;
  /** Sub text */
  subtitle?: string;
  /** Background color */
  background: string;
  /** Main text color */
  textColor: string;
  /** Accent color (impact lines and frame) */
  accentColor: string;
  /** Maximum shake amplitude (px) */
  maxIntensity?: number;
  /** Time of impact (seconds) */
  impactAt?: number;
  /** Duration of the shake (seconds) */
  shakeDuration?: number;
};

export const defaultCameraShakeProps: CameraShakeProps = {
  title: "IMPACT",
  subtitle: "System breach detected",
  background: "#111827",
  textColor: "#fef3c7",
  accentColor: "#f59e0b",
  maxIntensity: 28,
  impactAt: 0.9,
  shakeDuration: 1.6,
};

// Pseudo-random (frame-driven, deterministic)
const pseudoRand = (n: number, seed: number) => {
  const v = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const ImpactRays: React.FC<{
  accentColor: string;
  progress: number;
  width: number;
  height: number;
}> = ({ accentColor, progress, width, height }) => {
  const rays = 12;
  const maxLen = Math.max(width, height) * 0.9;
  const len = progress * maxLen;
  const opacity = 1 - progress;
  return (
    <svg
      viewBox={`-${width / 2} -${height / 2} ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i / rays) * Math.PI * 2;
        const x = Math.cos(angle) * len;
        const y = Math.sin(angle) * len;
        return (
          <line
            key={i}
            x1={0}
            y1={0}
            x2={x}
            y2={y}
            stroke={accentColor}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

export const CameraShake: React.FC<CameraShakeProps> = ({
  title,
  subtitle,
  background,
  textColor,
  accentColor,
  maxIntensity = 28,
  impactAt = 0.9,
  shakeDuration = 1.6,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const impactFrame = Math.floor(impactAt * fps);
  const shakeFrames = Math.floor(shakeDuration * fps);

  // Time elapsed since impact
  const elapsedFromImpact = frame - impactFrame;

  // Decay curve: peaks right after impact, then fades
  let decay = 0;
  if (elapsedFromImpact >= 0 && elapsedFromImpact <= shakeFrames) {
    decay = interpolate(elapsedFromImpact, [0, shakeFrames], [1, 0], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  // Shake vector (high-frequency noise x decay)
  const shakeX = (pseudoRand(frame, 1) - 0.5) * 2 * maxIntensity * decay;
  const shakeY = (pseudoRand(frame, 2) - 0.5) * 2 * maxIntensity * decay;
  const shakeRot = (pseudoRand(frame, 3) - 0.5) * 2 * 1.5 * decay; // max 1.5 degrees

  // Impact flash (white flash, then fades out)
  const flashOpacity = interpolate(
    elapsedFromImpact,
    [0, 3, 10],
    [0, 0.45, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Initial fade-in
  const introOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text is at rest before impact, slightly enlarged after
  const titleScale = interpolate(
    elapsedFromImpact,
    [0, 6, 18],
    [1, 1.08, 1.02],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeRot}deg)`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: background,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_EN,
            color: textColor,
            opacity: introOpacity,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Impact lines (radial, behind) */}
          {elapsedFromImpact >= 0 && elapsedFromImpact <= 30 ? (
            <ImpactRays
              accentColor={accentColor}
              progress={interpolate(elapsedFromImpact, [0, 30], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              width={width}
              height={height}
            />
          ) : null}

          <div
            style={{
              padding: "32px 64px",
              border: `6px solid ${accentColor}`,
              borderRadius: 8,
              transform: `scale(${titleScale})`,
              zIndex: 2,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                fontSize: width >= 1920 ? 124 : 84,
                fontWeight: 900,
                letterSpacing: 6,
                textAlign: "center",
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 36,
                fontSize: width >= 1920 ? 36 : 28,
                fontWeight: 600,
                letterSpacing: 3,
                color: accentColor,
                zIndex: 2,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      {/* Impact flash (front-most) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#ffffff",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export default CameraShake;
