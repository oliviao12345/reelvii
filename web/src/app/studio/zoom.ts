/** Screen Studio-style zoom: ease in toward (x, y), hold, ease back out. x/y are 0..1 of the screen. */
export type Zoom = { id: string; at: number; dur: number; scale: number; x: number; y: number };
export const ZOOM_SCALES = [1.5, 2, 3];
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function zoomAt(zooms: Zoom[], t: number, w: number, h: number) {
  const z = zooms.find((q) => t >= q.at && t <= q.at + q.dur);
  if (!z) return { k: 1, tx: 0, ty: 0 };
  const ramp = Math.min(0.7, z.dur / 2);
  const e =
    t < z.at + ramp
      ? easeInOut((t - z.at) / ramp)
      : t > z.at + z.dur - ramp
        ? easeInOut((z.at + z.dur - t) / ramp)
        : 1;
  const k = 1 + (z.scale - 1) * e;
  // keep the focus centred but never reveal empty edges
  const mx = ((k - 1) * w) / 2;
  const my = ((k - 1) * h) / 2;
  return { k, tx: clamp((0.5 - z.x) * w * k, -mx, mx), ty: clamp((0.5 - z.y) * h * k, -my, my) };
}
