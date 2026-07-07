/**
 * Production-mode transport: talks to the Native Android Bridge
 * (`android/bridge/ReconstructionBridgeModule.kt`), which invokes the
 * on-device Reconstruction Engine. No network involved.
 */
import { NativeEventEmitter, NativeModules } from 'react-native';
import RNFS from 'react-native-fs';

import type { CapturedImage } from '../../store/useCreateStore';
import type {
  GeneratedModel,
  ProgressListener,
  ReconstructionService,
} from './ReconstructionService';
import type { ImageValidation, ModelMetadata } from './types';

const PROGRESS_EVENT = 'ReconstructionProgress';

interface NativeBridge {
  isAvailable(): Promise<boolean>;
  getEngineInfo(): Promise<object>;
  validateImage(imagePath: string): Promise<ImageValidation>;
  generateModel(imagePaths: string[]): Promise<{
    modelPath: string;
    previewPath?: string | null;
    metadata: ModelMetadata;
  }>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export function getNativeBridge(): NativeBridge | null {
  return (NativeModules.ReconstructionBridge as NativeBridge | undefined) ?? null;
}

export class NativeReconstructionService implements ReconstructionService {
  readonly mode = 'native' as const;

  constructor(private readonly bridge: NativeBridge) {}

  async isAvailable(): Promise<boolean> {
    try {
      return await this.bridge.isAvailable();
    } catch {
      return false;
    }
  }

  async validateImage(image: CapturedImage): Promise<ImageValidation | null> {
    try {
      return await this.bridge.validateImage(image.uri.replace('file://', ''));
    } catch {
      return null; // never block capture on validation transport errors
    }
  }

  async generateModel(
    images: CapturedImage[],
    onProgress: ProgressListener,
  ): Promise<GeneratedModel> {
    const emitter = new NativeEventEmitter(
      NativeModules.ReconstructionBridge,
    );
    const subscription = emitter.addListener(
      PROGRESS_EVENT,
      (event: { percent: number; stage: string }) =>
        onProgress(event.percent, event.stage),
    );
    try {
      const result = await this.bridge.generateModel(
        images.map(image => image.uri.replace('file://', '')),
      );
      const modelUri = result.modelPath.startsWith('file://')
        ? result.modelPath
        : `file://${result.modelPath}`;
      return {
        modelUri,
        metadata: result.metadata,
        cleanup: async () => {
          const path = modelUri.replace('file://', '');
          if (await RNFS.exists(path)) {
            await RNFS.unlink(path).catch(() => undefined);
          }
        },
      };
    } finally {
      subscription.remove();
    }
  }
}
