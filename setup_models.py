#!/usr/bin/env python3
"""
Model Setup Script for MacBook M1 Stable Diffusion
Downloads and configures models optimized for Apple Silicon
"""

import os
import torch
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
from transformers import CLIPTextModel, CLIPTokenizer
import platform

def check_mps_availability():
    """Check if MPS (Metal Performance Shaders) is available"""
    if torch.backends.mps.is_available():
        print("✅ MPS is available - Using Apple Silicon GPU acceleration")
        return "mps"
    else:
        print("⚠️  MPS not available - Using CPU (will be slower)")
        return "cpu"

def download_and_setup_models():
    """Download and setup Stable Diffusion models"""
    print("🔄 Setting up Stable Diffusion models...")
    
    # Check device
    device = check_mps_availability()
    
    # Model configuration for interior design
    model_id = "runwayml/stable-diffusion-v1-5"  # Good balance of quality and speed
    
    print(f"📥 Downloading {model_id} (this may take 5-10 minutes)...")
    
    try:
        # Load the pipeline
        pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device == "mps" else torch.float32,
            use_safetensors=True,
            variant="fp16" if device == "mps" else None
        )
        
        # Use DPM++ scheduler for better quality/speed balance
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        
        # Move to device
        pipe = pipe.to(device)
        
        # Enable memory efficient attention if available
        if hasattr(pipe, "enable_attention_slicing"):
            pipe.enable_attention_slicing()
        
        # Enable CPU offload for memory efficiency on M1
        if device == "mps":
            pipe.enable_model_cpu_offload()
        
        # Save the pipeline locally
        local_model_path = "./models/stable-diffusion/interior-design-v1-5"
        os.makedirs(local_model_path, exist_ok=True)
        pipe.save_pretrained(local_model_path)
        
        print("✅ Models downloaded and configured successfully!")
        print(f"📁 Models saved to: {local_model_path}")
        
        # Test generation to verify setup
        print("🧪 Running test generation...")
        test_prompt = "modern minimalist living room, clean lines, neutral colors"
        
        # Create a small test image
        from PIL import Image
        test_image = Image.new('RGB', (512, 512), color='white')
        
        with torch.no_grad():
            result = pipe(
                prompt=test_prompt,
                image=test_image,
                strength=0.7,
                num_inference_steps=20,
                guidance_scale=7.5
            ).images[0]
        
        # Save test result
        os.makedirs("./outputs", exist_ok=True)
        result.save("./outputs/test_generation.png")
        print("✅ Test generation successful! Check ./outputs/test_generation.png")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up models: {str(e)}")
        return False

def create_config_file():
    """Create configuration file for the API server"""
    config = {
        "model_path": "./models/stable-diffusion/interior-design-v1-5",
        "device": "mps" if torch.backends.mps.is_available() else "cpu",
        "torch_dtype": "float16" if torch.backends.mps.is_available() else "float32",
        "max_image_size": 768,  # Reduced for M1 memory constraints
        "default_steps": 20,
        "default_guidance_scale": 7.5,
        "default_strength": 0.75,
        "enable_attention_slicing": True,
        "enable_cpu_offload": True
    }
    
    import json
    with open("sd_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("✅ Configuration file created: sd_config.json")

def main():
    print("🏠 Interior Design AI - Model Setup for MacBook M1")
    print("=" * 60)
    
    # Check system
    print(f"🖥️  System: {platform.system()} {platform.machine()}")
    print(f"🐍 Python: {platform.python_version()}")
    print(f"🔥 PyTorch: {torch.__version__}")
    
    # Setup models
    success = download_and_setup_models()
    
    if success:
        create_config_file()
        print("\n🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Start the API server: python sd_api_server.py")
        print("2. Open your browser and test the interface")
        print("\n💡 Tips for M1 optimization:")
        print("- Keep image resolution at 512x512 or 768x768")
        print("- Use 15-25 inference steps for good quality/speed balance")
        print("- Monitor memory usage with Activity Monitor")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
