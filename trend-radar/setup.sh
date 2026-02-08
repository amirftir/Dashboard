#!/bin/bash
# setup.sh — Run this once to set up Trend Radar
set -e

echo ""
echo "========================================"
echo "  Setting up Trend Radar..."
echo "========================================"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo ""
echo "  1. Go to https://www.reddit.com/prefs/apps"
echo "     - Click 'create another app'"
echo "     - Select 'script'"
echo "     - Name: trend-radar"
echo "     - Redirect URI: http://localhost:8080"
echo "     - Copy the client_id (under the app name) and client_secret"
echo ""
echo "  2. Edit config.py and paste your Reddit credentials:"
echo "     REDDIT_CLIENT_ID = \"your_id_here\""
echo "     REDDIT_CLIENT_SECRET = \"your_secret_here\""
echo "     REDDIT_USER_AGENT = \"trend-radar:v1.0 (by /u/your_username)\""
echo ""
echo "  3. Run the tool:"
echo "     ./run.sh"
echo "     OR"
echo "     source venv/bin/activate && python trend_radar.py --verbose"
echo ""
echo "  NOTE: Google News and Google Trends work without any credentials."
echo "        If you skip the Reddit setup, the tool still runs with"
echo "        the other two sources."
echo ""
