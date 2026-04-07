import { describe, expect, test } from "vite-plus/test";
import { parseScore } from "../../src/parser/score";
import { computeRowLayouts } from "../../src/renderer/index";
import {
  getPositionedPunctuations,
  getPositionedPunctuationsInRenderOrder,
} from "../../src/renderer/punctation";

describe("punctation layout", () => {
  test("bar と note は入力順に関係なく note -> bar で処理される", () => {
    const { chords, punctuations } = parseScore("!bar 1/1\n!note memo\n1");
    const layout = computeRowLayouts(chords, punctuations)[0]!;
    const positioned = getPositionedPunctuationsInRenderOrder(
      getPositionedPunctuations(punctuations, layout),
    );

    expect(positioned.map(({ punctuation }) => punctuation.type)).toEqual(["note", "bar"]);
  });

  test("note は現在の最高位置を基準に上へ積み上がる", () => {
    const { chords, punctuations } = parseScore("!note first\n!note second\n1");
    const layout = computeRowLayouts(chords, punctuations)[0]!;
    const positioned = getPositionedPunctuations(punctuations, layout);

    expect(positioned).toHaveLength(2);
    expect(positioned[1]!.bounds.maxY).toBe(positioned[0]!.bounds.minY);
    expect(positioned[1]!.bounds.minY).toBeLessThan(positioned[0]!.bounds.minY);
  });

  test("bar と note は同じ上側領域で接する", () => {
    const { chords, punctuations } = parseScore("!bar 1/1\n!note memo\n1");
    const layout = computeRowLayouts(chords, punctuations)[0]!;
    const positioned = getPositionedPunctuations(punctuations, layout);
    const note = positioned.find(({ punctuation }) => punctuation.type === "note");
    const bar = positioned.find(({ punctuation }) => punctuation.type === "bar");

    if (note === undefined || bar === undefined) {
      throw new Error("note and bar are required");
    }

    expect(bar.bounds.minY).toBe(note.bounds.maxY);
    expect(bar.bounds.maxY).toBeGreaterThan(note.bounds.minY);
  });

  test("bar と gradualTempoChange は同じ帯で重なる", () => {
    const { chords, punctuations } = parseScore("!bar 1/1\n!gradualTempoChange 0/1 1/1 up\n1");
    const layout = computeRowLayouts(chords, punctuations)[0]!;
    const positioned = getPositionedPunctuations(punctuations, layout);
    const bar = positioned.find(({ punctuation }) => punctuation.type === "bar")!;
    const gradual = positioned.find(
      ({ punctuation }) => punctuation.type === "gradualTempoChange",
    )!;

    expect(bar.bounds.minY).toBeLessThan(gradual.bounds.maxY);
    expect(gradual.bounds.minY).toBeLessThan(bar.bounds.maxY);
  });

  test("note -> bar -> note は note -> note -> bar に正規化される", () => {
    const { chords, punctuations } = parseScore("!note first\n!bar 1/1\n!note second\n1");
    const layout = computeRowLayouts(chords, punctuations)[0]!;
    const positioned = getPositionedPunctuationsInRenderOrder(
      getPositionedPunctuations(punctuations, layout),
    );

    expect(positioned.map(({ punctuation }) => punctuation.type)).toEqual(["note", "note", "bar"]);
    expect(positioned[1]!.bounds.maxY).toBe(positioned[0]!.bounds.minY);
    expect(positioned[1]!.bounds.minY).toBeLessThan(positioned[0]!.bounds.minY);
    expect(positioned[2]!.bounds.minY).toBeGreaterThan(positioned[1]!.bounds.maxY);
  });

  test("note -> gradualTempoChange -> note は note -> note -> gradualTempoChange に正規化される", () => {
    const { chords, punctuations } = parseScore(
      "!note first\n!gradualTempoChange 0/1 1/1 up\n!note second\n1",
    );
    const layout = computeRowLayouts(chords, punctuations)[0]!;
    const positioned = getPositionedPunctuationsInRenderOrder(
      getPositionedPunctuations(punctuations, layout),
    );

    expect(positioned.map(({ punctuation }) => punctuation.type)).toEqual([
      "note",
      "note",
      "gradualTempoChange",
    ]);
    expect(positioned[1]!.bounds.maxY).toBe(positioned[0]!.bounds.minY);
    expect(positioned[1]!.bounds.minY).toBeLessThan(positioned[0]!.bounds.minY);
    expect(positioned[2]!.bounds.minY).toBeGreaterThan(positioned[1]!.bounds.maxY);
  });
});
