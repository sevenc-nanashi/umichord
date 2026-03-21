export class UnreachableError extends Error {
  constructor(message: string = "This code should be unreachable") {
    super(message);
  }
}
export class ExhaustiveError extends Error {
  constructor(value: never, message: string = "This value should be exhaustive") {
    super(`${message}: ${JSON.stringify(value)}`);
  }
}
