"""
API routes for segmentation endpoints.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.background import BackgroundTasks
from typing import Dict, Any
import os
import json
from core.model_registry import get_registry
from core.preprocessing import preprocess_image, preprocess_video
from core.postprocessing import (
    run_inference,
    process_segmentation_result,
    create_video_with_overlay,
    encode_image_to_base64,
    aggregate_video_statistics
)
from core.streaming import stream_video_segmentation

router = APIRouter()


def cleanup_file(path: str):
    """Remove temporary file."""
    try:
        if os.path.exists(path):
            os.remove(path)
            print(f"Cleaned up: {path}")
    except Exception as e:
        print(f"Error cleaning up {path}: {e}")


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


@router.get("/models/{model_id}/classes")
async def get_model_classes(model_id: str) -> Dict[str, Any]:
    """
    Get class metadata for a specific model.
    
    Args:
        model_id: Model identifier
        
    Returns:
        Dict with classes array containing class metadata
    """
    try:
        from core.constants import get_class_metadata
        
        registry = get_registry()
        _, config = registry.get_model(model_id)
        
        num_classes = config.get('num_classes', 4)
        class_metadata = get_class_metadata(num_classes)
        
        return {"classes": class_metadata}
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


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
        model_type = config.get('type', 'segformer')
        logits = run_inference(session, input_tensor, model_type)
        
        # Postprocess
        result = process_segmentation_result(
            logits, 
            original_image, 
            original_size,
            model_type=model_type,
            input_shape=(config['input_size'], config['input_size']),
            num_classes=config.get('num_classes', 4)
        )
        
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model_id: str = Form(...),
    sample_rate: int = Form(15)  # Process every 15th frame (~2fps at 30fps input)
):
    """
    Segment video and return processed video with overlay.
    
    Args:
        file: Uploaded video file
        model_id: Model identifier
        sample_rate: Process every Nth frame (1-30, default 15 for ~15x speedup)
        
    Returns:
        Video file with segmentation overlay
    """
    try:
        # Validate sample_rate
        sample_rate = max(1, min(30, sample_rate))  # Clamp between 1 and 30
        
        # Get model
        registry = get_registry()
        session, config = registry.get_model(model_id)
        
        # Read file
        file_bytes = await file.read()
        print(f"Read {len(file_bytes)} bytes from uploaded file")
        
        # Create video with overlay
        output_path = create_video_with_overlay(
            file_bytes,
            session,
            config,
            sample_rate=sample_rate
        )
        print(f"Video created at: {output_path}")
        
        # Verify file exists and get size
        import os
        if not os.path.exists(output_path):
            raise Exception(f"Output file does not exist: {output_path}")
        file_size = os.path.getsize(output_path)
        print(f"Output file size: {file_size} bytes")
        
        # Schedule cleanup after response is sent
        background_tasks.add_task(cleanup_file, output_path)
        
        # Return video file
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename=f"segmented_{file.filename}"
        )
        
    except KeyError as e:
        print(f"KeyError: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Exception in segment_video: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/segment/video/stream")
async def segment_video_stream(
    file: UploadFile = File(...),
    model_id: str = Form(...),
    sample_rate: int = Form(15)
):
    """
    Segment video with real-time streaming of processed frames.
    
    Args:
        file: Uploaded video file
        model_id: Model identifier
        sample_rate: Process every Nth frame (1-30, default 15 for ~15x speedup)
        
    Returns:
        Server-Sent Events stream of processed frames
    """
    try:
        # Validate sample_rate
        sample_rate = max(1, min(30, sample_rate))
        
        # Get model
        registry = get_registry()
        session, config = registry.get_model(model_id)
        
        # Read file
        file_bytes = await file.read()
        print(f"Starting stream for {len(file_bytes)} bytes")
        
        async def generate():
            """Generate SSE events for each processed frame."""
            for frame_data in stream_video_segmentation(
                file_bytes,
                session,
                config,
                sample_rate=sample_rate
            ):
                # Format as Server-Sent Event
                yield f"data: {json.dumps(frame_data)}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
        
    except KeyError as e:
        print(f"KeyError: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Exception in segment_video_stream: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
