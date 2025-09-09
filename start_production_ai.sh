#!/bin/bash

# Production Interior Design AI Launcher
# For commercial use by interior designers and architects

echo "🏭 STARTING PRODUCTION INTERIOR DESIGN AI"
echo "=========================================="
echo "🎯 Optimized for commercial use"
echo "📍 Local server: http://127.0.0.1:3001"
echo "🌐 Frontend: http://localhost:3000/ai-design.html"
echo ""

# Check if virtual environment exists
if [ ! -d "venv_sd" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run setup first."
    exit 1
fi

# Activate virtual environment and start server
echo "🚀 Starting production server..."
echo "⏳ This may take 2-3 minutes for first-time model loading..."
echo ""

source venv_sd/bin/activate
python server_production_ready.py
