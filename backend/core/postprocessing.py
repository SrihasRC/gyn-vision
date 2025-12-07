"""
Postprocessing pipeline for generating masks, overlays, and statistics.
"""
import io
import base64
import numpy as np
from PIL import Image
import cv2
from typing import Dict, List, Tuple
from core.constants import CLASS_METADATA, COLOR_MAP, NUM_CLASSES


def run_inference(session, input_tensor: np.ndarray) -> np.ndarray:
    """
    Run ONNX model inference.
    
    Args:
        session: ONNX Runtime InferenceSession
        input_tensor: Preprocessed input tensor
        
    Returns:
        Logits tensor (1, num_classes, H, W)
    """
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})
    return outputs[0]


def generate_mask(logits: np.ndarray, original_size: Tuple[int, int] = None) -> np.ndarray:
    """
    Generate class ID mask from logits.
    
    Args:
        logits: Model output (1, num_classes, H, W)
        original_size: Optional (width, height) to resize mask
        
    Returns:
        Class ID array (H, W)
    """
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


def mask_to_color(mask: np.ndarray) -> np.ndarray:
    """
    Convert class ID mask to RGB color mask.
    
    Args:
        mask: Class ID array (H, W)
        
    Returns:
        RGB color mask (H, W, 3)
    """
    h, w = mask.shape
    color_mask = np.zeros((h, w, 3), dtype=np.uint8)
    
    for class_id, color in COLOR_MAP.items():
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


def calculate_statistics(mask: np.ndarray) -> List[Dict]:
    """
    Calculate per-class statistics.
    
    Args:
        mask: Class ID array (H, W)
        
    Returns:
        List of class info dicts with statistics
    """
    total_pixels = mask.size
    stats = []
    
    for class_info in CLASS_METADATA:
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
    logits: np.ndarray,
    original_image: Image.Image,
    original_size: Tuple[int, int]
) -> Dict:
    """
    Complete postprocessing pipeline for segmentation result.
    
    Args:
        logits: Model output
        original_image: Original PIL Image
        original_size: Original image size (width, height)
        
    Returns:
        Dict with mask, overlay, and statistics
    """
    # Generate mask
    mask = generate_mask(logits, original_size)
    
    # Create color mask
    color_mask = mask_to_color(mask)
    
    # Create overlay
    overlay = create_overlay(original_image, color_mask, mask)
    
    # Calculate statistics
    stats = calculate_statistics(mask)
    
    # Convert to PIL Images for encoding
    mask_image = Image.fromarray(color_mask)
    
    return {
        'mask': mask,
        'mask_image': mask_image,
        'overlay_image': overlay,
        'statistics': stats
    }


def aggregate_video_statistics(frames_stats: List[List[Dict]]) -> List[Dict]:
    """
    Aggregate statistics across video frames.
    
    Args:
        frames_stats: List of statistics for each frame
        
    Returns:
        Aggregated class statistics
    """
    aggregated = []
    
    for class_info in CLASS_METADATA:
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
