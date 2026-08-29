// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Effect: 3D card-flip transition.
// The whole screen is treated as one card rotating 0deg -> 180deg around the Y axis.
// At the 90deg midpoint the front/back faces swap. The before scene shows from 0-90deg,
// the after scene from 90-180deg (rotateY 180 makes it face front). Starts at 30f, completes at 75f.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 120;

const FONT_EN = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type CardFlipTransitionProps = {
  colorBefore: string;
  colorAfter: string;
  labelBefore: string;
  labelAfter: string;
  textColor: string;
  /**
   * Stage colour behind the card. Perspective shrinks the card as it turns, so the frame is
   * not fully covered mid-flip; this base layer is what shows through instead of raw black.
   */
  backdropColor?: string;
};

const DEFAULT_BACKDROP = "#14141f";

export const defaultCardFlipTransitionProps: CardFlipTransitionProps = {
  colorBefore: "#22223b",
  colorAfter: "#9a8c98",
  labelBefore: "Before",
  labelAfter: "After",
  textColor: "#ffffff",
  backdropColor: DEFAULT_BACKDROP,
};

const Face: React.FC<{
  bg: string;
  label: string;
  textColor: string;
  rotateY: number;
}> = ({ bg, label, textColor, rotateY }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backfaceVisibility: "hidden",
      transform: `rotateY(${rotateY}deg)`,
    }}
  >
    <div
      style={{
        fontFamily: FONT_EN,
        fontSize: 180,
        fontWeight: 800,
        letterSpacing: 6,
        color: textColor,
        textShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {label}
    </div>
  </div>
);

export const CardFlipTransition: React.FC<CardFlipTransitionProps> = ({
  colorBefore,
  colorAfter,
  labelBefore,
  labelAfter,
  textColor,
  backdropColor = DEFAULT_BACKDROP,
}) => {
  const frame = useCurrentFrame();

  // 30f -> 75f rotates 0 -> 180deg
  const rotateY = interpolate(frame, [30, 75], [0, 180], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 1 = card is face-on, 0 = card is edge-on. Drives the stage lighting and the contact
  // shadow so the exposed backdrop reads as a lit stage rather than a hole in the frame.
  const faceOn = Math.abs(Math.cos((rotateY * Math.PI) / 180));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backdropColor,
        perspective: 2200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Stage wash: keeps the revealed backdrop from reading as flat black */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 45%, transparent 70%)",
        }}
      />
      {/* Contact shadow: widest when the card faces us, collapses as it turns edge-on */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "76%",
          width: "78%",
          height: "16%",
          marginLeft: "-39%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 72%)",
          transform: `scaleX(${0.25 + faceOn * 0.75})`,
          opacity: 0.5 + faceOn * 0.35,
          filter: "blur(18px)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotateY}deg)`,
        }}
      >
        {/* Front face: before scene */}
        <Face
          bg={colorBefore}
          label={labelBefore}
          textColor={textColor}
          rotateY={0}
        />
        {/* Back face: after scene (rotated 180 to face front) */}
        <Face
          bg={colorAfter}
          label={labelAfter}
          textColor={textColor}
          rotateY={180}
        />
      </div>
    </AbsoluteFill>
  );
};

export default CardFlipTransition;
