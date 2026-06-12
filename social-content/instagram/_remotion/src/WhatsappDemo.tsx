import React from "react";
import { interpolate, staticFile } from "remotion";
import { CrossFadeSequence } from "./CrossFadeSequence";

// VIDEO 07 — WhatsApp demo. 10s @ 30fps = 300 frames.
// Segmentos de 2s (60 frames), ritmo de chat real.
// Frame-5 (titular 24/7) entra con blur sutil que se resuelve a nitido.
export const WhatsappDemo = () => {
  const images = [1, 2, 3, 4, 5].map((i) => staticFile(`whatsapp/frame-${i}.png`));

  const extraStyle = (
    frame: number,
    start: number,
    _end: number,
    isLast: boolean
  ): React.CSSProperties => {
    if (!isLast) return {};
    const blur = interpolate(frame, [start, start + 18], [3, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return blur > 0.05 ? { filter: `blur(${blur}px)` } : {};
  };

  return (
    <CrossFadeSequence
      images={images}
      boundaries={[0, 60, 120, 180, 240, 300]}
      fadeFrames={15}
      backgroundColor="#0b141a"
      extraStyle={extraStyle}
    />
  );
};
