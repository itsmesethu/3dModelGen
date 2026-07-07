import { getBackendUrl } from '../../config';
import type { CapturedImage } from '../../store/useCreateStore';
import { getJobStatus, getModel, setBackendUrl, startJob, validateImage } from './api';
import type { GeneratedModel, ProgressListener, ReconstructionService } from './ReconstructionService';

/**
 * HTTP-based reconstruction service for development.
 * Polls the backend for job status and reports progress via callback.
 */
export class HttpReconstructionService implements ReconstructionService {
  private pollIntervalMs = 500;

  async validateImage(imageUri: string): Promise<{ valid: boolean; issues: string[] }> {
    const imageBase64 = await this.uriToBase64(imageUri);
    const result = await validateImage(imageBase64);
    return {
      valid: result.ok,
      issues: result.reasons,
    };
  }

  async generateModel(
    images: CapturedImage[],
    onProgress: ProgressListener,
  ): Promise<GeneratedModel> {
    // Update backend URL
    const backendUrl = getBackendUrl();
    setBackendUrl(backendUrl);

    // Convert images to base64
    const imagesBase64 = await Promise.all(images.map(img => this.uriToBase64(img.uri)));

    // Start the job
    const jobId = await startJob(imagesBase64);

    // Poll for progress
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await getJobStatus(jobId);

          // Report progress (convert progress from 0-1 to 0-100)
          const stageKey = status.stage || 'validate';
          const percent = Math.round(status.progress * 100);
          
          // Always call onProgress to ensure UI updates
          console.log(`Job progress: ${percent}% - Stage: ${stageKey} - State: ${status.state}`);
          onProgress(percent, stageKey);

          // Check if done
          if (status.state === 'done') {
            clearInterval(pollInterval);
            console.log('Job completed, fetching model...');
            const model = await getModel(jobId);
            console.log('Model fetched successfully');
            resolve({
              glbData: model.glbData,
              metadata: model.metadata,
              cleanup: () => {
                // Cleanup if needed
              },
            });
          } else if (status.state === 'failed') {
            clearInterval(pollInterval);
            console.error('Job failed:', status.error);
            reject(new Error(status.error || 'Job failed'));
          }
        } catch (error) {
          clearInterval(pollInterval);
          console.error('Error polling job status:', error);
          reject(error);
        }
      }, this.pollIntervalMs);
    });
  }

  private async uriToBase64(uri: string): Promise<string> {
    if (uri.startsWith('data:')) {
      // Already base64
      return uri.split(',')[1];
    }

    // Fetch from file or URL
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
