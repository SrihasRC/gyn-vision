"""
API routes for segmentation endpoints.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Dict, Any
from core.model_registry import get_registry
from core.preprocessing import preprocess_image, preprocess_video
from core.postprocessing import (
    run_inference,
    process_segmentation_result,
    encode_image_to_base64,
    aggregate_video_statistics
)

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@router.get("/models")
async def get_models() -> Dict[str, Any]:
    """
    Get list of available models.
    
    Returns:
        Dict with models array
    """
    registry = get_registry()
    models = registry.get_available_models()
    return {"models": models}


@router.post("/segment/image")
async def segment_image(
    file: UploadFile = File(...),
    model_id: str = Form(...)
) -> Dict[str, Any]:
    """
    Segment a single image.
    
    Args:
        file: Uploaded image file
        model_id: Model identifier
        
    Returns:
        Segmentation results with masks and statistics
    """
    try:
        # Get model
        registry = get_registry()
        session, config = registry.get_model(model_id)
        
        # Read file
        file_bytes = await file.read()
        
        # Preprocess
        input_tensor, original_image, original_size = preprocess_image(
            file_bytes,
            input_size=config['input_size'],
            normalize=config['normalize'],
            mean=config.get('mean'),
            std=config.get('std')
        )
        
        # Run inference
        logits = run_inference(session, input_tensor)
        
        # Postprocess
        result = process_segmentation_result(logits, original_image, original_size)
        
        # Encode images
        return {
            "model_id": model_id,
            "classes": result['statistics'],
            "original_image": encode_image_to_base64(original_image),
            "mask_image": encode_image_to_base64(result['mask_image']),
            "overlay_image": encode_image_to_base64(result['overlay_image'])
        }
        
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/segment/video")
async def segment_video(
    file: UploadFile = File(...),
    model_id: str = Form(...)
) -> Dict[str, Any]:
    """
    Segment video by processing keyframes.
    
    Args:
        file: Uploaded video file
        model_id: Model identifier
        
    Returns:
        Video segmentation results with frames array
    """
    try:
        # Get model
        registry = get_registry()
        session, config = registry.get_model(model_id)
        
        # Read file
        file_bytes = await file.read()
        
        # Preprocess video (sample frames)
        frames_data = preprocess_video(
            file_bytes,
            input_size=config['input_size'],
            normalize=config['normalize'],
            mean=config.get('mean'),
            std=config.get('std'),
            max_frames=30
        )
        
        if not frames_data:
            raise HTTPException(status_code=400, detail="No frames could be extracted")
        
        # Process each frame
        processed_frames = []
        all_stats = []
        
        for frame_data in frames_data:
            # Run inference
            logits = run_inference(session, frame_data['input_tensor'])
            
            # Postprocess
            result = process_segmentation_result(
                logits,
                frame_data['original_frame'],
                frame_data['original_frame'].size
            )
            
            all_stats.append(result['statistics'])
            
            # Store frame result
            processed_frames.append({
                'index': frame_data['index'],
                'time_seconds': frame_data['time_seconds'],
                'overlay_image': encode_image_to_base64(result['overlay_image'])
            })
        
        # Aggregate statistics
        aggregated_stats = aggregate_video_statistics(all_stats)
        
        return {
            "model_id": model_id,
            "num_frames": len(processed_frames),
            "classes": aggregated_stats,
            "frames": processed_frames
        }
        
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
