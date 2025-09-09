#!/bin/bash

echo "🏠 Starting Local Interior Design AI"
echo "===================================="

# Check if virtual environment exists
if [ ! -d "venv_sd" ]; then
    echo "❌ Virtual environment not found. Running setup..."
    ./setup_mac_m1.sh
fi

# Activate environment
echo "📦 Activating environment..."
source venv_sd/bin/activate

# Check if config exists
if [ ! -f "sd_config.json" ]; then
    echo "⚙️  Running setup..."
    python simple_setup.py
fi

echo ""
echo "🚀 Starting AI server..."
echo "   Server will be available at: http://127.0.0.1:3001"
echo "   Open ai-design.html in your browser to use the interface"
echo ""
echo "💡 First generation may take 2-3 minutes (downloading models)"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start server
python simple_server.py
