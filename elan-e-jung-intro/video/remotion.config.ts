import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL for the three.js scene
Config.setChromiumOpenGlRenderer("angle");
// Use the system Chromium when Remotion's own download is unavailable
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
