"""
Model registry for loading and managing ONNX models.
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple
import onnxruntime as ort


class ModelRegistry:
    """Manages ONNX model loading and inference sessions."""
    
    def __init__(self, config_path: str):
        """
        Initialize model registry.
        
        Args:
            config_path: Path to models.json configuration file
        """
        self.config_path = config_path
        self.models_config: List[Dict] = []
        self.sessions: Dict[str, ort.InferenceSession] = {}
        self.base_dir = Path(config_path).parent.parent
        
    def load_registry(self) -> None:
        """Load model configurations from JSON file."""
        with open(self.config_path, 'r') as f:
            data = json.load(f)
            self.models_config = data['models']
            
    def initialize_models(self) -> None:
        """Initialize ONNX Runtime sessions for all models."""
        for model_config in self.models_config:
            model_id = model_config['id']
            onnx_path = self.base_dir / model_config['onnx_path']
            
            # Check if ONNX file exists
            if not onnx_path.exists():
                print(f"Warning: Model file not found: {onnx_path}")
                print(f"Skipping model: {model_id}")
                continue
            
            # Create ONNX Runtime session
            try:
                session = ort.InferenceSession(
                    str(onnx_path),
                    providers=['CPUExecutionProvider']
                )
                self.sessions[model_id] = session
                print(f"✓ Loaded model: {model_id}")
            except Exception as e:
                print(f"Error loading model {model_id}: {e}")
                
    def get_model(self, model_id: str) -> Tuple[ort.InferenceSession, Dict]:
        """
        Get ONNX session and config for a specific model.
        
        Args:
            model_id: Model identifier
            
        Returns:
            Tuple of (InferenceSession, model_config)
            
        Raises:
            KeyError: If model not found
        """
        if model_id not in self.sessions:
            raise KeyError(f"Model '{model_id}' not found or not loaded")
            
        # Find config
        config = next(
            (m for m in self.models_config if m['id'] == model_id),
            None
        )
        
        return self.sessions[model_id], config
    
    def get_available_models(self) -> List[Dict]:
        """
        Get list of available (loaded) models.
        
        Returns:
            List of model info dicts with id, name, description
        """
        available = []
        for model in self.models_config:
            if model['id'] in self.sessions:
                available.append({
                    'id': model['id'],
                    'name': model['name'],
                    'description': model['description']
                })
        return available


# Global registry instance
_registry = None


def get_registry() -> ModelRegistry:
    """Get the global model registry instance."""
    global _registry
    if _registry is None:
        raise RuntimeError("Model registry not initialized")
    return _registry


def initialize_registry(config_path: str) -> ModelRegistry:
    """Initialize the global model registry."""
    global _registry
    _registry = ModelRegistry(config_path)
    _registry.load_registry()
    _registry.initialize_models()
    return _registry
