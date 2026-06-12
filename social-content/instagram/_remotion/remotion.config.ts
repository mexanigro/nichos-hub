import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
// Sin audio: Liam agrega musica en IG
Config.setMuted(true);
