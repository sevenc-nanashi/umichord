import {
  baseLineY,
  dotRadius,
  paddingLeft,
  rowHeight,
  width,
  type Length,
  type Position,
} from "./base.ts";
import { ExhaustiveError } from "../lib/error.ts";

/**
 * minorSection: 白抜きコンマ
 * majorSection: 黒塗りコンマ
 * verseEnd: ピリオド
 * songEnd: ∴（元の仕様には書いてないが、実際の曲で使われているので追加）
 * songChange: コロン
 * songSmoothChange: セミコロン
 */
export type Punctuation =
  | {
      type: "key";
      row: number;
      from: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | null;
      to: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
    }
  | {
      type: "bar";
      row: number;
      length: Length;
      tempo?: number;
    }
  | {
      type: "gradualTempoChange";
      position: Position;
      length: Length;
      direction: "up" | "down";
    }
  | {
      type: "minorSection";
      row: number;
    }
  | {
      type: "majorSection";
      row: number;
    }
  | {
      type: "verseEnd";
      row: number;
    }
  | {
      type: "songEnd";
      row: number;
    }
  | {
      type: "songChange";
      row: number;
    }
  | {
      type: "songSmoothChange";
      row: number;
    };
// | {
//     type:
//       | "minorSection"
//       | "majorSection"
//       | "verseEnd"
//       | "songEnd"
//       | "songChange"
//       | "songSmoothChange";
//     row: number;
//   };

export function getRowFromPunctation(p: Punctuation): number {
  switch (p.type) {
    case "key":
    case "bar":
    case "minorSection":
    case "majorSection":
    case "verseEnd":
    case "songEnd":
    case "songChange":
    case "songSmoothChange":
      return p.row;
    case "gradualTempoChange":
      return p.position[0];
    default:
      throw new ExhaustiveError(p);
  }
}

export function renderPunctuation(canvas: CanvasRenderingContext2D, p: Punctuation) {
  switch (p.type) {
    case "key":
      renderKey(canvas, p);
      break;
    case "majorSection":
      renderMajorSection(canvas, p);
      break;
    case "minorSection":
      renderMinorSection(canvas, p);
      break;
    default:
      throw new Error("Not implemented");
  }
}

const keyLength = (rowHeight / 2) * 0.8;
const keyTipLength = keyLength * 0.3;
const keyTipAngle = 20;
const keyBaseX = paddingLeft / 2;
const keyBaseY = rowHeight / 2;
function renderKey(canvas: CanvasRenderingContext2D, p: Extract<Punctuation, { type: "key" }>) {
  const toDirection = 30 * p.to - 90;
  if (p.from === null) {
    // key change
    const toX = keyBaseX + keyLength * Math.cos((toDirection * Math.PI) / 180);
    const toY = keyBaseY + keyLength * Math.sin((toDirection * Math.PI) / 180);
    canvas.beginPath();
    canvas.moveTo(keyBaseX, keyBaseY);
    canvas.lineTo(toX, toY);
    canvas.stroke();
    canvas.beginPath();
    const leftTipDirection = toDirection - keyTipAngle;
    const leftTipX = toX - keyTipLength * Math.cos((leftTipDirection * Math.PI) / 180);
    const leftTipY = toY - keyTipLength * Math.sin((leftTipDirection * Math.PI) / 180);
    canvas.moveTo(toX, toY);
    canvas.lineTo(leftTipX, leftTipY);
    const rightTipDirection = toDirection + keyTipAngle;
    const rightTipX = toX - keyTipLength * Math.cos((rightTipDirection * Math.PI) / 180);
    const rightTipY = toY - keyTipLength * Math.sin((rightTipDirection * Math.PI) / 180);
    canvas.moveTo(toX, toY);
    canvas.lineTo(rightTipX, rightTipY);
    canvas.stroke();
  }
}

function renderMajorSection(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "majorSection" }>,
) {
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.moveTo(width - paddingLeft + dotRadius * 2, baseLineY);
  canvas.lineTo(width - paddingLeft + dotRadius, baseLineY + dotRadius * 2);
  canvas.stroke();
}
function renderMinorSection(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "minorSection" }>,
) {
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.stroke();
  canvas.beginPath();
  canvas.moveTo(width - paddingLeft + dotRadius * 2, baseLineY);
  canvas.lineTo(width - paddingLeft + dotRadius, baseLineY + dotRadius * 2);
  canvas.stroke();
}
