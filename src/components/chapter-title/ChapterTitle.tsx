// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
// Animation essence: a large chapter label zooms in (3x -> 1x), a divider
// line draws out from left to right, then the title + subtitle reveal from
// below with a float-and-fade. Fully self-contained: the original
// `../types` props and the shared `TitleReveal` / `FloatFadeIn` helpers are
// inlined below so this file has no dependency beyond react + remotion.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

export const FPS = 30;
export const DURATION_FRAMES = 150;

const FONT_FAMILY = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type ChapterTitleProps = {
  /** Chapter label (e.g. "Chapter 1") */
  chapterLabel: string;
  /** Chapter title */
  title: string;
  /** Chapter subtitle (optional) */
  subtitle?: string;
  /** Background color */
  background: string;
  /** Chapter label color */
  chapterColor: string;
  /** Title color */
  titleColor: string;
};

export const defaultChapterTitleProps: ChapterTitleProps = {
  chapterLabel: "Chapter 1",
  title: "Chapter One: The Beginning",
  subtitle: "Where the journey starts",
  background: "#0d1117",
  chapterColor: "#d4af37",
  titleColor: "#ffffff",
};

// Inlined from shared FloatFadeIn (M-S01): fade + small upward float.
// Defaults match the original: duration 9f, easing Easing.out(Easing.ease),
// distance 15px.
const FloatFadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  distance?: number;
}> = ({ children, delay = 0, distance = 15 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 9], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offsetY = (1 - progress) * distance;
  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${offsetY}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Inlined from shared TitleReveal (O-S01): two-stage title + subtitle entrance.
const TitleReveal: React.FC<{
  title: string;
  subtitle?: string;
  delay?: number;
  titleFontSize: number;
  subtitleFontSize: number;
  titleColor: string;
  subtitleColor: string;
  fontFamily: string;
}> = ({
  title,
  subtitle,
  delay = 0,
  titleFontSize,
  subtitleFontSize,
  titleColor,
  subtitleColor,
  fontFamily,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24, // SPACE.md
        alignItems: "center",
        fontFamily,
        lineBreak: "strict",
        overflowWrap: "break-word",
        wordBreak: "normal",
      }}
    >
      <FloatFadeIn delay={delay}>
        <span
          style={{
            fontSize: titleFontSize,
            fontWeight: 900,
            color: titleColor,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {title}
        </span>
      </FloatFadeIn>
      {subtitle && (
        <FloatFadeIn delay={delay + 8}>
          <span
            style={{
              fontSize: subtitleFontSize,
              fontWeight: 400,
              color: subtitleColor,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            {subtitle}
          </span>
        </FloatFadeIn>
      )}
    </div>
  );
};

export const ChapterTitle: React.FC<ChapterTitleProps> = ({
  chapterLabel,
  title,
  subtitle,
  background,
  chapterColor,
  titleColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Chapter label: large -> small -> settled (zoom-out)
  const chapterScale = interpolate(frame, [0, 20, 40], [3, 1.05, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chapterOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider line: draws out from left to right
  const lineProgress = interpolate(frame, [28, 48], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isPortrait = height > width;
  const chapterFontSize = isPortrait ? width * 0.08 : height * 0.06;
  const titleFontSize = isPortrait ? width * 0.085 : height * 0.085;
  const subFontSize = isPortrait ? width * 0.028 : height * 0.026;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {/* Faint background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Chapter label */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: chapterFontSize,
          fontWeight: 300,
          color: chapterColor,
          letterSpacing: 12,
          opacity: chapterOpacity,
          transform: `scale(${chapterScale})`,
          textTransform: "uppercase",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {chapterLabel}
      </div>

      {/* Divider line */}
      <div
        style={{
          width: width * 0.4,
          height: 2,
          backgroundColor: chapterColor,
          transformOrigin: "left center",
          transform: `scaleX(${lineProgress})`,
        }}
      />

      {/* Title + subtitle */}
      <div style={{ marginTop: 8 }}>
        <TitleReveal
          title={title}
          subtitle={subtitle}
          delay={45}
          titleFontSize={titleFontSize}
          subtitleFontSize={subFontSize}
          titleColor={titleColor}
          subtitleColor="rgba(255,255,255,0.6)"
          fontFamily={FONT_FAMILY}
        />
      </div>
    </AbsoluteFill>
  );
};

export default ChapterTitle;
