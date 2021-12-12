import React from 'react';
import './GrapeChart.css';

import * as types from '../lib/types';

export default function GrapeChart(props: types.GrapeChartProps): JSX.Element {
  const height = 600;
  const groupSpacing = 300;
  const zeroGroupsWidth = 70;
  const tooltipPadding = 20;
  const tooltipMinWidth = 150;
  const firstGroup = 210;
  const numberOfColours = 7;

  const {
    groups,
    tickVals,
  } = props;

  const width = zeroGroupsWidth + groups.size * groupSpacing;
  const tooltipWidth = tooltipPadding + tooltipMinWidth;

  const groupArray = Array.from(groups.entries());

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="grapechart"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      version="1.1"
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
      { groupArray.map(([group, dataGroup], index) => {
        const withLegend = index === 0;
        const { guidelineY, grapeData } = dataGroup;
        return (
          <React.Fragment key={group}>
            <g
              className={`group ${withLegend ? 'with-legend' : ''}`}
              transform={`translate(${firstGroup + groupSpacing * index}, ${0})`}
            >
              <g>
                <line className="xaxis" x1="-150" x2="150" />
                <line className="trunk" x1="0" x2="0" y2="500" />
                <text className="label">{ group }</text>
                { grapeData.map((exp, expIndex) => {
                  const { radius, grapeX, grapeY } = exp;
                  return (
                    <circle
                      key={expIndex}
                      className={`experiment grape c${index % numberOfColours}`}
                      r={radius}
                      transform={`translate(${grapeX},${grapeY})`}
                    />
                  );
                }) }
                <g className="guideline" transform={`translate(${0},${guidelineY})`}>
                  <line className="guideline" x1="-142.5" x2="142.5" />
                  <g className="legend">
                    <text>weighted</text>
                    <text>mean</text>
                  </g>
                </g>
              </g>
            </g>
          </React.Fragment>
        );
      }) }

      { /* Displaying tootltips after circles so that z-index > circles */ }
      { groupArray.map(([group, dataGroup], index) => {
        return (
          <g
            key={group}
            className="group tooltips"
            transform={`translate(${firstGroup + groupSpacing * index}, ${0})`}
          >
            <g>
              { dataGroup.grapeData.map((grape, grapeIndex) => {
                const {
                  radius,
                  grapeX,
                  grapeY,
                  exp,
                } = grape;

                const orText = Math.exp(exp.oddsRatio).toFixed(2);
                const wtText = `${((exp.weight * 100) / dataGroup.totalWeight).toFixed(2)}%`;
                const ciText = `${Math.exp(exp.lowerConfidenceLimit).toFixed(2)}, ${Math.exp(exp.upperConfidenceLimit).toFixed(2)}`;

                const isTopHalf = grapeY > height / 2;
                return (
                  <React.Fragment key={grapeIndex}>
                    <g
                      className="experiment"
                      transform={`translate(${grapeX}, ${grapeY})`}
                    >
                      <circle
                        className="grape"
                        r={radius}
                      />
                      <g className={`tooltip ${isTopHalf ? 'tophalf' : ''}`}>
                        <rect height="103" width={tooltipWidth} />
                        <text className="paper">{ exp.paper || 'n/a' }</text>
                        <text className="exp  ">{ exp.experiment || 'n/a' }</text>
                        <text className="or   ">{ orText }</text>
                        <text className="wt   ">{ wtText }</text>
                        <text className="ci   ">{ ciText }</text>
                        <text className="_or  ">OR:</text>
                        <text className="_wt  ">Weight:</text>
                        <text className="_ci  ">95% CI:</text>
                      </g>
                    </g>
                  </React.Fragment>
                );
              }) }
            </g>
          </g>
        );
      }) }
    </svg>
  );
}
