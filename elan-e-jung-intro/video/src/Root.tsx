import { Composition } from "remotion";
import { Intro } from "./Intro";
import { DURATION, FPS } from "./timing";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ElanEJungIntro"
      component={Intro}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
