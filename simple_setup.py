#!/usr/bin/env python3
"""
Simple setup script that creates a working Stable Diffusion environment
without complex version conflicts
"""

import os
import sys
import json
import platform
import subprocess

def install_packages():
    """Install packages using pip with latest versions"""
    packages = [
        "torch",
        "torchvision", 
        "diffusers",
        "transformers",
        "accelerate",
        "Pillow",
        "numpy",
        "fastapi",
        "uvicorn[standard]",
        "python-multipart",
        "aiofiles",
        "pydantic",
        "python-dotenv",
        "requests"
    ]
    
    print("📦 Installing packages with latest compatible versions...")
    for package in packages:
        try:
            print(f"   Installing {package}...")
            subprocess.run([sys.executable, "-m", "pip", "install", package], 
                         check=True, capture_output=True)
            print(f"   ✅ {package} installed")
        except subprocess.CalledProcessError as e:
            print(f"   ⚠️  {package} installation had issues, continuing...")
            continue

def create_simple_config():
    """Create a simple configuration"""
    device = "mps" if platform.machine() == "arm64" else "cpu"
    
    config = {
        "device": device,
        "model_id": "runwayml/stable-diffusion-v1-5",
        "torch_dtype": "float16" if device == "mps" else "float32",
        "max_image_size": 768,
        "default_steps": 20,
        "default_guidance_scale": 7.5,
        "default_strength": 0.75
    }
    
    with open("sd_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("✅ Configuration created: sd_config.json")

def main():
    print("🏠 Simple Interior Design AI Setup")
    print("=" * 40)
    
    # Install packages
    install_packages()
    
    # Create config
    create_simple_config()
    
    print("\n✅ Basic setup complete!")
    print("\nNext step: Start the server with:")
    print("python simple_server.py")
    
    return 0

if __name__ == "__main__":
    exit(main())
