import React from 'react';
import './GrapeChart.css';

import * as types from '../lib/types';

import MultiMap from '../lib/MultiMap';
import PositionedCircles from '../lib/PositionedCircles';

const DEFAULT_OPTIONS: types.GrapeChartOptions = {
  // some of these defaults are repeated in the CSS so can't easily be changed - todo do something about it
  height: 600,
  graphHeight: 500,
  groupSpacing: 300,
  zeroGroupsWidth: 70,
  tooltipPadding: 20,
  tooltipMinWidth: 50,
  tooltipValueOffset: 50,
  firstGroup: 210,
  numberOfColours: 7,
  minGrapeSize: 5,
  maxGrapeSize: 14,
  grapeSpacing: 1.5,
};

export default function GrapeChart(props: types.GrapeChartProps): JSX.Element {
  const opts = { ...DEFAULT_OPTIONS, ...props.options };

  const {
    groups,
    tickVals,
  } = getGrapeChartData(props.data, opts);

  const width = opts.zeroGroupsWidth + groups.size * opts.groupSpacing;
  const tooltipWidth = opts.tooltipPadding + opts.tooltipMinWidth;

  const groupArray = Array.from(groups.entries());

  // todo layout effect to widen and position tooltips

  const svgRef = React.useRef<SVGSVGElement>(null);

  // make sure all tooltips are positioned so they are visible and the box is as big as the content
  React.useLayoutEffect(positionTooltips);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="grapechart"
      viewBox={`0 0 ${width} ${opts.height}`}
      width={width}
      height={opts.height}
      version="1.1"
      ref={svgRef}
    >
      <g className="axes">
        <line className="yaxis" x1="0" x2="0" y2="500" />

        { tickVals.map((tickVal, index) => (
          <g key={index} className="tick" transform={`translate(${0},${tickVal[2]})`}>
            <line x2="5" />
            <text>{ tickVal[0] < 0 ? tickVal[1].toPrecision(1) : Math.round(tickVal[1]) }</text>
          </g>
        )) }
        <text className="ylabel" transform="translate(-40,-260) rotate(-90)">odds ratio</text>
        <text className="title" transform="translate(-40,-530)">Grape Chart</text>
      </g>

      { /* Displaying circles and guidelines */ }
      { groupArray.map(renderGroupGrapesAndGuidelines) }

      { /* Displaying tooltips after circles so that z-index > circles */ }
      { groupArray.map(renderGroupHighlightGrapesAndTooltips) }
    </svg>
  );

  function renderGroupGrapesAndGuidelines([group, dataGroup]: [string, types.DataGroup], index: number) {
    const withLegend = index === 0;
    const { guidelineY, grapeData } = dataGroup;
    return (
      <g
        key={group}
        className={`group ${withLegend ? 'with-legend' : ''}`}
        transform={`translate(${opts.firstGroup + opts.groupSpacing * index}, ${0})`}
      >
        <g>
          <line className="xaxis" x1="-150" x2="150" />
          <line className="trunk" x1="0" x2="0" y2="500" />
          <text className="label">{ group }</text>

          { grapeData.map(renderGrape) }

          <g className="guideline" transform={`translate(${0},${guidelineY})`}>
            <line className="guideline" x1="-142.5" x2="142.5" />
            <g className="legend">
              <text>weighted</text>
              <text>mean</text>
            </g>
          </g>
        </g>
      </g>
    );

    function renderGrape(exp: types.GrapeData, expIndex: number) {
      const { radius, grapeX, grapeY } = exp;
      return (
        <circle
          key={expIndex}
          className={`experiment grape c${index % opts.numberOfColours}`}
          r={radius}
          transform={`translate(${grapeX},${grapeY})`}
        />
      );
    }
  }

  function renderGroupHighlightGrapesAndTooltips([group, dataGroup]: [string, types.DataGroup], index: number) {
    return (
      <g
        key={group}
        className="group tooltips"
        transform={`translate(${opts.firstGroup + opts.groupSpacing * index}, 0)`}
      >
        <g>
          { dataGroup.grapeData.map(renderHighlightGrapeAndTooltip) }
        </g>
      </g>
    );

    function renderHighlightGrapeAndTooltip(grape: types.GrapeData, grapeIndex: number) {
      const {
        radius,
        grapeX,
        grapeY,
        exp,
      } = grape;

      const orText = Math.exp(exp.oddsRatio).toFixed(2);
      const wtText = `${((exp.weight * 100) / dataGroup.totalWeight).toFixed(2)}%`;
      const ciText = `${Math.exp(exp.lowerConfidenceLimit).toFixed(2)}, ${Math.exp(exp.upperConfidenceLimit).toFixed(2)}`;

      return (
        <g
          key={grapeIndex}
          className="experiment"
          transform={`translate(${grapeX}, ${grapeY})`}
        >
          <circle
            className="grape"
            r={radius}
          />
          <g className="tooltip">
            <rect height="103" width={tooltipWidth} />
            <text className="paper">{ exp.paper || 'n/a' }</text>
            <text className="exp  ">{ exp.experiment || 'n/a' }</text>
            <text className="_or  ">OR:</text>
            <text className="_wt  ">Weight:</text>
            <text className="_ci  ">95% CI:</text>
            <text className="or   " data-offset={opts.tooltipValueOffset}>{ orText }</text>
            <text className="wt   " data-offset={opts.tooltipValueOffset}>{ wtText }</text>
            <text className="ci   " data-offset={opts.tooltipValueOffset}>{ ciText }</text>
          </g>
        </g>
      );
    }
  }

  function positionTooltips() {
    const svg = svgRef.current;
    if (!svg) return;

    const svgBox = svg.getBoundingClientRect();

    const tooltips = svg.querySelectorAll<SVGElement>('.tooltip');
    for (const tooltip of tooltips) {
      const rect = tooltip.querySelector('rect');
      if (!rect) continue;

      widenRectToText(tooltip, rect);
      positionAboveOrBelowCircle(tooltip, rect, svgBox);
    }
  }

  function widenRectToText(tooltip: Element, rect: SVGRectElement) {
    let boxWidth = opts.tooltipMinWidth;
    for (const text of tooltip.querySelectorAll('text')) {
      let w = text.getBBox().width;
      if (text.dataset.offset) w += Number(text.dataset.offset);
      if (w > boxWidth) boxWidth = w;
    }

    rect.setAttribute('width', String(boxWidth + opts.tooltipPadding));
  }

  function positionAboveOrBelowCircle(tooltip: SVGElement, rect: SVGRectElement, svgBox: DOMRect) {
    // the tooltip's top-left corner is in the center of the circle
    // move the tooltip's center below or above the circle (depending on where in the SVG the circle is vertically),
    // but constrain it so it doesn't go outside the SVG's sides

    const box = rect.getBoundingClientRect();

    const leftSpace = box.left - svgBox.left - 2;
    const rightSpace = svgBox.right - box.left - 2;

    let x = -box.width / 2;
    if (x + box.width > rightSpace) x = rightSpace - box.width;
    if (x < -leftSpace) x = -leftSpace;

    const isTopHalf = box.top < (svgBox.top + svgBox.height / 2);
    const y = isTopHalf
      ? opts.maxGrapeSize + opts.grapeSpacing * 2
      : -box.height - opts.maxGrapeSize - opts.grapeSpacing * 2;

    tooltip.setAttribute('transform', `translate(${x},${y})`);
  }
}

function getGrapeChartData(data: types.ExperimentData[], opts: types.GrapeChartOptions): types.GrapeChartData {
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

  let TICK_SPACING: number[];
  // select tick spacing based on a rough estimate of how many ticks we'll need anyway
  const clSpread = (maxOr - minOr) / Math.LN10; // how many orders of magnitude we cover
  if (clSpread > 5) TICK_SPACING = [100];
  else if (clSpread > 2) TICK_SPACING = [10];
  else TICK_SPACING = [2, 2.5, 2]; // ticks at 1, 2, 5, 10, 20, 50, 100...

  // adjust minimum and maximum around decimal non-logarithmic values
  let lowerBound = 1;
  let tickNo = 0;
  while (Math.log(lowerBound) > minOr) {
    tickNo -= 1;
    lowerBound /= TICK_SPACING[mod(tickNo, TICK_SPACING.length)];
    // JS % can be negative
  }
  minOr = Math.log(lowerBound) - 0.1;

  let upperBound = 1;
  tickNo = 0;
  while (Math.log(upperBound) < maxOr) {
    upperBound *= TICK_SPACING[mod(tickNo, TICK_SPACING.length)];
    tickNo += 1;
  }
  maxOr = Math.log(upperBound) + 0.1;

  const yRatio = (1 / (maxOr - minOr)) * opts.graphHeight;

  const MIN_WT_SPREAD = opts.maxGrapeSize / opts.minGrapeSize;
  if (maxWt / minWt < MIN_WT_SPREAD) {
    minWt = (maxWt + minWt) / 2 / Math.sqrt(MIN_WT_SPREAD);
    maxWt = minWt * MIN_WT_SPREAD;
  }

  // minWt = 0;
  // todo we can uncomment the above to make all weights relative to only the maximum weight

  // square root the weights because we're using them as
  // lengths of the side of a square whose area should correspond to the weight
  maxWt = Math.sqrt(maxWt);
  minWt = Math.sqrt(minWt);
  const wtRatio = (1 / (maxWt - minWt)) * (opts.maxGrapeSize - opts.minGrapeSize);

  const groups = new Map<string, types.DataGroup>();

  for (const [group, experiments] of expGroups) {
    const groupWt = experiments.reduce((acc, exp) => (acc + exp.weight), 0) || 1;
    const groupOr = experiments.reduce((acc, exp) => (acc + exp.oddsRatio * exp.weight), 0) / groupWt;

    const positionedGrapes = new PositionedCircles();
    for (const exp of experiments) {
      positionedGrapes.addCircle(exp, getY(exp.oddsRatio), getGrapeRadius(exp.weight) + opts.grapeSpacing);
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

  // prepare ticks
  const tickVals = prepareTicks();

  return {
    groups,
    tickVals,
  };

  function prepareTicks() {
    const ticks: types.Tick[] = [];

    let startingTickVal = lowerBound;
    let startingTick = tickNo;

    let tickVal;
    while ((tickVal = Math.log(startingTickVal)) < maxOr) {
      ticks.push([tickVal, startingTickVal, getY(tickVal)]);
      startingTickVal *= TICK_SPACING[mod(startingTick, TICK_SPACING.length)];
      startingTick += 1;
    }
    return ticks;
  }

  function getGrapeRadius(wt: number) {
    return (Math.sqrt(wt) - minWt) * wtRatio + opts.minGrapeSize;
  }

  function getY(logVal: number) {
    return -(logVal - minOr) * yRatio;
  }
}

function mod(x: number, n: number) {
  return ((x % n) + n) % n;
}
