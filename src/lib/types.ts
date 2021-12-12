export interface ExperimentData {
  paper: string,
  experiment: string,
  oddsRatio: number,
  weight: number,
  lowerConfidenceLimit: number,
  upperConfidenceLimit: number,
  group: string,
}

export interface DataGroup {
  grapeData: GrapeData[],
  guidelineY: number,
  totalWeight: number,
}

export interface GrapeData {
  radius: number,
  grapeX: number,
  grapeY: number,
  exp: ExperimentData,
}

export type Tick = [number, number, number];

export interface GrapeChartProps {
  groups: Map<string, DataGroup>,
  tickVals: Tick[],
}
