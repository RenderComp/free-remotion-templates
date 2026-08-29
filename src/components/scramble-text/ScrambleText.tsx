// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Animation essence: a label fades in, then the main text decrypts
// character-by-character (left-to-right) while glyphs scramble through a
// charset; a scanline sweeps the text and a neon glow blooms once resolved.
// Fully self-contained: original `../types`, the shared `Scramble` atom,
// motion tokens, and layout constants are all inlined below.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 150;

export type ScrambleTextProps = {
  /** Main text (the decryption target) */
  text: string;
  /** Short label shown above the main text */
  label?: string;
  /** Background color */
  background: string;
  /** Main text color */
  textColor: string;
  /** Label color */
  labelColor: string;
  /** Scramble duration (in frames) */
  scrambleDuration: number;
  /** Charset used while scrambling */
  charset: string;
};

export const defaultScrambleTextProps: ScrambleTextProps = {
  text: "ACCESS GRANTED",
  label: "DECRYPTING",
  background: "#05080f",
  textColor: "#00ff9c",
  labelColor: "#7a9a8c",
  scrambleDuration: 60,
  charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+=?/<>",
};

const FONT_DISPLAY = '-apple-system, "Segoe UI", Roboto, sans-serif';
const FONT_MONO = '"SF Mono", "Menlo", "Consolas", monospace';

// --- inlined from shared/animations/tokens.ts (easing.out) ---
const EASE_OUT = Easing.out(Easing.ease);

// --- inlined deterministic pseudo-random (from shared Scramble atom) ---
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

// --- inlined helper: shift the lightness of a hex color ---
function shiftLightness(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(clean.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(clean.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(clean.slice(4, 6), 16) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// --- inlined sub-component: the Scramble atom (A-U13) ---
// Characters flicker randomly then resolve left-to-right to the final text.
type ScrambleProps = {
  text: string;
  delay?: number;
  duration?: number;
  charset?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
};

const Scramble: React.FC<ScrambleProps> = ({
  text,
  delay = 0,
  duration = 20,
  charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  fontSize = 48,
  color = "#ffffff",
  fontFamily = FONT_DISPLAY,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chars = text.split("");
  const resolvedCount = Math.floor(progress * chars.length);

  const displayChars = chars.map((ch, i) => {
    if (i < resolvedCount) return ch;
    if (ch === " ") return " ";
    const randIndex = Math.floor(
      seededRandom(frame * 31 + i * 97) * charset.length,
    );
    return charset[randIndex];
  });

  return (
    <span
      style={{
        fontSize,
        color,
        fontFamily,
        fontWeight: 700,
        letterSpacing: "0.02em",
        whiteSpace: "pre-wrap",
        lineBreak: "strict",
        overflowWrap: "break-word",
        wordBreak: "normal",
      }}
    >
      {displayChars.join("")}
    </span>
  );
};

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  label,
  background,
  textColor,
  labelColor,
  scrambleDuration,
  charset,
}) => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [0, 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow intensity after the text is fully decrypted
  const glowProgress = interpolate(
    frame,
    [scrambleDuration + 12, scrambleDuration + 24],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Scanline sweep animation
  const scanY = ((frame * 6) % 200) - 100;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        backgroundImage: `
          linear-gradient(180deg, ${background} 0%, ${shiftLightness(background, 8)} 100%),
          repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0,255,156,0.02) 3px, rgba(0,255,156,0.02) 4px)
        `,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {label ? (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 28,
            fontWeight: 500,
            color: labelColor,
            letterSpacing: 8,
            opacity: labelOpacity,
          }}
        >
          [ {label} ]
        </div>
      ) : null}

      <div
        style={{
          position: "relative",
          padding: "16px 48px",
          textShadow: `0 0 ${20 * glowProgress}px ${textColor}, 0 0 ${40 * glowProgress}px ${textColor}aa`,
        }}
      >
        <Scramble
          text={text}
          delay={14}
          duration={scrambleDuration}
          fontSize={180}
          color={textColor}
          fontFamily={FONT_DISPLAY}
          charset={charset}
        />
        {/* Scanline overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, transparent ${scanY - 4}%, ${textColor}22 ${scanY}%, transparent ${scanY + 4}%)`,
            pointerEvents: "none",
            opacity: 1 - glowProgress * 0.7,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default ScrambleText;
