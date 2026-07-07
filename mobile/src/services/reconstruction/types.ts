export type StageState = 'waiting' | 'running' | 'done' | 'failed';

export interface StageStatus {
  key: string;
  label: string;
  state: StageState;
}

/** Mirrors shared/contracts/reconstruction.md (engine ModelMetadata). */
export interface ModelMetadata {
  vertices: number;
  faces: number;
  file_size_bytes: number;
  processing_seconds: number;
  engine: string;
  image_count: number;
}

export interface JobStatus {
  job_id: string;
  state: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
  stage: string | null;
  stages: StageStatus[];
  error: string | null;
  elapsed_seconds: number;
  metadata: ModelMetadata | null;
}

export interface JobCreated {
  job_id: string;
  image_count: number;
}

export interface ImageValidation {
  ok: boolean;
  reasons: string[];
  blur_score: number;
  brightness: number;
}
