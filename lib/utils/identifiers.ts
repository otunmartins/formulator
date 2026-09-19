/**
 * True for a well-formed CAS Registry Number whose check digit is right, e.g. "9005-65-6".
 * The check digit is the weighted sum of the other digits (right to left, weights 1, 2, 3…)
 * modulo 10 (cas.org/cas-data/cas-registry).
 */
export function isCasNumber(value: string): boolean {
  const match = /^(\d{2,7})-(\d{2})-(\d)$/.exec(value.trim());
  if (!match) return false;
  const digits = `${match[1]}${match[2]}`;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[digits.length - 1 - i]) * (i + 1);
  }
  return sum % 10 === Number(match[3]);
}

/**
 * A loose shape check for SMILES: allowed characters only and balanced brackets. It doesn't
 * parse chemistry; the identity step does that later (TODO(phase-2): RDKit in the worker).
 */
export function looksLikeSmiles(value: string): boolean {
  const s = value.trim();
  if (!s || s.length > 500) return false;
  if (!/^[A-Za-z0-9@+\-[\]()=#$%/\\.:*~]+$/.test(s)) return false;
  if (!/[A-Za-z]/.test(s)) return false;
  let round = 0;
  let square = 0;
  for (const c of s) {
    if (c === "(") round++;
    if (c === ")") round--;
    if (c === "[") square++;
    if (c === "]") square--;
    if (round < 0 || square < 0) return false;
  }
  return round === 0 && square === 0;
}

/** Classifies an identity override: a CAS number, a SMILES string, or neither. */
export function overrideFormat(value: string): "cas" | "smiles" | null {
  if (isCasNumber(value)) return "cas";
  if (/^\d+-\d+-\d+$/.test(value.trim())) return null; // CAS-shaped but the check digit is wrong
  return looksLikeSmiles(value) ? "smiles" : null;
}
