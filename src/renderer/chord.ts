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
        | "augmentedWithOctave"
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
const attachmentShift = dotRadius * 1;
const susDotRadius = dotRadius * 0.5;
const nonDiatonicSusLength = dotRadius * 2;
const omitCircleRadius = dotRadius * 2;
const fifthShiftLength = dotRadius * 1;
const tensionRadius = dotRadius;
const slashBassSize = dotRadius * 4;

// P0.x=P1.x=left, P2.x=P3.x=right, P1.y=P2.y=cpY のベジエ曲線上の targetX における Y を返す
function bezierYAt(
  left: number,
  right: number,
  y0: number,
  cpY: number,
  y3: number,
  targetX: number,
): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    const t = mid;
    const x = left * (1 - t) * (1 - t) * (1 + 2 * t) + right * t * t * (3 - 2 * t);
    if (x < targetX) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  return y0 * (1 - t) ** 3 + 3 * cpY * t * (1 - t) + y3 * t ** 3;
}

// 直線上の targetX における Y を返す（線形補間）
function lineYAt(x1: number, y1: number, x2: number, y2: number, targetX: number): number {
  return y1 + ((targetX - x1) / (x2 - x1)) * (y2 - y1);
}

function drawLineLastAttachmentOnBezier(
  canvas: CanvasRenderingContext2D,
  left: number,
  right: number,
  y0: number,
  cpY: number,
  y3: number,
  firstTension: null | "diatonic" | "flipped" | "6th" | "b6th",
) {
  const baseX = right - attachmentShift;
  const guideX = Math.max(left, baseX - attachmentShift);
  const baseY = bezierYAt(left, right, y0, cpY, y3, baseX);
  const guideY = bezierYAt(left, right, y0, cpY, y3, guideX);
  drawLineLastAttachment(canvas, baseX, baseY, firstTension, baseX - guideX, baseY - guideY);
}

function drawLineLastAttachmentOnLine(
  canvas: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  firstTension: null | "diatonic" | "flipped" | "6th" | "b6th",
) {
  const baseX = x2 - attachmentShift;
  const guideX = Math.max(x1, baseX - attachmentShift);
  const baseY = lineYAt(x1, y1, x2, y2, baseX);
  const guideY = lineYAt(x1, y1, x2, y2, guideX);
  drawLineLastAttachment(canvas, baseX, baseY, firstTension, baseX - guideX, baseY - guideY);
}

function drawCircleLastAttachmentOnBezier(
  canvas: CanvasRenderingContext2D,
  left: number,
  right: number,
  y0: number,
  cpY: number,
  y3: number,
  outerDirection: "up" | "down",
  firstTension: null | "diatonic" | "flipped" | "6th" | "b6th",
) {
  const baseX = right - attachmentShift;
  const guideX = Math.max(left, baseX - attachmentShift);
  const baseY = bezierYAt(left, right, y0, cpY, y3, baseX);
  const guideY = bezierYAt(left, right, y0, cpY, y3, guideX);
  drawCircleLastAttachment(
    canvas,
    baseX,
    baseY,
    outerDirection,
    firstTension,
    baseX - guideX,
    baseY - guideY,
  );
}

export function renderChord(canvas: CanvasRenderingContext2D, chord: Chord) {
  const positionLeft = new Fraction(chord.position[1], chord.position[2]);
  const positionRight = positionLeft.add(new Fraction(chord.length[0], chord.length[1]));
  const left = lerp(paddingLeft + gap, width - paddingRight - gap, positionLeft.toNumber());
  const right = lerp(paddingLeft + gap, width - paddingRight - gap, positionRight.toNumber());
  const centerX = lerp(left, right, 0.5);

  const { centerY, shiftY } = drawRoot(canvas, chord, left, right, centerX);
  drawVariant(canvas, chord, centerX, centerY);
  drawOmit(canvas, chord, centerX, centerY);
  drawFifthShift(canvas, chord, centerX, centerY);
  canvas.translate(0, shiftY);
  drawTensions(canvas, chord, right);
  drawSlashBass(canvas, chord, right);
}

function drawRoot(
  canvas: CanvasRenderingContext2D,
  chord: Chord,
  left: number,
  right: number,
  centerX: number,
): { centerY: number; shiftY: number } {
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
      drawLineLastAttachmentOnBezier(
        canvas,
        left,
        right,
        0,
        curveControlPointOffset,
        0,
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
      drawLineLastAttachmentOnLine(
        canvas,
        left + nonDiatonicLoopSize,
        shiftAmount,
        right,
        shiftAmount,
        chord.firstTension,
      );
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
      drawCircleLastAttachmentOnBezier(
        canvas,
        left,
        right,
        0,
        -curveControlPointOffset,
        0,
        "down",
        chord.firstTension,
      );
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
      drawLineLastAttachmentOnBezier(
        canvas,
        left,
        right,
        -shiftAmount,
        -shiftAmount + curveControlPointOffset,
        -shiftAmount,
        chord.firstTension,
      );
      break;
    case "iii":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(right, 0);
      canvas.stroke();
      drawLineLastAttachmentOnLine(canvas, left, 0, right, 0, chord.firstTension);
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
      drawLineLastAttachmentOnBezier(
        canvas,
        left,
        right,
        0,
        -curveControlPointOffset,
        0,
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
      drawSeventhLikeAttachment(
        canvas,
        right - attachmentShift,
        lineYAt(left + nonDiatonicLoopSize, -shiftAmount, right, 0, right - attachmentShift),
        chord,
        right - (left + nonDiatonicLoopSize),
        shiftAmount,
      );
      centerY = -shiftAmount / 2;
      break;
    case "v":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.lineTo(right, -shiftAmount);
      canvas.stroke();
      drawLineLastAttachmentOnLine(canvas, left, 0, right, -shiftAmount, chord.firstTension);
      centerY = -shiftAmount / 2;
      shiftY = -shiftAmount;
      break;
    case "vib":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.bezierCurveTo(left, -shiftAmount, centerX, -shiftAmount, right, -shiftAmount);
      canvas.stroke();
      drawLineLastAttachmentOnBezier(
        canvas,
        left,
        right,
        0,
        -shiftAmount,
        -shiftAmount,
        chord.firstTension,
      );
      centerY = -shiftAmount;
      shiftY = -shiftAmount;
      break;
    case "vi":
      canvas.beginPath();
      canvas.moveTo(left, 0);
      canvas.bezierCurveTo(left, curveControlPointOffset, right, curveControlPointOffset, right, 0);
      canvas.stroke();
      drawCircleLastAttachmentOnBezier(
        canvas,
        left,
        right,
        0,
        curveControlPointOffset,
        0,
        "up",
        chord.firstTension,
      );
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
      drawLineLastAttachmentOnBezier(
        canvas,
        left,
        right,
        shiftAmount,
        shiftAmount - curveControlPointOffset,
        shiftAmount,
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
      drawSeventhLikeAttachment(
        canvas,
        right - attachmentShift,
        lineYAt(left, 0, right, shiftAmount, right - attachmentShift),
        chord,
        right - left,
        shiftAmount,
      );
      break;
  }
  return { centerY, shiftY };
}

function drawVariant(
  canvas: CanvasRenderingContext2D,
  chord: Chord,
  centerX: number,
  centerY: number,
) {
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
    case "augmentedWithOctave":
      canvas.beginPath();
      canvas.arc(centerX, centerY - centerAttachmentShift, dimAugCircleRadius, 0, 2 * Math.PI);
      if (chord.variant === "augmentedWithOctave") {
        canvas.fill();
      } else {
        canvas.stroke();
      }
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
}

function drawOmit(
  canvas: CanvasRenderingContext2D,
  chord: Chord,
  centerX: number,
  centerY: number,
) {
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
}

function drawFifthShift(
  canvas: CanvasRenderingContext2D,
  chord: Chord,
  centerX: number,
  centerY: number,
) {
  if (!chord.fifthShift) return;
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

function drawTensions(canvas: CanvasRenderingContext2D, chord: Chord, right: number) {
  let tensionX = right - tensionRadius;
  const tensionY = (tensionRadius / 2) * (chord.tensions.length + 1) + centerAttachmentShift;
  for (let i = chord.tensions.length - 1; i >= 0; i--) {
    const tension = chord.tensions[i];
    if (tension === null) {
      continue;
    }
    const tensionTopY = tensionY + (chord.tensions.length - 1 - i) * tensionRadius;
    const tensionBottomY = tensionTopY + tensionRadius * 2 * i;
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

function drawSlashBass(canvas: CanvasRenderingContext2D, chord: Chord, right: number) {
  const baseX = right - slashBassSize * 1.25;
  const baseY =
    centerAttachmentShift * 2 + tensionRadius * 2 * chord.tensions.length + slashBassSize / 2;
  switch (chord.slashBass) {
    case null:
      break;
    case "i":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.bezierCurveTo(
        baseX,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY,
      );
      canvas.stroke();
      break;
    case "iib":
      canvas.beginPath();
      canvas.moveTo(baseX + slashBassSize / 2, baseY - slashBassSize / 2);
      canvas.lineTo(baseX + slashBassSize / 2, baseY + slashBassSize / 2);
      canvas.bezierCurveTo(
        baseX,
        baseY + slashBassSize / 2,
        baseX,
        baseY + slashBassSize / 2,
        baseX,
        baseY,
      );
      canvas.lineTo(baseX + slashBassSize, baseY);
      canvas.stroke();
      break;
    case "ii":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.bezierCurveTo(
        baseX,
        baseY - slashBassSize / 2,
        baseX + slashBassSize,
        baseY - slashBassSize / 2,
        baseX + slashBassSize,
        baseY,
      );
      canvas.stroke();
      canvas.beginPath();
      canvas.arc(baseX + slashBassSize * (3 / 4), baseY, slashBassSize / 4, 0, Math.PI);
      canvas.moveTo(baseX + slashBassSize / 2, baseY);
      canvas.lineTo(baseX + slashBassSize / 2, baseY - slashBassSize / 2);
      canvas.stroke();
      break;
    case "iiib":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY + slashBassSize / 2);
      canvas.lineTo(baseX, baseY);
      canvas.bezierCurveTo(
        baseX,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY,
      );
      canvas.stroke();
      break;
    case "iii":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.lineTo(baseX + slashBassSize, baseY);
      canvas.stroke();
      break;
    case "iv":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.bezierCurveTo(
        baseX,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY,
      );
      canvas.stroke();
      break;
    case "vb":
      canvas.beginPath();
      canvas.moveTo(baseX + slashBassSize / 2, baseY + slashBassSize / 2);
      canvas.lineTo(baseX + slashBassSize / 2, baseY - slashBassSize / 2);
      canvas.bezierCurveTo(
        baseX,
        baseY - slashBassSize / 2,
        baseX,
        baseY - slashBassSize / 2,
        baseX,
        baseY,
      );
      canvas.lineTo(baseX + slashBassSize, baseY);
      canvas.stroke();
      break;
    case "v":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY + slashBassSize / 2);
      canvas.lineTo(baseX + slashBassSize, baseY);
      canvas.stroke();
      break;
    case "vib":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY + slashBassSize / 2);
      canvas.bezierCurveTo(
        baseX,
        baseY,
        baseX + slashBassSize / 2,
        baseY,
        baseX + slashBassSize,
        baseY,
      );
      canvas.stroke();
      break;
    case "vi":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY);
      canvas.bezierCurveTo(
        baseX,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY + slashBassSize / 2,
        baseX + slashBassSize,
        baseY,
      );
      canvas.stroke();
      canvas.beginPath();
      canvas.arc(baseX + slashBassSize * (3 / 4), baseY, slashBassSize / 4, Math.PI, 2 * Math.PI);
      canvas.moveTo(baseX + slashBassSize / 2, baseY);
      canvas.lineTo(baseX + slashBassSize / 2, baseY + slashBassSize / 2);
      canvas.stroke();
      break;
    case "viib":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY - slashBassSize / 2);
      canvas.lineTo(baseX, baseY);
      canvas.bezierCurveTo(
        baseX,
        baseY - slashBassSize / 2,
        baseX + slashBassSize,
        baseY - slashBassSize / 2,
        baseX + slashBassSize,
        baseY,
      );
      canvas.stroke();
      break;
    case "vii":
      canvas.beginPath();
      canvas.moveTo(baseX, baseY - slashBassSize / 2);
      canvas.lineTo(baseX + slashBassSize, baseY);
      canvas.stroke();
      break;
  }
}

const sixthShift = dotRadius;
function getAttachmentVector(
  tangentDx: number,
  tangentDy: number,
  verticalDirection: -1 | 1,
): { dx: number; dy: number } {
  if (tangentDx === 0 && tangentDy === 0) {
    return { dx: 0, dy: firstTensionLength * verticalDirection };
  }

  let dx = -tangentDy;
  let dy = tangentDx;
  if (dy !== 0 && Math.sign(dy) !== verticalDirection) {
    dx *= -1;
    dy *= -1;
  }

  const scale = firstTensionLength / Math.hypot(dx, dy);
  return { dx: dx * scale, dy: dy * scale };
}

function getLeftNormal(dx: number, dy: number): { x: number; y: number } {
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return { x: -1, y: 0 };
  }
  return { x: -dy / length, y: dx / length };
}

function getTangentUnit(tangentDx: number, tangentDy: number): { x: number; y: number } {
  const length = Math.hypot(tangentDx, tangentDy);
  if (length === 0) {
    return { x: 1, y: 0 };
  }
  return { x: tangentDx / length, y: tangentDy / length };
}

function getOutwardNormal(
  tangentDx: number,
  tangentDy: number,
  outerDirection: "up" | "down",
): { x: number; y: number } {
  const tangent = getTangentUnit(tangentDx, tangentDy);
  let normal = { x: -tangent.y, y: tangent.x };
  const expectedSign = outerDirection === "up" ? -1 : 1;
  if (normal.y !== 0 && Math.sign(normal.y) !== expectedSign) {
    normal = { x: -normal.x, y: -normal.y };
  }
  return normal;
}

function drawLineLastAttachment(
  canvas: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  firstTension: null | "diatonic" | "flipped" | "6th" | "b6th",
  tangentDx = 0,
  tangentDy = 0,
) {
  switch (firstTension) {
    case null:
      break;
    case "diatonic":
      {
        const attachment = getAttachmentVector(tangentDx, tangentDy, 1);
        canvas.beginPath();
        canvas.moveTo(baseX, baseY);
        canvas.lineTo(baseX + attachment.dx, baseY + attachment.dy);
        canvas.stroke();
      }
      break;
    case "flipped":
      {
        const attachment = getAttachmentVector(tangentDx, tangentDy, -1);
        canvas.beginPath();
        canvas.moveTo(baseX, baseY);
        canvas.lineTo(baseX + attachment.dx, baseY + attachment.dy);
        canvas.stroke();
      }
      break;
    case "6th":
      {
        const attachment = getAttachmentVector(tangentDx, tangentDy, 1);
        const leftNormal = getLeftNormal(attachment.dx, attachment.dy);
        const offsetX = leftNormal.x * sixthShift;
        const offsetY = leftNormal.y * sixthShift;

        canvas.beginPath();
        canvas.moveTo(baseX, baseY);
        canvas.lineTo(baseX + attachment.dx, baseY + attachment.dy);
        canvas.stroke();

        canvas.beginPath();
        canvas.moveTo(baseX + offsetX, baseY + offsetY);
        canvas.lineTo(baseX + offsetX + attachment.dx, baseY + offsetY + attachment.dy);
        canvas.stroke();
      }
      break;
    case "b6th":
      {
        const attachment = getAttachmentVector(tangentDx, tangentDy, 1);
        const leftNormal = getLeftNormal(attachment.dx, attachment.dy);
        const offsetX = -leftNormal.x * sixthShift;
        const offsetY = -leftNormal.y * sixthShift;

        canvas.beginPath();
        canvas.moveTo(baseX, baseY);
        canvas.lineTo(baseX + attachment.dx, baseY + attachment.dy);
        canvas.stroke();

        canvas.beginPath();
        canvas.moveTo(baseX + offsetX, baseY + offsetY);
        canvas.lineTo(baseX + offsetX + attachment.dx, baseY + offsetY + attachment.dy);
        canvas.stroke();
      }
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
  tangentDx = 0,
  tangentDy = 0,
) {
  const tangent = getTangentUnit(tangentDx, tangentDy);
  const outwardNormal = getOutwardNormal(tangentDx, tangentDy, outerDirection);
  const centerX = baseX + outwardNormal.x * chordDotRadius;
  const centerY = baseY + outwardNormal.y * chordDotRadius;
  const outerEdgeX = centerX + outwardNormal.x * chordDotRadius;
  const outerEdgeY = centerY + outwardNormal.y * chordDotRadius;
  const tangentOffsetX = -tangent.x * sixthShift;
  const tangentOffsetY = -tangent.y * sixthShift;
  const tangentLength = firstTensionLength - chordDotRadius;

  switch (firstTension) {
    case null:
      canvas.beginPath();
      canvas.arc(centerX, centerY, chordDotRadius, 0, 2 * Math.PI);
      canvas.stroke();
      break;
    case "diatonic":
      canvas.beginPath();
      canvas.arc(centerX, centerY, chordDotRadius, 0, 2 * Math.PI);
      canvas.fill();
      break;
    case "flipped":
      canvas.beginPath();
      canvas.arc(centerX, centerY, chordDotRadius, 0, 2 * Math.PI);
      canvas.fill();
      canvas.beginPath();
      canvas.moveTo(outerEdgeX, outerEdgeY);
      canvas.lineTo(
        outerEdgeX + outwardNormal.x * tangentLength,
        outerEdgeY + outwardNormal.y * tangentLength,
      );
      canvas.stroke();
      break;
    case "6th":
      canvas.beginPath();
      canvas.arc(centerX, centerY, chordDotRadius, 0, 2 * Math.PI);
      canvas.stroke();
      canvas.beginPath();
      canvas.moveTo(outerEdgeX + tangentOffsetX, outerEdgeY + tangentOffsetY);
      canvas.lineTo(
        outerEdgeX + tangentOffsetX + outwardNormal.x * tangentLength,
        outerEdgeY + tangentOffsetY + outwardNormal.y * tangentLength,
      );
      canvas.moveTo(outerEdgeX, outerEdgeY);
      canvas.lineTo(
        outerEdgeX + outwardNormal.x * tangentLength,
        outerEdgeY + outwardNormal.y * tangentLength,
      );
      canvas.stroke();
      break;
    case "b6th":
      canvas.beginPath();
      canvas.arc(centerX, centerY, chordDotRadius, 0, 2 * Math.PI);
      canvas.stroke();
      canvas.beginPath();
      canvas.moveTo(centerX - tangent.x * chordDotRadius, centerY - tangent.y * chordDotRadius);
      canvas.lineTo(
        centerX - tangent.x * firstTensionLength,
        centerY - tangent.y * firstTensionLength,
      );
      canvas.moveTo(centerX + tangent.x * chordDotRadius, centerY + tangent.y * chordDotRadius);
      canvas.lineTo(
        centerX + tangent.x * firstTensionLength,
        centerY + tangent.y * firstTensionLength,
      );
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
  tangentDx = 0,
  tangentDy = 0,
) {
  const isDim = chord.variant === "diminished";
  const isMin7Flat5 = chord.firstTension === "diatonic" && chord.fifthShift === "flat";
  if (isDim) {
    drawLineLastAttachment(canvas, baseX, baseY, null, tangentDx, tangentDy);
  } else if (isMin7Flat5) {
    drawLineLastAttachment(canvas, baseX, baseY, "diatonic", tangentDx, tangentDy);
  } else {
    drawCircleLastAttachment(
      canvas,
      baseX,
      baseY,
      "down",
      chord.firstTension,
      tangentDx,
      tangentDy,
    );
  }
}
