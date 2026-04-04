import { describe, expect, test } from "vite-plus/test";
import { getDecorationLayout } from "../../src/renderer/chord";

describe("getDecorationLayout", () => {
  test("テンションは右端の線のすぐ下から始まる", () => {
    expect(getDecorationLayout(0, 1, false)).toEqual({
      tensionY: 18,
      slashBassY: null,
    });
  });

  test("線の位置が下がると装飾も同じだけ下がる", () => {
    expect(getDecorationLayout(10, 2, true)).toEqual({
      tensionY: 28,
      slashBassY: 49,
    });
  });

  test("テンションがない場合は分数コードを線の直下に置く", () => {
    expect(getDecorationLayout(-4, 0, true)).toEqual({
      tensionY: null,
      slashBassY: 14,
    });
  });

  test("装飾がなければ何も配置しない", () => {
    expect(getDecorationLayout(0, 0, false)).toEqual({
      tensionY: null,
      slashBassY: null,
    });
  });
});
