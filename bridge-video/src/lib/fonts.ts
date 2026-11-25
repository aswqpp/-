import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const weights: [string, string][] = [
  ["Regular", "400"],
  ["Medium", "500"],
  ["SemiBold", "600"],
  ["Bold", "700"],
];

export const fontsReady = Promise.all(
  weights.map(([name, weight]) =>
    loadFont({
      family: "Pretendard",
      url: staticFile(`fonts/Pretendard-${name}.woff2`),
      weight,
    }),
  ),
);
