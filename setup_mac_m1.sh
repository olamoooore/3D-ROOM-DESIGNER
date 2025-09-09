#!/bin/bash

echo "🚀 Setting up Local Stable Diffusion for MacBook M1..."

# Check if Python 3.9+ is installed
if ! python3 --version | grep -E "3\.(9|10|11|12)" > /dev/null; then
    echo "❌ Python 3.9+ is required. Please install Python 3.9+ first."
    echo "You can install it via Homebrew: brew install python@3.11"
    exit 1
fi

# Create virtual environment
echo "📦 Creating Python virtual environment..."
python3 -m venv venv_sd
source venv_sd/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install PyTorch with MPS support for M1
echo "🔥 Installing PyTorch with MPS support for Apple Silicon..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
echo "📚 Installing Stable Diffusion dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p models/stable-diffusion
mkdir -p models/controlnet
mkdir -p outputs
mkdir -p temp

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Activate the environment: source venv_sd/bin/activate"
echo "2. Run the setup script: python setup_models.py"
echo "3. Start the API server: python sd_api_server.py"
echo ""
echo "💡 The first run will download models (~4GB), so ensure you have good internet."
