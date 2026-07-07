export interface ImageValidation {
  valid: boolean;
  issues: string[];
}

export interface ModelMetadata {
  generatedAt: string;
  imageCount: number;
  processingTimeSeconds: number;
  engine: string;
  geometryBackend: string;
}

export type StageState = 'waiting' | 'running' | 'done' | 'failed';

export interface StageStatus {
  key: string;
  label: string;
  state: StageState;
}
