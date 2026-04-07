import { describe, expect, test } from "vite-plus/test";
import { parseScore } from "../../src/parser/score";
import { minCropRowHeight, paddingTop, rowBottomPadding, rowHeight } from "../../src/renderer/base";
import { getChordBounds, getChordRightEdgeY } from "../../src/renderer/chord";
import { computeRowLayouts } from "../../src/renderer/index";

describe("row layout", () => {
  test("通常の行は下限つきで切り詰められる", () => {
    const { chords, punctuations } = parseScore("1");
    const layouts = computeRowLayouts(chords, punctuations);
    const chordBounds = getChordBounds(chords[0]!);
    const chordTopY = paddingTop + chordBounds.minY;
    const chordBottomY = paddingTop + chordBounds.maxY;

    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.row).toBe(0);
    expect(layouts[0]!.offsetY).toBe(0);
    expect(layouts[0]!.baselineY).toBe(paddingTop);
    expect(layouts[0]!.height).toBe(rowHeight);
    expect(layouts[0]!.chordTopY).toBe(chordTopY);
    expect(layouts[0]!.chordBottomY).toBe(chordBottomY);
    expect(layouts[0]!.chordEndY).toBe(paddingTop + getChordRightEdgeY(chords[0]!));
    expect(layouts[0]!.chordCenterY).toBe(paddingTop + (chordBounds.minY + chordBounds.maxY) / 2);
    expect(layouts[0]!.contentTopY).toBeLessThanOrEqual(chordTopY);
    expect(layouts[0]!.contentBottomY).toBeGreaterThanOrEqual(chordBottomY);
    expect(layouts[0]!.cropHeight).toBe(minCropRowHeight);
    expect(layouts[0]!.cropHeight).toBeLessThan(rowHeight);
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
    expect(layouts[0]!.chordTopY).toBe(layouts[0]!.baselineY + chordBounds.minY);
    expect(layouts[0]!.chordBottomY).toBe(layouts[0]!.baselineY + chordBounds.maxY);
    expect(layouts[0]!.chordEndY).toBe(layouts[0]!.baselineY + getChordRightEdgeY(chords[0]));
    expect(layouts[0]!.chordCenterY).toBe(
      layouts[0]!.baselineY + (chordBounds.minY + chordBounds.maxY) / 2,
    );
    expect(layouts[0]!.contentTopY).toBeLessThanOrEqual(layouts[0]!.baselineY + chordBounds.minY);
    expect(layouts[0]!.contentBottomY).toBeGreaterThanOrEqual(
      layouts[0]!.baselineY + chordBounds.maxY,
    );
    expect(layouts[0]!.cropHeight).toBe(layouts[0]!.contentBottomY - layouts[0]!.contentTopY);
    expect(layouts[0]!.cropHeight).toBeGreaterThanOrEqual(minCropRowHeight);
  });

  test("行ごとの切り出し高さに応じて次行のオフセットが決まる", () => {
    const { chords, punctuations } = parseScore("1(+_+)/5\n1");
    const layouts = computeRowLayouts(chords, punctuations);

    expect(layouts).toHaveLength(2);
    expect(layouts[0]!.cropHeight).toBe(layouts[0]!.contentBottomY - layouts[0]!.contentTopY);
    expect(layouts[1]!.cropHeight).toBe(layouts[1]!.contentBottomY - layouts[1]!.contentTopY);
    expect(layouts[0]!.cropHeight).toBeGreaterThanOrEqual(minCropRowHeight);
    expect(layouts[1]!.cropHeight).toBeGreaterThanOrEqual(minCropRowHeight);
    expect(layouts[1]!.offsetY).toBe(layouts[0]!.cropHeight);
  });

  test("chordEndY は行内のコードごとの終端 Y ずれを累積する", () => {
    const { chords, punctuations } = parseScore("1+ 1+");
    const layouts = computeRowLayouts(chords, punctuations);

    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.chordEndY).toBe(paddingTop + getChordRightEdgeY(chords[0]!) * 2);
  });

  test("位置が変わるコードが続く行でも高さ計算が累積ずれを反映する", () => {
    const { chords, punctuations } = parseScore("1+ 1+");
    const layouts = computeRowLayouts(chords, punctuations);
    const firstBounds = getChordBounds(chords[0]!);
    const secondBounds = getChordBounds(chords[1]!);
    const accumulatedBottom = paddingTop + getChordRightEdgeY(chords[0]!) + secondBounds.maxY;

    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.chordTopY).toBe(paddingTop + firstBounds.minY);
    expect(layouts[0]!.chordBottomY).toBe(accumulatedBottom);
    expect(layouts[0]!.contentBottomY).toBeGreaterThanOrEqual(accumulatedBottom);
  });

  test("bar がある行では上方向の余白が増えて行が高くなる", () => {
    const { chords, punctuations } = parseScore("!bar 1/1\n1");
    const layouts = computeRowLayouts(chords, punctuations);
    const chordBounds = getChordBounds(chords[0]!);

    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.baselineY).toBeGreaterThan(paddingTop - chordBounds.minY);
    expect(layouts[0]!.chordTopY).toBeGreaterThan(paddingTop);
    expect(layouts[0]!.contentTopY).toBeLessThan(layouts[0]!.chordTopY);
    expect(layouts[0]!.height).toBeGreaterThan(rowHeight);
    expect(layouts[0]!.cropHeight).toBeGreaterThan(minCropRowHeight);
  });

  test("note がある行でもレイアウト計算できる", () => {
    const { chords, punctuations } = parseScore("!note memo\n1 ;");
    const layouts = computeRowLayouts(chords, punctuations);

    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.contentTopY).toBeLessThanOrEqual(layouts[0]!.chordTopY);
    expect(layouts[0]!.contentBottomY).toBeGreaterThanOrEqual(layouts[0]!.chordBottomY);
  });

  test("bar と note が同居すると単体よりさらに上方向の余白が増える", () => {
    const noteOnly = parseScore("!note memo\n1");
    const barOnly = parseScore("!bar 1/1\n1");
    const noteAndBar = parseScore("!bar 1/1\n!note memo\n1");

    const noteOnlyLayout = computeRowLayouts(noteOnly.chords, noteOnly.punctuations)[0]!;
    const barOnlyLayout = computeRowLayouts(barOnly.chords, barOnly.punctuations)[0]!;
    const noteAndBarLayout = computeRowLayouts(noteAndBar.chords, noteAndBar.punctuations)[0]!;

    expect(noteAndBarLayout.baselineY).toBe(noteOnlyLayout.baselineY);
    expect(noteAndBarLayout.baselineY).toBeGreaterThan(barOnlyLayout.baselineY);
    expect(noteAndBarLayout.chordTopY).toBe(noteOnlyLayout.chordTopY);
    expect(noteAndBarLayout.chordTopY).toBeGreaterThan(barOnlyLayout.chordTopY);
  });

  test("bar と gradualTempoChange は同じ帯に重なり追加の上余白を生まない", () => {
    const barOnly = parseScore("!bar 1/1\n1");
    const barAndGradual = parseScore("!bar 1/1\n!gradualTempoChange 0/1 1/1 up\n1");

    const barOnlyLayout = computeRowLayouts(barOnly.chords, barOnly.punctuations)[0]!;
    const barAndGradualLayout = computeRowLayouts(
      barAndGradual.chords,
      barAndGradual.punctuations,
    )[0]!;

    expect(barAndGradualLayout.baselineY).toBe(barOnlyLayout.baselineY);
    expect(barAndGradualLayout.chordTopY).toBe(barOnlyLayout.chordTopY);
  });

  test("note -> bar -> note は note が2段積まれた分だけ上方向の余白が増える", () => {
    const noteAndBar = parseScore("!note first\n!bar 1/1\n1");
    const noteBarNote = parseScore("!note first\n!bar 1/1\n!note second\n1");

    const noteAndBarLayout = computeRowLayouts(noteAndBar.chords, noteAndBar.punctuations)[0]!;
    const noteBarNoteLayout = computeRowLayouts(noteBarNote.chords, noteBarNote.punctuations)[0]!;

    expect(noteBarNoteLayout.baselineY).toBeGreaterThan(noteAndBarLayout.baselineY);
    expect(noteBarNoteLayout.chordTopY).toBeGreaterThan(noteAndBarLayout.chordTopY);
  });
});
