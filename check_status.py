#!/usr/bin/env python3
"""
Quick status checker for your Interior Design AI
"""

import requests
import time
import json

def check_status():
    """Check if the AI is ready for testing"""
    print("🔍 Checking Interior Design AI Status...")
    print("=" * 45)
    
    try:
        response = requests.get('http://127.0.0.1:3001/health', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"🌐 Server Status: {data['status']}")
            print(f"🖥️  Device: {data['device']}")
            print(f"🧠 MPS Available: {data['mps_available']}")
            print(f"🤖 Pipeline Loaded: {data['pipeline_loaded']}")
            
            if data['pipeline_loaded']:
                print("\n🎉 ✅ READY TO TEST!")
                print("Your AI is fully loaded and ready for image generation!")
                print("\nYou can now:")
                print("1. Run: python test_simple.py")
                print("2. Open ai-design.html in your browser")
                print("3. Upload photos and generate designs!")
                return True
            else:
                print("\n⏳ STILL LOADING...")
                print("The AI models are still downloading/loading.")
                print("This is normal for the first startup.")
                print("\n💡 What's happening:")
                print("- Downloading Stable Diffusion models (~4GB)")
                print("- Loading models into memory")
                print("- Optimizing for your M1 chip")
                print("\n⏱️  Estimated time remaining: 2-8 minutes")
                print("🔄 Check again in a few minutes with: python check_status.py")
                return False
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("Server might not be running. Start it with:")
        print("./start_ai.sh")
        return False
    except Exception as e:
        print(f"❌ Error checking status: {e}")
        return False

def main():
    ready = check_status()
    
    if ready:
        print("\n🚀 Quick Test Command:")
        print("python test_simple.py")
    else:
        print("\n🕐 Check again in a few minutes:")
        print("python check_status.py")

if __name__ == "__main__":
    main()
