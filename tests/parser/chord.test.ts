import { describe, expect, test } from "vite-plus/test";
import { ParseError, parseChordString } from "../../src/parser/chord";

describe("parseChordString", () => {
  describe("ルート", () => {
    test("1 → i", () => {
      expect(parseChordString("1").root).toBe("i");
    });
    test("2 → ii", () => {
      expect(parseChordString("2").root).toBe("ii");
    });
    test("3 → iii", () => {
      expect(parseChordString("3").root).toBe("iii");
    });
    test("4 → iv", () => {
      expect(parseChordString("4").root).toBe("iv");
    });
    test("5 → v", () => {
      expect(parseChordString("5").root).toBe("v");
    });
    test("6 → vi", () => {
      expect(parseChordString("6").root).toBe("vi");
    });
    test("7 → vii", () => {
      expect(parseChordString("7").root).toBe("vii");
    });
    test("1+ → iib", () => {
      expect(parseChordString("1+").root).toBe("iib");
    });
    test("2- → iib", () => {
      expect(parseChordString("2-").root).toBe("iib");
    });
    test("2+ → iiib", () => {
      expect(parseChordString("2+").root).toBe("iiib");
    });
    test("3- → iiib", () => {
      expect(parseChordString("3-").root).toBe("iiib");
    });
    test("4+ → vb", () => {
      expect(parseChordString("4+").root).toBe("vb");
    });
    test("5- → vb", () => {
      expect(parseChordString("5-").root).toBe("vb");
    });
    test("5+ → vib", () => {
      expect(parseChordString("5+").root).toBe("vib");
    });
    test("6- → vib", () => {
      expect(parseChordString("6-").root).toBe("vib");
    });
    test("6+ → viib", () => {
      expect(parseChordString("6+").root).toBe("viib");
    });
    test("7- → viib", () => {
      expect(parseChordString("7-").root).toBe("viib");
    });
  });

  describe("firstTension（ルート直後パターン）", () => {
    test("1M7: firstTension=flipped（メジャー7th）", () => {
      const c = parseChordString("1M7");
      expect(c.firstTension).toBe("flipped");
      expect(c.variant).toBe("diatonic");
    });
    test("17sus2: firstTension=diatonic（ドミナント7th）", () => {
      const c = parseChordString("17sus2");
      expect(c.firstTension).toBe("diatonic");
      expect(c.variant).toBe("sus2");
    });
    test("16: firstTension=6th", () => {
      const c = parseChordString("16");
      expect(c.firstTension).toBe("6th");
    });
    test("1b6: firstTension=b6th", () => {
      const c = parseChordString("1b6");
      expect(c.firstTension).toBe("b6th");
    });
  });

  describe("firstTension（variant後パターン）", () => {
    test("1m7: variant=flipped, firstTension=diatonic", () => {
      const c = parseChordString("1m7");
      expect(c.variant).toBe("flipped");
      expect(c.firstTension).toBe("diatonic");
    });
    test("1mM7: variant=flipped, firstTension=flipped", () => {
      const c = parseChordString("1mM7");
      expect(c.variant).toBe("flipped");
      expect(c.firstTension).toBe("flipped");
    });
  });

  describe("variant", () => {
    test("1m → flipped（マイナー）", () => {
      expect(parseChordString("1m").variant).toBe("flipped");
    });
    test("1M → diatonic（メジャー明示）", () => {
      expect(parseChordString("1M").variant).toBe("diatonic");
    });
    test("1dim → diminished", () => {
      expect(parseChordString("1dim").variant).toBe("diminished");
    });
    test("1aug → augmented", () => {
      expect(parseChordString("1aug").variant).toBe("augmented");
    });
    test("1dim7 → diminished7", () => {
      expect(parseChordString("1dim7").variant).toBe("diminished7");
    });
    test("1sus2 → sus2", () => {
      expect(parseChordString("1sus2").variant).toBe("sus2");
    });
    test("1sus4 → sus4", () => {
      expect(parseChordString("1sus4").variant).toBe("sus4");
    });
    test("1susb2 → susb2", () => {
      expect(parseChordString("1susb2").variant).toBe("susb2");
    });
    test("1susb4 → sus#4", () => {
      expect(parseChordString("1susb4").variant).toBe("sus#4");
    });
    test("1sus#4 → sus#4", () => {
      expect(parseChordString("1sus#4").variant).toBe("sus#4");
    });
  });

  describe("omit", () => {
    test("omit3: omitThird=true", () => {
      const c = parseChordString("1omit3");
      expect(c.omitThird).toBe(true);
      expect(c.omitFifth).toBe(false);
    });
    test("omit5: omitFifth=true", () => {
      const c = parseChordString("1omit5");
      expect(c.omitThird).toBe(false);
      expect(c.omitFifth).toBe(true);
    });
    test("omit35: omitThird=true & omitFifth=true", () => {
      const c = parseChordString("1omit35");
      expect(c.omitThird).toBe(true);
      expect(c.omitFifth).toBe(true);
    });
  });

  describe("fifth shift", () => {
    test("b5: fifthShift=flat", () => {
      expect(parseChordString("1m7b5").fifthShift).toBe("flat");
    });
    test("#5: fifthShift=sharp", () => {
      expect(parseChordString("1M7#5").fifthShift).toBe("sharp");
    });
  });

  describe("テンション", () => {
    test("[=]: 9th=natural", () => {
      expect(parseChordString("1M7(=)").tensions).toEqual(["natural"]);
    });
    test("[+_=]: 9th=sharp, 11th=null, 13th=natural", () => {
      expect(parseChordString("1M7(+_=)").tensions).toEqual(["sharp", null, "natural"]);
    });
    test("[+_+]: 9th=sharp, 11th=null, 13th=sharp", () => {
      expect(parseChordString("1M7(+_+)").tensions).toEqual(["sharp", null, "sharp"]);
    });
    test("[-]: 9th=flat", () => {
      expect(parseChordString("1(-)").tensions).toEqual(["flat"]);
    });
  });

  describe("分数コード（スラッシュベース）", () => {
    test("/3: slashBass=iii", () => {
      expect(parseChordString("1/3").slashBass).toBe("iii");
    });
    test("/5: slashBass=v", () => {
      expect(parseChordString("1/5").slashBass).toBe("v");
    });
    test("/4+: slashBass=vb", () => {
      expect(parseChordString("1/4+").slashBass).toBe("vb");
    });
  });

  describe("docs の例", () => {
    test("1M7: IMaj7", () => {
      const c = parseChordString("1M7");
      expect(c.root).toBe("i");
      expect(c.variant).toBe("diatonic");
      expect(c.firstTension).toBe("flipped");
    });
    test("1m7: Im7", () => {
      const c = parseChordString("1m7");
      expect(c.root).toBe("i");
      expect(c.variant).toBe("flipped");
      expect(c.firstTension).toBe("diatonic");
    });
    test("1sus4: Isus4", () => {
      const c = parseChordString("1sus4");
      expect(c.root).toBe("i");
      expect(c.variant).toBe("sus4");
      expect(c.firstTension).toBeNull();
    });
    test("17sus2: I7sus2", () => {
      const c = parseChordString("17sus2");
      expect(c.root).toBe("i");
      expect(c.firstTension).toBe("diatonic");
      expect(c.variant).toBe("sus2");
    });
    test("1dim7: Idim7", () => {
      const c = parseChordString("1dim7");
      expect(c.root).toBe("i");
      expect(c.variant).toBe("diminished7");
    });
    test("1aug7: IAug7", () => {
      const c = parseChordString("1aug7");
      expect(c.root).toBe("i");
      expect(c.variant).toBe("augmented");
      expect(c.firstTension).toBe("diatonic");
    });
    test("1m7b5: Im7(b5)", () => {
      const c = parseChordString("1m7b5");
      expect(c.root).toBe("i");
      expect(c.variant).toBe("flipped");
      expect(c.firstTension).toBe("diatonic");
      expect(c.fifthShift).toBe("flat");
    });
    test("1M7#5: IMaj7(#5)", () => {
      const c = parseChordString("1M7#5");
      expect(c.root).toBe("i");
      expect(c.firstTension).toBe("flipped");
      expect(c.fifthShift).toBe("sharp");
    });
    test("1M7(=): IMaj7(add9)", () => {
      const c = parseChordString("1M7(=)");
      expect(c.tensions).toEqual(["natural"]);
    });
    test("1M7(+_=): IMaj7(add#9,13)", () => {
      const c = parseChordString("1M7(+_=)");
      expect(c.tensions).toEqual(["sharp", null, "natural"]);
    });
    test("1M7(+_+): IMaj7(add#9,#13)", () => {
      const c = parseChordString("1M7(+_+)");
      expect(c.tensions).toEqual(["sharp", null, "sharp"]);
    });
  });

  describe("デフォルト値", () => {
    test("シンプルなコードはデフォルト値を持つ", () => {
      const c = parseChordString("1");
      expect(c.omitThird).toBe(false);
      expect(c.omitFifth).toBe(false);
      expect(c.firstTension).toBeNull();
      expect(c.fifthShift).toBeNull();
      expect(c.tensions).toEqual([]);
      expect(c.slashBass).toBeNull();
      expect(c.variant).toBe("diatonic");
    });
  });

  describe("エラー", () => {
    test("無効なルートはエラー", () => {
      expect(() => parseChordString("x")).toThrow(ParseError);
    });
    test("閉じられていないテンションブラケットはエラー", () => {
      expect(() => parseChordString("1M7[+")).toThrow(ParseError);
    });
    test("余分な文字はエラー", () => {
      expect(() => parseChordString("1M7xyz")).toThrow(ParseError);
    });
  });
});
