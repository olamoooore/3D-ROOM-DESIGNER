#!/bin/bash

echo "🚀 Starting CPU-Optimized Interior Design AI..."
echo "============================================="

# Check if virtual environment exists
if [ ! -d "venv_sd" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: ./setup.sh first"
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv_sd/bin/activate

# Check if server file exists
if [ ! -f "server_cpu_working.py" ]; then
    echo "❌ Server file not found!"
    echo "Please ensure server_cpu_working.py exists"
    exit 1
fi

echo "🖥️ Starting CPU-optimized server on http://127.0.0.1:3001"
echo "⏳ This may take 30-60 seconds to load AI models..."
echo ""
echo "💡 Tips:"
echo "   - Wait for 'CPU Pipeline Ready' message"
echo "   - Generation takes ~60 seconds per image"
echo "   - Press Ctrl+C to stop"
echo ""

# Start the server
python server_cpu_working.py
