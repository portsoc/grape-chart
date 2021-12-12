import * as types from '../lib/types';

function isString(x: unknown): x is string {
  return typeof x === 'string';
}

export function getGrapeChartData(data: types.ExperimentData[]) {
  const height = 600;
  const zeroGroupsWidth = 70;
  const graphHeight = 500;
  const minGrapeSize = 7;
  const maxGrapeSize = 14;
  const firstGroup = 210;
  const groupSpacing = 300;
  const grapeSpacing = 1.5;
  const tooltipPadding = 20;
  const tooltipMinWidth = 150;
  const nbGroups = 7;

  const groups = Array.from(new Set(data.map(d => d.group).filter(isString)));
  groups.sort(); // alphabetically

  const dataGroups = [];
  for (const group of groups) {
    const dataGroup = {};
    dataGroup.data = data.filter((exp) => exp.group === group);
    dataGroups.push(dataGroup);
  }

  const perGroup = {};
  for (const dataGroup of dataGroups) {
    const { group } = dataGroup.data[0];
    perGroup[group] = {};
    perGroup[group].wt = dataGroup.data.reduce((acc, line) => (
      line.wt != null ? acc + line.wt : acc
    ), 0);
    if (perGroup[group].wt === 0) perGroup[group].wt = 1;
    perGroup[group].or = dataGroup.data.reduce((acc, line) => (
      line.wt !== null ? acc + line.or * line.wt : acc
    ), 0) / perGroup[group].wt;
  }

  let minWt = Infinity;
  let maxWt = -Infinity;
  let minOr = Infinity;
  let maxOr = -Infinity;

  for (const exp of data) {
    if (exp.or !== null) {
      if (exp.wt < minWt) minWt = exp.wt;
      if (exp.wt > maxWt) maxWt = exp.wt;
      if (exp.or < minOr) minOr = exp.or;
      if (exp.or > maxOr) maxOr = exp.or;
    }
  }

  if (minOr < -10) minOr = -10;
  if (maxOr > 10) maxOr = 10;
  if (minOr === Infinity) {
    minOr = 0;
    maxOr = 0;
  }
  if (minWt === Infinity) {
    minWt = 1;
    maxWt = 1;
  }

  let TICK_SPACING;
  // select tick spacing based on a rough estimate of how many ticks we'll need anyway
  const clSpread = (maxOr - minOr) / Math.LN10; // how many orders of magnitude we cover
  if (clSpread > 5) TICK_SPACING = [100];
  else if (clSpread > 2) TICK_SPACING = [10];
  else TICK_SPACING = [2, 2.5, 2]; // ticks at 1, 2, 5, 10, 20, 50, 100...
  // adjust minimum and maximum around decimal non-logarithmic values
  let newBound = 1;
  let tickNo = 0;
  while (Math.log(newBound) > minOr) {
    tickNo -= 1;
    newBound /= TICK_SPACING[mod(tickNo, TICK_SPACING.length)];
    // JS % can be negative
  }
  minOr = Math.log(newBound) - 0.1;

  let startingTickVal = newBound;
  let startingTick = tickNo;

  newBound = 1;
  tickNo = 0;
  while (Math.log(newBound) < maxOr) {
    newBound *= TICK_SPACING[mod(tickNo, TICK_SPACING.length)];
    tickNo += 1;
  }
  maxOr = Math.log(newBound) + 0.1;
  const midOr = (minOr + maxOr) / 2;

  const yRatio = (1 / (maxOr - minOr)) * graphHeight;
  function getY(logVal) {
    if (logVal == null) return 0;
    return -(logVal - minOr) * yRatio;
  }

  function isTopHalf(logVal) {
    return logVal > midOr;
  }

  const MIN_WT_SPREAD = 2.5;
  if (maxWt / minWt < MIN_WT_SPREAD) {
    minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
    maxWt = minWt * MIN_WT_SPREAD;
  }

  // minWt = 0;
  // todo we can uncomment this to make all weights relative to only the maximum weight
  // square root the weights because we're using them as
  // lengths of the side of a square whose area should correspond to the weight
  maxWt = Math.sqrt(maxWt);
  minWt = Math.sqrt(minWt);
  const wtRatio = (1 / (maxWt - minWt)) * (maxGrapeSize - minGrapeSize);

  function getGrapeRadius(wt) {
    if (wt == null) return minGrapeSize;
    return (Math.sqrt(wt) - minWt) * wtRatio + minGrapeSize;
  }

  let currentGroup = -1;
  const numberOfColours = +nbGroups;

  for (const group of groups) {
    currentGroup += 1;
    const dataGroup = dataGroups[currentGroup];

    if (currentGroup === 0) {
      dataGroup.withLegend = true;
    }
    if (currentGroup === groups.length - 1) {
      dataGroup.withPosButton = true;
    }

    let positionedGrapes;
    resetPositioning();
    let index = 0;
    for (const exp of dataGroup.data) {
      exp.index = index;
      precomputePosition(exp.index, getY(exp.or), getGrapeRadius(exp.wt) + grapeSpacing);
      index += 1;
    }
    finalizePositioning();

    dataGroup.guidelineY = getY(perGroup[group].or);

    for (const exp of dataGroup.data) {
      const text = {};
      text.paper = exp.paper;
      text.exp = exp.exp;
      if (exp.or != null) {
        text.or = Math.exp(exp.or).toFixed(2);
        text.wt = `${((exp.wt * 100) / perGroup[group].wt).toFixed(2)}%`;
        text.ci = `${Math.exp(exp.lcl).toFixed(2)}, ${Math.exp(exp.ucl).toFixed(2)}`;
      } else {
        dataGroup.invalid = true;
      }
      if (isTopHalf(exp.or)) {
        exp.isTopHalf = true;
      }

      exp.text = text;
      exp.radius = getGrapeRadius(exp.wt);
      exp.grapeX = getPosition(exp.index);
      exp.grapeY = getY(exp.or);
      // exp.boxWidth = boxWidth;
    }
  }
  // put axes into the plot
  const tickVals = [];
  let tickVal;

  while ((tickVal = Math.log(startingTickVal)) < maxOr) {
    tickVals.push([tickVal, startingTickVal, getY(tickVal)]);
    startingTickVal *= TICK_SPACING[mod(startingTick, TICK_SPACING.length)];
    startingTick += 1;
  }

  const width = zeroGroupsWidth + groups.length * groupSpacing;

  return {
    width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    groups: groups,
    dataGroups: dataGroups,
    firstGroup: firstGroup,
    groupSpacing: groupSpacing,
    numberOfColours: numberOfColours,
    tooltipWidth: tooltipPadding + tooltipMinWidth,
    tickVals: tickVals,
  };

  function resetPositioning() {
    positionedGrapes = {
      pre: [],
      sorted: [],
      post: [],
      ybounds: new Bounds(), // this helps us center blocks of grapes
    };
  }

  function precomputePosition(index, y, r) {
    positionedGrapes.ybounds.add(y - r, y + r);
    positionedGrapes.sorted[index] = { index, y, r };
    positionedGrapes.pre[index] = positionedGrapes.sorted[index];
  }

  function finalizePositioning() {
    // position big grapes first so they tend to be more central
    const sortingStrategy = (a, b) => b.r - a.r;
    positionedGrapes.sorted.sort(sortingStrategy);

    // compute X coordinates
    positionedGrapes.sorted.forEach((g1, index) => {
      const xbounds = new Bounds();
      positionedGrapes.post.forEach((g2) => {
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
      g1.x = xbounds.getNearestOutsideValue(0);

      // todo? if 0, maybe keep left- and right-slack so we can move things around a bit afterwards

      positionedGrapes.post[index] = g1;
    });

    // center connecting groups
    // use ybounds to group grapes in buckets so we can center them together
    const buckets = [];
    positionedGrapes.pre.forEach((g) => {
      const bucketNo = positionedGrapes.ybounds.indexOf(g.y);
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

  function getPosition(i) {
    return positionedGrapes.pre[i].x;
  }
}

function mod(x: number, n: number) {
  return ((x % n) + n) % n;
}

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

function Bounds() {
  if (this == null) return new Bounds();

  this.limits = [];
}

Bounds.prototype.add = function (min, max) {
  for (var i = 0; i < this.limits.length; i += 1) {
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
  }
  // if we didn't break above, the current bound is the last one
  if (i == this.limits.length) this.limits.push({ min: min, max: max });
};

Bounds.prototype.isEmpty = function () {
  return !this.limits.length;
};

Bounds.prototype.getNearestOutsideValue = function (val) {
  // choose the value outside of the given bounds that's closest to the given val

  // find the first bounds that ends after val
  for (var i = 0; i < this.limits.length; i += 1) {
    if (this.limits[i].max > val) break;
  }

  // no bounds end after val
  if (i == this.limits.length) {
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
};

// find the index of the bounds that contains val, or -1 if no bounds contains val
Bounds.prototype.indexOf = function (val) {
  // find the first bounds that ends after val
  for (var i = 0; i < this.limits.length; i += 1) {
    if (this.limits[i].max >= val) break;
  }

  // no bounds end after val
  if (i == this.limits.length) {
    return -1;
  }

  // the first bounds that ends after val also start after val
  if (this.limits[i].min > val) {
    return -1;
  }

  return i;
};
