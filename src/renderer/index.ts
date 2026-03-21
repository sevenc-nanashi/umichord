// NOTE:
// - major/minorという書き方より、diatonic / flipped（Iならdiatonicがmaj、flippedがmin）の方が構造的には近いので、diatonic / flippedをベースにする

import { rowHeight } from "./base";
import type { Chord } from "./chord";
import { renderPunctuation, type Punctuation } from "./punctation";

export function render(
  canvas: CanvasRenderingContext2D,
  chords: Chord[],
  punctations: Punctuation[],
) {
  const maxRow = Math.max(
    ...chords.map((chord) => chord.position[0]),
    ...punctations.map((p) => ("row" in p ? p.row : p.position[0])),
  );
  for (let row = 0; row <= maxRow; row++) {
    const chordsInRow = chords.filter((chord) => chord.position[0] === row);
    const punctationsInRow = punctations.filter((p) =>
      "row" in p ? p.row === row : p.position[0] === row,
    );
    canvas.save();
    canvas.translate(0, row * rowHeight);
    renderRow(canvas, chordsInRow, punctationsInRow);
    canvas.restore();
  }
}

function renderRow(canvas: CanvasRenderingContext2D, _chords: Chord[], punctations: Punctuation[]) {
  for (const punctation of punctations) {
    renderPunctuation(canvas, punctation);
  }
}
