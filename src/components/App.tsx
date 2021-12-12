import * as React from 'react';

import './App.css';

import GrapeChart from './GrapeChart';

import testData from '../../test-data.json';

export default function App(): JSX.Element {
  return <GrapeChart data={testData} />;
}
