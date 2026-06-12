import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

export type FrameStyleFn = (
  frame: number,
  start: number,
  end: number,
  isLast: boolean
) => React.CSSProperties;

/**
 * Cross-fade secuencial entre N imagenes fullscreen.
 * `boundaries` tiene N+1 valores: inicio de cada segmento + frame final.
 * Cada imagen i es visible desde boundaries[i] hasta boundaries[i+1],
 * con un cross-fade de `fadeFrames` frames al entrar (excepto la primera).
 * Las imagenes se apilan en orden: la siguiente hace fade-in ENCIMA de la
 * anterior, asi nunca hay un hueco de fondo visible durante la transicion.
 */
export const CrossFadeSequence: React.FC<{
  images: string[];
  boundaries: number[];
  fadeFrames?: number;
  backgroundColor?: string;
  extraStyle?: FrameStyleFn;
}> = ({ images, boundaries, fadeFrames = 15, backgroundColor = "#000", extraStyle }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {images.map((src, i) => {
        const start = boundaries[i];
        const end = boundaries[i + 1];
        const isLast = i === images.length - 1;

        // Fade-in al inicio del segmento (la primera imagen arranca opaca).
        const opacity =
          i === 0
            ? 1
            : interpolate(frame, [start, start + fadeFrames], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

        // Ocultar del todo cuando la siguiente ya termino su fade-in
        // (micro-optimizacion: evita pintar capas invisibles).
        const nextFadeDone = isLast ? Infinity : end + fadeFrames;
        if (frame < start || frame > nextFadeDone) {
          return null;
        }

        const style: React.CSSProperties = {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity,
          ...(extraStyle ? extraStyle(frame, start, end, isLast) : {}),
        };

        return <Img key={i} src={src} style={style} />;
      })}
    </AbsoluteFill>
  );
};
