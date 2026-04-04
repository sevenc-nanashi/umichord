import { describe, expect, test } from "vite-plus/test";
import { parseScore } from "../../src/parser/score";
import { paddingTop, rowBottomPadding, rowHeight } from "../../src/renderer/base";
import { getChordBounds } from "../../src/renderer/chord";
import { computeRowLayouts, measureHeight } from "../../src/renderer/index";

describe("row layout", () => {
  test("通常の行は最小高さのまま", () => {
    const { chords, punctuations } = parseScore("1");
    const layouts = computeRowLayouts(chords, punctuations);

    expect(layouts).toHaveLength(1);
    expect(layouts[0]).toMatchObject({
      row: 0,
      offsetY: 0,
      baselineY: paddingTop,
      height: rowHeight,
    });
  });

  test("テンションと分数コードが多い行でも必要最小限の高さに収まる", () => {
    const { chords, punctuations } = parseScore("1(+_+)/5");
    const layouts = computeRowLayouts(chords, punctuations);
    const chordBounds = getChordBounds(chords[0]);
    const chordBottom = getChordBounds(chords[0]).maxY;

    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.baselineY).toBe(paddingTop - chordBounds.minY);
    expect(layouts[0]!.height).toBe(
      Math.max(rowHeight, layouts[0]!.baselineY + chordBottom + rowBottomPadding),
    );
    expect(measureHeight(chords, punctuations)).toBe(layouts[0]!.height);
  });

  test("行ごとの高さに応じて次行のオフセットが決まる", () => {
    const { chords, punctuations } = parseScore("1(+_+)/5\n1");
    const layouts = computeRowLayouts(chords, punctuations);

    expect(layouts).toHaveLength(2);
    expect(layouts[0]!.height).toBeGreaterThanOrEqual(rowHeight);
    expect(layouts[1]!.offsetY).toBe(layouts[0]!.height);
    expect(measureHeight(chords, punctuations)).toBe(layouts[0]!.height + layouts[1]!.height);
  });

  test("bar がある行ではコード開始位置が bar の下へ押し下がる", () => {
    const { chords, punctuations } = parseScore("!bar 1/1\n1");
    const layouts = computeRowLayouts(chords, punctuations);

    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.baselineY).toBeGreaterThan(paddingTop);
    expect(layouts[0]!.height).toBe(rowHeight);
  });
});
