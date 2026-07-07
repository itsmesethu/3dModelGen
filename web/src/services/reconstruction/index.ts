/**
 * Reconstruction service factory.
 * For web, we only support HTTP mode (no native bridge).
 */
import { HttpReconstructionService } from './HttpReconstructionService';
import type { ReconstructionService } from './ReconstructionService';

let cached: ReconstructionService | null = null;

export async function getReconstructionService(): Promise<ReconstructionService> {
  if (cached) {
    return cached;
  }
  cached = new HttpReconstructionService();
  return cached;
}

export type {
  GeneratedModel,
  ProgressListener,
  ReconstructionService,
} from './ReconstructionService';
export { STAGES } from './stages';
export type { ImageValidation, ModelMetadata, StageStatus } from './types';
