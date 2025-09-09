#!/usr/bin/env python3
"""
Proper Model Downloader for Interior Design AI
Ensures stable-diffusion-v1-5 is downloaded correctly
"""

import os
import shutil
from pathlib import Path
import requests
from huggingface_hub import hf_hub_download, snapshot_download
from huggingface_hub.utils import HfHubHTTPError
import time

def clear_cache():
    """Clear HuggingFace cache to ensure fresh download"""
    cache_dir = Path.home() / ".cache" / "huggingface"
    if cache_dir.exists():
        print(f"🧹 Clearing cache: {cache_dir}")
        try:
            shutil.rmtree(cache_dir)
            print("✅ Cache cleared successfully")
        except Exception as e:
            print(f"⚠️ Could not clear cache: {e}")
    else:
        print("📁 No cache found to clear")

def check_internet():
    """Check internet connectivity"""
    try:
        response = requests.get("https://huggingface.co", timeout=10)
        return response.status_code == 200
    except:
        return False

def download_model_with_retry(model_id: str, max_retries: int = 3):
    """Download model with retry logic"""
    
    for attempt in range(max_retries):
        try:
            print(f"📥 Attempt {attempt + 1}/{max_retries}: Downloading {model_id}...")
            
            # Download the entire model repository
            snapshot_download(
                repo_id=model_id,
                cache_dir=None,  # Use default cache
                resume_download=True,
                local_files_only=False,
                revision="main"
            )
            
            print(f"✅ Successfully downloaded {model_id}")
            return True
            
        except HfHubHTTPError as e:
            print(f"❌ HTTP Error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 10
                print(f"⏳ Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            
        except Exception as e:
            print(f"❌ Error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 5
                print(f"⏳ Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
    
    return False

def verify_model_files(model_id: str):
    """Verify essential model files exist"""
    try:
        from diffusers import StableDiffusionImg2ImgPipeline
        
        print(f"🔍 Verifying {model_id} files...")
        
        # Try to load the pipeline (this will verify files)
        pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            model_id,
            torch_dtype=None,  # Auto-detect
            local_files_only=True  # Only use local files
        )
        
        print("✅ Model files verified successfully")
        return True
        
    except Exception as e:
        print(f"❌ Model verification failed: {e}")
        return False

def main():
    """Main download process"""
    print("🏠 Interior Design AI - Model Downloader")
    print("========================================")
    
    # Check internet
    if not check_internet():
        print("❌ No internet connection detected")
        print("Please check your internet connection and try again")
        return
    
    print("🌐 Internet connection verified")
    
    # Model to download
    model_id = "runwayml/stable-diffusion-v1-5"
    
    # Clear cache for fresh download
    clear_cache()
    
    # Download model
    print(f"\n📦 Downloading AI Model: {model_id}")
    print("⏳ This will take 10-15 minutes and download ~5GB")
    print("💡 Please be patient and keep your internet connected")
    
    success = download_model_with_retry(model_id)
    
    if success:
        print(f"\n🎉 Model download completed!")
        
        # Verify files
        if verify_model_files(model_id):
            print("\n✅ Setup Complete!")
            print("\n🚀 Next steps:")
            print("   1. Start AI server: ./start_working_ai.sh")
            print("   2. Start frontend: npm run serve-frontend")
            print("   3. Open: http://localhost:3000/ai-design.html")
        else:
            print("\n⚠️ Model downloaded but verification failed")
            print("You can try running the AI server anyway")
            
    else:
        print(f"\n❌ Failed to download {model_id}")
        print("\n🔧 Troubleshooting:")
        print("   - Check your internet connection")
        print("   - Try running this script again")
        print("   - Make sure you have enough disk space (5GB+)")

if __name__ == "__main__":
    main()
