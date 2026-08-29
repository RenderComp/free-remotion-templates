// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 110;

export type TextMaskRevealProps = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  lines: string[];
};

export const defaultTextMaskRevealProps: TextMaskRevealProps = {
  backgroundColor: "#050818",
  accentColor: "#22d3ee",
  textColor: "#ecfeff",
  lines: ["DESIGN", "IN", "MOTION"],
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Smooth ease for the block sweep.
const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const TextMaskReveal: React.FC<TextMaskRevealProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  lines,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const lineList = (lines && lines.length > 0 ? lines : ["REVEAL"]).map((l) =>
    String(l).toUpperCase()
  );
  const count = lineList.length;

  // Vertically centered stack, sized relative to canvas.
  const lineHeight = Math.round(height * 0.17);
  const fontSize = Math.round(lineHeight * 0.66);
  const stackHeight = lineHeight * count;
  const stackTop = (height - stackHeight) / 2;

  // Each line gets its own beat. Per-line cycle:
  //  - block sweeps in left->right covering the text (cover phase)
  //  - block sweeps out left->right revealing the text underneath (reveal phase)
  const beat = 22;
  const baseDelay = 8;
  const coverFrames = 11;
  const revealFrames = 13;

  // Background hairline accent that draws across once all lines start.
  const lastLineStart = baseDelay + (count - 1) * beat;
  const ruleProgress = interpolate(
    frame,
    [lastLineStart, lastLineStart + 22],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Gentle end fade so the terminal frame is never abrupt or blank.
  const fadeOut = interpolate(
    frame,
    [DURATION_FRAMES - 10, DURATION_FRAMES],
    [1, 0.9],
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
      {/* Ambient corner glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 18% 22%, ${accentColor}22 0%, ${accentColor}00 50%)`,
        }}
      />

      {/* Horizontal rule that draws under the stack after the lines land */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: stackTop + stackHeight + lineHeight * 0.18,
          height: Math.max(3, Math.round(height * 0.004)),
          width: Math.round(width * 0.62) * ruleProgress,
          transform: "translateX(-50%)",
          background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
          borderRadius: 999,
          opacity: 0.85 * ruleProgress,
        }}
      />

      {lineList.map((line, i) => {
        const start = baseDelay + i * beat;
        const local = frame - start;

        // Cover phase: 0 -> 1 as the block sweeps across to fully mask text.
        const coverRaw = interpolate(local, [0, coverFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const cover = easeInOut(coverRaw);

        // Reveal phase: 0 -> 1 as the block exits, uncovering the text.
        const revealRaw = interpolate(
          local,
          [coverFrames, coverFrames + revealFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const reveal = easeInOut(revealRaw);

        // Text becomes visible (clip-wiped) in step with the block exit.
        // Until the block has covered the line, text stays hidden.
        const textWipe = local < coverFrames ? 0 : reveal;
        const textVisiblePct = Math.round(textWipe * 100);

        // The color block: left edge follows the reveal sweep, right edge
        // follows the cover sweep. While covering, left stays at 0 and the
        // right edge advances. While revealing, the right edge is at 100 and
        // the left edge advances, so the block slides off to the right.
        const blockLeftPct = Math.round(reveal * 100);
        const blockRightPct = Math.round((1 - cover) * 100);
        const blockVisible = local >= 0 && local <= coverFrames + revealFrames + 2;

        const top = stackTop + i * lineHeight;

        // Slight settle on the revealed text.
        const dy = interpolate(textWipe, [0, 1], [lineHeight * 0.06, 0]);

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
            }}
          >
            {/* Revealed text, clip-wiped left -> right in sync with block exit */}
            <span
              style={{
                fontSize,
                fontWeight: 800,
                letterSpacing: Math.round(fontSize * 0.02),
                lineHeight: 1,
                color: textColor,
                transform: `translateY(${dy}px)`,
                WebkitClipPath: `inset(0 ${100 - textVisiblePct}% 0 0)`,
                clipPath: `inset(0 ${100 - textVisiblePct}% 0 0)`,
              }}
            >
              {line}
            </span>

            {/* Sliding color block mask sitting over the text line */}
            {blockVisible && blockRightPct > blockLeftPct ? (
              <div
                style={{
                  position: "absolute",
                  top: lineHeight * 0.12,
                  bottom: lineHeight * 0.12,
                  left: `${blockLeftPct}%`,
                  right: `${blockRightPct}%`,
                  background: accentColor,
                  borderRadius: Math.round(fontSize * 0.06),
                  boxShadow: `0 0 ${Math.round(fontSize * 0.3)}px ${accentColor}66`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export default TextMaskReveal;
