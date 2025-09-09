#!/usr/bin/env python3
"""
Comprehensive diagnostic for local Stable Diffusion on M1 Mac
This will identify exactly why we're getting black/grey images
"""

import torch
import numpy as np
from PIL import Image, ImageDraw
from diffusers import StableDiffusionImg2ImgPipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_room():
    """Create a clear test room image"""
    img = Image.new('RGB', (512, 512), color=(240, 240, 240))  # Light background
    draw = ImageDraw.Draw(img)
    
    # Draw clear room elements
    draw.rectangle([0, 0, 512, 300], fill=(250, 250, 250))  # Wall
    draw.rectangle([0, 300, 512, 512], fill=(200, 180, 160))  # Floor
    draw.rectangle([200, 50, 350, 200], fill=(150, 200, 255))  # Window
    draw.rectangle([100, 250, 300, 350], fill=(100, 50, 0))  # Furniture
    
    return img

def test_pipeline_step_by_step():
    """Test each component of the pipeline"""
    print("🔍 COMPREHENSIVE STABLE DIFFUSION DIAGNOSTIC")
    print("=" * 60)
    
    # Step 1: Check device and memory
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"🖥️  Device: {device}")
    print(f"🧠 MPS Available: {torch.backends.mps.is_available()}")
    
    if device == "mps":
        print("✅ M1 GPU acceleration available")
    else:
        print("⚠️  Using CPU - will be slow")
    
    # Step 2: Load pipeline with detailed logging
    print("\n📥 Loading Stable Diffusion pipeline...")
    try:
        # Load with minimal safety restrictions
        pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if device == "mps" else torch.float32,
            safety_checker=None,
            requires_safety_checker=False,
            use_safetensors=True
        )
        print("✅ Pipeline loaded successfully")
        
        # Move to device
        pipeline = pipeline.to(device)
        print(f"✅ Pipeline moved to {device}")
        
        # Enable optimizations
        pipeline.enable_attention_slicing()
        print("✅ Attention slicing enabled")
        
    except Exception as e:
        print(f"❌ Pipeline loading failed: {e}")
        return False
    
    # Step 3: Create and test input image
    print("\n🎨 Creating test input image...")
    input_image = create_test_room()
    input_image.save("diagnostic_input.png")
    print("✅ Test input created: diagnostic_input.png")
    
    # Analyze input image
    input_array = np.array(input_image)
    print(f"📊 Input image stats:")
    print(f"   Shape: {input_array.shape}")
    print(f"   Mean: {input_array.mean():.1f}")
    print(f"   Min/Max: {input_array.min()}/{input_array.max()}")
    
    # Step 4: Test with very simple prompt
    print("\n🚀 Testing generation with simple prompt...")
    
    simple_prompts = [
        "room with furniture",
        "interior room",
        "living room",
        "modern room interior"
    ]
    
    for i, prompt in enumerate(simple_prompts):
        print(f"\n🧪 Test {i+1}: '{prompt}'")
        
        try:
            # Very conservative parameters
            with torch.no_grad():
                result = pipeline(
                    prompt=prompt,
                    image=input_image,
                    strength=0.3,  # Very low strength
                    num_inference_steps=10,  # Very few steps
                    guidance_scale=5.0,  # Low guidance
                    generator=torch.Generator(device=device).manual_seed(42)  # Fixed seed
                )
            
            if hasattr(result, 'images') and len(result.images) > 0:
                output_image = result.images[0]
                
                # Analyze output
                output_array = np.array(output_image)
                print(f"📊 Output image stats:")
                print(f"   Shape: {output_array.shape}")
                print(f"   Mean: {output_array.mean():.1f}")
                print(f"   Min/Max: {output_array.min()}/{output_array.max()}")
                
                # Save output
                output_path = f"diagnostic_output_{i+1}.png"
                output_image.save(output_path)
                print(f"💾 Saved: {output_path}")
                
                # Check if image is essentially black
                if output_array.max() < 20:
                    print("❌ Image is essentially black!")
                    print("🔍 This indicates safety filter or generation issue")
                elif output_array.mean() < 50:
                    print("⚠️  Image is very dark")
                elif np.std(output_array) < 10:
                    print("⚠️  Image has very low variation (grey/uniform)")
                else:
                    print("✅ Image appears to have content!")
                    return True  # Success!
                    
            else:
                print("❌ No images in result")
                
        except Exception as e:
            print(f"❌ Generation failed: {e}")
    
    # Step 5: Try different model
    print("\n🔄 Trying alternative approach...")
    try:
        # Try with different scheduler
        from diffusers import EulerAncestralDiscreteScheduler
        pipeline.scheduler = EulerAncestralDiscreteScheduler.from_config(pipeline.scheduler.config)
        print("✅ Switched to Euler scheduler")
        
        # Test again with new scheduler
        with torch.no_grad():
            result = pipeline(
                prompt="bright modern living room with sofa",
                image=input_image,
                strength=0.5,
                num_inference_steps=15,
                guidance_scale=6.0,
                generator=torch.Generator(device=device).manual_seed(123)
            )
        
        if hasattr(result, 'images') and len(result.images) > 0:
            output_image = result.images[0]
            output_array = np.array(output_image)
            
            print(f"📊 Alternative scheduler results:")
            print(f"   Mean: {output_array.mean():.1f}")
            print(f"   Min/Max: {output_array.min()}/{output_array.max()}")
            
            output_image.save("diagnostic_output_euler.png")
            print("💾 Saved: diagnostic_output_euler.png")
            
            if output_array.max() > 50 and np.std(output_array) > 20:
                print("✅ Alternative scheduler works better!")
                return True
                
    except Exception as e:
        print(f"❌ Alternative scheduler failed: {e}")
    
    print("\n🔍 DIAGNOSIS COMPLETE")
    print("=" * 60)
    print("Check the diagnostic_output_*.png files to see what's being generated")
    
    return False

if __name__ == "__main__":
    success = test_pipeline_step_by_step()
    
    if success:
        print("\n🎉 SUCCESS: Found working configuration!")
        print("The pipeline can generate proper images.")
    else:
        print("\n🔧 NEEDS FIXING: Local setup has issues.")
        print("Will need to adjust parameters or model configuration.")
