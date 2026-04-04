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
const gradualTempoChangeTipSize = dotRadius * 4;
const gradualTempoChangePadding = dotRadius;
const punctuationChordGap = dotRadius;

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
      timeSignature?: [numerator: number, denominator: number];
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

export function getRowFromPunctation(p: Punctuation): number {
  switch (p.type) {
    case "key":
    case "bar":
    case "minorSection":
    case "majorSection":
    case "verseEnd":
    case "songEnd":
    case "songChange":
    case "gradualSongChange":
      return p.row;
    case "gradualTempoChange":
      return p.position[0];
    default:
      throw new ExhaustiveError(p);
  }
}

export function renderPunctuation(
  canvas: CanvasRenderingContext2D,
  p: Punctuation,
  layout: RowLayout,
) {
  switch (p.type) {
    case "key":
      renderKey(canvas, p, layout);
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

export function getPunctuationBottomY(p: Punctuation): number {
  switch (p.type) {
    case "bar":
      return paddingTop + barTextSize + barHeight;
    case "gradualTempoChange":
      return paddingTop + barTextSize + gradualTempoChangeTipSize;
    default:
      return 0;
  }
}

export function getPunctuationChordGap(_p: Punctuation): number {
  return punctuationChordGap;
}

export type VerticalBounds = {
  minY: number;
  maxY: number;
};

type VerticalLayout = Pick<RowLayout, "baselineY" | "height" | "chordCenterY">;

const keyLength = dotRadius * 10;
const fromKeyLength = keyLength * 0.6;
const keyTipLength = dotRadius * 4;
const keyTipAngle = 20;
const keyBaseX = paddingLeft - keyLength;
function getKeyBaseY(layout: VerticalLayout) {
  return layout.chordCenterY;
}
export function getPunctuationBounds(p: Punctuation, layout: VerticalLayout): VerticalBounds {
  switch (p.type) {
    case "key": {
      const keyBaseY = getKeyBaseY(layout);
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
        minY: layout.baselineY - dotRadius,
        maxY: layout.baselineY + dotRadius * 2,
      };
    case "songChange":
      return {
        minY: layout.baselineY - dotsDistance - dotRadius,
        maxY: layout.baselineY + dotRadius,
      };
    case "gradualSongChange":
      return {
        minY: layout.baselineY - dotsDistance - dotRadius,
        maxY: layout.baselineY + dotRadius * 2,
      };
    case "songEnd":
      return {
        minY: layout.baselineY - dotsDistance - dotRadius,
        maxY: layout.baselineY + dotRadius,
      };
    case "bar":
      return {
        minY: paddingTop,
        maxY: paddingTop + barTextSize + barHeight,
      };
    case "gradualTempoChange":
      return {
        minY: paddingTop + barTextSize - gradualTempoChangeTipSize,
        maxY: paddingTop + barTextSize + gradualTempoChangeTipSize,
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
  const keyBaseY = getKeyBaseY(layout);
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
  const baseLineY = layout.baselineY;
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
  layout: RowLayout,
) {
  const baseLineY = layout.baselineY;
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.stroke();
  canvas.beginPath();
  canvas.moveTo(width - paddingLeft + dotRadius * 2, baseLineY);
  canvas.lineTo(width - paddingLeft + dotRadius, baseLineY + dotRadius * 2);
  canvas.stroke();
}
function renderVerseEnd(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "verseEnd" }>,
  layout: RowLayout,
) {
  const baseLineY = layout.baselineY;
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
}
function renderSongChange(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "songChange" }>,
  layout: RowLayout,
) {
  const baseLineY = layout.baselineY;
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.arc(width - paddingLeft + dotRadius, baseLineY - dotsDistance, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
}
function renderGradualSongChange(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "gradualSongChange" }>,
  layout: RowLayout,
) {
  const baseLineY = layout.baselineY;
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.arc(width - paddingLeft + dotRadius, baseLineY - dotsDistance, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.moveTo(width - paddingLeft + dotRadius * 2, baseLineY);
  canvas.lineTo(width - paddingLeft + dotRadius, baseLineY + dotRadius * 2);
  canvas.stroke();
}
function renderSongEnd(
  canvas: CanvasRenderingContext2D,
  _p: Extract<Punctuation, { type: "songEnd" }>,
  layout: RowLayout,
) {
  const baseLineY = layout.baselineY;
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.arc(width - paddingLeft + dotRadius + dotsDistance, baseLineY, dotRadius, 0, 2 * Math.PI);
  canvas.fill();
  canvas.beginPath();
  canvas.arc(
    width - paddingLeft + dotRadius + dotsDistance / 2,
    baseLineY - dotsDistance,
    dotRadius,
    0,
    2 * Math.PI,
  );
  canvas.fill();
}
function renderBar(
  canvas: CanvasRenderingContext2D,
  p: Extract<Punctuation, { type: "bar" }>,
  _layout: RowLayout,
) {
  const positionRight = new Fraction(p.length[0], p.length[1]);
  const barLeft = paddingLeft + gap;
  const barRight = lerp(paddingLeft + gap, width - paddingRight - gap, positionRight.toNumber());
  canvas.beginPath();
  canvas.moveTo(barLeft, paddingTop + barTextSize);
  canvas.lineTo(barRight, paddingTop + barTextSize);
  canvas.lineTo(barRight, paddingTop + barTextSize + barHeight);
  canvas.stroke();

  const text =
    `${p.tempo} ${p.timeSignature ? `${p.timeSignature[0]}/${p.timeSignature[1]}` : ""}`.trim();
  if (text) {
    canvas.font = `${barTextSize}px sans-serif`;
    canvas.textAlign = "left";
    canvas.textBaseline = "bottom";
    canvas.fillText(text, barLeft, paddingTop + barTextSize);
  }
}
function renderGradualTempoChange(
  canvas: CanvasRenderingContext2D,
  p: Extract<Punctuation, { type: "gradualTempoChange" }>,
  _layout: RowLayout,
) {
  const positionLeft = new Fraction(p.position[1], p.position[2]);
  const positionRight = positionLeft.add(new Fraction(p.length[0], p.length[1]));

  const barLeft = lerp(paddingLeft + gap, width - paddingRight - gap, positionLeft.toNumber());
  const barRight = lerp(paddingLeft + gap, width - paddingRight - gap, positionRight.toNumber());
  const barCenter = (barLeft + barRight) / 2;

  canvas.beginPath();
  canvas.moveTo(barLeft, paddingTop + barTextSize);
  canvas.lineTo(barRight, paddingTop + barTextSize);
  canvas.lineTo(
    barRight - gradualTempoChangeTipSize,
    paddingTop + barTextSize - gradualTempoChangeTipSize / 2,
  );
  canvas.lineTo(
    barRight - gradualTempoChangeTipSize,
    paddingTop + barTextSize + gradualTempoChangeTipSize / 2,
  );
  canvas.lineTo(barRight, paddingTop + barTextSize);
  canvas.stroke();

  if (p.direction === "up") {
    canvas.beginPath();
    canvas.moveTo(barCenter, paddingTop + barTextSize - gradualTempoChangeTipSize);
    canvas.lineTo(
      barCenter - gradualTempoChangeTipSize / 2,
      paddingTop + barTextSize - gradualTempoChangePadding,
    );
    canvas.lineTo(
      barCenter + gradualTempoChangeTipSize / 2,
      paddingTop + barTextSize - gradualTempoChangePadding,
    );
    canvas.closePath();
    canvas.fill();
  } else {
    canvas.beginPath();
    canvas.moveTo(barCenter, paddingTop + barTextSize + gradualTempoChangeTipSize);
    canvas.lineTo(
      barCenter - gradualTempoChangeTipSize / 2,
      paddingTop + barTextSize + gradualTempoChangePadding,
    );
    canvas.lineTo(
      barCenter + gradualTempoChangeTipSize / 2,
      paddingTop + barTextSize + gradualTempoChangePadding,
    );
    canvas.closePath();
    canvas.fill();
  }
}
