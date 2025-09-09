#!/usr/bin/env python3
"""
Simple test with minimal parameters
"""

import torch
from diffusers import StableDiffusionImg2ImgPipeline
from PIL import Image, ImageDraw

def create_simple_room():
    """Create a very simple room"""
    img = Image.new('RGB', (512, 512), color=(240, 240, 240))  # Light gray
    draw = ImageDraw.Draw(img)
    
    # Just draw a simple floor
    draw.rectangle([0, 400, 512, 512], fill=(200, 180, 160))  # Floor
    
    return img

def simple_test():
    """Simple test with basic parameters"""
    print("🧪 Simple Stable Diffusion Test")
    
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Device: {device}")
    
    # Load pipeline
    pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=torch.float16,
        safety_checker=None,
        requires_safety_checker=False
    ).to(device)
    
    # Simple input
    input_img = create_simple_room()
    input_img.save("simple_input.png")
    
    # Very simple prompt
    prompt = "room with furniture"
    
    print("Generating...")
    result = pipeline(
        prompt=prompt,
        image=input_img,
        strength=0.3,  # Very low strength
        num_inference_steps=5,  # Very few steps
        guidance_scale=5.0  # Lower guidance
    )
    
    output = result.images[0]
    output.save("simple_output.png")
    print("Done! Check simple_output.png")

if __name__ == "__main__":
    simple_test()
