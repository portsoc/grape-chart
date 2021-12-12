import * as React from 'react';

import './App.css';

import { getGrapeChartData } from '../lib/grape-chart';
import GrapeChart from './GrapeChart';

import testData from '../../test-data.json';

export default function App(): JSX.Element {
  const data = getGrapeChartData(testData);
  return <GrapeChart {...data} />;
}
