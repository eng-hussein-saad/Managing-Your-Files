import { timingSafeEqual } from "node:crypto";

/** Compares the BFF trust credential without leaking matching-prefix timing. */
export function trustSecretMatches(
  actual: string | undefined,
  expected: string,
): boolean {
  if (!actual) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
