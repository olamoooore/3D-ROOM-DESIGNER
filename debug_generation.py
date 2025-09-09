#!/usr/bin/env python3
"""
Debug script to understand what's happening with image generation
"""

import torch
from diffusers import StableDiffusionImg2ImgPipeline
from PIL import Image, ImageDraw
import numpy as np

def create_test_image():
    """Create a simple test room"""
    img = Image.new('RGB', (512, 512), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple room
    draw.rectangle([0, 0, 512, 200], fill='lightgray')  # Wall
    draw.rectangle([0, 200, 512, 512], fill='beige')    # Floor
    draw.rectangle([200, 50, 300, 150], fill='lightblue', outline='black', width=2)  # Window
    
    return img

def debug_pipeline():
    """Debug the pipeline step by step"""
    print("🔍 Debugging Stable Diffusion Pipeline")
    print("=" * 50)
    
    # Check device
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"🖥️  Device: {device}")
    
    try:
        print("📥 Loading pipeline...")
        # Load without safety checker
        pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if device == "mps" else torch.float32,
            use_safetensors=True,
            safety_checker=None,
            requires_safety_checker=False
        )
        
        pipeline = pipeline.to(device)
        print("✅ Pipeline loaded successfully")
        
        # Create test image
        print("🎨 Creating test image...")
        test_image = create_test_image()
        test_image.save("debug_input.png")
        print("📁 Test input saved as: debug_input.png")
        
        # Simple prompt
        prompt = "beautiful modern living room, interior design, furniture, sofa, coffee table"
        negative_prompt = "blurry, low quality"
        
        print(f"📝 Prompt: {prompt}")
        print("🚀 Generating image...")
        
        with torch.no_grad():
            result = pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=test_image,
                strength=0.7,
                num_inference_steps=10,  # Very few steps for quick test
                guidance_scale=7.5
            )
        
        print("✅ Generation completed!")
        
        # Check result
        if hasattr(result, 'images') and len(result.images) > 0:
            output_image = result.images[0]
            print(f"📊 Output image size: {output_image.size}")
            print(f"📊 Output image mode: {output_image.mode}")
            
            # Convert to numpy to check if it's actually black
            img_array = np.array(output_image)
            print(f"📊 Image array shape: {img_array.shape}")
            print(f"📊 Image array min/max: {img_array.min()}/{img_array.max()}")
            print(f"📊 Image array mean: {img_array.mean():.2f}")
            
            # Check if it's all black (or very dark)
            if img_array.max() < 10:
                print("❌ Image is essentially black!")
                print("🔍 This confirms the safety filter or generation issue")
            else:
                print("✅ Image has actual content!")
            
            # Save result
            output_image.save("debug_output.png")
            print("📁 Debug output saved as: debug_output.png")
            
            return True
        else:
            print("❌ No images in result")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    debug_pipeline()
