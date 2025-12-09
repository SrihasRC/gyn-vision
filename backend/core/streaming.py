"""
Streaming utilities for real-time video segmentation.
"""
import io
import base64
import tempfile
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Generator
from core.postprocessing import run_inference, process_segmentation_result


def stream_video_segmentation(
    video_bytes: bytes,
    session,
    config: Dict,
    sample_rate: int = 15
) -> Generator[Dict, None, None]:
    """
    Stream video segmentation results frame by frame.
    
    Args:
        video_bytes: Raw video bytes
        session: ONNX Runtime InferenceSession
        config: Model configuration
        sample_rate: Process every Nth frame
        
    Yields:
        Dict with frame data: {
            'frame_index': int,
            'total_frames': int,
            'frame_data': str (base64 encoded image),
            'fps': float,
            'done': bool
        }
    """
    # Save input to temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_in:
        tmp_in.write(video_bytes)
        tmp_in_path = tmp_in.name
    
    try:
        # Open input video
        cap = cv2.VideoCapture(tmp_in_path)
        
        if not cap.isOpened():
            raise ValueError("Failed to open video file")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        input_size = config['input_size']
        normalize = config['normalize']
        mean = config.get('mean')
        std = config.get('std')
        model_type = config.get('type', 'segformer')
        num_classes = config.get('num_classes', 4)
        
        frame_count = 0
        processed_count = 0
        last_overlay_bgr = None
        
        print(f"Starting stream: {width}x{height} @ {fps}fps, {total_frames} frames")
        
        # Send initial metadata
        yield {
            'type': 'metadata',
            'fps': fps,
            'total_frames': total_frames,
            'width': width,
            'height': height,
            'sample_rate': sample_rate
        }
        
        # Process each frame
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Decide if we should process this frame or reuse last overlay
            should_process = (frame_count - 1) % sample_rate == 0
            
            if should_process:
                processed_count += 1
                
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                original_frame = Image.fromarray(frame_rgb)
                
                # Resize for model
                resized_frame = original_frame.resize(
                    (input_size, input_size),
                    Image.BILINEAR
                )
                
                # Convert to numpy and normalize
                img_array = np.array(resized_frame, dtype=np.float32) / 255.0
                
                if normalize and mean is not None and std is not None:
                    mean_arr = np.array(mean, dtype=np.float32).reshape(1, 1, 3)
                    std_arr = np.array(std, dtype=np.float32).reshape(1, 1, 3)
                    img_array = (img_array - mean_arr) / std_arr
                
                # Transpose and add batch dimension
                img_array = np.transpose(img_array, (2, 0, 1))
                input_tensor = np.expand_dims(img_array, axis=0)
                
                # Run inference
                logits = run_inference(session, input_tensor, model_type)
                
                # Generate overlay
                result = process_segmentation_result(
                    logits,
                    original_frame,
                    original_frame.size,
                    model_type=model_type,
                    input_shape=(input_size, input_size),
                    num_classes=num_classes
                )
                
                # Convert overlay to OpenCV format (RGB -> BGR)
                overlay_np = np.array(result['overlay_image'])
                last_overlay_bgr = cv2.cvtColor(overlay_np, cv2.COLOR_RGB2BGR)
            
            # Encode frame to base64
            if last_overlay_bgr is not None:
                # Encode to JPEG for smaller size
                _, buffer = cv2.imencode('.jpg', last_overlay_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                
                # Yield frame data
                yield {
                    'type': 'frame',
                    'frame_index': frame_count,
                    'total_frames': total_frames,
                    'processed_count': processed_count,
                    'frame_data': f'data:image/jpeg;base64,{frame_base64}',
                    'progress': (frame_count / total_frames) * 100
                }
        
        cap.release()
        
        # Send completion signal
        yield {
            'type': 'complete',
            'total_frames': frame_count,
            'processed_frames': processed_count
        }
        
        print(f"Stream complete. Frames: {frame_count}, Processed: {processed_count}")
        
    finally:
        # Clean up input temp file
        import os
        try:
            os.unlink(tmp_in_path)
        except:
            pass
