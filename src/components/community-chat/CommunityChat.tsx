// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Community chat screen animation (generic team-chat UI)
 *
 * - Workspace icon rail + channel list + message area
 * - Messages appear sequentially with a spring entrance
 * - Reactions are added after each message settles
 * - Whole window tilts via rotateX + rotateY for a 3D feel
 *
 * Self-contained, Latin system fonts only. Neutral palette — no brand colors.
 */

export const FPS = 30;
export const DURATION_FRAMES = 270;

const SANS = '-apple-system, "Segoe UI", Roboto, sans-serif';

// Neutral, brand-agnostic palette
const C = {
  appBg: "#0b0d10",
  rail: "#15181d",
  sidebar: "#1b1f26",
  main: "#21262e",
  divider: "#15181d",
  accent: "#2f9e8f", // neutral teal
  accentSoft: "rgba(47,158,143,0.15)",
  accentBorder: "rgba(47,158,143,0.4)",
  textStrong: "#eef1f4",
  textBody: "#cdd3da",
  textMuted: "#8b929c",
  activeChan: "#343a44",
  composer: "#2a2f38",
  composerText: "#6c727c",
};

export type CommunityChatMessage = {
  authorName: string;
  avatarLabel: string;
  avatarColor?: string;
  time: string;
  text: string;
  reactions?: { emoji: string; count: number }[];
};

export type CommunityChatProps = {
  workspaceName: string;
  channelName: string;
  messages: CommunityChatMessage[];
};

const Message: React.FC<{
  msg: CommunityChatMessage;
  startFrame: number;
}> = ({ msg, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame) return null;

  const spr = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  return (
    <div
      style={{
        opacity: spr,
        transform: `translateY(${10 * (1 - spr)}px)`,
        padding: "8px 20px",
        display: "flex",
        gap: 16,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: msg.avatarColor ?? C.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {msg.avatarLabel}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <span style={{ color: C.textStrong, fontWeight: 700, fontSize: 16 }}>
            {msg.authorName}
          </span>
          <span style={{ color: C.textMuted, fontSize: 12 }}>{msg.time}</span>
        </div>
        <div
          style={{
            color: C.textBody,
            fontSize: 16,
            lineHeight: 1.4,
            marginBottom: 6,
          }}
        >
          {msg.text}
        </div>
        {msg.reactions && msg.reactions.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {msg.reactions.map((r, i) => (
              <div
                key={i}
                style={{
                  background: C.accentSoft,
                  border: `1px solid ${C.accentBorder}`,
                  borderRadius: 8,
                  padding: "2px 8px",
                  fontSize: 13,
                  color: C.textBody,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 14 }}>{r.emoji}</span>
                <span>{r.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WorkspaceIcon: React.FC<{
  label: string;
  color: string;
  active?: boolean;
}> = ({ label, color, active }) => (
  <div
    style={{
      width: 48,
      height: 48,
      borderRadius: active ? 16 : 24,
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontWeight: 700,
      fontSize: 18,
      fontFamily: SANS,
      marginBottom: 8,
      position: "relative",
    }}
  >
    {label}
    {active && (
      <div
        style={{
          position: "absolute",
          left: -16,
          top: 12,
          width: 4,
          height: 24,
          background: "#fff",
          borderRadius: 2,
        }}
      />
    )}
  </div>
);

const ChatWindow: React.FC<CommunityChatProps> = ({
  workspaceName,
  channelName,
  messages,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: 50 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: C.rail,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          display: "flex",
        }}
      >
        {/* Workspace rail */}
        <div
          style={{
            width: 76,
            background: C.rail,
            paddingTop: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <WorkspaceIcon
            label={workspaceName[0] || "W"}
            color={C.accent}
            active
          />
          <div
            style={{
              width: 32,
              height: 2,
              background: C.sidebar,
              marginBottom: 8,
            }}
          />
          <WorkspaceIcon label="A" color="#7a5cd6" />
          <WorkspaceIcon label="B" color="#d68a3c" />
          <WorkspaceIcon label="C" color="#3c9dd6" />
        </div>

        {/* Channel list */}
        <div
          style={{
            width: 240,
            background: C.sidebar,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              fontFamily: SANS,
              fontSize: 16,
              color: C.textStrong,
              fontWeight: 700,
              borderBottom: `1px solid ${C.divider}`,
              boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
            }}
          >
            {workspaceName}
          </div>
          <div style={{ padding: "16px 8px" }}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 11,
                color: C.textMuted,
                textTransform: "uppercase",
                padding: "0 8px 6px",
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              Text Channels
            </div>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                background: C.activeChan,
                fontFamily: SANS,
                fontSize: 15,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              # {channelName}
            </div>
            <div
              style={{
                padding: "6px 10px",
                fontFamily: SANS,
                fontSize: 15,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              # general
            </div>
            <div
              style={{
                padding: "6px 10px",
                fontFamily: SANS,
                fontSize: 15,
                color: C.textMuted,
              }}
            >
              # random
            </div>
          </div>
        </div>

        {/* Message area */}
        <div
          style={{
            flex: 1,
            background: C.main,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: `1px solid ${C.divider}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: SANS,
              color: C.textStrong,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            <span style={{ color: C.textMuted }}>#</span>
            {channelName}
          </div>
          <div
            style={{
              flex: 1,
              padding: "16px 0",
              overflow: "hidden",
            }}
          >
            {messages.map((m, i) => (
              <Message
                key={i}
                msg={m}
                startFrame={i * Math.floor(fps * 0.8)}
              />
            ))}
          </div>
          <div
            style={{
              padding: "12px 20px",
              borderTop: `1px solid ${C.divider}`,
            }}
          >
            <div
              style={{
                background: C.composer,
                borderRadius: 8,
                padding: "10px 14px",
                fontFamily: SANS,
                fontSize: 14,
                color: C.composerText,
              }}
            >
              Message #{channelName}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CommunityChat: React.FC<CommunityChatProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const rotateY = interpolate(frame, [0, durationInFrames], [8, -8]);

  return (
    <AbsoluteFill style={{ background: C.appBg, perspective: 1500 }}>
      <Sequence
        durationInFrames={durationInFrames}
        style={{ transform: `rotateX(6deg) rotateY(${rotateY}deg)` }}
      >
        <ChatWindow {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const defaultCommunityChatProps: CommunityChatProps = {
  workspaceName: "Nimbus",
  channelName: "announcements",
  messages: [
    {
      authorName: "Nimbus Bot",
      avatarLabel: "N",
      avatarColor: "#2f9e8f",
      time: "Today 10:24",
      text: "New AI video pipeline is live 🎬",
      reactions: [
        { emoji: "🎉", count: 24 },
        { emoji: "👀", count: 12 },
      ],
    },
    {
      authorName: "Member 1",
      avatarLabel: "M",
      avatarColor: "#5cc89a",
      time: "Today 10:25",
      text: "This looks amazing!",
    },
    {
      authorName: "Member 2",
      avatarLabel: "K",
      avatarColor: "#7a5cd6",
      time: "Today 10:26",
      text: "Love the new UI 💚",
      reactions: [{ emoji: "❤️", count: 8 }],
    },
    {
      authorName: "Member 3",
      avatarLabel: "S",
      avatarColor: "#d68a3c",
      time: "Today 10:28",
      text: "Can we share clips straight to social?",
    },
  ],
};

export default CommunityChat;
