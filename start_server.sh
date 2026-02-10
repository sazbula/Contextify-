#!/bin/bash

# Start Contextify Backend Server with Verbose Logging

echo "============================================================"
echo "Starting Contextify Backend Server"
echo "============================================================"
echo ""

# Set environment for unbuffered output
export PYTHONUNBUFFERED=1

# Check if .env file exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found!"
    echo "Please create a .env file with your OPENAI_API_KEY"
    echo ""
    echo "Example:"
    echo "OPENAI_API_KEY=your-key-here"
    echo ""
    read -p "Press enter to continue anyway..."
fi

# Start the server
echo "Starting uvicorn server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn src.api.server:app --reload --host 0.0.0.0 --port 8000
