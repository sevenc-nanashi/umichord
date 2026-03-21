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
      variant:
        | "diatonic"
        | "flipped"
        | "diminished"
        | "augmented"
        | "diminished7"
        | "sus2"
        | "sus4"
        | "susb2"
        | "sus#4";
      /** omit3 */
      omitThird: boolean;
      /** omit5 */
      omitFifth: boolean;
      /** 7th/6th/b6th */
      firstTension: "diatonic" | "flipped" | "6th" | "b6th" | null;
      /** 9th以降のテンション（順番に9th, 11th, 13th、...） */
      tensions: ("flat" | "sharp" | "natural" | null)[];
      /** b5/#5 **/
      fifthShift: "flat" | "sharp" | null;
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
      tensions: [];
      fifthShift: null;
      slashBass: null;
    };

const curveControlPointOffset = rowHeight / 8;
const flipLineLength = dotRadius * 4;
const dimAugCircleRadius = dotRadius;
const centerAttachmentShift = dimAugCircleRadius + dotRadius;
const dimAugLineLength = dimAugCircleRadius * 4;
const shiftAmount = dotRadius * 8;
const chordDotRadius = dotRadius;
const nonDiatonicLoopSize = dotRadius * 2;
const firstTensionLength = dotRadius * 3;
const attachmentShift = chordDotRadius * 2;
const susDotRadius = dotRadius * 0.5;
const nonDiatonicSusLength = dotRadius * 2;
const omitCircleRadius = dotRadius * 2;
const fifthShiftLength = dotRadius * 1;
const tensionRadius = dotRadius;
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
    case "v":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(right, -shiftAmount);
      canvas.stroke();
      drawLineLastAttachment(canvas, right - attachmentShift, -shiftAmount, chord.firstTension);
      centerY = -shiftAmount / 2;
      shiftY = -shiftAmount;
      break;
    case "vib":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.bezierCurveTo(left, -shiftAmount, centerX, -shiftAmount, right, -shiftAmount);
      canvas.stroke();
      drawLineLastAttachment(canvas, right - attachmentShift, -shiftAmount, chord.firstTension);
      centerY = -shiftAmount;
      shiftY = -shiftAmount;
      break;
    case "vi":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.bezierCurveTo(left, curveControlPointOffset, right, curveControlPointOffset, right, 0);
      canvas.stroke();
      drawCircleLastAttachment(canvas, right - chordDotRadius, 0, "up", chord.firstTension);
      centerY = curveControlPointOffset * 0.75;
      break;
    case "viib":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(left, shiftAmount);
      canvas.bezierCurveTo(
        left,
        shiftAmount - curveControlPointOffset,
        right,
        shiftAmount - curveControlPointOffset,
        right,
        shiftAmount,
      );
      canvas.stroke();
      centerY = shiftAmount - curveControlPointOffset * 0.75;
      shiftY = shiftAmount;
      drawLineLastAttachment(
        canvas,
        right - attachmentShift,
        shiftAmount - curveControlPointOffset * 0.5,
        chord.firstTension,
      );
      break;
    case "vii":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(right, shiftAmount);
      canvas.stroke();
      centerY = shiftAmount / 2;
      shiftY = shiftAmount;
      drawSeventhLikeAttachment(canvas, right - attachmentShift, shiftAmount * 0.9, chord);
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
      canvas.arc(centerX, centerY + centerAttachmentShift, dimAugCircleRadius, 0, 2 * Math.PI);
      if (chord.variant === "diminished7") {
        canvas.fill();
      } else {
        canvas.stroke();
      }
      canvas.beginPath();
      if (defaultMajor.includes(chord.root)) {
        canvas.moveTo(centerX - dimAugCircleRadius, centerY + centerAttachmentShift);
        canvas.lineTo(centerX, centerY + centerAttachmentShift - dimAugLineLength);
      } else {
        canvas.moveTo(centerX + dimAugCircleRadius, centerY + centerAttachmentShift);
        canvas.lineTo(centerX, centerY + centerAttachmentShift + dimAugLineLength);
      }
      canvas.stroke();
      break;
    case "augmented":
      canvas.beginPath();
      canvas.arc(centerX, centerY - centerAttachmentShift, dimAugCircleRadius, 0, 2 * Math.PI);
      canvas.stroke();
      canvas.beginPath();
      if (defaultMajor.includes(chord.root)) {
        canvas.moveTo(centerX - dimAugCircleRadius, centerY - centerAttachmentShift);
        canvas.lineTo(centerX, centerY - centerAttachmentShift - dimAugLineLength);
      } else {
        canvas.moveTo(centerX + dimAugCircleRadius, centerY - centerAttachmentShift);
        canvas.lineTo(centerX, centerY - centerAttachmentShift + dimAugLineLength);
      }
      canvas.stroke();
      break;
    case "sus2":
      canvas.beginPath();
      canvas.arc(centerX, centerY + centerAttachmentShift, susDotRadius, 0, 2 * Math.PI);
      canvas.fill();
      break;
    case "sus4":
      canvas.beginPath();
      canvas.arc(centerX, centerY - centerAttachmentShift, susDotRadius, 0, 2 * Math.PI);
      canvas.fill();
      break;
    case "susb2":
      canvas.beginPath();
      canvas.moveTo(centerX, centerY + centerAttachmentShift);
      canvas.lineTo(centerX, centerY + centerAttachmentShift + nonDiatonicSusLength);
      canvas.stroke();
      break;
    case "sus#4":
      canvas.beginPath();
      canvas.moveTo(centerX, centerY - centerAttachmentShift);
      canvas.lineTo(centerX, centerY - centerAttachmentShift - nonDiatonicSusLength);
      canvas.stroke();
      break;
    default:
      throw new ExhaustiveError(chord);
  }

  if (chord.omitThird) {
    canvas.beginPath();
    canvas.arc(centerX, centerY, omitCircleRadius, 0, 2 * Math.PI);
    canvas.stroke();
  }
  if (chord.omitFifth) {
    canvas.beginPath();
    canvas.arc(centerX, centerY - omitCircleRadius, omitCircleRadius, Math.PI, 2 * Math.PI);
    canvas.moveTo(centerX + omitCircleRadius, centerY - omitCircleRadius);
    canvas.lineTo(centerX - omitCircleRadius, centerY + omitCircleRadius);
    canvas.moveTo(centerX - omitCircleRadius, centerY - omitCircleRadius);
    canvas.lineTo(centerX + omitCircleRadius, centerY + omitCircleRadius);
    canvas.arc(centerX, centerY + omitCircleRadius, omitCircleRadius, 0, Math.PI);
    canvas.stroke();
  }
  if (chord.fifthShift) {
    canvas.beginPath();
    if (chord.fifthShift === "sharp") {
      canvas.moveTo(centerX + fifthShiftLength, centerY - centerAttachmentShift);
      canvas.lineTo(centerX, centerY - centerAttachmentShift - fifthShiftLength);
      canvas.lineTo(centerX - fifthShiftLength, centerY - centerAttachmentShift);
    } else if (
      chord.fifthShift === "flat" &&
      // 7th系のm7b5は描画しない
      !(chord.firstTension === "diatonic" && chord.fifthShift === "flat")
    ) {
      canvas.moveTo(centerX - fifthShiftLength, centerY + centerAttachmentShift);
      canvas.lineTo(centerX, centerY + centerAttachmentShift + fifthShiftLength);
      canvas.lineTo(centerX + fifthShiftLength, centerY + centerAttachmentShift);
    }
    canvas.stroke();
  }

  canvas.translate(0, shiftY);
  let tensionX = right;
  const tensionY = (tensionRadius / 2) * (chord.tensions.length + 1) + centerAttachmentShift;
  for (let i = chord.tensions.length - 1; i >= 0; i--) {
    const tension = chord.tensions[i];
    if (tension === null) {
      continue;
    }
    const tensionTopY = tensionY + (chord.tensions.length - 1 - i) * tensionRadius;
    const tensionBottomY = tensionTopY + tensionRadius * 2 * (i + 1);
    if (i === 0) {
      if (tension === "sharp") {
        canvas.beginPath();
        canvas.moveTo(tensionX, tensionTopY - tensionRadius);
        canvas.lineTo(tensionX, tensionTopY - tensionRadius * 2);
        canvas.stroke();
      }
      canvas.beginPath();
      canvas.arc(tensionX, tensionTopY, tensionRadius, 0, 2 * Math.PI);
      canvas.stroke();
      if (tension === "flat") {
        canvas.beginPath();
        canvas.moveTo(tensionX, tensionTopY + tensionRadius);
        canvas.lineTo(tensionX, tensionTopY + tensionRadius * 2);
        canvas.stroke();
      }
    } else {
      if (tension === "sharp") {
        canvas.beginPath();
        canvas.moveTo(tensionX, tensionTopY - tensionRadius);
        canvas.lineTo(tensionX, tensionTopY);
        canvas.stroke();
      }
      for (let j = 0; j < i; j++) {
        canvas.beginPath();
        canvas.arc(
          tensionX,
          tensionTopY + j * tensionRadius * 2 + tensionRadius,
          tensionRadius,
          -Math.PI / 2,
          Math.PI / 2,
        );
        canvas.stroke();
      }
      if (tension === "flat") {
        canvas.beginPath();
        canvas.moveTo(tensionX, tensionBottomY + tensionRadius);
        canvas.lineTo(tensionX, tensionBottomY);
        canvas.stroke();
      }
    }
    tensionX -= tensionRadius * 2;
  }
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
  const isMin7Flat5 = chord.firstTension === "diatonic" && chord.fifthShift === "flat";
  if (isDim) {
    drawLineLastAttachment(canvas, baseX, baseY, null);
  } else if (isMin7Flat5) {
    drawLineLastAttachment(canvas, baseX, baseY, "diatonic");
  } else {
    drawCircleLastAttachment(canvas, baseX, baseY, "down", chord.firstTension);
  }
}
