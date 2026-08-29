// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// TransitionCircleWipe — centred circular (iris) wipe between two scenes.
// Scene 01 holds under a slow push, then an accent-edged iris opens from the
// centre and Scene 02 is revealed *through* it — so the destination is on
// screen from the first frame of the wipe and is held to the last frame.
// Scene 02 has its own ground (base pushed toward the accent) and an accent
// rule that draws out as it settles, so the landing reads as a second scene
// rather than a flood of the wipe colour.
// All phases are fractions of the composition duration, so the clip retimes
// itself if the duration changes.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 90;

export type TransitionCircleWipeProps = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fromLabel: string;
  toLabel: string;
};

export const defaultTransitionCircleWipeProps: TransitionCircleWipeProps = {
  backgroundColor: "#0b0f1a",
  accentColor: "#6366f1",
  textColor: "#eef2ff",
  fromLabel: "Scene 01",
  toLabel: "Scene 02",
};

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Phase boundaries as fractions of the clip.
const IRIS_START = 0.16;
const IRIS_END = 0.66;
const RULE_START = 0.44;
const RULE_END = 0.94;

// --- colour helpers (hex only; falls back to the input on anything unparsable)
const parseHex = (hex: string): [number, number, number] | null => {
  const h = hex.trim().replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

/** Mix two colours; t = 0 returns a, t = 1 returns b. */
const mixHex = (a: string, b: string, t: number): string => {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  const out = ca.map((v, i) =>
    Math.max(0, Math.min(255, Math.round(v + (cb[i] - v) * t))),
  );
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
};

export const TransitionCircleWipe: React.FC<TransitionCircleWipeProps> = ({
  backgroundColor,
  accentColor,
  textColor,
  fromLabel,
  toLabel,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const scale = Math.min(width, height);
  const last = Math.max(1, durationInFrames - 1);
  const at = (fraction: number) => fraction * last;

  // The iris must clear the frame corners to hand the frame over completely.
  const maxRadius = Math.sqrt(width * width + height * height) / 2;

  const iris = interpolate(frame, [at(IRIS_START), at(IRIS_END)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const irisRadius = iris * maxRadius * 1.04;

  // Accent edge riding the iris front: thick on the way out, thinning as it
  // clears the frame.
  const edgeWidth = interpolate(iris, [0, 1], [scale * 0.05, scale * 0.014], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const edgeOpacity = interpolate(iris, [0, 0.04, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow push on the outgoing scene so the opening hold is not frozen.
  const push = interpolate(frame, [0, last], [1, 1.035], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The accent rule under the incoming label draws out through the landing.
  const ruleProgress = interpolate(frame, [at(RULE_START), at(RULE_END)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Scene 02 ground: the base colour pushed toward the accent, so the landing
  // reads as a different scene and not as the wipe colour flooding the frame.
  const sceneTwoBase = mixHex(backgroundColor, accentColor, 0.26);
  const sceneTwoEdge = mixHex(backgroundColor, accentColor, 0.07);
  const labelSize = scale * 0.075;

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontSize: labelSize,
    fontWeight: 800,
    color: textColor,
    letterSpacing: scale * 0.004,
  };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* --- Scene 01 (outgoing) --- */}
      <AbsoluteFill
        style={{
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${push.toFixed(4)})`,
        }}
      >
        <div style={labelStyle}>{fromLabel}</div>
      </AbsoluteFill>

      {/* --- Scene 02 (incoming), revealed through the iris --- */}
      <AbsoluteFill
        style={{
          clipPath: `circle(${Math.max(0, irisRadius).toFixed(1)}px at 50% 50%)`,
          WebkitClipPath: `circle(${Math.max(0, irisRadius).toFixed(1)}px at 50% 50%)`,
        }}
      >
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 42%, ${sceneTwoBase} 0%, ${sceneTwoEdge} 78%)`,
          }}
        />
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: labelSize * 0.34,
            }}
          >
            <div style={labelStyle}>{toLabel}</div>
            <div
              style={{
                width: ruleProgress * labelSize * 5,
                height: Math.max(2, scale * 0.005),
                backgroundColor: accentColor,
              }}
            />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* --- Accent edge on the iris front --- */}
      {edgeOpacity > 0.001 && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <circle
            cx={width / 2}
            cy={height / 2}
            r={Math.max(0, irisRadius - edgeWidth / 2)}
            fill="none"
            stroke={accentColor}
            strokeWidth={edgeWidth}
            opacity={edgeOpacity}
          />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export default TransitionCircleWipe;
