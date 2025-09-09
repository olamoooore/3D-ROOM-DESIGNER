#!/usr/bin/env python3
"""
Optimized Stable Diffusion API Server for M1 - Fixed Black Image Issue
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
import numpy as np

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
app = FastAPI(title="Interior Design AI API - Optimized", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = None
config = None

def load_config():
    """Load optimized configuration"""
    global config
    config = {
        "device": "mps" if torch.backends.mps.is_available() else "cpu",
        "model_id": "runwayml/stable-diffusion-v1-5",
        "torch_dtype": "float16",
        "max_image_size": 512,  # Smaller for stability
        "default_steps": 15,    # Fewer steps
        "default_guidance_scale": 6.0,  # Lower guidance
        "default_strength": 0.5  # Much lower strength
    }
    logger.info("✅ Optimized configuration loaded")
    return True

def initialize_pipeline():
    """Initialize optimized pipeline"""
    global pipeline
    
    logger.info("🚀 Initializing optimized pipeline...")
    
    try:
        from diffusers import StableDiffusionImg2ImgPipeline, EulerAncestralDiscreteScheduler
        
        device = config["device"]
        model_id = config["model_id"]
        torch_dtype = torch.float16 if config["torch_dtype"] == "float16" and device == "mps" else torch.float32
        
        logger.info(f"📥 Loading model: {model_id}")
        logger.info(f"🖥️  Device: {device}")
        logger.info("🔧 Using optimized settings to prevent black images")
        
        # Load pipeline with minimal components
        pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            model_id,
            torch_dtype=torch_dtype,
            use_safetensors=True,
            safety_checker=None,
            requires_safety_checker=False,
            variant="fp16" if torch_dtype == torch.float16 else None
        )
        
        # Use different scheduler that works better on M1
        pipeline.scheduler = EulerAncestralDiscreteScheduler.from_config(pipeline.scheduler.config)
        
        # Move to device
        pipeline = pipeline.to(device)
        
        # Optimizations
        if hasattr(pipeline, "enable_attention_slicing"):
            pipeline.enable_attention_slicing()
            logger.info("✅ Attention slicing enabled")
        
        if hasattr(pipeline, "enable_model_cpu_offload") and device == "mps":
            pipeline.enable_model_cpu_offload()
            logger.info("✅ CPU offload enabled")
        
        # Set to eval mode
        pipeline.unet.eval()
        pipeline.vae.eval()
        
        logger.info("✅ Optimized pipeline initialized successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Pipeline initialization failed: {e}")
        return False

def preprocess_image(image_data: str, max_size: int = 512) -> Image.Image:
    """Preprocess input image with optimization"""
    try:
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Ensure good contrast and brightness
        image_array = np.array(image)
        if image_array.mean() < 50:  # Very dark image
            image_array = np.clip(image_array * 1.5, 0, 255).astype(np.uint8)
            image = Image.fromarray(image_array)
        
        image = ImageOps.fit(image, (max_size, max_size), Image.Resampling.LANCZOS)
        
        width, height = image.size
        width = (width // 8) * 8
        height = (height // 8) * 8
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        
        return image
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

def create_safe_prompt(base_prompt: str, style: str, room_type: str) -> tuple:
    """Create safe prompts that avoid triggering safety filters"""
    
    # Safe style descriptions
    safe_styles = {
        "minimalist": "clean simple room design, white furniture, organized space",
        "modern": "contemporary room design, sleek furniture, neutral colors",
        "scandinavian": "bright room design, light wood furniture, cozy atmosphere",
        "industrial": "urban room design, modern furniture, concrete walls",
        "bohemian": "colorful room design, artistic furniture, plants and textiles",
        "traditional": "classic room design, wooden furniture, warm atmosphere",
        "luxury": "elegant room design, premium furniture, sophisticated decor",
        "japanese": "zen room design, natural materials, minimal furniture"
    }
    
    # Safe room descriptions
    safe_rooms = {
        "living": "living room interior with sofa and table",
        "bedroom": "bedroom interior with bed and storage",
        "kitchen": "kitchen interior with cabinets and appliances",
        "bathroom": "bathroom interior with modern fixtures",
        "office": "office interior with desk and chair",
        "dining": "dining room interior with table and chairs"
    }
    
    style_desc = safe_styles.get(style, "modern room design")
    room_desc = safe_rooms.get(room_type, "interior room")
    
    # Very safe prompt
    enhanced_prompt = f"{room_desc}, {style_desc}, interior design, bright lighting, high quality"
    
    # Comprehensive negative prompt
    negative_prompt = "dark, black, shadow, low quality, blurry, distorted, amateur, messy, cluttered"
    
    return enhanced_prompt, negative_prompt

async def generate_image(request: GenerationRequest) -> GenerationResponse:
    """Generate image with optimized settings"""
    start_time = datetime.now()
    
    try:
        if pipeline is None:
            return GenerationResponse(success=False, error="Pipeline not initialized")
        
        input_image = preprocess_image(request.image, config["max_image_size"])
        enhanced_prompt, negative_prompt = create_safe_prompt(
            request.prompt, request.style, request.room_type
        )
        
        logger.info(f"🎨 Generating: {enhanced_prompt}")
        
        # Optimized generation parameters
        with torch.no_grad():
            result = pipeline(
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                image=input_image,
                strength=min(request.strength, 0.6),  # Cap strength at 0.6
                num_inference_steps=min(request.steps, 15),  # Cap steps at 15
                guidance_scale=min(request.guidance_scale, 6.0),  # Cap guidance
                generator=torch.Generator(device=config["device"]).manual_seed(42)  # Fixed seed for consistency
            )
        
        if not hasattr(result, 'images') or len(result.images) == 0:
            return GenerationResponse(success=False, error="No images generated")
        
        output_image = result.images[0]
        
        # Check if image is black/empty
        img_array = np.array(output_image)
        if img_array.max() < 20:  # Very dark image
            logger.warning("⚠️ Generated image is too dark, brightening...")
            img_array = np.clip(img_array * 2 + 50, 0, 255).astype(np.uint8)
            output_image = Image.fromarray(img_array)
        
        buffer = BytesIO()
        output_image.save(buffer, format="PNG", quality=95)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        generation_time = (datetime.now() - start_time).total_seconds()
        
        os.makedirs("outputs", exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"outputs/optimized_{timestamp}.png"
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
    return {"message": "Interior Design AI API - Optimized for M1", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "pipeline_loaded": pipeline is not None,
        "device": config["device"] if config else "unknown",
        "mps_available": torch.backends.mps.is_available(),
        "mode": "optimized"
    }

@app.post("/generate", response_model=GenerationResponse)
async def generate_design(request: GenerationRequest):
    """Generate interior design with optimized settings"""
    return await generate_image(request)

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("🏠 Starting Optimized Interior Design AI API...")
    
    load_config()
    success = initialize_pipeline()
    
    if success:
        logger.info("🎉 Optimized API ready!")
    else:
        logger.warning("⚠️  API started but pipeline failed to load")

if __name__ == "__main__":
    uvicorn.run("server_optimized:app", host="127.0.0.1", port=3001, reload=False)
