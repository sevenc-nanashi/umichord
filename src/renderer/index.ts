// NOTE:
// - major/minorという書き方より、diatonic / flipped（Iならdiatonicがmaj、flippedがmin）の方が構造的には近いので、diatonic / flippedをベースにする

import { minCropRowHeight, paddingTop, rowBottomPadding, rowHeight, width } from "./base";
import { getChordBounds, getChordRightEdgeY, renderChord, type Chord } from "./chord";
import { getPunctuationBounds, renderPunctuation, type Punctuation } from "./punctation";
import { Context } from "svgcanvas";

export { width, rowHeight } from "./base.ts";

const rowGuideLineColor = "rgba(15, 23, 42, 0.12)";

export type RowLayout = {
  row: number;
  offsetY: number;
  baselineY: number;
  height: number;
  chordCenterY: number;
  chordTopY: number;
  chordBottomY: number;
  chordEndY: number;
  contentTopY: number;
  contentBottomY: number;
  cropHeight: number;
};

type RowLayoutBase = Omit<RowLayout, "contentTopY" | "contentBottomY" | "cropHeight">;

type PositionedChordBounds = {
  minY: number;
  maxY: number;
};

function getChordsInRenderOrder(chords: Chord[]) {
  return [...chords].sort((left, right) => {
    const leftPosition = left.position[1] / left.position[2];
    const rightPosition = right.position[1] / right.position[2];
    return leftPosition - rightPosition;
  });
}

function getPositionedChordBounds(chords: Chord[]): PositionedChordBounds[] {
  const bounds: PositionedChordBounds[] = [];
  let currentY = 0;

  for (const chord of getChordsInRenderOrder(chords)) {
    const chordBounds = getChordBounds(chord);
    bounds.push({
      minY: currentY + chordBounds.minY,
      maxY: currentY + chordBounds.maxY,
    });
    currentY += getChordRightEdgeY(chord);
  }

  return bounds;
}

function getMaxRow(chords: Chord[], punctations: Punctuation[]) {
  return Math.max(
    -1,
    ...chords.map((chord) => chord.position[0]),
    ...punctations.map((p) => ("row" in p ? p.row : p.position[0])),
  );
}

export function countRows(chords: Chord[], punctations: Punctuation[]) {
  return getMaxRow(chords, punctations) + 1;
}

export function computeRowLayouts(chords: Chord[], punctations: Punctuation[]): RowLayout[] {
  const rowCount = countRows(chords, punctations);
  const layouts: RowLayout[] = [];
  let offsetY = 0;

  for (let row = 0; row < rowCount; row++) {
    const chordsInRow = chords.filter((chord) => chord.position[0] === row);
    const punctationsInRow = punctations.filter((p) =>
      "row" in p ? p.row === row : p.position[0] === row,
    );
    const positionedChordBounds = getPositionedChordBounds(chordsInRow);
    const minChordTop = Math.min(0, ...positionedChordBounds.map((bounds) => bounds.minY));
    const maxChordBottom = Math.max(0, ...positionedChordBounds.map((bounds) => bounds.maxY));
    const baselineY = paddingTop - minChordTop;
    const height = Math.max(rowHeight, baselineY + maxChordBottom + rowBottomPadding);
    const chordTopY = baselineY + minChordTop;
    const chordBottomY = baselineY + maxChordBottom;
    const chordCenterY = chordsInRow.length === 0 ? height / 2 : (chordTopY + chordBottomY) / 2;
    let chordEndYOffset = 0;
    for (const chord of getChordsInRenderOrder(chordsInRow)) {
      chordEndYOffset += getChordRightEdgeY(chord);
    }
    const chordEndY = baselineY + chordEndYOffset;
    const layoutBase: RowLayoutBase = {
      row,
      offsetY,
      baselineY,
      height,
      chordCenterY,
      chordTopY,
      chordBottomY,
      chordEndY,
    };
    const contentBounds = getContentBounds(chordsInRow, punctationsInRow, layoutBase);
    layouts.push({
      ...layoutBase,
      contentTopY: contentBounds.topY,
      contentBottomY: contentBounds.bottomY,
      cropHeight: contentBounds.bottomY - contentBounds.topY,
    });
    offsetY += contentBounds.bottomY - contentBounds.topY;
  }

  return layouts;
}

export function measureHeight(chords: Chord[], punctations: Punctuation[]) {
  const layouts = computeRowLayouts(chords, punctations);
  if (layouts.length === 0) {
    return rowHeight;
  }
  return layouts.reduce((sum, layout) => sum + layout.cropHeight, 0);
}

export function render(
  canvas: CanvasRenderingContext2D,
  chords: Chord[],
  punctations: Punctuation[],
) {
  canvas.fillStyle = "black";
  canvas.strokeStyle = "black";
  const layouts = computeRowLayouts(chords, punctations);
  for (const layout of layouts) {
    const row = layout.row;
    const chordsInRow = chords.filter((chord) => chord.position[0] === row);
    const punctationsInRow = punctations.filter((p) =>
      "row" in p ? p.row === row : p.position[0] === row,
    );
    renderRowAt(canvas, chordsInRow, punctationsInRow, layout);
    renderRowGuideLine(canvas, layout);
  }
}

export function renderToSvg(chords: Chord[], punctations: Punctuation[]) {
  if (typeof document === "undefined") {
    throw new Error("renderToSvg requires a browser document");
  }
  const height = measureHeight(chords, punctations);
  const canvas = new Context(width, height) as unknown as CanvasRenderingContext2D & {
    getSerializedSvg(): string;
  };

  canvas.fillStyle = "white";
  canvas.fillRect(0, 0, width, height);
  render(canvas, chords, punctations);

  return canvas.getSerializedSvg();
}

function getActualContentTopY(chords: Chord[], punctations: Punctuation[], layout: RowLayoutBase) {
  const chordTopY =
    chords.length === 0
      ? Number.POSITIVE_INFINITY
      : Math.min(
          ...getPositionedChordBounds(chords).map((bounds) => layout.baselineY + bounds.minY),
        );
  const punctuationTopY =
    punctations.length === 0
      ? Number.POSITIVE_INFINITY
      : Math.min(...punctations.map((punctation) => getPunctuationBounds(punctation, layout).minY));

  return Math.max(0, Math.min(chordTopY, punctuationTopY));
}

function getActualContentBottomY(
  chords: Chord[],
  punctations: Punctuation[],
  layout: RowLayoutBase,
) {
  const chordBottomY =
    chords.length === 0
      ? Number.NEGATIVE_INFINITY
      : Math.max(
          ...getPositionedChordBounds(chords).map((bounds) => layout.baselineY + bounds.maxY),
        );
  const punctuationBottomY =
    punctations.length === 0
      ? Number.NEGATIVE_INFINITY
      : Math.max(...punctations.map((punctation) => getPunctuationBounds(punctation, layout).maxY));

  return Math.min(layout.height, Math.max(chordBottomY, punctuationBottomY));
}

function getContentBounds(chords: Chord[], punctations: Punctuation[], layout: RowLayoutBase) {
  const actualTopY = getActualContentTopY(chords, punctations, layout);
  const actualBottomY = getActualContentBottomY(chords, punctations, layout);
  const actualHeight = Math.max(1, actualBottomY - actualTopY);
  const targetHeight = Math.min(layout.height, Math.max(minCropRowHeight, actualHeight));

  if (targetHeight === actualHeight) {
    return {
      topY: actualTopY,
      bottomY: actualBottomY,
    };
  }

  const centerY = (actualTopY + actualBottomY) / 2;
  let topY = centerY - targetHeight / 2;
  let bottomY = centerY + targetHeight / 2;

  if (topY < 0) {
    bottomY -= topY;
    topY = 0;
  }
  if (bottomY > layout.height) {
    topY -= bottomY - layout.height;
    bottomY = layout.height;
  }

  return {
    topY: Math.max(0, topY),
    bottomY: Math.min(layout.height, bottomY),
  };
}

function renderRowAt(
  canvas: CanvasRenderingContext2D,
  chords: Chord[],
  punctations: Punctuation[],
  layout: RowLayout,
) {
  canvas.save();
  canvas.translate(0, layout.offsetY - layout.contentTopY);
  renderRow(canvas, chords, punctations, layout);
  canvas.restore();
}

function renderRowGuideLine(canvas: CanvasRenderingContext2D, layout: RowLayout) {
  const guideLineY = layout.offsetY + layout.cropHeight - 0.5;
  canvas.save();
  canvas.strokeStyle = rowGuideLineColor;
  canvas.lineWidth = 1;
  canvas.beginPath();
  canvas.moveTo(0, guideLineY);
  canvas.lineTo(width, guideLineY);
  canvas.stroke();
  canvas.restore();
}

function renderRow(
  canvas: CanvasRenderingContext2D,
  chords: Chord[],
  punctations: Punctuation[],
  layout: RowLayout,
) {
  canvas.save();
  canvas.translate(0, layout.baselineY);
  for (const chord of chords) {
    renderChord(canvas, chord);
  }
  canvas.restore();
  for (const punctation of punctations) {
    canvas.save();
    renderPunctuation(canvas, punctation, layout);
    canvas.restore();
  }
}
