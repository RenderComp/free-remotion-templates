// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// SplitScreen — splits the frame into two contrasting panels shown side by side.
// Each panel reveals via an animated clip-path wipe, a divider line snaps in at
// the midpoint, and the panel headings/sub-text fade + rise into place.
//
// Self-contained port of the rv-template "SplitScreenScene":
//   - original imported a shared SplitScreen organism (clip-path reveal + divider)
//   - and motion tokens (easing.out = Easing.out(Easing.ease))
// Both are inlined below; no external/relative imports beyond react + remotion.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";

export const FPS = 30;
export const DURATION_FRAMES = 150;

// Latin display font stack (no external CDN fonts).
const FONT_LATIN = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Inlined motion token: easing.out — decelerate-to-arrival entrance.
const EASE_OUT = Easing.out(Easing.ease);

// ---- Props -----------------------------------------------------------------

type SplitScreenPanel = {
  /** Panel heading text */
  heading: string;
  /** Optional sub text */
  sub?: string;
  /** Background color */
  bg: string;
  /** Text color */
  textColor: string;
};

export type SplitScreenProps = {
  /** Split direction */
  direction: "horizontal" | "vertical";
  /** Left/top panel */
  panelA: SplitScreenPanel;
  /** Right/bottom panel */
  panelB: SplitScreenPanel;
  /** Divider line color */
  dividerColor: string;
  /** Divider line width (px) */
  dividerWidth: number;
  /**
   * Base layer behind the two panels. The clip-path reveal deliberately leaves the middle of
   * the frame uncovered until both halves have opened, so something has to sit under it —
   * without this the opening second and a half is raw black.
   */
  backdropColor?: string;
};

const DEFAULT_BACKDROP = "#0b1220";

export const defaultSplitScreenProps: SplitScreenProps = {
  direction: "horizontal",
  panelA: {
    heading: "Before",
    sub: "The old way",
    bg: "#1f2937",
    textColor: "#f1f5f9",
  },
  panelB: {
    heading: "After",
    sub: "Powered by AI",
    bg: "#0ea5e9",
    textColor: "#ffffff",
  },
  dividerColor: "#fbbf24",
  dividerWidth: 6,
  backdropColor: DEFAULT_BACKDROP,
};

// ---- Inlined SplitScreen reveal organism -----------------------------------
// Reveals each half via clip-path inset; the central divider scales + fades in
// at the midpoint of the animation. `children` is expected to be two elements
// (first = left/top, second = right/bottom).

type SplitScreenRevealProps = {
  direction?: "horizontal" | "vertical";
  delay?: number;
  duration?: number;
  dividerColor?: string;
  dividerWidth?: number;
  children: ReactNode;
  style?: CSSProperties;
};

const SplitScreenReveal: React.FC<SplitScreenRevealProps> = ({
  direction = "horizontal",
  delay = 0,
  duration = 21,
  dividerColor = "#ffffff",
  dividerWidth = 4,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const isHorizontal = direction === "horizontal";

  const childArray = React.Children.toArray(children);
  const first = childArray[0] ?? null;
  const second = childArray[1] ?? null;

  // Phase 1: first side reveals (0 -> 0.5 of duration)
  // Phase 2: second side reveals (0.5 -> 1 of duration)
  const halfDur = duration / 2;

  const firstProgress = interpolate(
    frame,
    [delay, delay + halfDur],
    [0, 1],
    { easing: EASE_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const secondProgress = interpolate(
    frame,
    [delay + halfDur, delay + duration],
    [0, 1],
    { easing: EASE_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Divider entrance.
  const dividerOpacity = interpolate(
    frame,
    [delay + halfDur - 3, delay + halfDur + 3],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const dividerScale = interpolate(
    frame,
    [delay + halfDur - 3, delay + halfDur + 6],
    [0, 1],
    { easing: EASE_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // clipPath for each side.
  const firstClip = isHorizontal
    ? `inset(0 ${(1 - firstProgress) * 50}% 0 0)`
    : `inset(0 0 ${(1 - firstProgress) * 50}% 0)`;

  const secondClip = isHorizontal
    ? `inset(0 0 0 ${(1 - secondProgress) * 50}%)`
    : `inset(${(1 - secondProgress) * 50}% 0 0 0)`;

  const panelBase: CSSProperties = {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  const firstPanel: CSSProperties = isHorizontal
    ? { ...panelBase, top: 0, left: 0, width: "50%", height: "100%" }
    : { ...panelBase, top: 0, left: 0, width: "100%", height: "50%" };

  const secondPanel: CSSProperties = isHorizontal
    ? { ...panelBase, top: 0, right: 0, width: "50%", height: "100%" }
    : { ...panelBase, bottom: 0, left: 0, width: "100%", height: "50%" };

  const dividerStyle: CSSProperties = isHorizontal
    ? {
        position: "absolute",
        top: 0,
        left: "50%",
        width: dividerWidth,
        height: "100%",
        backgroundColor: dividerColor,
        transform: `translateX(-50%) scaleY(${dividerScale})`,
        transformOrigin: "center",
        opacity: dividerOpacity,
        zIndex: 2,
      }
    : {
        position: "absolute",
        left: 0,
        top: "50%",
        width: "100%",
        height: dividerWidth,
        backgroundColor: dividerColor,
        transform: `translateY(-50%) scaleX(${dividerScale})`,
        transformOrigin: "center",
        opacity: dividerOpacity,
        zIndex: 2,
      };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <div style={{ ...firstPanel, clipPath: firstClip }}>{first}</div>
      <div style={dividerStyle} />
      <div style={{ ...secondPanel, clipPath: secondClip }}>{second}</div>
    </div>
  );
};

// ---- Panel content ---------------------------------------------------------
// Heading + optional sub-text that fades and rises into view.

const Panel: React.FC<{
  heading: string;
  sub?: string;
  bg: string;
  textColor: string;
  appearStart: number;
}> = ({ heading, sub, bg, textColor, appearStart }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [appearStart, appearStart + 14],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const y = interpolate(
    frame,
    [appearStart, appearStart + 14],
    [24, 0],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: FONT_LATIN,
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: textColor,
          letterSpacing: 4,
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        {heading}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: textColor,
            opacity: opacity * 0.85,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

// ---- Main composition ------------------------------------------------------

export const SplitScreen: React.FC<SplitScreenProps> = ({
  direction,
  panelA,
  panelB,
  dividerColor,
  dividerWidth,
  backdropColor = DEFAULT_BACKDROP,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: backdropColor }}>
      {/* Soft centre wash so the not-yet-revealed strip reads as a lit stage */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 68%)",
        }}
      />
      <SplitScreenReveal
        direction={direction}
        delay={6}
        duration={36}
        dividerColor={dividerColor}
        dividerWidth={dividerWidth}
      >
        <Panel {...panelA} appearStart={22} />
        <Panel {...panelB} appearStart={40} />
      </SplitScreenReveal>
    </AbsoluteFill>
  );
};

export default SplitScreen;
