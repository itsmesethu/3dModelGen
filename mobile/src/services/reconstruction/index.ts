/**
 * Reconstruction service factory.
 *
 * Selects the production native bridge when it is bundled in the build,
 * otherwise falls back to the HTTP development wrapper. Screens call
 * `getReconstructionService()` and never know which mode is active.
 */
import { HttpReconstructionService } from './HttpReconstructionService';
import {
  getNativeBridge,
  NativeReconstructionService,
} from './NativeReconstructionService';
import type { ReconstructionService } from './ReconstructionService';

let cached: ReconstructionService | null = null;

export async function getReconstructionService(): Promise<ReconstructionService> {
  if (cached) {
    return cached;
  }
  const bridge = getNativeBridge();
  if (bridge) {
    const native = new NativeReconstructionService(bridge);
    if (await native.isAvailable()) {
      cached = native;
      return cached;
    }
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
