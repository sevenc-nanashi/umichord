import type { Chord } from "../renderer/chord";
import type { Punctuation } from "../renderer/punctation";
import { Fraction } from "../lib/math";
import { ParseError, parseChordString } from "./chord";

// ──────────────────────────────────────────────
// 内部型
// ──────────────────────────────────────────────

type LayoutToken =
  | { kind: "chord"; text: string; weight: number }
  | { kind: "noChord"; weight: number }
  | { kind: "blank"; weight: number }
  | { kind: "group"; tokens: LayoutToken[]; weight: number };

// ──────────────────────────────────────────────
// ユーティリティ
// ──────────────────────────────────────────────

function parseFraction(s: string): [number, number] {
  const parts = s.split("/");
  if (parts.length !== 2) throw new ParseError(`Invalid fraction: "${s}"`);
  return [parseInt(parts[0]), parseInt(parts[1])];
}

const keyNameToSemitone: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function parseKeyName(name: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 {
  const semitone = keyNameToSemitone[name];
  if (semitone === undefined) throw new ParseError(`Unknown key name: "${name}"`);
  return semitone as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
}

// ──────────────────────────────────────────────
// レイアウトトークナイザ
// ──────────────────────────────────────────────

/**
 * スペース区切りでトップレベルのトークンを分割する（ブラケットを考慮）。
 */
function splitBySpace(s: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let depth = 0;

  for (const ch of s) {
    if (ch === "[") {
      depth++;
      current += ch;
    } else if (ch === "]") {
      depth--;
      current += ch;
    } else if (ch === " " && depth === 0) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

/**
 * トークン文字列から `:N` の重みを取り出す。
 * ブラケットグループ `[...]:N` にも対応。
 */
function extractWeight(token: string): { content: string; weight: number } {
  // グループの場合: [...]:N
  if (token.startsWith("[")) {
    const closeIdx = token.lastIndexOf("]");
    const after = token.slice(closeIdx + 1);
    const m = after.match(/^:(\d+(?:\.\d+)?)$/);
    if (m) {
      return { content: token.slice(0, closeIdx + 1), weight: parseFloat(m[1]) };
    }
    return { content: token, weight: 1 };
  }
  // 通常トークン: chord:N
  const m = token.match(/^(.*):(\d+(?:\.\d+)?)$/);
  if (m) {
    return { content: m[1], weight: parseFloat(m[2]) };
  }
  return { content: token, weight: 1 };
}

/**
 * レイアウト文字列をトークンツリーにパースする。
 */
function parseLayoutTokens(s: string): LayoutToken[] {
  const rawTokens = splitBySpace(s.trim());
  return rawTokens.map((raw) => {
    const { content, weight } = extractWeight(raw);

    if (content === "~") return { kind: "noChord", weight };
    if (content === "_") return { kind: "blank", weight };

    if (content.startsWith("[") && content.endsWith("]")) {
      const inner = content.slice(1, -1);
      return { kind: "group", tokens: parseLayoutTokens(inner), weight };
    }

    return { kind: "chord", text: content, weight };
  });
}

// ──────────────────────────────────────────────
// レイアウト → Chord[] 変換
// ──────────────────────────────────────────────

function processTokens(
  tokens: LayoutToken[],
  row: number,
  start: Fraction,
  end: Fraction,
): Chord[] {
  const chords: Chord[] = [];
  const total = tokens.reduce((sum, t) => sum + t.weight, 0);
  let cursor = start;

  for (const token of tokens) {
    // span = (end - start) * (weight / total)
    // 整数演算で保持: numerator = (end.n*start.d - start.n*end.d) * weight
    //                denominator = start.d * end.d * total
    const rangeNum = end.numerator * start.denominator - start.numerator * end.denominator;
    const rangeDen = start.denominator * end.denominator;
    const spanFrac = new Fraction(
      Math.round(rangeNum * token.weight),
      Math.round(rangeDen * total),
    );
    const tokenEnd = cursor.add(spanFrac);

    switch (token.kind) {
      case "blank":
        break;
      case "noChord":
        chords.push({
          position: [row, cursor.numerator, cursor.denominator],
          length: [spanFrac.numerator, spanFrac.denominator],
          root: null,
          variant: "diatonic",
          omitThird: false,
          omitFifth: false,
          sus: null,
          firstTension: null,
          tensions: [],
          fifthShift: null,
          slashBass: null,
        });
        break;
      case "chord": {
        const data = parseChordString(token.text);
        chords.push({
          position: [row, cursor.numerator, cursor.denominator],
          length: [spanFrac.numerator, spanFrac.denominator],
          ...data,
        });
        break;
      }
      case "group":
        chords.push(...processTokens(token.tokens, row, cursor, tokenEnd));
        break;
    }

    cursor = tokenEnd;
  }

  return chords;
}

function parseChordLayout(line: string, row: number): Chord[] {
  if (!line.trim()) return [];
  const tokens = parseLayoutTokens(line);
  return processTokens(tokens, row, new Fraction(0, 1), new Fraction(1, 1));
}

// ──────────────────────────────────────────────
// 約物のストリップ
// ──────────────────────────────────────────────

type PunctuationMark = "," | ",," | "." | ".." | ":" | ";";

function stripPunctuation(line: string): { line: string; mark: PunctuationMark | null } {
  if (line.endsWith(",,")) return { line: line.slice(0, -2).trimEnd(), mark: ",," };
  if (line.endsWith("..")) return { line: line.slice(0, -2).trimEnd(), mark: ".." };
  if (line.endsWith(",")) return { line: line.slice(0, -1).trimEnd(), mark: "," };
  if (line.endsWith(".")) return { line: line.slice(0, -1).trimEnd(), mark: "." };
  if (line.endsWith(";")) return { line: line.slice(0, -1).trimEnd(), mark: ";" };
  // `:` は `:N`（重み）と区別する: `:` の直前が空白・`]`・行末のみを punctuation とみなす
  if (line.endsWith(":") && !/:\d+$/.test(line)) {
    return { line: line.slice(0, -1).trimEnd(), mark: ":" };
  }
  return { line, mark: null };
}

function markToPunctuation(mark: PunctuationMark, row: number): Punctuation {
  switch (mark) {
    case ",":
      return { type: "minorSection", row };
    case ",,":
      return { type: "majorSection", row };
    case ".":
      return { type: "verseEnd", row };
    case "..":
      return { type: "songEnd", row };
    case ":":
      return { type: "songChange", row };
    case ";":
      return { type: "gradualSongChange", row };
  }
}

// ──────────────────────────────────────────────
// メインパーサ
// ──────────────────────────────────────────────

/**
 * 譜面テキストをパースして Chord[] と Punctuation[] を返す。
 */
export function parseScore(text: string): { chords: Chord[]; punctuations: Punctuation[] } {
  const chords: Chord[] = [];
  const punctuations: Punctuation[] = [];
  let currentRow = 0;

  const rawLines = text.split("\n");
  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    let line = rawLines[lineIndex];
    try {
      // コメント除去（# が行頭か空白の直後にある場合のみ）
      const commentMatch = line.match(/(^|\s)#/);
      if (commentMatch?.index !== undefined) {
        line = line.slice(0, commentMatch.index + (commentMatch[1] ? 1 : 0));
      }
      line = line.trim();
      if (!line) continue;

      // 特殊指示
      if (line.startsWith("!")) {
        const parts = line.slice(1).split(/\s+/);
        const directive = parts[0];

        switch (directive) {
          case "bar": {
            const [lenNum, lenDen] = parseFraction(parts[1]);
            let tempo: number | undefined;
            let timeSignature: [number, number] | undefined;
            for (let i = 2; i < parts.length; i++) {
              const p = parts[i];
              if (/^\d+\/\d+$/.test(p)) {
                const [n, d] = parseFraction(p);
                timeSignature = [n, d];
              } else if (/^\d+$/.test(p)) {
                tempo = parseInt(p);
              }
            }
            punctuations.push({
              type: "bar",
              row: currentRow,
              length: [lenNum, lenDen],
              ...(tempo !== undefined ? { tempo } : {}),
              ...(timeSignature ? { timeSignature } : {}),
            });
            break;
          }
          case "gradualTempoChange": {
            const [startNum, startDen] = parseFraction(parts[1]);
            const [lenNum, lenDen] = parseFraction(parts[2]);
            const direction = parts[3] as "up" | "down";
            if (direction !== "up" && direction !== "down") {
              throw new ParseError(`Invalid gradualTempoChange direction: "${parts[3]}"`);
            }
            punctuations.push({
              type: "gradualTempoChange",
              position: [currentRow, startNum, startDen],
              length: [lenNum, lenDen],
              direction,
            });
            break;
          }
          case "key": {
            const to = parseKeyName(parts[1]);
            punctuations.push({ type: "key", row: currentRow, from: null, to });
            break;
          }
          case "keyChange": {
            const from = parseKeyName(parts[1]);
            const to = parseKeyName(parts[2]);
            punctuations.push({ type: "key", row: currentRow, from, to });
            break;
          }
          default:
            throw new ParseError(`Unknown directive: "!${directive}"`);
        }
        continue;
      }

      // 約物をストリップ
      const { line: chordsLine, mark } = stripPunctuation(line);
      if (mark) {
        punctuations.push(markToPunctuation(mark, currentRow));
      }

      // コードレイアウト
      const rowChords = parseChordLayout(chordsLine, currentRow);
      chords.push(...rowChords);
      if (rowChords.length > 0) currentRow++;
    } catch (e) {
      if (e instanceof ParseError && e.line === undefined) {
        e.line = lineIndex + 1;
      }
      throw e;
    }
  }

  return { chords, punctuations };
}
