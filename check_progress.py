#!/usr/bin/env python3
"""
Real-time progress checker for Interior Design AI
Shows download percentage and loading status
"""

import requests
import time
import sys

def show_progress_bar(percentage, width=40):
    """Show a visual progress bar"""
    filled = int(width * percentage / 100)
    bar = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {percentage:.1f}%"

def check_progress():
    """Check and display current progress"""
    try:
        response = requests.get('http://127.0.0.1:3001/health', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            progress_info = data.get('loading_progress', {})
            
            print(f"\r🔍 Status: {data['status']}")
            print(f"🖥️  Device: {data['device']}")
            print(f"🧠 MPS: {data['mps_available']}")
            print(f"🤖 Pipeline: {'✅ Loaded' if data['pipeline_loaded'] else '⏳ Loading'}")
            
            if progress_info:
                status = progress_info.get('status', 'unknown')
                progress = progress_info.get('progress', 0)
                message = progress_info.get('message', '')
                
                if status == "loading":
                    print(f"\n📥 {message}")
                    print(f"📊 Progress: {show_progress_bar(progress)}")
                    print(f"⏱️  Estimated time: {max(1, int((100-progress)/10))} minutes remaining")
                elif status == "complete":
                    print(f"\n🎉 ✅ READY TO TEST!")
                    print(f"✨ {message}")
                    return True
                elif status == "error":
                    print(f"\n❌ Error: {message}")
                    return False
                else:
                    print(f"\n⏳ Preparing to download models...")
            
            return data['pipeline_loaded']
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("Start the server with: python server_with_progress.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def monitor_progress():
    """Monitor progress in real-time"""
    print("🏠 Interior Design AI - Progress Monitor")
    print("=" * 50)
    
    ready = False
    while not ready:
        # Clear screen (works on most terminals)
        print("\033[2J\033[H", end="")
        
        print("🏠 Interior Design AI - Progress Monitor")
        print("=" * 50)
        
        ready = check_progress()
        
        if ready:
            print("\n🚀 Your AI is ready! You can now:")
            print("1. Run: python test_simple.py")
            print("2. Open ai-design.html in your browser")
            print("3. Upload photos and generate designs!")
            break
        
        print(f"\n🔄 Refreshing in 10 seconds... (Press Ctrl+C to exit)")
        
        try:
            time.sleep(10)
        except KeyboardInterrupt:
            print("\n\n👋 Monitoring stopped. Check progress anytime with:")
            print("python check_progress.py")
            break

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--monitor":
        monitor_progress()
    else:
        print("🏠 Interior Design AI - Status Check")
        print("=" * 45)
        ready = check_progress()
        
        if ready:
            print("\n🚀 Quick Test Command:")
            print("python test_simple.py")
        else:
            print("\n🔄 For real-time monitoring, run:")
            print("python check_progress.py --monitor")
            print("\nOr check again in a few minutes:")
            print("python check_progress.py")

if __name__ == "__main__":
    main()
