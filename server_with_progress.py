#!/usr/bin/env python3
"""
Enhanced Stable Diffusion API Server with Download Progress
"""

import os
import json
import base64
import logging
from typing import Optional
from io import BytesIO
from datetime import datetime

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageOps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class GenerationRequest(BaseModel):
    image: str
    prompt: str
    style: Optional[str] = "modern"
    room_type: Optional[str] = "living"
    strength: Optional[float] = 0.75
    steps: Optional[int] = 20
    guidance_scale: Optional[float] = 7.5

class GenerationResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    generation_time: Optional[float] = None

# Global variables
app = FastAPI(title="Interior Design AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = None
config = None
loading_progress = {"status": "not_started", "progress": 0, "message": ""}

def load_config():
    """Load configuration"""
    global config
    config = {
        "device": "mps" if torch.backends.mps.is_available() else "cpu",
        "model_id": "runwayml/stable-diffusion-v1-5",
        "torch_dtype": "float16",
        "max_image_size": 768,
        "default_steps": 20,
        "default_guidance_scale": 7.5,
        "default_strength": 0.75
    }
    logger.info("✅ Configuration loaded")
    return True

class ProgressCallback:
    """Custom progress callback for model downloads"""
    def __init__(self):
        self.total_files = 0
        self.downloaded_files = 0
        
    def __call__(self, downloaded_bytes, total_bytes):
        if total_bytes > 0:
            progress = (downloaded_bytes / total_bytes) * 100
            loading_progress["progress"] = min(progress, 100)
            loading_progress["message"] = f"Downloading models: {progress:.1f}%"
            logger.info(f"📥 Download progress: {progress:.1f}%")

def initialize_pipeline():
    """Initialize Stable Diffusion pipeline with progress tracking"""
    global pipeline, loading_progress
    
    logger.info("🚀 Initializing pipeline...")
    loading_progress["status"] = "loading"
    loading_progress["progress"] = 0
    loading_progress["message"] = "Starting model download..."
    
    try:
        from diffusers import StableDiffusionImg2ImgPipeline
        
        device = config["device"]
        model_id = config["model_id"]
        torch_dtype = torch.float16 if config["torch_dtype"] == "float16" and device == "mps" else torch.float32
        
        logger.info(f"📥 Loading model: {model_id}")
        logger.info(f"🖥️  Device: {device}")
        
        loading_progress["message"] = "Downloading Stable Diffusion models..."
        loading_progress["progress"] = 10
        
        # Load pipeline (this will download models if not cached)
        pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            model_id,
            torch_dtype=torch_dtype,
            use_safetensors=True,
            variant="fp16" if torch_dtype == torch.float16 else None
        )
        
        loading_progress["progress"] = 70
        loading_progress["message"] = "Loading models into memory..."
        
        # Move to device
        pipeline = pipeline.to(device)
        
        loading_progress["progress"] = 85
        loading_progress["message"] = "Applying optimizations..."
        
        # Enable optimizations
        try:
            if hasattr(pipeline, "enable_attention_slicing"):
                pipeline.enable_attention_slicing()
                logger.info("✅ Attention slicing enabled")
        except Exception as e:
            logger.warning(f"⚠️  Attention slicing failed: {e}")
        
        try:
            if hasattr(pipeline, "enable_model_cpu_offload") and device == "mps":
                pipeline.enable_model_cpu_offload()
                logger.info("✅ CPU offload enabled")
        except Exception as e:
            logger.warning(f"⚠️  CPU offload failed: {e}")
        
        loading_progress["status"] = "complete"
        loading_progress["progress"] = 100
        loading_progress["message"] = "Pipeline ready!"
        
        logger.info("✅ Pipeline initialized successfully!")
        return True
        
    except Exception as e:
        loading_progress["status"] = "error"
        loading_progress["message"] = f"Error: {str(e)}"
        logger.error(f"❌ Pipeline initialization failed: {e}")
        return False

def preprocess_image(image_data: str, max_size: int = 768) -> Image.Image:
    """Preprocess input image"""
    try:
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image = ImageOps.fit(image, (max_size, max_size), Image.Resampling.LANCZOS)
        
        width, height = image.size
        width = (width // 8) * 8
        height = (height // 8) * 8
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        
        return image
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

def create_prompt(base_prompt: str, style: str, room_type: str) -> tuple:
    """Create enhanced prompt"""
    style_prompts = {
        "minimalist": "minimalist design, clean lines, neutral colors",
        "modern": "modern contemporary design, sleek furniture",
        "scandinavian": "Scandinavian design, light wood, cozy textiles",
        "industrial": "industrial design, exposed materials, metal fixtures",
        "bohemian": "bohemian design, colorful textiles, plants",
        "traditional": "traditional design, classic furniture, warm colors",
        "luxury": "luxury design, high-end furniture, rich textures",
        "japanese": "Japanese minimalist design, natural materials"
    }
    
    room_types = {
        "living": "living room",
        "bedroom": "bedroom", 
        "kitchen": "kitchen",
        "bathroom": "bathroom",
        "office": "home office",
        "dining": "dining room"
    }
    
    style_desc = style_prompts.get(style, "modern design")
    room_desc = room_types.get(room_type, "interior space")
    
    enhanced_prompt = f"{base_prompt}, {room_desc}, {style_desc}, professional interior design, high quality"
    negative_prompt = "blurry, low quality, distorted, cluttered, messy"
    
    return enhanced_prompt, negative_prompt

async def generate_image(request: GenerationRequest) -> GenerationResponse:
    """Generate image using Stable Diffusion"""
    start_time = datetime.now()
    
    try:
        if pipeline is None:
            return GenerationResponse(success=False, error="Pipeline not initialized")
        
        input_image = preprocess_image(request.image, config["max_image_size"])
        enhanced_prompt, negative_prompt = create_prompt(
            request.prompt, request.style, request.room_type
        )
        
        logger.info(f"🎨 Generating with prompt: {enhanced_prompt[:100]}...")
        
        with torch.no_grad():
            result = pipeline(
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                image=input_image,
                strength=request.strength,
                num_inference_steps=request.steps,
                guidance_scale=request.guidance_scale
            )
        
        output_image = result.images[0]
        buffer = BytesIO()
        output_image.save(buffer, format="PNG", quality=95)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        generation_time = (datetime.now() - start_time).total_seconds()
        
        os.makedirs("outputs", exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"outputs/generated_{timestamp}.png"
        output_image.save(output_path)
        
        logger.info(f"✅ Generated in {generation_time:.1f}s, saved to {output_path}")
        
        return GenerationResponse(
            success=True,
            result=f"data:image/png;base64,{image_base64}",
            generation_time=generation_time
        )
        
    except Exception as e:
        logger.error(f"❌ Generation failed: {str(e)}")
        return GenerationResponse(success=False, error=str(e))

# API Routes
@app.get("/")
async def root():
    return {"message": "Interior Design AI API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "pipeline_loaded": pipeline is not None,
        "device": config["device"] if config else "unknown",
        "mps_available": torch.backends.mps.is_available(),
        "loading_progress": loading_progress
    }

@app.get("/progress")
async def get_progress():
    """Get current loading progress"""
    return loading_progress

@app.post("/generate", response_model=GenerationResponse)
async def generate_design(request: GenerationRequest):
    """Generate interior design"""
    return await generate_image(request)

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("🏠 Starting Interior Design AI API...")
    
    load_config()
    success = initialize_pipeline()
    
    if success:
        logger.info("🎉 API ready!")
    else:
        logger.warning("⚠️  API started but pipeline failed to load")

if __name__ == "__main__":
    uvicorn.run("server_with_progress:app", host="127.0.0.1", port=3001, reload=False)
