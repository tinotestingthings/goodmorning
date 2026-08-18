import React from "react";
import { OffthreadVideo, staticFile } from "remotion";

/**
 * Speelt een eigen opname af, bijvoorbeeld een schermopname van de app.
 *
 * Gebruik:
 *   1. zet je bestand in `public/`, bijvoorbeeld `public/app-demo.mp4`
 *   2. <ScreenRecording file="app-demo.mp4" />
 *
 * `OffthreadVideo` (in plaats van `<Video>`) is wat Remotion aanraadt voor
 * renderen: het pakt per frame exact het juiste beeld, in plaats van te leunen
 * op de afspeelpositie van een <video>-element.
 *
 * `startFrom` / `endAt` zijn in frames van de compositie (30 fps), niet in
 * seconden — `startFrom={90}` slaat dus de eerste 3 seconden van je opname over.
 */
export const ScreenRecording: React.FC<{
  file: string;
  startFrom?: number;
  endAt?: number;
  style?: React.CSSProperties;
  /** 1 = normale snelheid, 2 = twee keer zo snel */
  playbackRate?: number;
}> = ({ file, startFrom, endAt, style, playbackRate = 1 }) => (
  <OffthreadVideo
    src={staticFile(file)}
    startFrom={startFrom}
    endAt={endAt}
    playbackRate={playbackRate}
    muted
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      ...style,
    }}
  />
);
