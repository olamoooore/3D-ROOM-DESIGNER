# 🚀 Quick Start Guide - Local Interior Design AI

## Step-by-Step Setup (10 minutes)

### 1. Install Dependencies
```bash
# Run the automated setup
./setup_mac_m1.sh
```

### 2. Download AI Models (First time only)
```bash
# Activate environment and download models
source venv_sd/bin/activate
python setup_models.py
```

### 3. Start the AI Server
```bash
# Easy way - use the launcher script
./start_local_ai.sh

# Or manually
source venv_sd/bin/activate
python sd_api_server.py
```

### 4. Test Everything Works
```bash
# Run the test script
python test_local_api.py
```

### 5. Use Your AI Designer
Open `ai-design.html` in your browser and start designing!

## 🎯 What You'll Get

✅ **Completely Local AI** - No internet needed after setup  
✅ **No API Costs** - Unlimited generations  
✅ **Private & Secure** - Images never leave your Mac  
✅ **Fast Generation** - 20-30 seconds on M1  
✅ **Professional Quality** - High-resolution results  

## 🔧 If Something Goes Wrong

**Models not downloading?**
```bash
# Check internet connection and try again
rm -rf models/
python setup_models.py
```

**Server won't start?**
```bash
# Check Python version (needs 3.9+)
python3 --version

# Reinstall dependencies
pip install -r requirements.txt
```

**Generation fails?**
```bash
# Check memory usage in Activity Monitor
# Reduce image size in sd_config.json if needed
```

## 📞 Need Help?
1. Check `LOCAL_AI_SETUP.md` for detailed troubleshooting
2. Run `python test_local_api.py` to diagnose issues
3. Look at server logs in the terminal

Your local AI interior designer is ready! 🏡✨
