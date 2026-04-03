import type { Degree } from "../renderer/base";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const rootsWhoseMinorDiatonic = new Set(["ii", "iii", "vb", "vi", "vii"]);
const rootsWhoseMinorSeventhDiatonic = new Set(["ii", "vb", "v", "vi"]);

export type ChordData = {
  root: Degree;
  variant:
    | "diatonic"
    | "flipped"
    | "diminished"
    | "augmented"
    | "augmentedWithOctave"
    | "diminished7"
    | "sus2"
    | "sus4"
    | "susb2"
    | "sus#4";
  omitThird: boolean;
  omitFifth: boolean;
  firstTension: "diatonic" | "flipped" | "6th" | "b6th" | null;
  tensions: ("flat" | "sharp" | "natural" | null)[];
  fifthShift: "flat" | "sharp" | null;
  slashBass: Degree | null;
};

const degreeMap: Record<string, Degree> = {
  "1": "i",
  "1+": "iib",
  "2-": "iib",
  "2": "ii",
  "2+": "iiib",
  "3-": "iiib",
  "3": "iii",
  "4": "iv",
  "4+": "vb",
  "5-": "vb",
  "5": "v",
  "5+": "vib",
  "6-": "vib",
  "6": "vi",
  "6+": "viib",
  "7-": "viib",
  "7": "vii",
};

function parseRoot(s: string, pos: number): [Degree, number] | null {
  const digit = s[pos];
  if (!digit || !/[1-7]/.test(digit)) return null;
  const modifier = s[pos + 1];
  let key: string;
  let advance: number;
  if (modifier === "+" || modifier === "-") {
    key = digit + modifier;
    advance = 2;
  } else {
    key = digit;
    advance = 1;
  }
  const degree = degreeMap[key];
  if (!degree) return null;
  return [degree, advance];
}

function parseTensionChar(ch: string, src: string): "flat" | "sharp" | "natural" | null {
  switch (ch) {
    case "+":
      return "sharp";
    case "-":
      return "flat";
    case "=":
      return "natural";
    case "_":
      return null;
    default:
      throw new ParseError(`Unknown tension character '${ch}' in: ${src}`);
  }
}

/**
 * コード文字列（例: `1M7`、`2m7b5`）をパースする。
 * `_`（ノーコード）や `~`（空白）は受け付けない。
 */
export function parseChordString(s: string): ChordData {
  let pos = 0;

  // ルート
  const rootResult = parseRoot(s, pos);
  if (!rootResult) throw new ParseError(`Invalid chord root in: "${s}"`);
  const [root, rootAdvance] = rootResult;
  pos += rootAdvance;

  // firstTension（先に来るパターン: root firstTension variant ...）を試みる
  let firstTension: ChordData["firstTension"] = null;

  if (s.startsWith("M7", pos)) {
    firstTension = rootsWhoseMinorSeventhDiatonic.has(root) ? "flipped" : "diatonic";
    pos += 2;
  } else if (s.startsWith("b6", pos)) {
    firstTension = "b6th";
    pos += 2;
  } else if (s[pos] === "7") {
    firstTension = rootsWhoseMinorSeventhDiatonic.has(root) ? "diatonic" : "flipped";
    pos += 1;
  } else if (s[pos] === "6") {
    firstTension = "6th";
    pos += 1;
  }

  // variant
  let variant: ChordData["variant"] = rootsWhoseMinorDiatonic.has(root) ? "flipped" : "diatonic";

  if (s.startsWith("dim7", pos)) {
    variant = "diminished7";
    pos += 4;
  } else if (s.startsWith("dim", pos)) {
    variant = "diminished";
    pos += 3;
  } else if (s.startsWith("aug8", pos)) {
    variant = "augmentedWithOctave";
    pos += 4;
  } else if (s.startsWith("aug", pos)) {
    variant = "augmented";
    pos += 3;
  } else if (s.startsWith("susb2", pos)) {
    variant = "susb2";
    pos += 5;
  } else if (s.startsWith("sus#4", pos) || s.startsWith("susb4", pos)) {
    variant = "sus#4";
    pos += 5;
  } else if (s.startsWith("sus2", pos)) {
    variant = "sus2";
    pos += 4;
  } else if (s.startsWith("sus4", pos)) {
    variant = "sus4";
    pos += 4;
  } else if (s[pos] === "M" && s[pos + 1] !== "7") {
    // 単独の M（メジャー）
    variant = "diatonic";
    pos += 1;
  } else if (s[pos] === "m") {
    variant = rootsWhoseMinorDiatonic.has(root) ? "diatonic" : "flipped";
    pos += 1;
  }

  // firstTension（後に来るパターン: root variant firstTension ...）
  if (firstTension === null) {
    if (s.startsWith("M7", pos)) {
      firstTension = rootsWhoseMinorSeventhDiatonic.has(root) ? "flipped" : "diatonic";
      pos += 2;
    } else if (s.startsWith("b6", pos)) {
      firstTension = "b6th";
      pos += 2;
    } else if (s[pos] === "7") {
      firstTension = rootsWhoseMinorSeventhDiatonic.has(root) ? "diatonic" : "flipped";
      pos += 1;
    } else if (s[pos] === "6") {
      firstTension = "6th";
      pos += 1;
    }
  }

  // omit
  let omitThird = false;
  let omitFifth = false;
  if (s.startsWith("omit35", pos)) {
    omitThird = true;
    omitFifth = true;
    pos += 6;
  } else if (s.startsWith("omit3", pos)) {
    omitThird = true;
    pos += 5;
  } else if (s.startsWith("omit5", pos)) {
    omitFifth = true;
    pos += 5;
  }

  // fifth shift
  let fifthShift: ChordData["fifthShift"] = null;
  if (s.startsWith("b5", pos)) {
    fifthShift = "flat";
    pos += 2;
  } else if (s.startsWith("#5", pos)) {
    fifthShift = "sharp";
    pos += 2;
  }

  // tensions
  const tensions: ChordData["tensions"] = [];
  if (s[pos] === "(") {
    const end = s.indexOf(")", pos);
    if (end === -1) throw new ParseError(`Unclosed tension bracket in: "${s}"`);
    for (const ch of s.slice(pos + 1, end)) {
      tensions.push(parseTensionChar(ch, s));
    }
    pos = end + 1;
  }

  // slash bass
  let slashBass: Degree | null = null;
  if (s[pos] === "/") {
    pos++;
    const bassResult = parseRoot(s, pos);
    if (!bassResult) throw new ParseError(`Invalid slash bass in: "${s}"`);
    slashBass = bassResult[0];
    pos += bassResult[1];
  }

  if (pos !== s.length) {
    throw new ParseError(`Unexpected characters "${s.slice(pos)}" in chord: "${s}"`);
  }

  return { root, variant, omitThird, omitFifth, firstTension, tensions, fifthShift, slashBass };
}
