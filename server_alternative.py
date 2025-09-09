#!/usr/bin/env python3
"""
Alternative Stable Diffusion API Server using a different model
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

def load_config():
    """Load configuration"""
    global config
    config = {
        "device": "mps" if torch.backends.mps.is_available() else "cpu",
        "model_id": "stabilityai/stable-diffusion-2-1",  # Different model without safety issues
        "torch_dtype": "float16",
        "max_image_size": 512,  # Smaller size for stability
        "default_steps": 15,    # Fewer steps for faster generation
        "default_guidance_scale": 7.5,
        "default_strength": 0.7
    }
    logger.info("✅ Configuration loaded")
    return True

def initialize_pipeline():
    """Initialize Stable Diffusion pipeline with alternative model"""
    global pipeline
    
    logger.info("🚀 Initializing alternative pipeline...")
    
    try:
        from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
        
        device = config["device"]
        model_id = config["model_id"]
        torch_dtype = torch.float16 if config["torch_dtype"] == "float16" and device == "mps" else torch.float32
        
        logger.info(f"📥 Loading model: {model_id}")
        logger.info(f"🖥️  Device: {device}")
        logger.info("🔓 Using alternative model without safety issues")
        
        # Load pipeline with the alternative model
        pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            model_id,
            torch_dtype=torch_dtype,
            use_safetensors=True
        )
        
        # Use better scheduler
        pipeline.scheduler = DPMSolverMultistepScheduler.from_config(pipeline.scheduler.config)
        
        # Move to device
        pipeline = pipeline.to(device)
        
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
        
        logger.info("✅ Alternative pipeline initialized successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Pipeline initialization failed: {e}")
        return False

def preprocess_image(image_data: str, max_size: int = 512) -> Image.Image:
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

def create_enhanced_prompt(base_prompt: str, style: str, room_type: str) -> str:
    """Create enhanced prompt for better results"""
    
    style_descriptions = {
        "minimalist": "clean minimalist interior design, white walls, simple furniture, uncluttered space",
        "modern": "modern interior design, contemporary furniture, sleek lines, neutral colors",
        "scandinavian": "scandinavian interior design, light wood, cozy textiles, hygge style",
        "industrial": "industrial interior design, exposed brick, metal fixtures, concrete floors",
        "bohemian": "bohemian interior design, colorful textiles, plants, artistic decor",
        "traditional": "traditional interior design, classic furniture, warm colors, elegant",
        "luxury": "luxury interior design, high-end furniture, marble, gold accents, expensive",
        "japanese": "japanese interior design, natural materials, zen style, bamboo, tatami"
    }
    
    room_descriptions = {
        "living": "living room with comfortable seating area",
        "bedroom": "bedroom with bed and nightstands",
        "kitchen": "kitchen with modern appliances",
        "bathroom": "bathroom with clean fixtures",
        "office": "home office workspace",
        "dining": "dining room with table and chairs"
    }
    
    style_desc = style_descriptions.get(style, "modern interior design")
    room_desc = room_descriptions.get(room_type, "interior room")
    
    # Create a comprehensive prompt
    enhanced_prompt = f"beautiful {room_desc}, {style_desc}, professional interior design photography, high quality, well lit, detailed, realistic, architectural photography"
    
    return enhanced_prompt

async def generate_image(request: GenerationRequest) -> GenerationResponse:
    """Generate image using Stable Diffusion"""
    start_time = datetime.now()
    
    try:
        if pipeline is None:
            return GenerationResponse(success=False, error="Pipeline not initialized")
        
        input_image = preprocess_image(request.image, config["max_image_size"])
        enhanced_prompt = create_enhanced_prompt(request.prompt, request.style, request.room_type)
        
        # Negative prompt to avoid unwanted content
        negative_prompt = "blurry, low quality, distorted, cluttered, messy, dark, amateur, cartoon"
        
        logger.info(f"🎨 Generating: {enhanced_prompt[:80]}...")
        
        with torch.no_grad():
            result = pipeline(
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                image=input_image,
                strength=request.strength,
                num_inference_steps=request.steps,
                guidance_scale=request.guidance_scale
            )
        
        # Get the result image
        if hasattr(result, 'images') and len(result.images) > 0:
            output_image = result.images[0]
        else:
            return GenerationResponse(success=False, error="No image generated")
        
        # Convert to base64
        buffer = BytesIO()
        output_image.save(buffer, format="PNG", quality=95)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        generation_time = (datetime.now() - start_time).total_seconds()
        
        # Save output
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
    return {"message": "Interior Design AI API - Alternative Model", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "pipeline_loaded": pipeline is not None,
        "device": config["device"] if config else "unknown",
        "mps_available": torch.backends.mps.is_available(),
        "model": config["model_id"] if config else "unknown"
    }

@app.post("/generate", response_model=GenerationResponse)
async def generate_design(request: GenerationRequest):
    """Generate interior design"""
    return await generate_image(request)

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("🏠 Starting Interior Design AI API (Alternative Model)...")
    
    load_config()
    success = initialize_pipeline()
    
    if success:
        logger.info("🎉 API ready!")
    else:
        logger.warning("⚠️  API started but pipeline failed to load")

if __name__ == "__main__":
    uvicorn.run("server_alternative:app", host="127.0.0.1", port=3001, reload=False)
