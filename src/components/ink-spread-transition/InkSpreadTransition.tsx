// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// InkSpreadTransition — Japanese-style ink-bleed scene transition.
// The "before" page is covered by ink (the after-scene color) spreading from
// multiple droplets, then the "after" scene lands once the ink has fully
// spread. Re-creates the original rv-template effect (M-B03 InkSpreadTransition
// molecule + scene), fully self-contained (no shared/external imports).
//
// The ink is drawn as SVG droplets through a gooey filter chain
// (blur -> alpha threshold -> turbulent displacement -> feather), so droplets
// merge into one another and the front has a ragged, bleeding edge instead of
// hard geometric circles. A wider, softer copy of the same droplets is drawn
// underneath as the wicking halo.
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

// Choreography: the ink starts early enough that the opening is not dead, and
// finishes with a third of the clip left so the after-scene actually lands and
// is held to the final frame (the last frame is the catalog thumbnail).
// The after-scene starts bleeding through before the ink has finished wicking
// (the frame is fully inked around f40), so no frame is ever left blank between
// the two scenes.
const INK_START = 14;
const INK_END = 60;
const LABEL_IN = 36;
const LABEL_FULL = 58;
const DROP_COUNT = 7;
const SPECK_COUNT = 10;

const FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Easing used for the overall ink progress (inlined from shared tokens:
// easing.inOut = Easing.inOut(Easing.ease)).
const easeInOut = Easing.inOut(Easing.ease);

// Deterministic pseudo-random so droplet placement is stable per frame.
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

export type InkSpreadTransitionProps = {
  colorBefore: string;
  colorAfter: string;
  labelBefore: string;
  labelAfter: string;
  textColor: string;
};

export const defaultInkSpreadTransitionProps: InkSpreadTransitionProps = {
  colorBefore: "#f5f1e8",
  colorAfter: "#1a1a1a",
  labelBefore: "Before",
  labelAfter: "After",
  textColor: "#1a1a1a",
};

// Single full-screen page with a centered headline.
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
        fontSize: 220,
        fontWeight: 800,
        letterSpacing: 16,
        color: textColor,
        textShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      {label}
    </div>
  </AbsoluteFill>
);

type Drop = { cx: number; cy: number; r: number };

// Droplet field in pixel space. Droplet 0 is anchored at the centre and is the
// one guaranteed to cover the frame corners by the end of the spread.
const buildDrops = (
  progress: number,
  width: number,
  height: number,
): Drop[] => {
  const diag = Math.sqrt(width * width + height * height);
  return Array.from({ length: DROP_COUNT }, (_, i) => {
    const anchored = i === 0;
    const cx = anchored
      ? width / 2
      : width * (0.5 + (seededRandom(i * 67 + 11) - 0.5) * 0.46);
    const cy = anchored
      ? height / 2
      : height * (0.5 + (seededRandom(i * 89 + 23) - 0.5) * 0.5);
    // Each droplet lands a little later than the previous one.
    const dropDelay = anchored ? 0 : seededRandom(i * 43 + 7) * 0.36;
    const p = interpolate(progress, [dropDelay, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    // Ink wicks fast on contact, then creeps.
    const spread = 1 - Math.pow(1 - p, 2.2);
    // The anchored droplet is sized to just cover the frame corners at the end
    // of the spread — any larger and the frame is inked long before the spread
    // window closes, leaving a dead stretch of flat colour.
    const size = anchored ? 0.95 : 0.5 + seededRandom(i * 29 + 5) * 0.55;
    return { cx, cy, r: spread * diag * 0.62 * size };
  });
};

// Fine spatter that runs ahead of the ink front and is later swallowed by it.
const buildSpecks = (
  progress: number,
  width: number,
  height: number,
): Drop[] => {
  const diag = Math.sqrt(width * width + height * height);
  return Array.from({ length: SPECK_COUNT }, (_, i) => {
    const angle = seededRandom(i * 17 + 3) * Math.PI * 2;
    const dist = (0.2 + seededRandom(i * 53 + 9) * 0.42) * diag * 0.5;
    const appear = 0.12 + seededRandom(i * 71 + 13) * 0.5;
    const p = interpolate(progress, [appear, Math.min(1, appear + 0.3)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      cx: width / 2 + Math.cos(angle) * dist,
      cy: height / 2 + Math.sin(angle) * dist * 0.78,
      r: p * diag * (0.012 + seededRandom(i * 37 + 2) * 0.03),
    };
  });
};

export const InkSpreadTransition: React.FC<InkSpreadTransitionProps> = ({
  colorBefore,
  colorAfter,
  labelBefore,
  labelAfter,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const progress = interpolate(frame, [INK_START, INK_END], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const drops = buildDrops(progress, width, height);
  const specks = buildSpecks(progress, width, height);
  const inkVisible = progress > 0.001;

  // After-scene label: brushes in once the ink owns the frame, then holds to
  // the final frame (which is the catalog thumbnail).
  const afterLabelOpacity = interpolate(frame, [LABEL_IN, LABEL_FULL], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const afterLabelSpacing = interpolate(
    frame,
    [LABEL_IN, DURATION_FRAMES - 14],
    [34, 16],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Paint order is DOM order on purpose — no z-index anywhere in this tree.
  // (A z-indexed ink layer previously escaped its sibling order and painted
  // over the after-scene label, so the after-scene never appeared.)
  return (
    <AbsoluteFill style={{ backgroundColor: colorAfter }}>
      {/* Before scene. */}
      <PageLayer bg={colorBefore} label={labelBefore} textColor={textColor} />

      {/* Ink: wicking halo first, then the merged core on top. */}
      {inkVisible && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            {/* Soft, very ragged front — the paper wicking the ink. */}
            <filter
              id="ink-bleed"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="26" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 9 -3.2"
                result="t"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.009 0.013"
                numOctaves="3"
                seed="17"
                result="n"
              />
              <feDisplacementMap
                in="t"
                in2="n"
                scale="46"
                xChannelSelector="R"
                yChannelSelector="G"
                result="d"
              />
              <feGaussianBlur in="d" stdDeviation="7" />
            </filter>

            {/* Merged core — droplets fuse instead of overlapping as circles. */}
            <filter
              id="ink-core"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="17" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -9.5"
                result="t"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.013 0.017"
                numOctaves="4"
                seed="41"
                result="n"
              />
              <feDisplacementMap
                in="t"
                in2="n"
                scale="24"
                xChannelSelector="R"
                yChannelSelector="G"
                result="d"
              />
              <feGaussianBlur in="d" stdDeviation="2.2" />
            </filter>
          </defs>

          <g filter="url(#ink-bleed)" opacity={0.55}>
            {drops.map((d, i) => (
              <circle
                key={`h-${i}`}
                cx={d.cx}
                cy={d.cy}
                r={d.r * 1.06}
                fill={colorAfter}
              />
            ))}
            {specks.map((s, i) => (
              <circle
                key={`hs-${i}`}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill={colorAfter}
              />
            ))}
          </g>

          <g filter="url(#ink-core)">
            {drops.map((d, i) => (
              <circle
                key={`c-${i}`}
                cx={d.cx}
                cy={d.cy}
                r={d.r}
                fill={colorAfter}
              />
            ))}
            {specks.map((s, i) => (
              <circle
                key={`cs-${i}`}
                cx={s.cx}
                cy={s.cy}
                r={s.r * 0.82}
                fill={colorAfter}
              />
            ))}
          </g>
        </svg>
      )}

      {/* After scene, revealed once the ink has covered the frame. */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: afterLabelOpacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 220,
            fontWeight: 800,
            letterSpacing: afterLabelSpacing,
            color: colorBefore,
            textShadow: "0 4px 24px rgba(0,0,0,0.45)",
          }}
        >
          {labelAfter}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default InkSpreadTransition;
