// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Effect: book page-flip transition.
// The "before" page (current page) pivots on its left edge, rotating from
// rotateY 0 to -90deg, peeling away to reveal the "after" page (next page)
// underneath. The flip starts at frame 30 and completes at frame 75
// (delay 30 + duration 45). Implemented with CSS 3D rotateY + perspective,
// backface-visibility hidden, and an angle-based opacity falloff so the page
// fades as it approaches edge-on — no @keyframes, fully self-contained.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Scene-transition easing: accelerate then decelerate (inlined from the
// shared motion tokens — Easing.inOut(Easing.ease)).
const SCENE_EASING = Easing.inOut(Easing.ease);

// Flip choreography (shared by the page wrapper and the cast shadow so the
// lighting stays locked to the page angle).
const FLIP_DELAY = 30;
const FLIP_DURATION = 45;
// The page lifts slightly off the spine before the turn proper starts, so the
// opening second is not dead.
const PRE_LIFT_FRAMES = 16;

export type FlipPageTransitionProps = {
  colorBefore: string;
  colorAfter: string;
  labelBefore: string;
  labelAfter: string;
  textColor: string;
};

export const defaultFlipPageTransitionProps: FlipPageTransitionProps = {
  colorBefore: "#fefae0",
  colorAfter: "#283618",
  labelBefore: "Before",
  labelAfter: "After",
  textColor: "#283618",
};

// Full-screen color page with a centered label.
const PageLayer: React.FC<{
  bg: string;
  label: string;
  textColor: string;
}> = ({ bg, label, textColor }) => (
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
        fontSize: 180,
        fontWeight: 800,
        letterSpacing: 6,
        color: textColor,
        textShadow: "0 4px 24px rgba(0,0,0,0.15)",
      }}
    >
      {label}
    </div>
  </AbsoluteFill>
);

// Turn progress 0..1, shared by the page and by the shadow it casts.
// A short pre-lift phase (delay - PRE_LIFT_FRAMES .. delay) opens the page a
// few degrees before the turn proper.
const flipProgress = (frame: number, delay: number, duration: number): number =>
  interpolate(
    frame,
    [Math.max(0, delay - PRE_LIFT_FRAMES), delay, delay + duration],
    [0, 0.045, 1],
    {
      easing: SCENE_EASING,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

// Page-flip wrapper (inlined from the shared FlipPageTransition molecule).
// mode "exit": rotateY 0 -> 90 * sign over [delay, delay + duration].
// direction "left": pivots on the left edge (sign = -1, so angle goes 0 -> -90).
//
// Both wrapper layers are AbsoluteFill: the rotating layer must have an
// explicit box, otherwise it collapses to height 0 and the absolutely
// positioned page inside it is folded into a zero-height strip at the top
// (the page then never appears at all).
const FlipPage: React.FC<{
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  mode?: "enter" | "exit";
  direction?: "left" | "right";
  style?: React.CSSProperties;
}> = ({
  children,
  duration = 21,
  delay = 0,
  mode = "enter",
  direction = "left",
  style,
}) => {
  const frame = useCurrentFrame();

  const progress = flipProgress(frame, delay, duration);

  // Sign is chosen so the free edge of the page swings *away* from the camera:
  // the page foreshortens toward its pivot and uncovers the page underneath
  // along a clean straight edge. (Swinging toward the camera magnifies the page
  // instead, so it keeps covering the frame until it snaps edge-on.)
  const sign = direction === "left" ? 1 : -1;

  let rotateY: number;
  if (mode === "enter") {
    // -90deg (or 90deg) -> 0deg
    rotateY = sign * -90 * (1 - progress);
  } else {
    // 0deg -> 90deg (or -90deg)
    rotateY = sign * 90 * progress;
  }

  // Fade only as the page approaches edge-on (closer to 90deg = thinner
  // sliver). Stays fully opaque until then, so the page underneath never
  // ghosts through the flat page.
  const absAngle = Math.abs(rotateY);
  const opacity = interpolate(absAngle, [0, 72, 86, 90], [1, 1, 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const transformOrigin =
    direction === "left" ? "left center" : "right center";

  // The turning page catches less light toward its free edge.
  const shade = interpolate(absAngle, [0, 90], [0.02, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shadeDirection = direction === "left" ? "90deg" : "270deg";

  return (
    <AbsoluteFill
      style={{ perspective: 1600, perspectiveOrigin: "50% 50%", ...style }}
    >
      <AbsoluteFill
        style={{
          transform: `rotateY(${rotateY}deg)`,
          transformOrigin,
          backfaceVisibility: "hidden",
          opacity,
        }}
      >
        {children}
        <AbsoluteFill
          style={{
            background: `linear-gradient(${shadeDirection}, rgba(0,0,0,0) 0%, rgba(0,0,0,${shade.toFixed(3)}) 100%)`,
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const FlipPageTransition: React.FC<FlipPageTransitionProps> = ({
  colorBefore,
  colorAfter,
  labelBefore,
  labelAfter,
  textColor,
}) => {
  const frame = useCurrentFrame();

  // After-scene label color auto-inverts to stay legible on dark backgrounds.
  const afterTextColor =
    colorAfter === "#283618" || colorAfter === "#1a1a1a"
      ? "#fefae0"
      : textColor;

  // Same progress the page uses, so the shadow it casts tracks the turn.
  const progress = flipProgress(frame, FLIP_DELAY, FLIP_DURATION);
  // Shadow is strongest mid-turn (page standing up over the spine) and gone
  // once the page is edge-on.
  const shadowAlpha = interpolate(progress, [0, 0.15, 0.6, 1], [0, 0.34, 0.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shadowSpread = interpolate(progress, [0, 1], [18, 62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The revealed page settles after the turn finishes, so the hold is not
  // a hard freeze on the last third of the clip.
  const settle = interpolate(
    frame,
    [FLIP_DELAY + FLIP_DURATION * 0.4, DURATION_FRAMES - 12],
    [1.035, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colorAfter }}>
      {/* After scene (underneath, revealed as the page peels away). */}
      <AbsoluteFill style={{ transform: `scale(${settle.toFixed(4)})` }}>
        <PageLayer
          bg={colorAfter}
          label={labelAfter}
          textColor={afterTextColor}
        />
      </AbsoluteFill>

      {/* Shadow the turning page casts onto the page underneath. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,${shadowAlpha.toFixed(3)}) 0%, rgba(0,0,0,0) ${shadowSpread.toFixed(1)}%)`,
          pointerEvents: "none",
        }}
      />

      {/* Before scene: flips away on its left edge. */}
      <Sequence from={0} durationInFrames={DURATION_FRAMES}>
        <FlipPage
          mode="exit"
          direction="left"
          delay={FLIP_DELAY}
          duration={FLIP_DURATION}
        >
          <PageLayer
            bg={colorBefore}
            label={labelBefore}
            textColor={textColor}
          />
        </FlipPage>
      </Sequence>
    </AbsoluteFill>
  );
};

export default FlipPageTransition;
