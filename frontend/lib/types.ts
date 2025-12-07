/**
 * Type definitions for the segmentation application
 */

// Model metadata
export interface Model {
  id: string;
  name: string;
  description: string;
}

// Class metadata
export interface ClassInfo {
  id: number;
  name: string;
  color: string;
  area_percent?: number;
  frames_present?: number;
  avg_area_percent?: number;
  present?: boolean;
}

// Image segmentation response
export interface ImageResult {
  model_id: string;
  classes: ClassInfo[];
  original_image: string;  // base64
  mask_image: string;      // base64
  overlay_image: string;   // base64
}

// Video frame
export interface VideoFrame {
  index: number;
  time_seconds: number;
  overlay_image: string;   // base64
}

// Video segmentation response
export interface VideoResult {
  model_id: string;
  num_frames: number;
  classes: ClassInfo[];
  frames: VideoFrame[];
}

// UI state
export type Mode = 'image' | 'video';
