import { ExhaustiveError } from "../lib/error";
import { Fraction, lerp } from "../lib/math";
import {
  dotRadius,
  gap,
  paddingLeft,
  paddingRight,
  rowHeight,
  width,
  type Degree,
  type Length,
  type Position,
} from "./base";

const defaultMajor: Degree[] = ["i", "iib", "iib", "iib", "iiib", "iv", "v", "vib", "vib"];
// dimになるとループが外れるタイプのコード
const seventhLikes: Degree[] = ["vii", "vb"];

export type Chord =
  | {
      /** コードの開始位置 */
      position: Position;
      /** コードの長さ（分数表記） */
      length: Length;
      /** ルート音の位置 */
      root: Degree;
      /** コードの種類 */
      variant: "diatonic" | "flipped" | "diminished" | "augmented" | "diminished7";
      /** omit3 */
      omitThird: boolean;
      /** omit5 */
      omitFifth: boolean;
      /** sus */
      sus: "sus2" | "sus4" | "susb2" | "sus#4" | null;
      /** 7th/6th/b6th */
      firstTension: "diatonic" | "flipped" | "6th" | "b6th" | null;
      /** テンション */
      tensions: {
        9: -1 | 0 | 1 | null;
        11: -1 | 0 | 1 | null;
        13: -1 | 0 | 1 | null;
      };
      /** b5 **/
      flat5th: boolean;
      /** 分数コード */
      slashBass: Degree | null;
    }
  | {
      position: Position;
      length: Length;
      root: null;
      variant: "diatonic";
      omitThird: false;
      omitFifth: false;
      sus: null;
      firstTension: null;
      tensions: {
        9: null;
        11: null;
        13: null;
      };
      flat5th: false;
      slashBass: null;
    };

const curveControlPointOffset = rowHeight / 8;
const flipLineLength = dotRadius * 2;
const dimAugCircleRadius = dotRadius;
const dimAugOffset = dimAugCircleRadius + dotRadius;
const dimAugLineLength = dimAugCircleRadius * 4;
const shiftAmount = dotRadius * 4;
const chordDotRadius = dotRadius;
const nonDiatonicLoopSize = dotRadius * 2;
const firstTensionLength = dotRadius * 3;
const attachmentShift = chordDotRadius * 2;
export function renderChord(canvas: CanvasRenderingContext2D, chord: Chord) {
  const positionLeft = new Fraction(chord.position[1], chord.position[2]);
  const positionRight = positionLeft.add(new Fraction(chord.length[0], chord.length[1]));
  const left = lerp(paddingLeft + gap, width - paddingRight - gap, positionLeft.toNumber());
  const right = lerp(paddingLeft + gap, width - paddingRight - gap, positionRight.toNumber());
  const centerX = lerp(left, right, 0.5);

  let centerY = 0;
  let shiftY = 0;
  switch (chord.root) {
    case null:
      for (let x = left; x <= right; x += dotRadius) {
        canvas.beginPath();
        canvas.moveTo(x, 0);
        canvas.lineTo(Math.min(x + dotRadius / 2, right), 0);
        canvas.stroke();
      }
      break;
    case "i":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.bezierCurveTo(left, curveControlPointOffset, right, curveControlPointOffset, right, 0);
      canvas.stroke();
      centerY = curveControlPointOffset * 0.75;
      drawLineLastAttachment(
        canvas,
        right - attachmentShift,
        curveControlPointOffset * 0.5,
        chord.firstTension,
      );
      break;
    case "iib":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(left + nonDiatonicLoopSize, shiftAmount);
      canvas.lineTo(left + nonDiatonicLoopSize, shiftAmount + nonDiatonicLoopSize);
      canvas.bezierCurveTo(
        left,
        shiftAmount + nonDiatonicLoopSize,
        left,
        shiftAmount,
        left + nonDiatonicLoopSize,
        shiftAmount,
      );
      canvas.lineTo(right, shiftAmount);
      canvas.stroke();
      drawLineLastAttachment(canvas, right - attachmentShift, shiftAmount, chord.firstTension);
      centerY = shiftAmount;
      shiftY = shiftAmount;
      break;
    case "ii":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.bezierCurveTo(
        left,
        -curveControlPointOffset,
        right,
        -curveControlPointOffset,
        right,
        0,
      );
      canvas.stroke();
      drawCircleLastAttachment(canvas, right - chordDotRadius, 0, "down", chord.firstTension);
      // canvas.arc(right - chordDotRadius, 0, chordDotRadius, 0, 2 * Math.PI);
      centerY = -curveControlPointOffset * 0.75;
      break;
    case "iiib":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(left, -shiftAmount);
      canvas.bezierCurveTo(
        left,
        -shiftAmount + curveControlPointOffset,
        right,
        -shiftAmount + curveControlPointOffset,
        right,
        -shiftAmount,
      );
      canvas.stroke();
      centerY = -shiftAmount + curveControlPointOffset * 0.75;
      shiftY = -shiftAmount;
      drawLineLastAttachment(
        canvas,
        right - attachmentShift,
        -shiftAmount + curveControlPointOffset * 0.5,
        chord.firstTension,
      );
      break;
    case "iii":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(right, 0);
      canvas.stroke();
      drawLineLastAttachment(canvas, right - attachmentShift, 0, chord.firstTension);
      centerY = 0;
      break;
    case "iv":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.bezierCurveTo(
        left,
        -curveControlPointOffset,
        right,
        -curveControlPointOffset,
        right,
        0,
      );
      canvas.stroke();
      centerY = -curveControlPointOffset * 0.75;
      drawLineLastAttachment(
        canvas,
        right - attachmentShift,
        -curveControlPointOffset * 0.5,
        chord.firstTension,
      );
      break;
    case "vb":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(left + nonDiatonicLoopSize, -shiftAmount);
      canvas.lineTo(left + nonDiatonicLoopSize, -shiftAmount - nonDiatonicLoopSize);
      canvas.bezierCurveTo(
        left,
        -shiftAmount - nonDiatonicLoopSize,
        left,
        -shiftAmount,
        left + nonDiatonicLoopSize,
        -shiftAmount,
      );
      canvas.lineTo(right, 0);
      canvas.stroke();
      drawSeventhLikeAttachment(canvas, right - attachmentShift, 0, chord);
      centerY = -shiftAmount / 2;
      break;
  }

  switch (chord.variant) {
    case "diatonic":
      break;
    case "flipped":
      canvas.beginPath();
      canvas.moveTo(centerX, centerY - flipLineLength / 2);
      canvas.lineTo(centerX, centerY + flipLineLength / 2);
      canvas.stroke();
      break;
    case "diminished":
    case "diminished7":
      // 7th系のdimは9を書かない
      if (chord.variant === "diminished" && seventhLikes.includes(chord.root)) {
        break;
      }
      canvas.beginPath();
      canvas.arc(centerX, centerY + dimAugOffset, dimAugCircleRadius, 0, 2 * Math.PI);
      if (chord.variant === "diminished7") {
        canvas.fill();
      } else {
        canvas.stroke();
      }
      canvas.beginPath();
      if (defaultMajor.includes(chord.root)) {
        canvas.moveTo(centerX - dimAugCircleRadius, centerY + dimAugOffset);
        canvas.lineTo(centerX, centerY + dimAugOffset - dimAugLineLength);
      } else {
        canvas.moveTo(centerX + dimAugCircleRadius, centerY + dimAugOffset);
        canvas.lineTo(centerX, centerY + dimAugOffset + dimAugLineLength);
      }
      canvas.stroke();
      break;
    case "augmented":
      canvas.beginPath();
      canvas.arc(centerX, centerY - dimAugOffset, dimAugCircleRadius, 0, 2 * Math.PI);
      canvas.stroke();
      canvas.beginPath();
      if (defaultMajor.includes(chord.root)) {
        canvas.moveTo(centerX - dimAugCircleRadius, centerY - dimAugOffset);
        canvas.lineTo(centerX, centerY - dimAugOffset - dimAugLineLength);
      } else {
        canvas.moveTo(centerX + dimAugCircleRadius, centerY - dimAugOffset);
        canvas.lineTo(centerX, centerY - dimAugOffset + dimAugLineLength);
      }
      canvas.stroke();
      break;
  }

  canvas.translate(0, shiftY);
}

const sixthShift = dotRadius;
function drawLineLastAttachment(
  canvas: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  firstTension: null | "diatonic" | "flipped" | "6th" | "b6th",
) {
  switch (firstTension) {
    case null:
      break;
    case "diatonic":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.lineTo(baseX, baseY + firstTensionLength);
      canvas.stroke();
      break;
    case "flipped":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.lineTo(baseX, baseY - firstTensionLength);
      canvas.stroke();
      break;
    case "6th":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.lineTo(baseX, baseY + firstTensionLength);
      canvas.stroke();
      canvas.beginPath();
      canvas.moveTo(baseX - sixthShift, baseY);
      canvas.lineTo(baseX - sixthShift, baseY + firstTensionLength);
      canvas.stroke();
      break;
    case "b6th":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.lineTo(baseX, baseY + firstTensionLength);
      canvas.stroke();
      canvas.beginPath();
      canvas.moveTo(baseX + sixthShift, baseY);
      canvas.lineTo(baseX + sixthShift, baseY + firstTensionLength);
      canvas.stroke();
      break;
    default:
      throw new ExhaustiveError(firstTension);
  }
}

function drawCircleLastAttachment(
  canvas: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  outerDirection: "up" | "down",
  firstTension: null | "diatonic" | "flipped" | "6th" | "b6th",
) {
  switch (firstTension) {
    case null:
      canvas.beginPath();
      canvas.arc(baseX, baseY, chordDotRadius, 0, 2 * Math.PI);
      canvas.stroke();
      break;
    case "diatonic":
      canvas.beginPath();
      canvas.arc(baseX, baseY, chordDotRadius, 0, 2 * Math.PI);
      canvas.fill();
      break;
    case "flipped":
      canvas.beginPath();
      canvas.arc(baseX, baseY, chordDotRadius, 0, 2 * Math.PI);
      canvas.fill();
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.lineTo(
        baseX,
        outerDirection === "up" ? baseY - firstTensionLength : baseY + firstTensionLength,
      );
      canvas.stroke();
      break;
    case "6th":
      canvas.beginPath();
      canvas.arc(baseX, baseY, chordDotRadius, 0, 2 * Math.PI);
      canvas.stroke();
      canvas.moveTo(
        baseX - sixthShift,
        baseY + (outerDirection === "up" ? -chordDotRadius : chordDotRadius),
      );
      canvas.lineTo(
        baseX - sixthShift,
        baseY +
          (outerDirection === "up"
            ? -(firstTensionLength - chordDotRadius)
            : firstTensionLength - chordDotRadius),
      );
      canvas.stroke();
      canvas.beginPath();
      canvas.moveTo(baseX, baseY + (outerDirection === "up" ? -chordDotRadius : chordDotRadius));
      canvas.lineTo(
        baseX,
        baseY +
          (outerDirection === "up"
            ? -(firstTensionLength - chordDotRadius)
            : firstTensionLength - chordDotRadius),
      );
      canvas.stroke();
      break;
    case "b6th":
      canvas.beginPath();
      canvas.arc(baseX, baseY, chordDotRadius, 0, 2 * Math.PI);
      canvas.stroke();
      canvas.moveTo(baseX - chordDotRadius, baseY);
      canvas.lineTo(baseX - (firstTensionLength - chordDotRadius), baseY);
      canvas.stroke();
      canvas.beginPath();
      canvas.moveTo(baseX + chordDotRadius, baseY);
      canvas.lineTo(baseX + (firstTensionLength - chordDotRadius), baseY);
      canvas.stroke();
      break;
    default:
      throw new ExhaustiveError(firstTension);
  }
}

function drawSeventhLikeAttachment(
  canvas: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  chord: Chord,
) {
  const isDim = chord.variant === "diminished";
  const isMin7Flat5 = chord.firstTension === "flipped" && chord.flat5th;
  if (isDim) {
    drawLineLastAttachment(canvas, baseX, baseY, null);
  } else if (isMin7Flat5) {
    drawLineLastAttachment(canvas, baseX, baseY, "diatonic");
  } else {
    drawCircleLastAttachment(canvas, baseX, baseY, "down", chord.firstTension);
  }
}
