import type { CapturedImage } from '../../store/useCreateStore';
import type { ModelMetadata } from './types';

export interface GeneratedModel {
  /** Base64-encoded GLB data */
  glbData: string;
  /** Metadata about the generated model */
  metadata: ModelMetadata;
  /** Cleanup function to free resources */
  cleanup: () => void;
}

export type ProgressListener = (percent: number, stageKey: string) => void;

export interface ReconstructionService {
  /**
   * Validate a single image before adding to the collection.
   */
  validateImage(imageUri: string): Promise<{ valid: boolean; issues: string[] }>;

  /**
   * Generate a 3D model from the provided images.
   * Reports progress via the callback; never polls.
   */
  generateModel(
    images: CapturedImage[],
    onProgress: ProgressListener,
  ): Promise<GeneratedModel>;
}
