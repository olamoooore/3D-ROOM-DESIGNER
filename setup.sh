#!/bin/bash

# Interior Design AI Setup Script
# Run this to set up the local AI environment

echo "🏭 Setting up Interior Design AI..."
echo "=================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 first: https://www.python.org/downloads/"
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv_sd

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv_sd/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing AI dependencies..."
echo "⏳ This may take 5-10 minutes on first run..."

pip install torch torchvision torchaudio
pip install diffusers transformers accelerate
pip install fastapi uvicorn python-multipart
pip install pillow opencv-python numpy
pip install requests

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the AI server:"
echo "   ./start_production_ai.sh"
echo ""
echo "🌐 To open the web interface:"
echo "   npm run serve-frontend"
echo "   Then visit: http://localhost:3000/ai-design.html"
echo ""
echo "📖 For more info, see: PRODUCTION_README.md"
