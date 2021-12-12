import Bounds from './Bounds';

interface CircleWithoutX {
  key: unknown,
  y: number,
  r: number,
}

interface PositionedCircle extends CircleWithoutX {
  x: number,
}

export default class PositionedCircles {
  private pre: Map<unknown, CircleWithoutX>;
  private post: Map<unknown, PositionedCircle>;
  private ybounds: Bounds;
  private finalized = false;

  constructor() {
    this.pre = new Map();
    this.post = new Map();
    this.ybounds = new Bounds(); // this helps us center blocks of grapes
  }

  addCircle(key: unknown, y: number, r: number): void {
    if (this.finalized) throw new Error('cannot add circles once positioning is finalized by calling getPosition()');

    this.ybounds.add(y - r, y + r);

    const circle = { key, y, r };
    this.pre.set(key, circle);
  }

  getPosition(key: unknown): number {
    this.finalizePositioning();

    const positioned = this.post.get(key);
    if (!positioned) throw new Error('key not found among positioned circles');

    return positioned.x;
  }

  private finalizePositioning(): void {
    if (this.finalized) return;
    this.finalized = true;

    // position big grapes first so they tend to be more central
    const sortingStrategy = (a: CircleWithoutX, b: CircleWithoutX) => b.r - a.r;
    const sorted = Array.from(this.pre.values()).sort(sortingStrategy);

    // compute X coordinates
    for (const g1 of sorted) {
      const xbounds = new Bounds();
      this.post.forEach((g2) => {
        // check that the current grape is close enough to g on the y axis that they can touch
        if (Math.abs(g1.y - g2.y) < (g1.r + g2.r)) {
          // presence of g means current grape cannot be at g.x ± delta
          const delta = Math.sqrt((g1.r + g2.r) * (g1.r + g2.r) - (g1.y - g2.y) * (g1.y - g2.y));
          const min = g2.x - delta;
          const max = g2.x + delta;

          xbounds.add(min, max);
        }
      });

      // choose the nearest available x to 0
      const x = xbounds.getNearestOutsideValue(0);

      // todo? if 0, maybe keep left- and right-slack so we can move things around a bit afterwards

      this.post.set(g1.key, { ...g1, x });
    }

    // center connecting groups
    // use ybounds to group grapes in buckets so we can center them together
    const buckets: PositionedCircle[][] = [];
    this.post.forEach((g) => {
      const bucketNo = this.ybounds.indexOf(g.y);
      if (bucketNo === -1) throw new Error('assertion failed: grape not in ybounds'); // should never happen
      if (!buckets[bucketNo]) buckets[bucketNo] = [];
      buckets[bucketNo].push(g);
    });

    buckets.forEach((bucket) => {
      let min = Infinity;
      let max = -Infinity;
      bucket.forEach((g) => {
        min = Math.min(min, g.x - g.r);
        max = Math.max(max, g.x + g.r);
      });

      if (min < Infinity && Math.abs(min + max) > 1) {
        // got a connecting group that wants to be moved, move it to center
        const dx = (max + min) / 2;
        bucket.forEach((g) => { g.x -= dx; });
      }
    });
  }
}
