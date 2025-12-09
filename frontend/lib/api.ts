/**
 * API client for backend communication
 */
import axios from 'axios';
import { Model, ImageResult, ClassInfo } from './types';

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
 * Fetch class metadata for a specific model
 */
export async function fetchModelClasses(modelId: string): Promise<ClassInfo[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/models/${modelId}/classes`);
    return response.data.classes;
  } catch (error) {
    console.error('Error fetching model classes:', error);
    throw new Error('Failed to fetch model classes');
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
 * Segment a video with real-time streaming
 */
export async function segmentVideoStream(
  file: File,
  modelId: string,
  sampleRate: number = 15,
  onFrame: (frameData: {
    type: string;
    frame_index?: number;
    total_frames?: number;
    frame_data?: string;
    progress?: number;
    fps?: number;
    width?: number;
    height?: number;
  }) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', modelId);
    formData.append('sample_rate', sampleRate.toString());

    const response = await fetch(`${API_BASE_URL}/segment/video/stream`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onFrame(data);
            
            if (data.type === 'complete') {
              onComplete();
              return;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in video stream:', error);
    onError(error instanceof Error ? error : new Error('Stream failed'));
  }
}

/**
 * Segment a video (legacy - returns complete video)
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
