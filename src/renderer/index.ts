// NOTE:
// - major/minorという書き方より、diatonic / flipped（Iならdiatonicがmaj、flippedがmin）の方が構造的には近いので、diatonic / flippedをベースにする

import { paddingTop, rowBottomPadding, rowHeight } from "./base";
import { getChordBounds, renderChord, type Chord } from "./chord";
import {
  getPunctuationBottomY,
  getPunctuationChordGap,
  renderPunctuation,
  type Punctuation,
} from "./punctation";

export { width, rowHeight } from "./base.ts";

export type RowLayout = {
  row: number;
  offsetY: number;
  baselineY: number;
  height: number;
};

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
    const chordBounds = chordsInRow.map((chord) => getChordBounds(chord));
    const minChordTop = Math.min(0, ...chordBounds.map((bounds) => bounds.minY));
    const maxChordBottom = Math.max(0, ...chordBounds.map((bounds) => bounds.maxY));
    const punctuationBottom = Math.max(0, ...punctationsInRow.map((p) => getPunctuationBottomY(p)));
    const punctuationGap = Math.max(0, ...punctationsInRow.map((p) => getPunctuationChordGap(p)));
    const baselineY = Math.max(
      paddingTop - minChordTop,
      punctuationBottom + punctuationGap - minChordTop,
    );
    const height = Math.max(rowHeight, baselineY + maxChordBottom + rowBottomPadding);
    layouts.push({
      row,
      offsetY,
      baselineY,
      height,
    });
    offsetY += height;
  }

  return layouts;
}

export function measureHeight(chords: Chord[], punctations: Punctuation[]) {
  const layouts = computeRowLayouts(chords, punctations);
  if (layouts.length === 0) {
    return rowHeight;
  }
  return layouts.reduce((sum, layout) => sum + layout.height, 0);
}

export function render(
  canvas: CanvasRenderingContext2D,
  chords: Chord[],
  punctations: Punctuation[],
) {
  const layouts = computeRowLayouts(chords, punctations);
  for (const layout of layouts) {
    const row = layout.row;
    const chordsInRow = chords.filter((chord) => chord.position[0] === row);
    const punctationsInRow = punctations.filter((p) =>
      "row" in p ? p.row === row : p.position[0] === row,
    );
    canvas.save();
    canvas.translate(0, layout.offsetY);
    renderRow(canvas, chordsInRow, punctationsInRow, layout);
    canvas.restore();
  }
}

function renderRow(
  canvas: CanvasRenderingContext2D,
  chords: Chord[],
  punctations: Punctuation[],
  layout: RowLayout,
) {
  for (const punctation of punctations) {
    canvas.save();
    renderPunctuation(canvas, punctation, layout);
    canvas.restore();
  }
  canvas.save();
  canvas.translate(0, layout.baselineY);
  for (const chord of chords) {
    renderChord(canvas, chord);
  }
  canvas.restore();
}
