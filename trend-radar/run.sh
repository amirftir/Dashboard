#!/bin/bash
# run.sh — Run the trend radar
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Run ./setup.sh first."
    exit 1
fi

source venv/bin/activate
python trend_radar.py "$@"
