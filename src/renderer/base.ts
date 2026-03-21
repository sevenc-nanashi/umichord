export type Position = [row: number, numerator: number, denominator: number];
export type Length = [numerator: number, denominator: number];
export type Degree =
  | "i"
  | "iib"
  | "ii"
  | "iiib"
  | "iii"
  | "iv"
  | "vb"
  | "v"
  | "vib"
  | "vi"
  | "viib"
  | "vii";

export const rowHeight = 100;
export const width = 400;
export const gap = 16;
export const paddingLeft = 80;
export const paddingRight = 80;
export const paddingTop = 20;
export const baseLineY = 80;
export const chordsWidth = width - paddingLeft - paddingRight - gap * 2;
export const dotRadius = (rowHeight / 16) * 0.5;
