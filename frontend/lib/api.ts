/**
 * API client for backend communication
 */
import axios from 'axios';
import { Model, ImageResult } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch available models
 */
export async function fetchModels(): Promise<Model[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/models`);
    return response.data.models;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw new Error('Failed to fetch models');
  }
}

/**
 * Segment an image
 */
export async function segmentImage(
  file: File,
  modelId: string
): Promise<ImageResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', modelId);

    const response = await axios.post(
      `${API_BASE_URL}/segment/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error segmenting image:', error);
    const message = axios.isAxiosError(error) && error.response?.data?.detail 
      ? error.response.data.detail 
      : 'Failed to segment image';
    throw new Error(message);
  }
}

/**
 * Segment a video
 */
export async function segmentVideo(
  file: File,
  modelId: string,
  sampleRate: number = 15
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', modelId);
    formData.append('sample_rate', sampleRate.toString());

    const response = await axios.post(
      `${API_BASE_URL}/segment/video`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'  // Important: get video as blob
      }
    );

    // Create a URL for the video blob
    const videoBlob = new Blob([response.data], { type: 'video/mp4' });
    return URL.createObjectURL(videoBlob);
  } catch (error: unknown) {
    console.error('Error segmenting video:', error);
    const message = axios.isAxiosError(error) && error.response?.data?.detail 
      ? error.response.data.detail 
      : 'Failed to segment video';
    throw new Error(message);
  }
}
