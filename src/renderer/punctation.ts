import {
  dotRadius,
  gap,
  paddingLeft,
  paddingRight,
  paddingTop,
  width,
  type Length,
  type Position,
} from "./base.ts";
import { ExhaustiveError } from "../lib/error.ts";
import { Fraction, lerp } from "../lib/math.ts";
import type { RowLayout } from "./index.ts";

const dotsDistance = dotRadius * 4;
const barHeight = dotRadius * 4;
const barTextSize = dotRadius * 4;
const barTextTopPadding = dotRadius * 2;
const noteTextSize = dotRadius * 4;
const noteTopPadding = dotRadius * 2;
const noteRowTopOffset = paddingTop;
const noteLeftPadding = dotRadius * 2;
const noteTextColor = "#6b7280";
const gradualTempoChangeTipSize = dotRadius * 4;
const gradualTempoChangePadding = dotRadius;
const barVerticalOffset = dotRadius * 2;

/**
 * minorSection: 白抜きコンマ
 * majorSection: 黒塗りコンマ
 * verseEnd: ピリオド
 * songEnd: ∴
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
      timeSignature?: [numerator: number, denominator: number];
    }
  | {
      type: "note";
      row: number;
      text: string;
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
      type: "gradualSongChange";
      row: number;
    };

export function renderPunctuation(
  canvas: CanvasRenderingContext2D,
  p: Punctuation,
  layout: RowLayout,
) {
  switch (p.type) {
    case "key":
      renderKey(canvas, p, layout);
      break;
    case "note":
      renderNote(canvas, p, layout);
      break;
    case "majorSection":
      renderMajorSection(canvas, p, layout);
      break;
    case "minorSection":
      renderMinorSection(canvas, p, layout);
      break;
    case "verseEnd":
      renderVerseEnd(canvas, p, layout);
      break;
    case "songChange":
      renderSongChange(canvas, p, layout);
      break;
    case "gradualSongChange":
      renderGradualSongChange(canvas, p, layout);
      break;
    case "songEnd":
      renderSongEnd(canvas, p, layout);
      break;
    case "bar":
      renderBar(canvas, p, layout);
      break;
    case "gradualTempoChange":
      renderGradualTempoChange(canvas, p, layout);
      break;
    default:
      throw new ExhaustiveError(p);
  }
}

export type VerticalBounds = {
  minY: number;
  maxY: number;
};

type VerticalLayout = Pick<
  RowLayout,
  "baselineY" | "height" | "chordCenterY" | "chordTopY" | "chordBottomY" | "chordEndY"
>;

const keyLength = dotRadius * 10;
const fromKeyLength = keyLength * 0.5;
const keyTipLength = dotRadius * 4;
const keyTipAngle = 20;
const keyBaseX = paddingLeft - keyLength;
function getBarBottomY(layout: VerticalLayout) {
  return layout.chordTopY - barVerticalOffset;
}

function getGradualTempoChangeLineY(layout: VerticalLayout) {
  return getBarBottomY(layout) - gradualTempoChangeTipSize;
}

function computeSymbolY(layout: Pick<RowLayout, "baselineY" | "chordEndY">) {
  return lerp(layout.baselineY, layout.chordEndY, 0.25);
}
export function getPunctuationBounds(p: Punctuation, layout: VerticalLayout): VerticalBounds {
  switch (p.type) {
    case "key": {
      const keyBaseY = layout.chordCenterY;
      const maxLength = p.from === null ? keyLength : Math.max(keyLength, fromKeyLength);
      return {
        minY: keyBaseY - maxLength - keyTipLength,
        maxY: keyBaseY + maxLength + keyTipLength,
      };
    }
    case "majorSection":
    case "minorSection":
    case "verseEnd":
      return {
        minY: computeSymbolY(layout) - dotRadius,
        maxY: computeSymbolY(layout) + dotRadius * 2,
      };
    case "songChange": {
      const symbolY = computeSymbolY(layout);
      return {
        minY: symbolY - dotsDistance - dotRadius,
        maxY: symbolY + dotRadius,
      };
    }
    case "gradualSongChange": {
      const symbolY = computeSymbolY(layout);
      return {
        minY: symbolY - dotsDistance - dotRadius,
        maxY: symbolY + dotRadius * 2,
      };
    }
    case "songEnd": {
      const symbolY = computeSymbolY(layout);
      return {
        minY: symbolY - dotsDistance - dotRadius,
        maxY: symbolY + dotRadius,
      };
    }
    case "bar":
      return {
        minY: getBarBottomY(layout) - (barTextSize + barHeight + barTextTopPadding),
        maxY: getBarBottomY(layout),
      };
    case "note":
      return {
        minY: layout.chordTopY - (noteTextSize + noteTopPadding + noteRowTopOffset),
        maxY: layout.chordTopY - noteRowTopOffset,
      };
    case "gradualTempoChange":
      return {
        minY: getGradualTempoChangeLineY(layout) - barTextSize,
        maxY: getGradualTempoChangeLineY(layout) + gradualTempoChangeTipSize,
      };
    default:
      throw new ExhaustiveError(p);
  }
}
function renderKey(
  canvas: CanvasRenderingContext2D,
  p: Extract<Punctuation, { type: "key" }>,
  layout: RowLayout,
) {
  const keyBaseY = layout.chordCenterY;
  if (p.from !== null) {
    const fromDirection = 30 * p.from - 90;
    const fromX = keyBaseX + fromKeyLength * Math.cos((fromDirection * Math.PI) / 180);
    const fromY = keyBaseY + fromKeyLength * Math.sin((fromDirection * Math.PI) / 180);
    canvas.beginPath();
    canvas.moveTo(keyBaseX, keyBaseY);
    canvas.lineTo(fromX, fromY);
    canvas.stroke();
    canvas.beginPath();
  }
  const toDirection = 30 * p.to - 90;
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

function renderMajorSection(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "majorSection" }>,
  layout: RowLayout,
) {
  const y = computeSymbolY(layout);
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, y, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.moveTo(width - paddingLeft + dotRadius * 2, y);
  canvas.lineTo(width - paddingLeft + dotRadius, y + dotRadius * 2);
  canvas.stroke();
}
function renderMinorSection(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "minorSection" }>,
  layout: RowLayout,
) {
  const y = computeSymbolY(layout);
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, y, dotRadius, 0, 2 * Math.PI);
  canvas.stroke();
  canvas.beginPath();
  canvas.moveTo(width - paddingLeft + dotRadius * 2, y);
  canvas.lineTo(width - paddingLeft + dotRadius, y + dotRadius * 2);
  canvas.stroke();
}
function renderVerseEnd(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "verseEnd" }>,
  layout: RowLayout,
) {
  const y = computeSymbolY(layout);
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, y, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
}
function renderSongChange(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "songChange" }>,
  layout: RowLayout,
) {
  const y = computeSymbolY(layout);
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, y, dotRadius, 0, 2 * Math.PI);
  canvas.arc(width - paddingLeft + dotRadius, y - dotsDistance, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
}
function renderGradualSongChange(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "gradualSongChange" }>,
  layout: RowLayout,
) {
  const y = computeSymbolY(layout);
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, y, dotRadius, 0, 2 * Math.PI);
  canvas.arc(width - paddingLeft + dotRadius, y - dotsDistance, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.moveTo(width - paddingLeft + dotRadius * 2, y);
  canvas.lineTo(width - paddingLeft + dotRadius, y + dotRadius * 2);
  canvas.stroke();
}
function renderSongEnd(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "songEnd" }>,
  layout: RowLayout,
) {
  const y = computeSymbolY(layout);
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, y, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius + dotsDistance, y, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.arc(
    width - paddingLeft + dotRadius + dotsDistance / 2,
    y - dotsDistance,
    dotRadius,
    0,
    2 * Math.PI,
  );
  canvas.fill();
}
function renderBar(
  canvas: CanvasRenderingContext2D,
  p: Extract<Punctuation, { type: "bar" }>,
  layout: RowLayout,
) {
  const barBottomY = getBarBottomY(layout);
  const positionRight = new Fraction(p.length[0], p.length[1]);
  const barLeft = paddingLeft + gap;
  const barRight = lerp(paddingLeft + gap, width - paddingRight - gap, positionRight.toNumber());
  canvas.beginPath();
  canvas.moveTo(barLeft, barBottomY - barHeight);
  canvas.lineTo(barRight, barBottomY - barHeight);
  canvas.lineTo(barRight, barBottomY);
  canvas.stroke();

  const text =
    `${p.tempo ?? ""} ${p.timeSignature ? `${p.timeSignature[0]}/${p.timeSignature[1]}` : ""}`.trim();
  if (text) {
    canvas.font = `${barTextSize}px sans-serif`;
    canvas.textAlign = "left";
    canvas.textBaseline = "top";
    canvas.fillText(text, barLeft, barBottomY - barHeight - barTextSize - barTextTopPadding);
  }
}

function renderNote(
  canvas: CanvasRenderingContext2D,
  p: Extract<Punctuation, { type: "note" }>,
  layout: RowLayout,
) {
  const previousFillStyle = canvas.fillStyle;
  canvas.fillStyle = noteTextColor;
  canvas.font = `${noteTextSize}px sans-serif`;
  canvas.textAlign = "left";
  canvas.textBaseline = "top";
  canvas.fillText(
    p.text,
    noteLeftPadding,
    layout.chordTopY - noteTextSize - noteTopPadding - noteRowTopOffset,
  );
  canvas.fillStyle = previousFillStyle;
}

function renderGradualTempoChange(
  canvas: CanvasRenderingContext2D,
  p: Extract<Punctuation, { type: "gradualTempoChange" }>,
  layout: RowLayout,
) {
  const positionLeft = new Fraction(p.position[1], p.position[2]);
  const positionRight = positionLeft.add(new Fraction(p.length[0], p.length[1]));

  const barLeft = lerp(paddingLeft + gap, width - paddingRight - gap, positionLeft.toNumber());
  const barRight = lerp(paddingLeft + gap, width - paddingRight - gap, positionRight.toNumber());
  const barCenter = (barLeft + barRight) / 2;
  const lineY = getGradualTempoChangeLineY(layout);

  canvas.beginPath();
  canvas.moveTo(barLeft, lineY);
  canvas.lineTo(barRight, lineY);
  canvas.lineTo(barRight - gradualTempoChangeTipSize, lineY - gradualTempoChangeTipSize / 2);
  canvas.lineTo(barRight - gradualTempoChangeTipSize, lineY + gradualTempoChangeTipSize / 2);
  canvas.lineTo(barRight, lineY);
  canvas.stroke();

  if (p.direction === "up") {
    canvas.beginPath();
    canvas.moveTo(barCenter, lineY - gradualTempoChangeTipSize);
    canvas.lineTo(barCenter - gradualTempoChangeTipSize / 2, lineY - gradualTempoChangePadding);
    canvas.lineTo(barCenter + gradualTempoChangeTipSize / 2, lineY - gradualTempoChangePadding);
    canvas.closePath();
    canvas.fill();
  } else {
    canvas.beginPath();
    canvas.moveTo(barCenter, lineY + gradualTempoChangeTipSize);
    canvas.lineTo(barCenter - gradualTempoChangeTipSize / 2, lineY + gradualTempoChangePadding);
    canvas.lineTo(barCenter + gradualTempoChangeTipSize / 2, lineY + gradualTempoChangePadding);
    canvas.closePath();
    canvas.fill();
  }
}
