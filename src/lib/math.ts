export function gcd(a: number, b: number): number {
  if (b === 0) {
    return a;
  }
  return gcd(b, a % b);
}

export function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function unlerp(start: number, end: number, value: number): number {
  if (end - start === 0) {
    return 0; // Avoid division by zero
  }
  return (value - start) / (end - start);
}

export class Fraction {
  public numerator: number;
  public denominator: number;
  constructor(numerator: number, denominator: number) {
    if (denominator === 0) {
      throw new Error("Denominator cannot be zero");
    }
    const common = gcd(numerator, denominator);
    this.numerator = numerator / common;
    this.denominator = denominator / common;
    if (this.denominator < 0) {
      this.numerator = -this.numerator;
      this.denominator = -this.denominator;
    }
  }

  add(other: Fraction): Fraction {
    const commonDenominator = lcm(this.denominator, other.denominator);
    const newNumerator =
      this.numerator * (commonDenominator / this.denominator) +
      other.numerator * (commonDenominator / other.denominator);
    return new Fraction(newNumerator, commonDenominator);
  }

  toNumber(): number {
    return this.numerator / this.denominator;
  }
}
