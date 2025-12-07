"""
Preprocessing pipelines for image and video inputs.
"""
import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List, Dict
import tempfile


def preprocess_image(
    file_bytes: bytes,
    input_size: int,
    normalize: bool = True,
    mean: List[float] = None,
    std: List[float] = None
) -> Tuple[np.ndarray, Image.Image, Tuple[int, int]]:
    """
    Preprocess image for ONNX model inference.
    
    Args:
        file_bytes: Raw image bytes
        input_size: Target size (width/height)
        normalize: Whether to apply normalization
        mean: Normalization mean values
        std: Normalization std values
        
    Returns:
        Tuple of (input_tensor, original_image, original_size)
    """
    # Decode image
    original_image = Image.open(io.BytesIO(file_bytes)).convert('RGB')
    original_size = original_image.size  # (width, height)
    
    # Resize to model input size
    resized_image = original_image.resize((input_size, input_size), Image.BILINEAR)
    
    # Convert to numpy array
    img_array = np.array(resized_image, dtype=np.float32)
    
    # Normalize to [0, 1]
    img_array = img_array / 255.0
    
    # Apply mean/std normalization if needed
    if normalize and mean is not None and std is not None:
        mean = np.array(mean, dtype=np.float32).reshape(1, 1, 3)
        std = np.array(std, dtype=np.float32).reshape(1, 1, 3)
        img_array = (img_array - mean) / std
    
    # Transpose: HWC -> CHW
    img_array = np.transpose(img_array, (2, 0, 1))
    
    # Add batch dimension: [1, 3, H, W]
    input_tensor = np.expand_dims(img_array, axis=0)
    
    return input_tensor, original_image, original_size


def preprocess_video(
    file_bytes: bytes,
    input_size: int,
    normalize: bool = True,
    mean: List[float] = None,
    std: List[float] = None,
    max_frames: int = 30
) -> List[Dict]:
    """
    Preprocess video by sampling keyframes.
    
    Args:
        file_bytes: Raw video bytes
        input_size: Target size for frames
        normalize: Whether to apply normalization
        mean: Normalization mean values
        std: Normalization std values
        max_frames: Maximum number of frames to sample
        
    Returns:
        List of dicts with frame data:
        - index: frame index
        - time_seconds: timestamp
        - input_tensor: preprocessed tensor
        - original_frame: PIL Image
    """
    # Save to temporary file (OpenCV needs file path)
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    
    try:
        # Open video
        cap = cv2.VideoCapture(tmp_path)
        
        if not cap.isOpened():
            raise ValueError("Failed to open video file")
        
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Calculate frame sampling step
        step = max(1, total_frames // max_frames)
        
        frames_data = []
        frame_idx = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample frame
            if frame_idx % step == 0 and len(frames_data) < max_frames:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                original_frame = Image.fromarray(frame_rgb)
                
                # Resize
                resized_frame = original_frame.resize(
                    (input_size, input_size),
                    Image.BILINEAR
                )
                
                # Convert to numpy
                img_array = np.array(resized_frame, dtype=np.float32)
                
                # Normalize to [0, 1]
                img_array = img_array / 255.0
                
                # Apply mean/std normalization
                if normalize and mean is not None and std is not None:
                    mean_arr = np.array(mean, dtype=np.float32).reshape(1, 1, 3)
                    std_arr = np.array(std, dtype=np.float32).reshape(1, 1, 3)
                    img_array = (img_array - mean_arr) / std_arr
                
                # Transpose: HWC -> CHW
                img_array = np.transpose(img_array, (2, 0, 1))
                
                # Add batch dimension
                input_tensor = np.expand_dims(img_array, axis=0)
                
                # Calculate timestamp
                time_seconds = frame_idx / fps if fps > 0 else 0
                
                frames_data.append({
                    'index': frame_idx,
                    'time_seconds': round(time_seconds, 2),
                    'input_tensor': input_tensor,
                    'original_frame': original_frame
                })
            
            frame_idx += 1
        
        cap.release()
        
        return frames_data
        
    finally:
        # Clean up temp file
        import os
        try:
            os.unlink(tmp_path)
        except:
            pass
