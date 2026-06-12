import React from "react";
import { interpolate, staticFile } from "remotion";
import { CrossFadeSequence } from "./CrossFadeSequence";

// VIDEO 06 — Showcase Onyx & Steel. 9s @ 30fps = 270 frames.
// Segmentos de 1.8s (54 frames). Frame-5 entra con scale 1.05 -> 1.
export const Showcase = () => {
  const images = [1, 2, 3, 4, 5].map((i) => staticFile(`showcase/frame-${i}.png`));

  const extraStyle = (
    frame: number,
    start: number,
    _end: number,
    isLast: boolean
  ): React.CSSProperties => {
    if (!isLast) return {};
    const scale = interpolate(frame, [start, start + 24], [1.05, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { transform: `scale(${scale})` };
  };

  return (
    <CrossFadeSequence
      images={images}
      boundaries={[0, 54, 108, 162, 216, 270]}
      fadeFrames={15}
      backgroundColor="#0a0a0a"
      extraStyle={extraStyle}
    />
  );
};
