import axios from 'axios';

import { BACKEND_URL } from '../../config';
import type { CapturedImage } from '../../store/useCreateStore';
import type { ImageValidation, JobCreated, JobStatus } from './types';

const client = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 120000,
});

function toFormFile(image: CapturedImage) {
  const name = image.fileName || 'photo.jpg';
  const lower = name.toLowerCase();
  const type = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.webp')
    ? 'image/webp'
    : 'image/jpeg';
  return { uri: image.uri, name, type } as unknown as Blob;
}

/** Upload all images and start a reconstruction job. */
export async function createJob(images: CapturedImage[]): Promise<JobCreated> {
  const form = new FormData();
  images.forEach(image => form.append('images', toFormFile(image)));
  const response = await client.post<JobCreated>('/jobs', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await client.get<JobStatus>(`/jobs/${jobId}`);
  return response.data;
}

export function getModelUrl(jobId: string): string {
  return `${BACKEND_URL}/api/jobs/${jobId}/model`;
}

/** Delete the job and its temporary files on the backend. */
export async function deleteJob(jobId: string): Promise<void> {
  try {
    await client.delete(`/jobs/${jobId}`);
  } catch {
    // Best effort — the backend TTL reaper cleans up regardless.
  }
}

/** Best-effort single image validation during capture. */
export async function validateImage(
  image: CapturedImage,
): Promise<ImageValidation | null> {
  try {
    const form = new FormData();
    form.append('image', toFormFile(image));
    const response = await client.post<ImageValidation>('/validate', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000,
    });
    return response.data;
  } catch {
    // Backend unreachable — skip remote validation rather than block capture.
    return null;
  }
}

export async function isBackendReachable(): Promise<boolean> {
  try {
    await client.get('/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
