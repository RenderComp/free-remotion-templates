// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Social Reel — generic short-form social video player promo
 *
 * A neutral "vertical video player" UI (avatar / handle / like-comment-share
 * rail / progress bar) wrapped in a landscape stage, cycling through a
 * catch-copy -> second-copy -> info-panel -> CTA sequence.
 *
 * Motion preserved from the source template:
 *  - FadeIn-up entrances (opacity + translateY via interpolate)
 *  - AccentLine scaleX wipe (left/center grow)
 *  - PulseButton sin-wave scale pulse on the CTA after a spring entrance
 *  - Ken-Burns slow zoom on the backdrop
 *
 * Self-contained: react / remotion only, Latin system fonts, no external CDN,
 * no brand colors/logos/wordmarks — fully fictional ("Streamly" / @aria.studio).
 */

export const FPS = 30;
export const DURATION_FRAMES = 150;

const SANS = '-apple-system, "Segoe UI", Roboto, sans-serif';

export type SocialReelProps = {
  brandName: string;
  handle: string;
  headline: string;
  headlineAccent: string;
  secondCopy: string;
  infoLines: string[];
  ctaText: string;
  accentColor: string;
  bgFrom: string;
  bgVia: string;
  bgTo: string;
  caption: string;
  likeCount: string;
};

export const defaultSocialReelProps: SocialReelProps = {
  brandName: "Streamly",
  handle: "@aria.studio",
  headline: "Make it",
  headlineAccent: "unmissable",
  secondCopy: "Stories that\nscroll-stop",
  infoLines: ["New drop / Studio Aria", "Open daily 10:00 — 20:00", "Link in profile"],
  ctaText: "Watch the full reel",
  accentColor: "#4f8cff",
  bgFrom: "#1b1d2a",
  bgVia: "#222540",
  bgTo: "#10243f",
  caption: "behind the scenes ✦ no.07",
  likeCount: "12.4k",
};

// ─── FadeIn (opacity + directional slide) ─────────────────────
const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "none";
  distance?: number;
}> = ({ children, delay = 0, duration = 20, direction = "up", distance = 30 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let transform = "none";
  if (direction === "up") transform = `translateY(${(1 - progress) * distance}px)`;
  if (direction === "down") transform = `translateY(${(1 - progress) * -distance}px)`;
  return <div style={{ opacity: progress, transform }}>{children}</div>;
};

// ─── AccentLine (scaleX wipe) ─────────────────────────────────
const AccentLine: React.FC<{
  color: string;
  delay?: number;
  duration?: number;
  width?: number;
  height?: number;
}> = ({ color, delay = 0, duration = 20, width = 120, height = 5 }) => {
  const frame = useCurrentFrame();
  const scaleX = interpolate(frame, [delay, delay + duration], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: color,
        borderRadius: 3,
        transform: `scaleX(${scaleX})`,
        transformOrigin: "center",
      }}
    />
  );
};

// ─── PulseButton (spring entrance + sin-wave pulse) ───────────
const PulseButton: React.FC<{
  text: string;
  color: string;
  delay?: number;
}> = ({ text, color, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 300 },
  });
  const pulse = interpolate(Math.sin((frame - delay) * 0.08), [-1, 1], [0.97, 1.03]);
  const scale = entrance < 0.95 ? entrance : entrance * pulse;
  return (
    <div
      style={{
        opacity: entrance,
        transform: `scale(${scale})`,
        backgroundColor: color,
        borderRadius: 50,
        padding: "18px 56px",
        boxShadow: `0 10px 32px ${color}55`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
      }}
    >
      <span style={{ fontSize: 34, fontWeight: 700, color: "#ffffff", letterSpacing: "0.01em" }}>
        {text}
      </span>
    </div>
  );
};

// ─── Generic social action glyphs (no brand iconography) ──────
const HeartGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20s-7-4.6-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.4 12 20 12 20z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const CommentGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 5h16v11H9l-5 4V5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const ShareGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12l16-7-5 16-4-6-7-3z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const ActionRail: React.FC<{ accent: string; likeCount: string; frame: number }> = ({
  accent,
  likeCount,
  frame,
}) => {
  // subtle heart-tap pop, looping, no brand association
  const beat = (frame % 90) / 90;
  const heartScale = 1 + Math.max(0, Math.sin(beat * Math.PI * 2)) * 0.12;
  const railText = "rgba(255,255,255,0.85)";
  const item = (icon: React.ReactNode, label: string, scale = 1) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 18, color: railText, fontFamily: SANS, fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        right: 28,
        bottom: 130,
        display: "flex",
        flexDirection: "column",
        gap: 26,
        alignItems: "center",
      }}
    >
      {item(<HeartGlyph size={30} color={accent} />, likeCount, heartScale)}
      {item(<CommentGlyph size={28} color="#ffffff" />, "318")}
      {item(<ShareGlyph size={28} color="#ffffff" />, "Share")}
    </div>
  );
};

// ─── Top bar: avatar + handle + follow chip (generic) ─────────
const TopBar: React.FC<{ brandName: string; handle: string; accent: string }> = ({
  brandName,
  handle,
  accent,
}) => (
  <div
    style={{
      position: "absolute",
      top: 28,
      left: 28,
      right: 28,
      display: "flex",
      alignItems: "center",
      gap: 14,
      zIndex: 5,
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        background: `linear-gradient(135deg, ${accent}, #ffffff22)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 24,
        color: "#fff",
        border: "2px solid rgba(255,255,255,0.4)",
      }}
    >
      {brandName.charAt(0).toUpperCase()}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: SANS }}>
        {brandName}
      </span>
      <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", fontFamily: SANS }}>
        {handle}
      </span>
    </div>
    <div
      style={{
        marginLeft: 6,
        padding: "8px 20px",
        borderRadius: 22,
        border: "1.5px solid rgba(255,255,255,0.6)",
        fontSize: 16,
        fontWeight: 700,
        color: "#fff",
        fontFamily: SANS,
      }}
    >
      Follow
    </div>
  </div>
);

// ─── Bottom caption + progress bar ────────────────────────────
const BottomChrome: React.FC<{ caption: string; accent: string; progress: number }> = ({
  caption,
  accent,
  progress,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 28,
        bottom: 70,
        right: 130,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 19, color: "rgba(255,255,255,0.9)", fontFamily: SANS, fontWeight: 500 }}>
        {caption}
      </span>
    </div>
    <div
      style={{
        position: "absolute",
        left: 28,
        right: 28,
        bottom: 44,
        height: 5,
        borderRadius: 3,
        background: "rgba(255,255,255,0.22)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: accent,
          borderRadius: 3,
        }}
      />
    </div>
  </>
);

// ─── The vertical "phone" video player (carries the reel motion) ─
const PlayerBody: React.FC<SocialReelProps> = (p) => {
  const frame = useCurrentFrame();
  // Ken-Burns slow zoom on the backdrop
  const kb = interpolate(frame, [0, DURATION_FRAMES], [1, 1.08], {
    extrapolateRight: "clamp",
  });
  const progress = interpolate(frame, [0, DURATION_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Scene windows scaled to the 150-frame total (was 5 scenes over 15s @ 1080x1920)
  const S = (sec: number) => Math.round((sec / 5) * 30); // remap 15s plan -> 5s clip
  return (
    <AbsoluteFill style={{ background: p.bgFrom, overflow: "hidden" }}>
      {/* backdrop gradient with Ken-Burns zoom */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(150deg, ${p.bgFrom} 0%, ${p.bgVia} 50%, ${p.bgTo} 100%)`,
          transform: `scale(${kb})`,
          transformOrigin: "center",
        }}
      />
      {/* soft vignette for legibility */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 80% at 50% 35%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <TopBar brandName={p.brandName} handle={p.handle} accent={p.accentColor} />
      <ActionRail accent={p.accentColor} likeCount={p.likeCount} frame={frame} />
      <BottomChrome caption={p.caption} accent={p.accentColor} progress={progress} />

      {/* --- Scene 1: catch copy + accent wipe (0-1.6s) --- */}
      <Sequence from={0} durationInFrames={S(8)} layout="none">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <FadeIn delay={4} duration={16} direction="up">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <AccentLine color={p.accentColor} delay={6} width={120} />
              <div
                style={{
                  fontSize: 78,
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: SANS,
                  textAlign: "center",
                  lineHeight: 1.08,
                  letterSpacing: "-0.01em",
                }}
              >
                {p.headline}
                <br />
                <span style={{ color: p.accentColor }}>{p.headlineAccent}</span>
              </div>
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>

      {/* --- Scene 2: second copy (1.6-3.0s) --- */}
      <Sequence from={S(8)} durationInFrames={S(7)} layout="none">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <FadeIn delay={2} duration={16} direction="up">
            <div
              style={{
                fontSize: 70,
                fontWeight: 800,
                color: "#fff",
                fontFamily: SANS,
                textAlign: "center",
                lineHeight: 1.1,
                whiteSpace: "pre-line",
              }}
            >
              {p.secondCopy}
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>

      {/* --- Scene 3: info panel (3.0-4.6s) --- */}
      {/* from starts exactly where Scene 2 ends (no overlap window) so the second-copy
          text and the info card never cross-fade into each other; end frame unchanged. */}
      <Sequence from={S(8) + S(7)} durationInFrames={S(13) + S(10) - (S(8) + S(7))} layout="none">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <FadeIn delay={0} duration={18} direction="up">
            <div
              style={{
                padding: "28px 44px",
                background: "rgba(0,0,0,0.55)",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              {p.infoLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 30,
                    fontWeight: 400,
                    color: "#fff",
                    fontFamily: SANS,
                    lineHeight: 1.5,
                    letterSpacing: "0.02em",
                    textAlign: "center",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>

      {/* --- Scene 4: CTA pulse (3.4-5.0s) --- */}
      <Sequence from={S(17)} durationInFrames={S(8)} layout="none">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <PulseButton text={p.ctaText} color={p.accentColor} delay={0} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export const SocialReel: React.FC<SocialReelProps> = (props) => {
  // Landscape stage (1920x1080) framing a 9:16 vertical player in the center.
  const playerW = 608;
  const playerH = 1080;
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, #2a2d3a 0%, #14151c 55%, #0b0c11 100%)",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          width: playerW,
          height: playerH,
          borderRadius: 36,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.06)",
        }}
      >
        <PlayerBody {...props} />
      </div>
    </AbsoluteFill>
  );
};

export default SocialReel;
