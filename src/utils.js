// Colisión entre dos círculos {x, y, r}
export function overlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const rr = a.r + b.r;
  return dx * dx + dy * dy < rr * rr;
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));