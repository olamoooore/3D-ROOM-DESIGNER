#!/usr/bin/env python3
"""
System compatibility check for Local Stable Diffusion setup
"""

import sys
import platform
import subprocess
import os

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    print(f"🐍 Python Version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major == 3 and version.minor >= 9:
        print("✅ Python version is compatible")
        return True
    else:
        print("❌ Python 3.9+ required")
        return False

def check_system():
    """Check system compatibility"""
    system = platform.system()
    machine = platform.machine()
    
    print(f"🖥️  System: {system} {machine}")
    
    if system == "Darwin" and machine == "arm64":
        print("✅ MacBook M1/M2 detected")
        return True
    elif system == "Darwin":
        print("⚠️  Intel Mac detected - will use CPU (slower)")
        return True
    else:
        print("⚠️  Non-Mac system - may need different setup")
        return True

def check_disk_space():
    """Check available disk space"""
    try:
        statvfs = os.statvfs('.')
        free_bytes = statvfs.f_frsize * statvfs.f_available
        free_gb = free_bytes / (1024**3)
        
        print(f"💾 Available Disk Space: {free_gb:.1f} GB")
        
        if free_gb >= 8:
            print("✅ Sufficient disk space")
            return True
        else:
            print("⚠️  Low disk space - need at least 8GB")
            return False
    except:
        print("❓ Could not check disk space")
        return True

def check_memory():
    """Check system memory"""
    try:
        # Try to get memory info on macOS
        result = subprocess.run(['sysctl', 'hw.memsize'], capture_output=True, text=True)
        if result.returncode == 0:
            mem_bytes = int(result.stdout.split(': ')[1])
            mem_gb = mem_bytes / (1024**3)
            
            print(f"🧠 System Memory: {mem_gb:.0f} GB")
            
            if mem_gb >= 16:
                print("✅ Excellent memory for AI generation")
            elif mem_gb >= 8:
                print("✅ Sufficient memory (may need optimization)")
            else:
                print("⚠️  Limited memory - generation may be slow")
            
            return True
    except:
        print("❓ Could not check memory")
        return True

def check_internet():
    """Check internet connectivity for model download"""
    try:
        import urllib.request
        urllib.request.urlopen('https://huggingface.co', timeout=5)
        print("🌐 Internet connection: ✅ Available")
        return True
    except:
        print("🌐 Internet connection: ❌ Not available")
        print("   You'll need internet for initial model download")
        return False

def main():
    """Run all system checks"""
    print("🔍 System Compatibility Check for Local Stable Diffusion")
    print("=" * 60)
    
    checks = [
        check_python_version(),
        check_system(),
        check_disk_space(),
        check_memory(),
        check_internet()
    ]
    
    print("\n" + "=" * 60)
    
    if all(checks):
        print("🎉 All checks passed! Your system is ready for setup.")
        print("\nNext steps:")
        print("1. Run: ./setup_mac_m1.sh")
        print("2. Run: source venv_sd/bin/activate")
        print("3. Run: python setup_models.py")
        print("4. Run: ./start_local_ai.sh")
    else:
        print("⚠️  Some checks failed, but you can still try the setup.")
        print("   The system will work around most limitations.")
    
    return 0

if __name__ == "__main__":
    exit(main())
