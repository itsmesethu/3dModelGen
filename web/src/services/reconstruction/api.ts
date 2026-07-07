import axios from 'axios';
import { getBackendUrl } from '../../config';

// Create axios client with dynamic baseURL
let client = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
});

// Log configuration for debugging
console.log('API Client initialized with baseURL:', getBackendUrl());

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
  try {
    const blob = base64ToBlob(imageBase64);
    const formData = new FormData();
    formData.append('image', blob, 'capture.jpg');

    console.log('Validating image via POST /api/validate');
    const response = await client.post<ValidationResponse>('/api/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Image validation response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Image validation failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Start a reconstruction job.
 */
export async function startJob(imagesBase64: string[]): Promise<string> {
  try {
    const formData = new FormData();
    
    imagesBase64.forEach((base64, index) => {
      const blob = base64ToBlob(base64);
      formData.append('images', blob, `image_${index + 1}.jpg`);
    });

    console.log(`Starting job with ${imagesBase64.length} images via POST /api/jobs`);
    const response = await client.post<{ job_id: string }>('/api/jobs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Job created with ID:', response.data.job_id);
    return response.data.job_id;
  } catch (error: any) {
    console.error('Job creation failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get job status.
 */
export async function getJobStatus(jobId: string): Promise<JobResponse> {
  try {
    const url = `/api/jobs/${jobId}`;
    console.log(`Fetching job status via GET ${url}`);
    const response = await client.get<JobResponse>(url);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to get job status for ${jobId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get the generated model.
 */
export async function getModel(jobId: string): Promise<ModelResponse> {
  try {
    const url = `/api/jobs/${jobId}/model`;
    console.log(`Fetching model via GET ${url}`);
    const response = await client.get<ModelResponse>(url);
    console.log('Model fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error(`Failed to get model for ${jobId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update backend URL dynamically.
 */
export function setBackendUrl(url: string): void {
  client.defaults.baseURL = url;
}
