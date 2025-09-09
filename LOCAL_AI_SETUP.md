# 🏠 Local Interior Design AI Generator

A complete local setup for running Stable Diffusion interior design generation on your MacBook M1, optimized for Apple Silicon.

## 🚀 Quick Start

### 1. Environment Setup (5 minutes)

```bash
# Make setup script executable and run it
chmod +x setup_mac_m1.sh
./setup_mac_m1.sh
```

### 2. Activate Environment

```bash
# Activate the Python virtual environment
source venv_sd/bin/activate
```

### 3. Download and Setup Models (First time only - ~10 minutes)

```bash
# Download Stable Diffusion models (will download ~4GB)
python setup_models.py
```

### 4. Start the Local AI Server

```bash
# Start the FastAPI server
python sd_api_server.py
```

You should see:
```
🏠 Starting Interior Design AI API...
✅ Pipeline initialized successfully on mps
✅ API server ready!
INFO:     Uvicorn running on http://127.0.0.1:3001
```

### 5. Open Your Interface

Open your browser and go to:
- **Main Interface**: `file:///path/to/your/project/ai-design.html`
- **Or use the existing Next.js app**: `http://localhost:3000`

## 📋 System Requirements

- **MacBook with M1/M2 chip** (16GB RAM recommended)
- **Python 3.9+** (install via `brew install python@3.11`)
- **~8GB free disk space** (for models and dependencies)
- **Good internet connection** (for initial model download)

## 🎯 How It Works

1. **Upload a room photo** (empty or furnished)
2. **Select room type** (living room, bedroom, kitchen, etc.)
3. **Choose design style** (modern, scandinavian, luxury, etc.)
4. **Click "Generate Design"** and wait 15-30 seconds
5. **Download or view** your AI-redesigned room!

## ⚙️ Configuration

The system automatically creates `sd_config.json` with optimal M1 settings:

```json
{
  "device": "mps",
  "torch_dtype": "float16",
  "max_image_size": 768,
  "default_steps": 20,
  "enable_attention_slicing": true,
  "enable_cpu_offload": true
}
```

### Performance Tuning

**For 16GB M1 MacBook:**
- Image size: 768x768 (default)
- Inference steps: 20 (good quality/speed balance)
- Strength: 0.75 (good transformation while keeping structure)

**For 8GB M1 MacBook:**
- Reduce `max_image_size` to 512
- Use fewer inference steps (15)
- Enable more aggressive CPU offloading

## 🔧 API Endpoints

### Generate Design
```bash
POST http://127.0.0.1:3001/generate

{
  "image": "base64_encoded_image",
  "prompt": "Transform this living room...",
  "style": "modern",
  "room_type": "living",
  "strength": 0.75,
  "steps": 20,
  "guidance_scale": 7.5
}
```

### Health Check
```bash
GET http://127.0.0.1:3001/health
```

## 🎨 Supported Styles

- **Minimalist**: Clean lines, neutral colors, uncluttered
- **Modern**: Sleek furniture, sophisticated palette
- **Scandinavian**: Light wood, cozy textiles, natural light
- **Industrial**: Exposed materials, metal fixtures
- **Bohemian**: Colorful textiles, plants, eclectic elements
- **Traditional**: Classic furniture, warm colors
- **Luxury**: High-end furniture, rich textures
- **Japanese**: Natural materials, zen simplicity

## 🛠️ Troubleshooting

### "Pipeline not initialized" Error
```bash
# Check if models are downloaded
ls -la models/stable-diffusion/

# Re-run model setup if empty
python setup_models.py
```

### Memory Issues (Generation Fails)
```bash
# Monitor memory usage
Activity Monitor > Memory tab

# Reduce image size in sd_config.json:
"max_image_size": 512
```

### Slow Generation (>60 seconds)
```bash
# Check MPS availability
python -c "import torch; print('MPS available:', torch.backends.mps.is_available())"

# Reduce inference steps:
"default_steps": 15
```

### API Connection Failed
```bash
# Check if server is running
curl http://127.0.0.1:3001/health

# Restart server
python sd_api_server.py
```

## 📊 Performance Expectations

**M1 MacBook (16GB RAM):**
- First generation: ~45 seconds (model loading)
- Subsequent generations: ~20-30 seconds
- Memory usage: ~4-6GB
- Image quality: High (768x768)

**M1 MacBook (8GB RAM):**
- Generation time: ~30-45 seconds
- Memory usage: ~3-4GB
- Image quality: Good (512x512)

## 🔄 Updates and Maintenance

### Update Models
```bash
# Delete old models and re-download
rm -rf models/stable-diffusion/
python setup_models.py
```

### Update Dependencies
```bash
source venv_sd/bin/activate
pip install -r requirements.txt --upgrade
```

## 💡 Tips for Best Results

1. **Use clear, well-lit photos** taken straight-on
2. **Empty or sparsely furnished rooms** work better
3. **Higher strength values** (0.7-0.9) for more dramatic changes
4. **Lower strength values** (0.3-0.6) for subtle improvements
5. **Experiment with different styles** for the same room

## 🚀 Scaling to Production

This setup can be extended to a **paid API service**:

1. **Deploy on cloud GPU** (AWS/GCP with NVIDIA GPUs)
2. **Add user authentication** and billing
3. **Implement queue system** for multiple requests
4. **Add more models** (ControlNet, SDXL, etc.)
5. **Create mobile app** using the same API

## 📝 File Structure

```
AR-PROJECT-ROOM-DESIGNER/
├── setup_mac_m1.sh          # Environment setup script
├── setup_models.py          # Model download and configuration
├── sd_api_server.py         # FastAPI server with Stable Diffusion
├── requirements.txt         # Python dependencies
├── sd_config.json          # Runtime configuration (auto-generated)
├── ai-design.html          # Frontend interface
├── ai-design.js           # Frontend JavaScript (updated for local API)
├── models/                # Downloaded AI models
│   └── stable-diffusion/
├── outputs/               # Generated images
└── venv_sd/              # Python virtual environment
```

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Look at server logs in the terminal
3. Verify your M1 MacBook has enough RAM
4. Ensure Python 3.9+ is installed

## 🎉 Success!

Once everything is running, you'll have a **completely local, private AI interior design generator** that:
- ✅ Runs entirely on your MacBook M1
- ✅ No internet required after setup
- ✅ No API costs or usage limits
- ✅ Complete privacy (images never leave your device)
- ✅ Professional-quality results in 20-30 seconds

Ready to transform your interior design workflow! 🏡✨
