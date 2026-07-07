/**
 * Development-mode transport: talks to the FastAPI wrapper.
 *
 * The engine reports progress via callbacks; HTTP is a pull transport, so
 * this class polls the dev wrapper *internally* and re-exposes progress as
 * callbacks — screens never poll.
 */
import RNFS from 'react-native-fs';

import { POLL_INTERVAL_MS } from '../../config';
import type { CapturedImage } from '../../store/useCreateStore';
import {
  createJob,
  deleteJob,
  getJobStatus,
  getModelUrl,
  isBackendReachable,
  validateImage as validateImageHttp,
} from './api';
import type {
  GeneratedModel,
  ProgressListener,
  ReconstructionService,
} from './ReconstructionService';
import type { ImageValidation, JobStatus } from './types';

export class HttpReconstructionService implements ReconstructionService {
  readonly mode = 'http' as const;

  isAvailable(): Promise<boolean> {
    return isBackendReachable();
  }

  validateImage(image: CapturedImage): Promise<ImageValidation | null> {
    return validateImageHttp(image);
  }

  async generateModel(
    images: CapturedImage[],
    onProgress: ProgressListener,
  ): Promise<GeneratedModel> {
    const { job_id: jobId } = await createJob(images);
    try {
      const finalStatus = await this.waitForCompletion(jobId, onProgress);
      if (finalStatus.state === 'failed') {
        throw new Error(finalStatus.error ?? 'Reconstruction failed.');
      }

      const modelUri = await this.downloadModel(jobId);
      const metadata = finalStatus.metadata ?? {
        vertices: 0,
        faces: 0,
        file_size_bytes: 0,
        processing_seconds: finalStatus.elapsed_seconds,
        engine: 'unknown',
        image_count: images.length,
      };
      return {
        modelUri,
        metadata,
        cleanup: async () => {
          await deleteJob(jobId);
          const path = modelUri.replace('file://', '');
          if (await RNFS.exists(path)) {
            await RNFS.unlink(path).catch(() => undefined);
          }
        },
      };
    } catch (error) {
      // Never leave temp files on the wrapper.
      deleteJob(jobId);
      throw error;
    }
  }

  private waitForCompletion(
    jobId: string,
    onProgress: ProgressListener,
  ): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      const timer = setInterval(async () => {
        try {
          const status = await getJobStatus(jobId);
          onProgress(status.progress * 100, status.stage ?? 'preparing');
          if (status.state === 'done' || status.state === 'failed') {
            clearInterval(timer);
            resolve(status);
          }
        } catch (error: any) {
          if (error?.response?.status === 404) {
            clearInterval(timer);
            reject(new Error('The job expired on the development server.'));
          }
          // Other errors: transient network hiccup — keep polling.
        }
      }, POLL_INTERVAL_MS);
    });
  }

  private async downloadModel(jobId: string): Promise<string> {
    const destination = `${RNFS.CachesDirectoryPath}/generated_${jobId}.glb`;
    const result = await RNFS.downloadFile({
      fromUrl: getModelUrl(jobId),
      toFile: destination,
    }).promise;
    if (result.statusCode !== 200) {
      throw new Error(`Model download failed (HTTP ${result.statusCode}).`);
    }
    return `file://${destination}`;
  }
}
