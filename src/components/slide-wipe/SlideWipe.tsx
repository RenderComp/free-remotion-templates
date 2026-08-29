// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
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

export type SlideWipeProps = {
  colorBefore: string;
  colorAfter: string;
  labelBefore: string;
  labelAfter: string;
  textColor: string;
  /** Base layer behind the sliding pages — never let raw black show through. */
  backdropColor?: string;
};

const DEFAULT_BACKDROP = "#0a1626";

export const defaultSlideWipeProps: SlideWipeProps = {
  colorBefore: "#0d4f8b",
  colorAfter: "#ffb703",
  labelBefore: "Before",
  labelAfter: "After",
  textColor: "#ffffff",
  backdropColor: DEFAULT_BACKDROP,
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Shared timing for the wipe (inlined from the original SlideWipeScene):
// the transition begins at frame 30 and completes at frame 75.
const DELAY = 30;
const TRANSITION = 45;

// Easing inlined from the original shared tokens: easing.inOut === Easing.inOut(Easing.ease).
const EASE_IN_OUT = Easing.inOut(Easing.ease);

// A single full-screen colored page with a large centered label.
// Mirrors the original PageLayer (full-bleed background + bold display label).
const PageLayer: React.FC<{
  bg: string;
  label: string;
  textColor: string;
}> = ({ bg, label, textColor }) => {
  const { height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: height * 0.166, // ~180px at 1080p, preserves the original ratio
          fontWeight: 800,
          letterSpacing: 6,
          color: textColor,
          textShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

// Inlined SlideTransition logic.
// exit-left:  translateX(-progress * 100%)
// enter-right: translateX(-(1 - progress) * 100%)
export const SlideWipe: React.FC<SlideWipeProps> = ({
  colorBefore,
  colorAfter,
  labelBefore,
  labelAfter,
  textColor,
  backdropColor = DEFAULT_BACKDROP,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [DELAY, DELAY + TRANSITION],
    [0, 1],
    {
      easing: EASE_IN_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Outgoing "before" scene slides off to the left.
  const exitX = -progress * 100;
  // Incoming "after" scene slides in from the right. It must be +(1 - progress): with the
  // sign flipped it entered from the left, stacked on top of the outgoing page and left the
  // right-hand side of the frame uncovered (raw backdrop) for the whole transition.
  // At +(1 - progress) the two pages abut exactly and always cover the frame together.
  const enterX = (1 - progress) * 100;

  return (
    <AbsoluteFill style={{ backgroundColor: backdropColor, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${exitX}%)` }}>
        <PageLayer bg={colorBefore} label={labelBefore} textColor={textColor} />
      </AbsoluteFill>

      <AbsoluteFill style={{ transform: `translateX(${enterX}%)` }}>
        <PageLayer bg={colorAfter} label={labelAfter} textColor={textColor} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SlideWipe;
