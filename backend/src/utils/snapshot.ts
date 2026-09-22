// backend/src/utils/snapshot.ts

// Matching questions store their answer key as ordered pairs ({L, R}), and the
// student's exam snapshot needs both columns to render the question. Sent
// as-is, pairs[i].R is the correct match for pairs[i].L — the whole answer key,
// readable in the network response. Rotating the right-hand items keeps the
// same two lists (the UI shuffles the right column anyway) but breaks the
// alignment. Grading uses the real pairs from the database, never this copy.
export function maskMatchingPairs<T extends { L: string; R: string }>(pairs: T[] | undefined): T[] | undefined {
  if (!Array.isArray(pairs) || pairs.length < 2) return pairs;
  const shift = 1 + Math.floor(Math.random() * (pairs.length - 1));
  return pairs.map((p, i) => ({ ...p, R: pairs[(i + shift) % pairs.length].R }));
}
