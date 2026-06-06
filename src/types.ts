export interface CellSample {
  id: number;
  title: string;
  confluence: number;
  state: 'exponential' | 'dense' | 'saturated' | 'overgrown';
  stateLabel: string;
  description: string;
  morphology: string;
  advice: string;
  proceduralSeed: number; // For repeatable simulation of cell growth
}

export interface LabLog {
  id: string;
  date: string;
  dishName: string;
  passage: string;
  confluence: number;
  mediaStatus: string;
  cellStatus: string;
  notes: string;
}

export interface GeminiRefResponse {
  isHFF1: boolean;
  confluencePct: number;
  morphologyCommentary: string;
  confluenceEvaluation: string;
  cultureAdvice: string;
}
