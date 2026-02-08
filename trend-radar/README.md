# Trend Radar

A Python command-line tool that scans Reddit, Google News RSS, and Google Trends for trending conversations related to your LinkedIn content pillars. Outputs a clean Markdown briefing file you can paste into Claude.ai to generate LinkedIn posts.

## Quick Start

```bash
# 1. Set up (one time)
chmod +x setup.sh run.sh
./setup.sh

# 2. Configure Reddit credentials in config.py (optional — other sources work without it)

# 3. Run
./run.sh
```

The briefing is saved to `~/Desktop/trend-briefing.md`.

## Data Sources

| Source | Cost | API Key Required |
|--------|------|-----------------|
| Reddit (PRAW) | Free | Yes — register at reddit.com/prefs/apps |
| Google News RSS | Free | No |
| Google Trends (pytrends) | Free | No |

## Command Line Options

```bash
# Default — scan all pillars, all sources
python trend_radar.py

# Scan one pillar only
python trend_radar.py --pillar visibility
python trend_radar.py --pillar leads
python trend_radar.py --pillar networking

# Change time range
python trend_radar.py --days 3

# Verbose mode (see detailed progress)
python trend_radar.py --verbose

# Custom output path
python trend_radar.py --output ~/Documents/briefing.md

# Skip a source
python trend_radar.py --skip-reddit
python trend_radar.py --skip-trends
python trend_radar.py --skip-news
```

## Content Pillars

1. **VISIBILITY** — Why Local Businesses Stay Invisible (SEO / Online Presence)
2. **LEADS** — Why Their Leads Suck (Funnels / Systems)
3. **NETWORKING** — Why Networking Fails (BNI / Referrals)

Edit `config.py` to adjust keywords, subreddits, thresholds, and output settings.

## Relevance Scoring (1–10)

Each result is scored on four dimensions:

- **Keyword match (0–3):** How many pillar keywords appear in the content
- **Engagement (0–3):** Upvotes + comments relative to thresholds
- **Recency (0–2):** Posted within 24h = 2, within 3 days = 1, older = 0
- **Pain-point signal (0–2):** Presence of words like "struggling", "frustrated", "stuck"

Only results scoring 5+ appear in the main briefing. Lower-scoring items are included in the Raw Data section.

## Project Structure

```
trend-radar/
├── trend_radar.py          # Main entry point
├── config.py               # All settings — edit this
├── sources/
│   ├── reddit_scanner.py   # Reddit via PRAW
│   ├── google_news.py      # Google News RSS via feedparser
│   └── google_trends.py    # Google Trends via pytrends
├── filters/
│   └── relevance.py        # Scoring and filtering
├── output/
│   └── formatter.py        # Markdown output generation
├── requirements.txt
├── setup.sh
├── run.sh
└── README.md
```

## Reddit Setup

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app"
3. Select **script**
4. Name: `trend-radar`
5. Redirect URI: `http://localhost:8080`
6. Copy the `client_id` (shown under the app name) and `client_secret`
7. Paste them into `config.py`

## Workflow

1. Run `./run.sh` (or `./run.sh --verbose`)
2. Open `~/Desktop/trend-briefing.md`
3. Paste the entire file into Claude.ai
4. Say "Monday batch" or "Thursday batch" to generate LinkedIn posts
