export interface ExperimentData {
  paper: string,
  experiment: string,
  oddsRatio: number,
  weight: number,
  lowerConfidenceLimit: number,
  upperConfidenceLimit: number,
  group?: string,
}

export interface DataGroup {
  data: GrapeData[],
  guidelineY: number,
  totalWeight: number,
  invalid?: boolean,
}

export interface GrapeData {
  radius: number,
  grapeX: number,
  grapeY: number,
  exp: ExperimentData,
}
