import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { PhoneFrame } from "../components/PhoneFrame";
import { TriageCard } from "../components/TriageCard";
import { TRIAGE_CARDS } from "../data";
import { C, FONT } from "../theme";

/**
 * Beat 4 — the heart of the video. Three cards, three outcomes: keep, dismiss,
 * and "make it a task". This is the only step that costs human attention, so it
 * gets the most screen time (420 frames, a quarter of the runtime).
 *
 * The third card deliberately does NOT swipe: it opens the card's More menu, to
 * show that triage is not only a binary keep/dismiss — an item can leave the
 * inbox as work rather than as reference.
 */

const CARD_STARTS = [40, 150, 262];
const SWIPE_LEN = 34;
const MENU_OPEN = 312;
const MENU_PICK = 348;

const MENU_ITEMS = [
  "Notitie toevoegen",
  "Maak er een taak van",
  "Maak er een project van",
];

export const Beat4Triage: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame: local, fps, config: { damping: 200 } });
  const menuIn = spring({ frame: local - MENU_OPEN, fps, config: { damping: 200 } });

  return (
    <>
      <Caption delay={2} outAt={398} sub="één beslissing per kaart">
        Ik review. Elke ochtend, in een paar minuten.
      </Caption>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 252,
          transform: `translateX(-50%) scale(${interpolate(
            phoneIn,
            [0, 1],
            [0.9, 1]
          )})`,
          opacity: phoneIn,
        }}
      >
        <PhoneFrame width={400}>
          <div style={{ position: "relative", height: "100%", padding: 22 }}>
            {TRIAGE_CARDS.map((card, i) => {
              const start = CARD_STARTS[i];
              const isTask = card.action === "task";
              // Keep/dismiss cards leave; the task card stays for the menu.
              const gone = !isTask && local > start + SWIPE_LEN + 6;
              if (local < start - 40 || gone) return null;

              const throwP = isTask
                ? 0
                : spring({
                    frame: local - start,
                    fps,
                    config: { damping: 13, mass: 0.5 },
                  });
              const dir = card.action === "keep" ? 1 : -1;
              const x = throwP * dir * 620;
              const rot = throwP * dir * 17;
              const swipe = interpolate(Math.abs(x), [0, 200], [0, dir], {
                extrapolateRight: "clamp",
              });

              const depth = spring({
                frame: local - start + 40,
                fps,
                config: { damping: 200 },
              });

              // The task card slides up a little to make room for the menu.
              const lift = isTask
                ? interpolate(menuIn, [0, 1], [0, -46])
                : 0;

              return (
                <div
                  key={card.title}
                  style={{
                    position: "absolute",
                    left: 22,
                    right: 22,
                    top: 40,
                    transform: `translate(${x}px, ${lift}px) rotate(${rot}deg) scale(${interpolate(
                      depth,
                      [0, 1],
                      [0.94, 1]
                    )})`,
                    opacity: interpolate(Math.abs(throwP), [0.75, 1], [1, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  <TriageCard
                    title={card.title}
                    source={card.source}
                    date={card.date}
                    swipe={isTask ? 0 : swipe}
                  />
                </div>
              );
            })}

            {/* More menu on the third card */}
            {local > MENU_OPEN - 20 ? (
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  right: 30,
                  bottom: 54,
                  background: C.card,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 20,
                  padding: 10,
                  opacity: menuIn,
                  transform: `translateY(${interpolate(
                    menuIn,
                    [0, 1],
                    [40, 0]
                  )}px)`,
                  fontFamily: FONT,
                }}
              >
                {MENU_ITEMS.map((item, i) => {
                  const picked = i === 1;
                  const hi = picked
                    ? interpolate(local, [MENU_PICK, MENU_PICK + 10], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 0;
                  return (
                    <div
                      key={item}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 13,
                        fontSize: 21,
                        fontWeight: 600,
                        color: hi > 0 ? C.skip : C.dim,
                        background:
                          hi > 0 ? `${C.skip}22` : "transparent",
                        border: `1.5px solid ${
                          hi > 0 ? C.skip : "transparent"
                        }`,
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </PhoneFrame>
      </div>

      {/* action labels flashing beside the phone */}
      {TRIAGE_CARDS.map((card, i) => {
        const isTask = card.action === "task";
        const at = isTask ? MENU_PICK : CARD_STARTS[i];
        const flash = interpolate(
          local,
          [at - 6, at + 8, at + (isTask ? 56 : 40), at + (isTask ? 72 : 56)],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const colour =
          card.action === "keep"
            ? C.keep
            : card.action === "dismiss"
            ? C.dismiss
            : C.skip;
        const onLeft = card.action === "dismiss";

        return (
          <div
            key={card.label}
            style={{
              position: "absolute",
              top: 520,
              left: onLeft ? 300 : undefined,
              right: onLeft ? undefined : 300,
              opacity: flash,
              transform: `translateY(${interpolate(flash, [0, 1], [16, 0])}px)`,
              background: C.bg,
              border: `2.5px solid ${colour}`,
              color: colour,
              borderRadius: 16,
              padding: "18px 30px",
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {card.label}
          </div>
        );
      })}
    </>
  );
};
