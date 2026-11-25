import { Easing, interpolate } from "remotion";

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

/** start 프레임부터 dur 동안 0→1 */
export const prog = (frame: number, start: number, dur = 18, easing = ease) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
