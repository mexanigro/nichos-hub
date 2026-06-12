import { staticFile } from "remotion";
import { CrossFadeSequence } from "./CrossFadeSequence";

// VIDEO 03 — Cobertura. 8s @ 30fps = 240 frames.
// 5 frames, segmentos de 1.6s (48 frames). Cross-fade ~300ms al inicio
// de cada segmento; el efecto "items que crecen" ya vive en las imagenes.
export const Coverage = () => {
  const images = [1, 2, 3, 4, 5].map((i) => staticFile(`coverage/frame-${i}.png`));
  return (
    <CrossFadeSequence
      images={images}
      boundaries={[0, 48, 96, 144, 192, 240]}
      fadeFrames={10}
      backgroundColor="#F5EFE3"
    />
  );
};
