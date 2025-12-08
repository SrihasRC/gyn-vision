"""
Postprocessing pipeline for generating masks, overlays, and statistics.
"""
import io
import base64
import tempfile
import subprocess
import os
import numpy as np
from PIL import Image
import cv2
from typing import Dict, List, Tuple
from core.constants import CLASS_METADATA, COLOR_MAP, NUM_CLASSES, get_color_map, get_class_metadata


def run_inference(session, input_tensor: np.ndarray, model_type: str = "segformer"):
    """
    Run ONNX model inference.
    
    Args:
        session: ONNX Runtime InferenceSession
        input_tensor: Preprocessed input tensor
        model_type: Type of model ("segformer" or "yolo")
        
    Returns:
        Logits tensor (1, num_classes, H, W) for segformer
        or YOLO output for yolo models
    """
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})
    
    if model_type == "yolo":
        # YOLO returns the full output (we'll process it in generate_mask)
        return outputs
    else:
        # SegFormer returns logits as first output
        return outputs[0]


def generate_mask(logits, original_size: Tuple[int, int] = None, model_type: str = "segformer", input_shape: Tuple[int, int] = (640, 640)) -> np.ndarray:
    """
    Generate class ID mask from model output.
    
    Args:
        logits: Model output - array for SegFormer (1, num_classes, H, W) or list for YOLO
        original_size: Optional (width, height) to resize mask
        model_type: Type of model ("segformer" or "yolo")
        input_shape: Input size (width, height) for YOLO processing
        
    Returns:
        Class ID array (H, W)
    """
    if model_type == "yolo":
        # YOLO output processing
        # YOLO segmentation outputs: [detections, proto_masks]
        # We need to extract masks from the output
        output = logits[0]  # Get first output
        
        # For YOLO segmentation, create a simple semantic mask
        # Initialize empty mask with input dimensions
        h, w = input_shape[1], input_shape[0]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        # If YOLO has valid detections with masks, process them
        # This is a simplified version - YOLO outputs need proper NMS and mask decoding
        # For now, we'll create a basic mask from the output
        if isinstance(logits, list) and len(logits) > 0:
            # Try to extract mask data from YOLO output
            # YOLO output format varies, this handles basic case
            try:
                # Assuming output contains mask predictions
                if output.ndim >= 3:
                    # Take argmax if multi-class
                    if output.shape[0] > 1:
                        mask = np.argmax(output, axis=0).astype(np.uint8)
                    else:
                        mask = (output[0] > 0.5).astype(np.uint8)
            except Exception as e:
                print(f"YOLO mask extraction warning: {e}")
                # Return empty mask on error
                pass
    else:
        # SegFormer output processing
        # Argmax over classes: (1, C, H, W) -> (H, W)
        mask = np.argmax(logits[0], axis=0).astype(np.uint8)
    
    # Resize to original size if needed
    if original_size is not None:
        mask = cv2.resize(
            mask,
            original_size,
            interpolation=cv2.INTER_NEAREST
        )
    
    return mask


def mask_to_color(mask: np.ndarray, num_classes: int = 4) -> np.ndarray:
    """
    Convert class ID mask to RGB color mask.
    
    Args:
        mask: Class ID array (H, W)
        num_classes: Number of classes in the model
        
    Returns:
        RGB color mask (H, W, 3)
    """
    h, w = mask.shape
    color_mask = np.zeros((h, w, 3), dtype=np.uint8)
    
    color_map = get_color_map(num_classes)
    for class_id, color in color_map.items():
        color_mask[mask == class_id] = color
    
    return color_mask


def create_overlay(
    original_image: Image.Image,
    color_mask: np.ndarray,
    mask: np.ndarray,
    alpha: float = 0.4
) -> Image.Image:
    """
    Create overlay by blending original image with color mask.
    
    Args:
        original_image: Original PIL Image
        color_mask: RGB color mask array
        mask: Class ID mask (to exclude background)
        alpha: Blending weight for color mask
        
    Returns:
        Overlay PIL Image
    """
    # Resize original image to match mask size
    orig_array = np.array(original_image.resize(
        (color_mask.shape[1], color_mask.shape[0]),
        Image.BILINEAR
    ))
    
    # Create overlay
    overlay = orig_array.copy()
    
    # Blend only where mask > 0 (not background)
    non_background = mask > 0
    overlay[non_background] = (
        (1 - alpha) * orig_array[non_background] +
        alpha * color_mask[non_background]
    ).astype(np.uint8)
    
    return Image.fromarray(overlay)


def calculate_statistics(mask: np.ndarray, num_classes: int = 4) -> List[Dict]:
    """
    Calculate per-class statistics.
    
    Args:
        mask: Class ID array (H, W)
        num_classes: Number of classes in the model
        
    Returns:
        List of class info dicts with statistics
    """
    total_pixels = mask.size
    stats = []
    
    class_metadata = get_class_metadata(num_classes)
    for class_info in class_metadata:
        class_id = class_info['id']
        pixel_count = int(np.sum(mask == class_id))
        area_percent = (pixel_count / total_pixels) * 100
        
        stats.append({
            'id': class_id,
            'name': class_info['name'],
            'color': class_info['color'],
            'area_percent': round(float(area_percent), 2),
            'present': bool(pixel_count > 0)
        })
    
    return stats


def encode_image_to_base64(image: Image.Image) -> str:
    """
    Encode PIL Image to base64 PNG string.
    
    Args:
        image: PIL Image
        
    Returns:
        Base64 encoded string with data URI prefix
    """
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


def process_segmentation_result(
    logits,
    original_image: Image.Image,
    original_size: Tuple[int, int],
    model_type: str = "segformer",
    input_shape: Tuple[int, int] = (640, 640),
    num_classes: int = 4
) -> Dict:
    """
    Complete postprocessing pipeline for segmentation result.
    
    Args:
        logits: Model output
        original_image: Original PIL Image
        original_size: Original image size (width, height)
        model_type: Type of model (\"segformer\" or \"yolo\")
        input_shape: Input size (width, height) for YOLO
        num_classes: Number of classes in the model
        
    Returns:
        Dict with mask, overlay, and statistics
    """
    # Generate mask
    mask = generate_mask(logits, original_size, model_type, input_shape)
    
    # Create color mask
    color_mask = mask_to_color(mask, num_classes)
    
    # Create overlay
    overlay = create_overlay(original_image, color_mask, mask)
    
    # Calculate statistics
    stats = calculate_statistics(mask, num_classes)
    
    # Convert to PIL Images for encoding
    mask_image = Image.fromarray(color_mask)
    
    return {
        'mask': mask,
        'mask_image': mask_image,
        'overlay_image': overlay,
        'statistics': stats
    }


def aggregate_video_statistics(frames_stats: List[List[Dict]], num_classes: int = 4) -> List[Dict]:
    """
    Aggregate statistics across video frames.
    
    Args:
        frames_stats: List of statistics for each frame
        num_classes: Number of classes in the model
        
    Returns:
        Aggregated class statistics
    """
    aggregated = []
    
    class_metadata = get_class_metadata(num_classes)
    for class_info in class_metadata:
        class_id = class_info['id']
        
        # Skip background
        if class_id == 0:
            continue
        
        frames_present = 0
        total_area = 0.0
        
        for frame_stat in frames_stats:
            class_stat = next(
                (s for s in frame_stat if s['id'] == class_id),
                None
            )
            if class_stat and class_stat['present']:
                frames_present += 1
                total_area += class_stat['area_percent']
        
        avg_area = total_area / len(frames_stats) if frames_stats else 0
        
        aggregated.append({
            'id': class_id,
            'name': class_info['name'],
            'color': class_info['color'],
            'frames_present': frames_present,
            'avg_area_percent': round(avg_area, 2)
        })
    
    return aggregated


def create_video_with_overlay(
    video_bytes: bytes,
    session,
    config: Dict,
    output_path: str = None,
    sample_rate: int = 15  # Process every 15th frame (~2fps at 30fps)
) -> str:
    """
    Process video with frame sampling and create output video with segmentation overlays.
    
    Args:
        video_bytes: Raw video bytes
        session: ONNX Runtime InferenceSession
        config: Model configuration
        output_path: Optional output path for video file
        sample_rate: Process every Nth frame (default 15 = ~2fps at 30fps input)
        
    Returns:
        Path to output video file
    """
    # Save input to temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_in:
        tmp_in.write(video_bytes)
        tmp_in_path = tmp_in.name
    
    # Create output path
    if output_path is None:
        tmp_out = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        output_path = tmp_out.name
        tmp_out.close()
    
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
        
        estimated_processed = total_frames // sample_rate
        print(f"Video properties: {width}x{height} @ {fps}fps, {total_frames} frames")
        print(f"Frame sampling: Processing 1 out of every {sample_rate} frames (~{estimated_processed} frames)")
        
        # Create video writer with H.264 codec for web compatibility
        # Try different codecs in order of preference
        codecs = ['avc1', 'H264', 'X264', 'mp4v']
        out = None
        
        for codec in codecs:
            try:
                fourcc = cv2.VideoWriter_fourcc(*codec)
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                if out.isOpened():
                    print(f"Using codec: {codec}")
                    break
                out.release()
            except:
                continue
        
        if out is None or not out.isOpened():
            raise ValueError("Failed to create output video with any codec")
        
        input_size = config['input_size']
        normalize = config['normalize']
        mean = config.get('mean')
        std = config.get('std')
        model_type = config.get('type', 'segformer')
        num_classes = config.get('num_classes', 4)
        
        frame_count = 0
        processed_count = 0
        last_overlay_bgr = None
        
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
                
                if processed_count % 10 == 0:  # Log every 10 processed frames
                    print(f"Processed {processed_count}/{estimated_processed} key frames ({frame_count}/{total_frames} total)")
            
            # Write frame (either newly processed or reused overlay)
            if last_overlay_bgr is not None:
                out.write(last_overlay_bgr)
            else:
                # Fallback: write original frame if no overlay yet
                out.write(frame)
        
        cap.release()
        out.release()
        
        print(f"Video processing complete. Total frames: {frame_count}, Processed: {processed_count}")
        print(f"Speed improvement: ~{sample_rate}x faster")
        print(f"Output video saved to: {output_path}")
        
        # Re-encode with ffmpeg for better web compatibility
        final_output = output_path.replace('.mp4', '_web.mp4')
        try:
            subprocess.run([
                'ffmpeg', '-y', '-i', output_path,
                '-c:v', 'libx264', '-preset', 'fast',
                '-crf', '23', '-pix_fmt', 'yuv420p',
                final_output
            ], check=True, capture_output=True)
            
            print(f"Re-encoded video for web: {final_output}")
            
            # Remove original and use re-encoded version
            os.unlink(output_path)
            return final_output
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"ffmpeg re-encoding failed, using original: {e}")
            return output_path
        
    finally:
        # Clean up input temp file
        try:
            os.unlink(tmp_in_path)
        except:
            pass
