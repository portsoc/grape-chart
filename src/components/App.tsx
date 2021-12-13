import * as React from 'react';

import './App.css';

import GrapeChart from './GrapeChart';

import * as types from '../lib/types';

import testData from '../../test-data.json';

export default function App(): JSX.Element {
  const [inputData, setInputData] = React.useState<string>('');

  const parsedData = inputData.trim() ? parse(inputData) : testData;

  return (
    <>
      <h1>Grape Chart Generator</h1>
      <Instructions />
      <textarea placeholder="paste your spreadsheet data here" onChange={(e) => setInputData(e.target.value)}/>
      <GrapeChart data={parsedData} />
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

function parse(input: string): types.ExperimentData[] {
  const lines = input.trim().split('\n');

  const retval: types.ExperimentData[] = [];

  for (const line of lines) {
    const [
      rawPaper,
      rawExperiment,
      rawOddsRatio,
      rawWeight,
      rawLowerConfidenceLimit,
      rawUpperConfidenceLimit,
      rawGroup,
    ] = line.split('\t');

    const paper = rawPaper ?? '';
    const experiment = rawExperiment ?? '';
    const oddsRatio = parseNumber(rawOddsRatio);
    const weight = parseNumber(rawWeight);
    const lowerConfidenceLimit = parseNumber(rawLowerConfidenceLimit);
    const upperConfidenceLimit = parseNumber(rawUpperConfidenceLimit);
    const group = rawGroup ?? '';

    if (oddsRatio == null ||
        weight == null ||
        lowerConfidenceLimit == null ||
        upperConfidenceLimit == null) {
      continue;
    }

    retval.push({
      paper,
      experiment,
      oddsRatio,
      weight,
      lowerConfidenceLimit,
      upperConfidenceLimit,
      group,
    });
  }

  return retval;
}

function parseNumber(str?: string) {
  if (!str) return null;

  const num = Number(str);

  // remove NaNs and infinities
  if (Number.isNaN(0 * num)) return null;

  return num;
}
