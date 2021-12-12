import MultiMap from '../lib/MultiMap';
import * as types from '../lib/types';

import PositionedCircles from '../lib/PositionedCircles';

export function getGrapeChartData(data: types.ExperimentData[]): types.GrapeChartProps {
  const graphHeight = 500;
  const minGrapeSize = 5;
  const maxGrapeSize = 14;
  const grapeSpacing = 1.5;

  const expGroups = new MultiMap<string, types.ExperimentData>();

  for (const exp of data) {
    expGroups.push(exp.group, exp);
  }

  let minWt = Infinity;
  let maxWt = -Infinity;
  let minOr = Infinity;
  let maxOr = -Infinity;

  for (const exp of data) {
    if (exp.weight < minWt) minWt = exp.weight;
    if (exp.weight > maxWt) maxWt = exp.weight;
    if (exp.oddsRatio < minOr) minOr = exp.oddsRatio;
    if (exp.oddsRatio > maxOr) maxOr = exp.oddsRatio;
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

  const yRatio = (1 / (maxOr - minOr)) * graphHeight;

  function getY(logVal: number) {
    return -(logVal - minOr) * yRatio;
  }

  const MIN_WT_SPREAD = maxGrapeSize / minGrapeSize;
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

  function getGrapeRadius(wt: number) {
    if (wt == null) return minGrapeSize;
    return (Math.sqrt(wt) - minWt) * wtRatio + minGrapeSize;
  }

  const groups = new Map<string, types.DataGroup>();

  for (const [group, experiments] of expGroups) {
    const groupWt = experiments.reduce((acc, exp) => (acc + exp.weight), 0) || 1;
    const groupOr = experiments.reduce((acc, exp) => (acc + exp.oddsRatio * exp.weight), 0) / groupWt;

    const positionedGrapes = new PositionedCircles();
    for (const exp of experiments) {
      positionedGrapes.addCircle(exp, getY(exp.oddsRatio), getGrapeRadius(exp.weight) + grapeSpacing);
    }

    const grapeData: types.GrapeData[] = [];

    for (const exp of experiments) {
      grapeData.push({
        radius: getGrapeRadius(exp.weight),
        grapeX: positionedGrapes.getPosition(exp),
        grapeY: getY(exp.oddsRatio),
        exp,
      });
    }

    groups.set(group, {
      guidelineY: getY(groupOr),
      totalWeight: groupWt,
      grapeData,
    });
  }
  // put axes into the plot
  const tickVals: types.Tick[] = [];
  let tickVal;

  while ((tickVal = Math.log(startingTickVal)) < maxOr) {
    tickVals.push([tickVal, startingTickVal, getY(tickVal)]);
    startingTickVal *= TICK_SPACING[mod(startingTick, TICK_SPACING.length)];
    startingTick += 1;
  }

  return {
    groups,
    tickVals,
  };
}

function mod(x: number, n: number) {
  return ((x % n) + n) % n;
}
