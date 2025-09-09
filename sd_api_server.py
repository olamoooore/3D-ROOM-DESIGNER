#!/usr/bin/env python3
"""
Local Stable Diffusion API Server for Interior Design
Optimized for MacBook M1 with MPS support
"""

import os
import json
import base64
import asyncio
import logging
from typing import Optional, Dict, Any
from io import BytesIO
from datetime import datetime

import torch
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from PIL import Image, ImageOps
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class GenerationRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded input image")
    prompt: str = Field(..., description="Text prompt for generation")
    style: Optional[str] = Field("modern", description="Interior design style")
    room_type: Optional[str] = Field("living", description="Type of room")
    strength: Optional[float] = Field(0.75, ge=0.1, le=1.0, description="Generation strength")
    steps: Optional[int] = Field(20, ge=10, le=50, description="Number of inference steps")
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0, description="Guidance scale")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")

class GenerationResponse(BaseModel):
    success: bool
    result: Optional[str] = None  # Base64 encoded result image
    error: Optional[str] = None
    generation_time: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

# Global variables
app = FastAPI(
    title="Interior Design AI API",
    description="Local Stable Diffusion API for interior design image generation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline variable
pipeline = None
config = None

def load_config():
    """Load configuration from JSON file"""
    global config
    try:
        with open("sd_config.json", "r") as f:
            config = json.load(f)
        logger.info("✅ Configuration loaded successfully")
        return config
    except Exception as e:
        logger.error(f"❌ Failed to load configuration: {e}")
        # Default configuration
        config = {
            "model_path": "./models/stable-diffusion/interior-design-v1-5",
            "device": "mps" if torch.backends.mps.is_available() else "cpu",
            "torch_dtype": "float16",
            "max_image_size": 768,
            "default_steps": 20,
            "default_guidance_scale": 7.5,
            "default_strength": 0.75,
            "enable_attention_slicing": True,
            "enable_cpu_offload": True
        }
        return config

def initialize_pipeline():
    """Initialize the Stable Diffusion pipeline"""
    global pipeline, config
    
    logger.info("🚀 Initializing Stable Diffusion pipeline...")
    
    try:
        # Determine device and dtype
        device = config["device"]
        torch_dtype = torch.float16 if config["torch_dtype"] == "float16" else torch.float32
        
        # Load pipeline
        model_path = config["model_path"]
        if os.path.exists(model_path):
            logger.info(f"📁 Loading local model from {model_path}")
            pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                model_path,
                torch_dtype=torch_dtype,
                use_safetensors=True,
                local_files_only=True
            )
        else:
            logger.info("📥 Loading model from Hugging Face...")
            pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                "runwayml/stable-diffusion-v1-5",
                torch_dtype=torch_dtype,
                use_safetensors=True,
                variant="fp16" if torch_dtype == torch.float16 else None
            )
        
        # Configure scheduler
        pipeline.scheduler = DPMSolverMultistepScheduler.from_config(pipeline.scheduler.config)
        
        # Move to device
        pipeline = pipeline.to(device)
        
        # Memory optimizations
        if config.get("enable_attention_slicing", True):
            pipeline.enable_attention_slicing()
        
        if config.get("enable_cpu_offload", True) and device == "mps":
            pipeline.enable_model_cpu_offload()
        
        logger.info(f"✅ Pipeline initialized successfully on {device}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize pipeline: {e}")
        return False

def preprocess_image(image_data: str, max_size: int = 768) -> Image.Image:
    """Preprocess input image for Stable Diffusion"""
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to optimal size while maintaining aspect ratio
        image = ImageOps.fit(image, (max_size, max_size), Image.Resampling.LANCZOS)
        
        # Ensure dimensions are divisible by 8 (required by Stable Diffusion)
        width, height = image.size
        width = (width // 8) * 8
        height = (height // 8) * 8
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        
        return image
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

def create_enhanced_prompt(base_prompt: str, style: str, room_type: str) -> str:
    """Create an enhanced prompt for better interior design results"""
    
    style_prompts = {
        "minimalist": "minimalist design, clean lines, neutral colors, uncluttered, simple furniture",
        "modern": "modern contemporary design, sleek furniture, sophisticated color palette, geometric shapes",
        "scandinavian": "Scandinavian design, light wood, cozy textiles, natural light, hygge atmosphere",
        "industrial": "industrial design, exposed materials, metal fixtures, concrete, urban aesthetics",
        "bohemian": "bohemian design, colorful textiles, plants, eclectic decorative elements, artistic",
        "traditional": "traditional design, classic furniture, warm colors, timeless elegance, ornate details",
        "luxury": "luxury design, high-end furniture, rich textures, opulent details, expensive materials",
        "japanese": "Japanese minimalist design, natural materials, zen-inspired simplicity, tatami, shoji"
    }
    
    room_descriptors = {
        "living": "living room with comfortable seating, coffee table, entertainment area",
        "bedroom": "bedroom with bed, nightstands, wardrobe, peaceful atmosphere",
        "kitchen": "kitchen with cabinets, countertops, appliances, functional layout",
        "bathroom": "bathroom with modern fixtures, tiles, mirror, clean design",
        "office": "home office with desk, chair, storage, productive workspace",
        "dining": "dining room with table, chairs, elegant dining setup"
    }
    
    style_desc = style_prompts.get(style, "modern design")
    room_desc = room_descriptors.get(room_type, "interior space")
    
    enhanced_prompt = f"{base_prompt}, {room_desc}, {style_desc}, professional interior design photography, high quality, 8k resolution, perfect lighting, detailed textures"
    
    negative_prompt = "blurry, low quality, distorted, amateur, cluttered, messy, dark, poor lighting, oversaturated"
    
    return enhanced_prompt, negative_prompt

async def generate_image(request: GenerationRequest) -> GenerationResponse:
    """Generate interior design image using Stable Diffusion"""
    start_time = datetime.now()
    
    try:
        # Preprocess input image
        input_image = preprocess_image(request.image, config["max_image_size"])
        
        # Create enhanced prompt
        enhanced_prompt, negative_prompt = create_enhanced_prompt(
            request.prompt, request.style, request.room_type
        )
        
        # Set random seed if provided
        if request.seed:
            torch.manual_seed(request.seed)
        
        # Generate image
        with torch.no_grad():
            result = pipeline(
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                image=input_image,
                strength=request.strength,
                num_inference_steps=request.steps,
                guidance_scale=request.guidance_scale,
                generator=torch.Generator(device=config["device"]).manual_seed(request.seed) if request.seed else None
            )
        
        # Convert result to base64
        output_image = result.images[0]
        buffer = BytesIO()
        output_image.save(buffer, format="PNG", quality=95)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Calculate generation time
        generation_time = (datetime.now() - start_time).total_seconds()
        
        # Save output (optional)
        if not os.path.exists("outputs"):
            os.makedirs("outputs")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"outputs/generated_{timestamp}.png"
        output_image.save(output_path)
        
        return GenerationResponse(
            success=True,
            result=f"data:image/png;base64,{image_base64}",
            generation_time=generation_time,
            metadata={
                "prompt": enhanced_prompt,
                "style": request.style,
                "room_type": request.room_type,
                "steps": request.steps,
                "guidance_scale": request.guidance_scale,
                "strength": request.strength,
                "seed": request.seed,
                "output_path": output_path
            }
        )
        
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        return GenerationResponse(
            success=False,
            error=str(e)
        )

# API Routes
@app.get("/")
async def root():
    return {"message": "Interior Design AI API", "status": "running", "device": config["device"]}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "pipeline_loaded": pipeline is not None,
        "device": config["device"],
        "mps_available": torch.backends.mps.is_available()
    }

@app.post("/generate", response_model=GenerationResponse)
async def generate_design(request: GenerationRequest):
    """Generate interior design from uploaded image"""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    return await generate_image(request)

@app.post("/generate-form")
async def generate_design_form(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    style: str = Form("modern"),
    room_type: str = Form("living"),
    strength: float = Form(0.75),
    steps: int = Form(20),
    guidance_scale: float = Form(7.5),
    seed: Optional[int] = Form(None)
):
    """Generate interior design from form upload"""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    # Read and encode image
    image_bytes = await image.read()
    image_base64 = base64.b64encode(image_bytes).decode()
    
    # Create request
    request = GenerationRequest(
        image=image_base64,
        prompt=prompt,
        style=style,
        room_type=room_type,
        strength=strength,
        steps=steps,
        guidance_scale=guidance_scale,
        seed=seed
    )
    
    return await generate_image(request)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("🏠 Starting Interior Design AI API...")
    
    # Load configuration
    load_config()
    
    # Initialize pipeline
    success = initialize_pipeline()
    if not success:
        logger.error("❌ Failed to initialize pipeline. Server will not work properly.")
    else:
        logger.info("✅ API server ready!")

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "sd_api_server:app",
        host="127.0.0.1",
        port=3001,
        reload=False,  # Disable reload to prevent memory issues
        log_level="info"
    )
