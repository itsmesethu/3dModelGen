import axios from 'axios';
import { getBackendUrl } from '../../config';

const client = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
});

/**
 * Helper function to convert base64 string to Blob
 */
function base64ToBlob(base64: string, type: string = 'image/jpeg'): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

export interface JobResponse {
  job_id: string;
  state: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
  stage: string | null;
  stages: Array<{
    key: string;
    label: string;
    state: string;
  }>;
  error?: string;
  elapsed_seconds: number;
  metadata?: {
    vertices: number;
    faces: number;
    file_size_bytes: number;
    processing_seconds: number;
    engine: string;
    image_count: number;
  };
}

export interface ValidationResponse {
  ok: boolean;
  reasons: string[];
  blur_score?: number;
  brightness?: number;
}

export interface ModelResponse {
  glbData: string;
  metadata: {
    generatedAt: string;
    imageCount: number;
    processingTimeSeconds: number;
    engine: string;
    geometryBackend: string;
  };
}

/**
 * Validate a single image.
 */
export async function validateImage(imageBase64: string): Promise<ValidationResponse> {
  const blob = base64ToBlob(imageBase64);
  const formData = new FormData();
  formData.append('image', blob, 'capture.jpg');

  const response = await client.post<ValidationResponse>('/api/validate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Start a reconstruction job.
 */
export async function startJob(imagesBase64: string[]): Promise<string> {
  const formData = new FormData();
  
  imagesBase64.forEach((base64, index) => {
    const blob = base64ToBlob(base64);
    formData.append('images', blob, `image_${index + 1}.jpg`);
  });

  const response = await client.post<{ job_id: string }>('/api/jobs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.job_id;
}

/**
 * Get job status.
 */
export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const response = await client.get<JobResponse>(`/api/jobs/${jobId}`);
  return response.data;
}

/**
 * Get the generated model.
 */
export async function getModel(jobId: string): Promise<ModelResponse> {
  const response = await client.get<ModelResponse>(`/api/jobs/${jobId}/model`);
  return response.data;
}

/**
 * Update backend URL dynamically.
 */
export function setBackendUrl(url: string): void {
  client.defaults.baseURL = url;
}
