// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Reverse-shatter reveal: fragments start scattered/rotated and converge into a
// single picture tile, then an accent bar wipes in and a subtitle fades up.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Deterministic seeded PRNG (LCG) so the scatter layout is stable per render.
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type ShatterRevealProps = {
  /** Main headline shown on the reassembled tile */
  title: string;
  /** Sub line revealed at the bottom (empty string hides it) */
  subtitle: string;
  /** Number of fragments the tile shatters into */
  pieces: number;
  /** Maximum scatter distance in px */
  spread: number;
  /** Headline text color */
  textColor: string;
  /** Scene background color */
  background: string;
  /** Tile background (gradient or solid) */
  tileBackground: string;
  /** Accent bar color */
  accentColor: string;
};

export const defaultShatterRevealProps: ShatterRevealProps = {
  title: "Reveal",
  subtitle: "Fragments converge into focus",
  pieces: 36,
  spread: 280,
  textColor: "#ffffff",
  background: "#050913",
  tileBackground:
    "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #db2777 100%)",
  accentColor: "#facc15",
};

export const ShatterReveal: React.FC<ShatterRevealProps> = ({
  title,
  subtitle,
  pieces,
  spread,
  textColor,
  background,
  tileBackground,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = Math.min(width, height);

  // --- Shatter atom timing (delay=2, duration=48, ease-out) ---
  const SHATTER_DELAY = 2;
  const SHATTER_DURATION = 48;
  const progress = interpolate(
    frame,
    [SHATTER_DELAY, SHATTER_DELAY + SHATTER_DURATION],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // --- Lower-third reveals ---
  const subtitleOpacity = interpolate(frame, [60, 90], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barScale = interpolate(frame, [70, 100], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Build the deterministic fragment grid (inlined from the shared atom).
  const safePieces = Math.max(1, Math.floor(pieces));
  const rand = seededRandom(42);
  const cols = Math.ceil(Math.sqrt(safePieces));
  const rows = Math.ceil(safePieces / cols);
  const pieceWidth = 100 / cols;
  const pieceHeight = 100 / rows;

  const fragments = Array.from({ length: safePieces }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const offsetX = (rand() - 0.5) * 2 * spread * (1 - progress);
    const offsetY = (rand() - 0.5) * 2 * spread * (1 - progress);
    const rotation = (rand() - 0.5) * 360 * (1 - progress);
    return { key: i, col, row, offsetX, offsetY, rotation };
  });

  // The original framed the tile with an inset of 80px on a 1080-tall canvas
  // (~7.4%). Keep it proportional so the layout scales with the canvas.
  const inset = scale * 0.074;

  // The tile reassembles a single picture: each fragment is a window onto the
  // full tile, repositioned/rotated by its scatter offset.
  const tileContent = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: tileBackground,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: scale * 0.26,
          fontWeight: 900,
          color: textColor,
          letterSpacing: scale * 0.013,
          lineHeight: 1,
          textShadow: "0 6px 30px rgba(0,0,0,0.3)",
        }}
      >
        {title}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background }}>
      <div
        style={{
          position: "absolute",
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {fragments.map((frag) => (
            <div
              key={frag.key}
              style={{
                position: "absolute",
                left: `${frag.col * pieceWidth}%`,
                top: `${frag.row * pieceHeight}%`,
                width: `${pieceWidth}%`,
                height: `${pieceHeight}%`,
                overflow: "hidden",
                opacity: progress,
                transform: `translate(${frag.offsetX}px, ${frag.offsetY}px) rotate(${frag.rotation}deg)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `-${frag.col * 100}%`,
                  top: `-${frag.row * 100}%`,
                  width: `${cols * 100}%`,
                  height: `${rows * 100}%`,
                }}
              >
                {tileContent}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: scale * 0.017,
          padding: scale * 0.059,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: scale * 0.222,
            height: scale * 0.0046,
            background: accentColor,
            transform: `scaleX(${barScale})`,
            transformOrigin: "left center",
          }}
        />
        {subtitle ? (
          <div
            style={{
              fontFamily: FONT,
              fontSize: scale * 0.03,
              color: textColor,
              opacity: subtitleOpacity * 0.85,
              letterSpacing: scale * 0.0037,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ShatterReveal;
