import { describe, expect, test } from "vite-plus/test";
import { parseScore } from "../../src/parser/score";

// ヘルパー: position と length を分数の数値として取得
function positionValue(chord: { position: [number, number, number] }): number {
  return chord.position[1] / chord.position[2];
}
function lengthValue(chord: { length: [number, number] }): number {
  return chord.length[0] / chord.length[1];
}

describe("parseScore", () => {
  describe("コメント", () => {
    test("# 以降は無視される", () => {
      const { chords } = parseScore("1 2 # これはコメント");
      expect(chords).toHaveLength(2);
    });
    test("# のみの行は無視される", () => {
      const { chords } = parseScore("# コメント行\n1");
      expect(chords).toHaveLength(1);
    });
  });

  describe("空行・空白行", () => {
    test("空行は行番号に影響しない", () => {
      const { chords } = parseScore("1\n\n2");
      expect(chords[0].position[0]).toBe(0); // row 0
      expect(chords[1].position[0]).toBe(1); // row 1
    });
    test("_ のみの行はコードを生成せず row もインクリメントしない", () => {
      const { chords } = parseScore("1\n_ _ _\n2");
      expect(chords).toHaveLength(2);
      expect(chords[0].position[0]).toBe(0);
      expect(chords[1].position[0]).toBe(1); // _ 行に row を消費しない
    });
    test("~ のみの行はノーコードを生成し row をインクリメントする", () => {
      const { chords } = parseScore("1\n~\n2");
      expect(chords[0].position[0]).toBe(0);
      expect(chords[1].position[0]).toBe(1); // ~ はコード扱いなので row 1
      expect(chords[2].position[0]).toBe(2);
    });
  });

  describe("単一コードのレイアウト", () => {
    test("1コードは position=0, length=1/1", () => {
      const { chords } = parseScore("1");
      expect(chords).toHaveLength(1);
      expect(chords[0].position).toEqual([0, 0, 1]);
      expect(chords[0].length).toEqual([1, 1]);
    });
  });

  describe("複数コードの等分割", () => {
    test("2コードは各 1/2", () => {
      const { chords } = parseScore("1 5");
      expect(chords).toHaveLength(2);
      expect(positionValue(chords[0])).toBeCloseTo(0);
      expect(lengthValue(chords[0])).toBeCloseTo(0.5);
      expect(positionValue(chords[1])).toBeCloseTo(0.5);
      expect(lengthValue(chords[1])).toBeCloseTo(0.5);
    });
    test("3コードは各 1/3", () => {
      const { chords } = parseScore("1 4 5");
      expect(chords).toHaveLength(3);
      expect(positionValue(chords[0])).toBeCloseTo(0);
      expect(lengthValue(chords[0])).toBeCloseTo(1 / 3);
      expect(positionValue(chords[1])).toBeCloseTo(1 / 3);
      expect(lengthValue(chords[1])).toBeCloseTo(1 / 3);
      expect(positionValue(chords[2])).toBeCloseTo(2 / 3);
      expect(lengthValue(chords[2])).toBeCloseTo(1 / 3);
    });
  });

  describe("重み付き分割", () => {
    test("1:2 2 → 1が2/3、2が1/3", () => {
      const { chords } = parseScore("1:2 2");
      expect(chords).toHaveLength(2);
      expect(positionValue(chords[0])).toBeCloseTo(0);
      expect(lengthValue(chords[0])).toBeCloseTo(2 / 3);
      expect(positionValue(chords[1])).toBeCloseTo(2 / 3);
      expect(lengthValue(chords[1])).toBeCloseTo(1 / 3);
    });
    test("1 2:3 → 1が1/4、2が3/4", () => {
      const { chords } = parseScore("1 2:3");
      expect(positionValue(chords[0])).toBeCloseTo(0);
      expect(lengthValue(chords[0])).toBeCloseTo(1 / 4);
      expect(positionValue(chords[1])).toBeCloseTo(1 / 4);
      expect(lengthValue(chords[1])).toBeCloseTo(3 / 4);
    });
  });

  describe("ブラケットグループ", () => {
    test("docs の例: [chord1:2 chord2] chord3", () => {
      const { chords } = parseScore("[1:2 2] 3");
      expect(chords).toHaveLength(3);
      // グループ全体が 1/2、chord3 が 1/2
      // グループ内: chord1 が 2/3、chord2 が 1/3
      // chord1: [0, 1/3), chord2: [1/3, 1/2), chord3: [1/2, 1)
      expect(positionValue(chords[0])).toBeCloseTo(0);
      expect(lengthValue(chords[0])).toBeCloseTo(1 / 3);
      expect(positionValue(chords[1])).toBeCloseTo(1 / 3);
      expect(lengthValue(chords[1])).toBeCloseTo(1 / 6);
      expect(positionValue(chords[2])).toBeCloseTo(1 / 2);
      expect(lengthValue(chords[2])).toBeCloseTo(1 / 2);
    });

    test("ネストしたグループ", () => {
      const { chords } = parseScore("[[1 2] 3]");
      expect(chords).toHaveLength(3);
      // 外: 1グループ (全体)
      // 内: [1 2] が 1/2、3 が 1/2
      // [1 2] 内: 1 が 1/2、2 が 1/2
      // chord1: [0, 1/4), chord2: [1/4, 1/2), chord3: [1/2, 1)
      expect(positionValue(chords[0])).toBeCloseTo(0);
      expect(lengthValue(chords[0])).toBeCloseTo(1 / 4);
      expect(positionValue(chords[1])).toBeCloseTo(1 / 4);
      expect(lengthValue(chords[1])).toBeCloseTo(1 / 4);
      expect(positionValue(chords[2])).toBeCloseTo(1 / 2);
      expect(lengthValue(chords[2])).toBeCloseTo(1 / 2);
    });
  });

  describe("~ と _", () => {
    test("~ はノーコード (root: null)", () => {
      const { chords } = parseScore("1 ~ 2");
      expect(chords).toHaveLength(3);
      expect(chords[1].root).toBeNull();
    });
    test("_ は空白（コードを生成しない）", () => {
      const { chords } = parseScore("1 _ 2");
      expect(chords).toHaveLength(2);
      expect(chords[0].root).toBe("i");
      expect(chords[1].root).toBe("ii");
    });
    test("_ でも位置は正しく計算される", () => {
      const { chords } = parseScore("1 _ 2");
      expect(positionValue(chords[1])).toBeCloseTo(2 / 3);
    });
  });

  describe("複数行", () => {
    test("各行に row 番号が割り当てられる", () => {
      const { chords } = parseScore("1\n2\n3");
      expect(chords[0].position[0]).toBe(0);
      expect(chords[1].position[0]).toBe(1);
      expect(chords[2].position[0]).toBe(2);
    });
  });

  describe("約物", () => {
    test(", → minorSection", () => {
      const { punctuations } = parseScore("1 ,");
      const p = punctuations.find((p) => p.type === "minorSection");
      expect(p).toBeDefined();
      expect(p!.type).toBe("minorSection");
    });
    test(",, → majorSection", () => {
      const { punctuations } = parseScore("1 ,,");
      expect(punctuations.some((p) => p.type === "majorSection")).toBe(true);
    });
    test(". → verseEnd", () => {
      const { punctuations } = parseScore("1 .");
      expect(punctuations.some((p) => p.type === "verseEnd")).toBe(true);
    });
    test(".. → songEnd", () => {
      const { punctuations } = parseScore("1 ..");
      expect(punctuations.some((p) => p.type === "songEnd")).toBe(true);
    });
    test(": → songChange（重みのコロンとは区別）", () => {
      const { punctuations, chords } = parseScore("1:2 2 :");
      expect(punctuations.some((p) => p.type === "songChange")).toBe(true);
      // コードは weight が適用されている
      expect(lengthValue(chords[0])).toBeCloseTo(2 / 3);
    });
    test("; → gradualSongChange", () => {
      const { punctuations } = parseScore("1 ;");
      expect(punctuations.some((p) => p.type === "gradualSongChange")).toBe(true);
    });
    test("約物の row は対応する行番号", () => {
      const { punctuations } = parseScore("1\n2 ,\n3");
      const minor = punctuations.find((p) => p.type === "minorSection");
      expect(minor).toBeDefined();
      if (minor && "row" in minor) {
        expect(minor.row).toBe(1);
      }
    });
    test("約物があっても同じ行のコードはパースされる", () => {
      const { chords } = parseScore("1 5 ,");
      expect(chords).toHaveLength(2);
    });
  });

  describe("特殊指示", () => {
    test("!key C → { type: 'key', from: null, to: 0 }", () => {
      const { punctuations } = parseScore("!key C\n1");
      const key = punctuations.find((p) => p.type === "key");
      expect(key).toMatchObject({ type: "key", from: null, to: 0 });
    });
    test("!key C# → to: 1", () => {
      const { punctuations } = parseScore("!key C#\n1");
      const key = punctuations.find((p) => p.type === "key");
      expect(key).toMatchObject({ to: 1 });
    });
    test("!key G → to: 7", () => {
      const { punctuations } = parseScore("!key G\n1");
      const key = punctuations.find((p) => p.type === "key");
      expect(key).toMatchObject({ to: 7 });
    });
    test("!keyChange C G → { from: 0, to: 7 }", () => {
      const { punctuations } = parseScore("!keyChange C G\n1");
      const key = punctuations.find((p) => p.type === "key");
      expect(key).toMatchObject({ type: "key", from: 0, to: 7 });
    });
    test("!bar 1/1 → { type: 'bar', length: [1,1] }", () => {
      const { punctuations } = parseScore("!bar 1/1\n1");
      const bar = punctuations.find((p) => p.type === "bar");
      expect(bar).toMatchObject({ type: "bar", length: [1, 1] });
    });
    test("!bar 1/1 120 → tempo: 120", () => {
      const { punctuations } = parseScore("!bar 1/1 120\n1");
      const bar = punctuations.find((p) => p.type === "bar");
      expect(bar).toMatchObject({ tempo: 120 });
    });
    test("!bar 1/1 4/4 → timeSignature: [4,4]", () => {
      const { punctuations } = parseScore("!bar 1/1 4/4\n1");
      const bar = punctuations.find((p) => p.type === "bar");
      expect(bar).toMatchObject({ timeSignature: [4, 4] });
    });
    test("!bar 1/1 120 4/4 → tempo と timeSignature 両方", () => {
      const { punctuations } = parseScore("!bar 1/1 120 4/4\n1");
      const bar = punctuations.find((p) => p.type === "bar");
      expect(bar).toMatchObject({ tempo: 120, timeSignature: [4, 4] });
    });
    test("!gradualTempoChange 1/2 1/2 up", () => {
      const { punctuations } = parseScore("!gradualTempoChange 1/2 1/2 up\n1");
      const g = punctuations.find((p) => p.type === "gradualTempoChange");
      expect(g).toMatchObject({
        type: "gradualTempoChange",
        position: [0, 1, 2],
        length: [1, 2],
        direction: "up",
      });
    });
    test("!gradualTempoChange down", () => {
      const { punctuations } = parseScore("!gradualTempoChange 0/1 1/1 down\n1");
      const g = punctuations.find((p) => p.type === "gradualTempoChange");
      expect(g).toMatchObject({ direction: "down" });
    });
    test("指示の row は次のコード行の row に対応する", () => {
      const { punctuations } = parseScore("1\n!bar 1/1\n2");
      const bar = punctuations.find((p) => p.type === "bar");
      if (bar && "row" in bar) {
        expect(bar.row).toBe(1);
      }
    });
  });

  describe("コード内容の保持", () => {
    test("コードのルート・バリアントが正しくパースされる", () => {
      const { chords } = parseScore("1m7 4M7");
      expect(chords[0].root).toBe("i");
      expect(chords[0].variant).toBe("flipped");
      expect(chords[0].firstTension).toBe("diatonic");
      expect(chords[1].root).toBe("iv");
      expect(chords[1].variant).toBe("diatonic");
      expect(chords[1].firstTension).toBe("flipped");
    });
  });
});
