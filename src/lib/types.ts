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
  data: ExperimentData[],
  options?: GrapeChartOptions,
}

export interface GrapeChartData {
  groups: Map<string, DataGroup>,
  tickVals: Tick[],
}

export interface GrapeChartOptions {
  height: number,
  graphHeight: number,
  groupSpacing: number,
  zeroGroupsWidth: number,
  firstGroup: number,
  tooltipPadding: number,
  tooltipMinWidth: number,
  tooltipValueOffset: number,
  numberOfColours: number,
  minGrapeSize: number,
  maxGrapeSize: number,
  grapeSpacing: number,
}
