import { Composition } from "remotion";
import { Coverage } from "./Coverage";
import { Showcase } from "./Showcase";
import { WhatsappDemo } from "./WhatsappDemo";

export const Root = () => {
  return (
    <>
      <Composition
        id="Coverage"
        component={Coverage}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Showcase"
        component={Showcase}
        durationInFrames={270}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="WhatsappDemo"
        component={WhatsappDemo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1350}
      />
    </>
  );
};
