// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// WhipPan — fast horizontal pan (with motion blur) that switches between scenes.
// Ported from rv-template-whip-pan (SlideIn translation + BlurIn visibility derivative).
// Self-contained: no external/shared imports beyond react + remotion.
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

const FONT_SANS = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Inlined from rv-template-whip-pan/src/types.ts
type WhipPanScene = {
  /** Background color (CSS color) */
  background: string;
  /** Main headline */
  title: string;
  /** Sub text */
  subtitle?: string;
  /** Title text color */
  textColor?: string;
};

export type WhipPanProps = {
  /** Scenes to switch between (at least 2) */
  scenes: WhipPanScene[];
  /** Pan direction (true = current slides left / false = slides right) */
  panLeft?: boolean;
  /** Extra blur amount applied during the pan */
  maxBlur?: number;
};

export const defaultWhipPanProps: WhipPanProps = {
  scenes: [
    { background: "#0f172a", title: "Discover", subtitle: "Stories that move", textColor: "#f1f5f9" },
    { background: "#7c3aed", title: "Create", subtitle: "Built for impact", textColor: "#ffffff" },
    { background: "#ea580c", title: "Deliver", subtitle: "Ready to ship", textColor: "#fff7ed" },
  ],
  panLeft: true,
  maxBlur: 24,
};

// Inlined scene pane sub-component
const ScenePane: React.FC<{
  scene: WhipPanScene;
  width: number;
  height: number;
}> = ({ scene, width, height }) => {
  const textColor = scene.textColor ?? "#ffffff";
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: scene.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
        color: textColor,
        gap: 28,
        padding: 80,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: width >= 1920 ? 132 : 92,
          fontWeight: 900,
          letterSpacing: 4,
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {scene.title}
      </div>
      {scene.subtitle ? (
        <div
          style={{
            fontSize: width >= 1920 ? 40 : 32,
            fontWeight: 500,
            letterSpacing: 2,
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          {scene.subtitle}
        </div>
      ) : null}
    </div>
  );
};

export const WhipPan: React.FC<WhipPanProps> = ({
  scenes,
  panLeft = true,
  maxBlur = 24,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const sceneCount = scenes.length;
  // Dwell time per scene (last scene only holds).
  // Structure: hold -> pan -> hold -> pan -> ... -> hold
  const segmentDuration = durationInFrames / sceneCount;
  const transitionFrames = segmentDuration * 0.4;

  // Determine the current scene index.
  const rawIndex = frame / segmentDuration;
  const currentIndex = Math.min(Math.floor(rawIndex), sceneCount - 1);
  const localFrame = frame - currentIndex * segmentDuration;
  // Transition happens in the back half of the segment (hold -> pan-out -> next).
  const transitionStart = segmentDuration - transitionFrames;

  // Next scene index.
  const nextIndex = Math.min(currentIndex + 1, sceneCount - 1);
  const isLastScene = currentIndex === sceneCount - 1;

  // Pan progress (0 = still, 1 = fully on the next scene).
  let panProgress = 0;
  if (!isLastScene && localFrame >= transitionStart) {
    panProgress = interpolate(
      localFrame,
      [transitionStart, segmentDuration],
      [0, 1],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  // Blur amount (peaks at maxBlur mid-pan).
  const blurAmount = Math.sin(panProgress * Math.PI) * maxBlur;

  // Pan direction: panLeft=true -> current slides left, next enters from the right.
  const direction = panLeft ? -1 : 1;
  const sceneWidth = width;

  // Current scene offset: 0 -> -width (when panLeft).
  const currentOffset = panProgress * sceneWidth * direction;
  // Next scene offset: width -> 0 (when panLeft).
  const nextOffset = (1 - panProgress) * sceneWidth * -direction;

  const currentScene = scenes[currentIndex];
  const nextScene = scenes[nextIndex];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${currentOffset}px)`,
          filter: `blur(${blurAmount}px)`,
        }}
      >
        <ScenePane scene={currentScene} width={width} height={height} />
      </div>
      {!isLastScene && panProgress > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${nextOffset}px)`,
            filter: `blur(${blurAmount}px)`,
          }}
        >
          <ScenePane scene={nextScene} width={width} height={height} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default WhipPan;
