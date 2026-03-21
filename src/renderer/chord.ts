import type { Length, Position } from "./base";

export type Chord = {
  /** コードの開始位置 */
  position: Position;
  /** コードの長さ（分数表記） */
  length: Length;
  /** ルート音の位置 */
  root:
    | "i"
    | "i#"
    | "ii"
    | "ii#"
    | "iii"
    | "iv"
    | "iv#"
    | "v"
    | "v#"
    | "vi"
    | "vi#"
    | "vii"
    | "vii_dim";
  /** コードの種類 */
  variant: "diatonic" | "flipped" | "diminished" | "augmented";
  /** omit3 */
  omitThird: boolean;
  /** omit5 */
  omitFifth: boolean;
  /** sus */
  sus: "sus2" | "sus4" | "susb2" | "sus#4" | null;
  /** 7th/6th/b6th */
  firstTension: "diatonic" | "flipped" | null;
  /** テンション */
  tensions: {
    9: -1 | 0 | 1 | null;
    11: -1 | 0 | 1 | null;
    13: -1 | 0 | 1 | null;
  };
  /** b5 **/
  flat5th: boolean;
  /** 分数コード */
  slashBass:
    | "i"
    | "i#"
    | "ii"
    | "ii#"
    | "iii"
    | "iv"
    | "iv#"
    | "v"
    | "v#"
    | "vi"
    | "vi#"
    | "vii"
    | null;
};
