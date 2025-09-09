#!/bin/bash

echo "🏠 Starting Local Interior Design AI..."
echo "=================================="

# Check if virtual environment exists
if [ ! -d "venv_sd" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   ./setup_mac_m1.sh"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating Python environment..."
source venv_sd/bin/activate

# Check if models exist
if [ ! -d "models/stable-diffusion" ] || [ -z "$(ls -A models/stable-diffusion 2>/dev/null)" ]; then
    echo "🔄 Models not found. Setting up models..."
    python setup_models.py
    
    if [ $? -ne 0 ]; then
        echo "❌ Model setup failed. Please check the error messages above."
        exit 1
    fi
fi

# Check if config exists
if [ ! -f "sd_config.json" ]; then
    echo "⚙️  Configuration not found. Running model setup to create config..."
    python setup_models.py
fi

echo ""
echo "🚀 Starting AI API server..."
echo "   Server will be available at: http://127.0.0.1:3001"
echo "   Open ai-design.html in your browser to use the interface"
echo ""
echo "⏳ First generation may take 30-60 seconds (model loading)"
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the server
python sd_api_server.py
