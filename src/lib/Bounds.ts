
/* bounds arrays
 *
 *
 *   #####   ####  #    # #    # #####   ####       ##   #####  #####    ##   #   #  ####
 *   #    # #    # #    # ##   # #    # #          #  #  #    # #    #  #  #   # #  #
 *   #####  #    # #    # # #  # #    #  ####     #    # #    # #    # #    #   #    ####
 *   #    # #    # #    # #  # # #    #      #    ###### #####  #####  ######   #        #
 *   #    # #    # #    # #   ## #    # #    #    #    # #   #  #   #  #    #   #   #    #
 *   #####   ####   ####  #    # #####   ####     #    # #    # #    # #    #   #    ####
 *
 *
 */

interface Interval {
  min: number,
  max: number,
}

export default class Bounds {
  private limits: Interval[];

  constructor() {
    this.limits = [];
  }

  add(min: number, max: number): void {
    let i = 0;
    while (i < this.limits.length) {
      if (max < this.limits[i].min) {
      // this bound fits wholly before the next bound, insert it
        this.limits.splice(i, 0, { min: min, max: max });
        break;
      } else if (min <= this.limits[i].max) {
      // this bound overlaps the next one, merge them
        this.limits[i].min = Math.min(min, this.limits[i].min);
        this.limits[i].max = Math.max(max, this.limits[i].max);

        // merge subsequent bounds if they now overlap with the current one
        while (i < this.limits.length - 1 && this.limits[i + 1].min <= this.limits[i].max) {
          this.limits[i].max = Math.max(this.limits[i].max, this.limits[i + 1].max);
          this.limits.splice(i + 1, 1);
        }
        break;
      }
      // else this bound comes later, loop
      i += 1;
    }
    // if we didn't break above, the current bound is the last one
    if (i === this.limits.length) this.limits.push({ min: min, max: max });
  }

  isEmpty(): boolean {
    return !this.limits.length;
  }

  getNearestOutsideValue(val: number): number {
  // choose the value outside of the given bounds that's closest to the given val

    // find the first bounds that ends after val
    let i = 0;
    while (i < this.limits.length) {
      if (this.limits[i].max > val) break;
      i += 1;
    }

    // no bounds end after val
    if (i === this.limits.length) {
      return val;
    }

    // the first bounds that ends after val also start after val
    if (this.limits[i].min >= val) {
      return val;
    }

    // the found bounds contains val, get the nearer edge
    const d1 = val - this.limits[i].min;
    const d2 = this.limits[i].max - val;

    if (d1 < d2) {
      return this.limits[i].min;
    } else {
      return this.limits[i].max;
    }
  }

  // find the index of the bounds that contains val, or -1 if no bounds contains val
  indexOf(val: number): number {
  // find the first bounds that ends after val
    let i = 0;
    while (i < this.limits.length) {
      if (this.limits[i].max >= val) break;
      i += 1;
    }

    // no bounds end after val
    if (i === this.limits.length) {
      return -1;
    }

    // the first bounds that ends after val also start after val
    if (this.limits[i].min > val) {
      return -1;
    }

    return i;
  }
}
