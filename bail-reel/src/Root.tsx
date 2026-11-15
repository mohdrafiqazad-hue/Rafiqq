import { Composition } from "remotion";
import { Reel } from "./Reel";
import { TOTAL } from "./timings";

export const RemotionRoot: React.FC = () => {
  return <Composition id="BailReel" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />;
};
