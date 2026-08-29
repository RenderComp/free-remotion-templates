// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Animation essence: each character of the headline rides a continuous sine
// wave (per-character phase offset) while fading in, then a spaced-out
// subtitle slides up and fades in beneath it over a vertical gradient.
// Fully self-contained: the original shared `WaveText` atom, motion tokens,
// `../types`, and the `shade()` color helper are all inlined below — no
// external/relative imports beyond react + remotion.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 150;

export type WaveTextProps = {
  /** Main headline text */
  text: string;
  /** Optional subtitle shown below the headline */
  subText?: string;
  /** Background color (top of the vertical gradient) */
  background: string;
  /** Headline text color */
  textColor: string;
  /** Subtitle text color */
  subTextColor: string;
  /** Wave amplitude (px) */
  amplitude: number;
  /** Wave speed (smaller = faster) */
  waveSpeed: number;
  /** Wavelength — per-character phase difference */
  wavelength: number;
};

export const defaultWaveTextProps: WaveTextProps = {
  text: "WAVE",
  subText: "Shape the Future",
  background: "#0c2342",
  textColor: "#ffffff",
  subTextColor: "#7fb3ff",
  amplitude: 18,
  waveSpeed: 28,
  wavelength: 0.55,
};

const FONT_FAMILY = '-apple-system, "Segoe UI", Roboto, sans-serif';

/** Adjust a HEX color's brightness by a percentage (-100..100). */
function shade(hex: string, percent: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = Math.max(
    0,
    Math.min(255, ((num >> 16) & 0xff) + Math.round((percent / 100) * 255)),
  );
  const g = Math.max(
    0,
    Math.min(255, ((num >> 8) & 0xff) + Math.round((percent / 100) * 255)),
  );
  const b = Math.max(
    0,
    Math.min(255, (num & 0xff) + Math.round((percent / 100) * 255)),
  );
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Inlined shared WaveText atom: each character oscillates on a sine wave with
 * a per-character phase offset, while the whole word fades in.
 */
const WaveWord: React.FC<{
  text: string;
  delay?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  amplitude?: number;
  waveSpeed?: number;
  wavelength?: number;
  fontFamily?: string;
}> = ({
  text,
  delay = 0,
  duration = 18,
  fontSize = 140,
  color = "#ffffff",
  amplitude = 18,
  waveSpeed = 28,
  wavelength = 0.55,
  fontFamily = FONT_FAMILY,
}) => {
  const frame = useCurrentFrame();

  // Fade-in (original token: easing.out = Easing.out(Easing.ease))
  const fadeIn = interpolate(frame, [delay, delay + duration], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chars = text.split("");

  return (
    <span
      style={{
        display: "inline-flex",
        fontSize,
        fontFamily,
        fontWeight: 700,
        color,
        opacity: fadeIn,
      }}
    >
      {chars.map((char, i) => {
        const phase = ((frame - delay) / waveSpeed) * Math.PI * 2;
        const charPhase = i * wavelength;
        const y = Math.sin(phase + charPhase) * amplitude * fadeIn;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${y}px)`,
              whiteSpace: char === " " ? "pre" : undefined,
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

export const WaveText: React.FC<WaveTextProps> = ({
  text,
  subText,
  background,
  textColor,
  subTextColor,
  amplitude,
  waveSpeed,
  wavelength,
}) => {
  const frame = useCurrentFrame();

  const subOpacity = interpolate(frame, [24, 40], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subTranslate = interpolate(frame, [24, 40], [16, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${background} 0%, ${shade(
          background,
          -15,
        )} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}
    >
      <WaveWord
        text={text}
        delay={0}
        duration={18}
        fontSize={140}
        color={textColor}
        amplitude={amplitude}
        waveSpeed={waveSpeed}
        wavelength={wavelength}
        fontFamily={FONT_FAMILY}
      />
      {subText ? (
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 40,
            fontWeight: 500,
            color: subTextColor,
            letterSpacing: 6,
            opacity: subOpacity,
            transform: `translateY(${subTranslate}px)`,
          }}
        >
          {subText}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default WaveText;
