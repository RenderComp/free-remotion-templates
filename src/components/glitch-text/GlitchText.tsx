// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

// Western font stack (self-contained, no external CDN)
const FONT_EN = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type GlitchTextProps = {
  /** Text to display */
  text: string;
  /** Center color of the R/G/B layers (main text color) */
  glitchColor: string;
  /** Glitch strength (0 = still / 1 = max offset) */
  intensity: number;
  /** Background color */
  backgroundColor: string;
  /** Font size (px) */
  fontSize: number;
  /** Total duration (seconds) */
  duration: number;
};

export const defaultGlitchTextProps: GlitchTextProps = {
  text: "OVERDRIVE",
  glitchColor: "#FFFFFF",
  intensity: 0.8,
  backgroundColor: "#0A0A0F",
  fontSize: 220,
  duration: 4,
};

/**
 * Glitch text reveal.
 *
 * - Stacks R/G/B layers and offsets each layer with frame-driven randomness
 * - random(seed) gives reproducible random values (Remotion built-in)
 * - Uses only useCurrentFrame() + interpolate() (no CSS transition / keyframes)
 * - System fonts only (no external CDN reference)
 */
export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  glitchColor,
  intensity,
  backgroundColor,
  fontSize,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = Math.max(1, Math.floor(duration * fps));

  // Opacity rises during the reveal (kept short — the type should land fast)
  const appearFrames = Math.floor(fps * 0.4);
  const opacity = interpolate(frame, [0, appearFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Glitch exposure -------------------------------------------------------
  // The glitch used to run at full strength for 0.4s and then decay to a barely visible
  // residual, leaving ~3s of still type: the effect was over before the word was readable.
  // Now the hot phase lasts 1.2s, the residual floor is high enough to stay legible as
  // motion, and irregular bursts re-fire through the hold so the vocabulary keeps reading.
  const hotFrames = Math.floor(fps * 1.2);
  const decayFrames = Math.floor(fps * 0.7);
  const residual = 0.45;

  const baseAmount =
    frame < hotFrames
      ? 1.0
      : interpolate(frame, [hotFrames, hotFrames + decayFrames], [1.0, residual], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Irregular re-fire: one short burst per period, gated by a seeded draw so the rhythm
  // never reads as a metronome.
  const burstPeriod = Math.max(4, Math.floor(fps * 0.7));
  const burstLen = Math.max(2, Math.floor(fps * 0.16));
  const burstIndex = Math.floor(frame / burstPeriod);
  const framesIntoBurst = frame - burstIndex * burstPeriod;
  const burstFiring =
    framesIntoBurst < burstLen && random(`burst-${burstIndex}`) > 0.3;

  const phaseMultiplier = burstFiring ? Math.max(baseAmount, 1.0) : baseAmount;
  const tearing = phaseMultiplier > 0.75;

  // Fade out (last 0.3s)
  const fadeOut = interpolate(
    frame,
    [totalFrames - Math.floor(fps * 0.3), totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Re-seed every 3 frames (every 2 while a burst fires) for a stuttering glitch feel
  const seed = Math.floor(frame / (burstFiring ? 2 : 3));
  const maxOffset = 18 * intensity * phaseMultiplier;

  const rOffsetX = (random(`r-x-${seed}`) - 0.5) * 2 * maxOffset;
  const rOffsetY = (random(`r-y-${seed}`) - 0.5) * 2 * (maxOffset * 0.4);
  const bOffsetX = (random(`b-x-${seed}`) - 0.5) * 2 * maxOffset;
  const bOffsetY = (random(`b-y-${seed}`) - 0.5) * 2 * (maxOffset * 0.4);

  // Horizontal slice shift
  const sliceShift =
    (random(`slice-${seed}`) - 0.5) * 2 * (8 * intensity * phaseMultiplier);

  // Main text color (center layer)
  const centerColor = glitchColor;

  const textStyleBase: React.CSSProperties = {
    position: "absolute",
    fontFamily: FONT_EN,
    fontSize,
    fontWeight: 900,
    letterSpacing: "0.04em",
    margin: 0,
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  // The R/G/B stack, reused by the main render and by each displaced tear band.
  const stack = (extraX: number) => (
    <div
      style={{
        position: "relative",
        transform: `translateX(${sliceShift + extraX}px)`,
      }}
    >
      {/* R layer */}
      <span
        style={{
          ...textStyleBase,
          color: "#FF0033",
          mixBlendMode: "screen",
          transform: `translate(${rOffsetX}px, ${rOffsetY}px)`,
        }}
      >
        {text}
      </span>
      {/* B layer */}
      <span
        style={{
          ...textStyleBase,
          color: "#00E0FF",
          mixBlendMode: "screen",
          transform: `translate(${bOffsetX}px, ${bOffsetY}px)`,
        }}
      >
        {text}
      </span>
      {/* Main layer (center) */}
      <span
        style={{
          ...textStyleBase,
          color: centerColor,
          position: "relative",
          textShadow: `${rOffsetX * 0.3}px 0 0 #FF003366, ${
            bOffsetX * 0.3
          }px 0 0 #00E0FF66`,
        }}
      >
        {text}
      </span>
    </div>
  );

  // Horizontal tear bands, sized off the type (not off the frame) so they keep cutting
  // through the glyphs at any fontSize. Each band paints the background opaquely and then
  // redraws the word displaced, so it reads as torn scan blocks rather than a double image.
  const bands = [
    { top: -0.34 * fontSize, h: 0.13 * fontSize },
    { top: -0.1 * fontSize, h: 0.12 * fontSize },
    { top: 0.14 * fontSize, h: 0.13 * fontSize },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        opacity: opacity * fadeOut,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {stack(0)}
      </AbsoluteFill>

      {tearing
        ? bands.map((band, i) => (
            <AbsoluteFill
              key={`tear-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor,
                clipPath: `inset(calc(50% + ${band.top}px) 0 calc(50% - ${
                  band.top + band.h
                }px) 0)`,
              }}
            >
              {stack(
                (random(`tear-${i}-${seed}`) - 0.5) * 2 * maxOffset * 2.4
              )}
            </AbsoluteFill>
          ))
        : null}
    </AbsoluteFill>
  );
};

export default GlitchText;
