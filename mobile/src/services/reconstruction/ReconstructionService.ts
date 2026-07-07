/**
 * Transport-agnostic reconstruction contract.
 *
 * The app only ever talks to this interface. Implementations:
 *  - HttpReconstructionService   — development mode (FastAPI wrapper)
 *  - NativeReconstructionService — production mode (native Android bridge)
 *
 * Screens never know (or care) which one is active, nor how the engine is
 * implemented internally (Python today, C++/ONNX/TFLite tomorrow).
 */
import type { CapturedImage } from '../../store/useCreateStore';
import type { ImageValidation, ModelMetadata } from './types';

/** Mirrors shared/contracts: percent 0..100, stage key from stages.ts */
export type ProgressListener = (percent: number, stageKey: string) => void;

export interface GeneratedModel {
  /** Local file URI (file://...) of the generated GLB. */
  modelUri: string;
  metadata: ModelMetadata;
  /** Releases any temporary resources (cache files, remote job, ...). */
  cleanup: () => Promise<void>;
}

export interface ReconstructionService {
  readonly mode: 'http' | 'native';

  /** Whether this transport can currently reach an engine. */
  isAvailable(): Promise<boolean>;

  /**
   * Best-effort single-image quality check during guided capture.
   * Returns null when validation cannot be performed (never blocks capture).
   */
  validateImage(image: CapturedImage): Promise<ImageValidation | null>;

  /** Run the full pipeline. Progress arrives via callback, not polling. */
  generateModel(
    images: CapturedImage[],
    onProgress: ProgressListener,
  ): Promise<GeneratedModel>;
}
