import * as React from 'react';

import './App.css';

import GrapeChart from './GrapeChart';

import * as types from '../lib/types';

import testData from '../../test-data.json';

const testDataText = testDataIntoText(testData);

export default function App(): JSX.Element {
  return (
    <>
      <h1>Grape Chart</h1>
      <Instructions />
      <textarea placeholder="paste your spreadsheet data here" value={testDataText}/>
      <GrapeChart data={testData} />
    </>
  );
}

function Instructions(): JSX.Element {
  return (
    <>
      <p>
      Paste your odds ratio metaanalysis data into the text field below to generate a grape chart.
      </p>
      <details><summary>Instructions</summary>
        <p>
        To generate your grape chart, prepare a spreadsheet with these columns:
        </p>

        <p>
          <code>paper, experiment, oddsRatio, weight,
            <abbr title="lower confidence limit">LCL</abbr>,
            <abbr title="upper confidence limit">UCL</abbr>, group
          </code>
        </p>

        <p>
        You can start with <a href="https://docs.google.com/spreadsheets/d/1HvLRutXjrY_W0RzSNRK2ZodYcWd9LywxbC_0qPEbG88">this spreadsheet</a> that contains the initial data for this page.
        </p>

        <p>
        The order of the columns matters, the heading doesn't. For example, the fifth column will always be
        treated as the lower confidence limit, even if its heading says 'ucl' or anything else.
        </p>

        <p>
        Then copy&paste the spreadsheet contents into the text field below.
        </p>

        <p><code>paper</code> becomes the main label of a grape; <code>experiment</code> is the sublabel.</p>

        <p>
        The tool will ignore rows where the numerical values (oddsRatio, weight, lcl, ucl) cannot be parsed as
        numbers. This also applies to the heading row.
        </p>
      </details>
    </>
  );
}

function testDataIntoText(data: types.ExperimentData[]): string {
  const lines: unknown[][] = [];
  lines.push([
    'paper',
    'experiment',
    'oddsRatio',
    'weight',
    'lcl',
    'ucl',
    'group',
  ]);
  for (const line of data) {
    lines.push([
      line.paper,
      line.experiment,
      line.oddsRatio.toPrecision(4),
      line.weight.toPrecision(4),
      line.lowerConfidenceLimit.toPrecision(4),
      line.upperConfidenceLimit.toPrecision(4),
      line.group,
    ]);
  }

  return lines.map(line => line.join('\t')).join('\n');
}
