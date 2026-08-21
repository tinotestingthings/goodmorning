import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../../components/Caption";
import { Folder } from "../../components/Folder";
import { C, FONT } from "../../theme";

/**
 * Beat 1 — het second brain. Eerst de vault-mappen, dan zoomt één notitie in
 * met het vaste format (samenvatting + labels), en als slot de zin dat AI dit
 * als context/geheugen gebruikt — dat is op zichzelf al de waarde.
 */

const FOLDERS = [
  { label: "00 Inbox", accent: C.skip },
  { label: "20 Sources", accent: C.keep },
  { label: "30 Tasks", accent: C.dismiss },
  { label: "40 Projects", accent: C.keep },
  { label: "50 Agenda", accent: C.skip },
];

const LABELS = ["type: bron", "#privacy", "#apple", "status: bewaard"];

export const W1SecondBrain: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  const noteIn = spring({ frame: local - 120, fps, config: { damping: 200 } });
  // Mappen schuiven opzij + dimmen zodra de notitie binnenkomt.
  const shift = interpolate(noteIn, [0, 1], [0, -320]);
  const aiIn = spring({ frame: local - 290, fps, config: { damping: 200 } });

  return (
    <>
      <Caption delay={4} sub="vast format: samenvatting + labels" outAt={392}>
        Een second brain
      </Caption>

      {/* De vault-mappen */}
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 56,
          transform: `translateX(${shift}px)`,
          opacity: interpolate(noteIn, [0, 1], [1, 0.4]),
        }}
      >
        {FOLDERS.map((f, i) => {
          const s = spring({
            frame: local - 20 - i * 9,
            fps,
            config: { damping: 200 },
          });
          return (
            <div
              key={f.label}
              style={{
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [34, 0])}px)`,
              }}
            >
              <Folder label={f.label} accent={f.accent} />
            </div>
          );
        })}
      </div>

      {/* De notitie met het vaste format */}
      <div
        style={{
          position: "absolute",
          left: 1080,
          top: 330,
          width: 620,
          opacity: noteIn,
          transform: `translateY(${interpolate(noteIn, [0, 1], [46, 0])}px)`,
          background: C.card,
          border: `2px solid ${C.border}`,
          borderRadius: 24,
          padding: "34px 38px",
          fontFamily: FONT,
          boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            color: C.text,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: -0.5,
            lineHeight: 1.25,
          }}
        >
          Apple maakt ATT-toezeggingen bindend
        </div>
        <div
          style={{
            color: C.dim,
            fontSize: 21,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginTop: 26,
          }}
        >
          Samenvatting
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {[1, 0.96, 0.9, 0.6].map((w, i) => (
            <div
              key={i}
              style={{
                height: 10,
                width: `${w * 100}%`,
                borderRadius: 999,
                background: C.border,
                opacity: interpolate(
                  local,
                  [150 + i * 8, 165 + i * 8],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 26 }}>
          {LABELS.map((l, i) => {
            const s = spring({
              frame: local - 200 - i * 8,
              fps,
              config: { damping: 200 },
            });
            return (
              <span
                key={l}
                style={{
                  opacity: s,
                  transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
                  background: `${C.skip}1c`,
                  border: `1.5px solid ${C.skip}`,
                  borderRadius: 999,
                  padding: "8px 18px",
                  color: C.skip,
                  fontSize: 21,
                  fontWeight: 600,
                }}
              >
                {l}
              </span>
            );
          })}
        </div>
      </div>

      {/* De pointe: AI leest dit als geheugen */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 900,
          textAlign: "center",
          fontFamily: FONT,
          color: C.text,
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: -0.7,
          opacity: aiIn,
          transform: `translateY(${interpolate(aiIn, [0, 1], [18, 0])}px)`,
        }}
      >
        Vast format → <span style={{ color: C.keep }}>context en geheugen voor AI</span>
      </div>
    </>
  );
};
