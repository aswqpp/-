import React from "react";
import { FADE, Line, sceneFrames } from "./lib/timing";
import { CHAPTER_FRAMES, ChapterCard } from "./scenes/Chapter";
import * as P1 from "./scenes/Part1";
import * as P2 from "./scenes/Part2";
import * as P3 from "./scenes/Part3";
import * as P4 from "./scenes/Part4";
import * as P5 from "./scenes/Part5";
import * as P6 from "./scenes/Part6";

export type SceneDef = { id: string; frames: number; Comp: React.FC };

const scene = (id: string, Comp: React.FC, lines: Line[], extra = 0): SceneDef => ({
  id,
  Comp,
  frames: sceneFrames(lines, extra),
});

const chapter = (id: string, num: string, title: string, sub: string): SceneDef => ({
  id,
  frames: CHAPTER_FRAMES,
  Comp: () => <ChapterCard num={num} title={title} sub={sub} />,
});

export const SCENES: SceneDef[] = [
  scene("Title", P1.TitleScene, P1.TITLE_LINES, 30),
  chapter("Part1", "1부", "무대", "동아리에서 한 일과 두 가지 의문"),
  scene("Stage", P1.StageScene, P1.STAGE_LINES),
  scene("Cost", P1.CostScene, P1.COST_LINES, 20),
  scene("Club", P1.ClubScene, P1.CLUB_LINES),
  scene("Q1", P1.Q1Scene, P1.Q1_LINES),
  chapter("Part2", "2부", "다리를 이해하는 개념 7가지", "트러스 · 눌림과 당김 · 좌굴 · 세장비 · 정정구조 · 형식 · 포물선"),
  scene("C1Truss", P2.C1Scene, P2.C1_LINES),
  scene("C2Force", P2.C2Scene, P2.C2_LINES),
  scene("C3Buckling", P2.C3Scene, P2.C3_LINES),
  scene("C4Slenderness", P2.C4Scene, P2.C4_LINES),
  scene("C5Determinate", P2.C5Scene, P2.C5_LINES),
  scene("C6Types", P2.C6Scene, P2.C6_LINES, 20),
  scene("C7Parabola", P2.C7Scene, P2.C7_LINES, 60),
  chapter("Part3", "3부", "계산 프로그램", "설계 44,544개를 비교하는 방법"),
  scene("Program", P3.ProgramScene, P3.PROGRAM_LINES, 20),
  chapter("Part4", "4부", "반전", "26.6%라는 답은 틀렸다"),
  scene("Twist", P4.TwistScene, P4.TWIST_LINES, 20),
  scene("Test1", P4.Test1Scene, P4.TEST1_LINES),
  scene("Test2", P4.Test2Scene, P4.TEST2_LINES, 60),
  scene("Rule", P4.RuleScene, P4.RULE_LINES),
  scene("Test3", P4.Test3Scene, P4.TEST3_LINES),
  scene("Lesson", P4.LessonScene, P4.LESSON_LINES, 30),
  chapter("Part5", "5부", "결과", "계산으로 알아낸 다섯 가지"),
  scene("R1Spread", P5.R1Scene, P5.R1_LINES),
  scene("R2Sizes", P5.R2Scene, P5.R2_LINES),
  scene("R3Together", P5.R3Scene, P5.R3_LINES),
  scene("R4Parabola", P5.R4Scene, P5.R4_LINES),
  scene("R5Compare", P5.R5Scene, P5.R5_LINES),
  chapter("Part6", "6부", "더 생각해 볼 점", "양방향 통행 · 43번의 반복 · 안전"),
  scene("TwoWay", P6.TwoWayScene, P6.TWOWAY_LINES),
  scene("Reach", P6.ReachScene, P6.REACH_LINES),
  scene("Weak", P6.WeakScene, P6.WEAK_LINES),
  scene("Learned", P6.LearnedScene, P6.LEARNED_LINES),
  scene("Summary", P6.SummaryScene, P6.SUMMARY_LINES, 60),
  scene("Precise", P6.PreciseScene, P6.PRECISE_LINES),
  scene("End", P6.EndScene, P6.END_LINES, 30),
];

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.frames, 0) - FADE * (SCENES.length - 1);
