"""
Trend Radar Configuration
=========================
Edit this file to customize keywords, subreddits, API credentials, and settings.
"""

# ---------------------------------------------------------------------------
# Reddit credentials (register a free "script" app at https://www.reddit.com/prefs/apps)
# ---------------------------------------------------------------------------
REDDIT_CLIENT_ID = "YOUR_CLIENT_ID_HERE"
REDDIT_CLIENT_SECRET = "YOUR_CLIENT_SECRET_HERE"
REDDIT_USER_AGENT = "trend-radar:v1.0 (by /u/YOUR_USERNAME)"

# ---------------------------------------------------------------------------
# Output location (~ is expanded automatically)
# ---------------------------------------------------------------------------
OUTPUT_PATH = "~/Desktop/trend-briefing.md"

# ---------------------------------------------------------------------------
# Time range (days to look back)
# ---------------------------------------------------------------------------
DAYS_BACK = 7

# ---------------------------------------------------------------------------
# Minimum engagement thresholds (filter out low-quality Reddit posts)
# ---------------------------------------------------------------------------
MIN_UPVOTES = 10
MIN_COMMENTS = 5

# ---------------------------------------------------------------------------
# Maximum results per source per pillar
# ---------------------------------------------------------------------------
MAX_RESULTS_PER_SOURCE = 10

# ---------------------------------------------------------------------------
# Rate-limiting delays (seconds)
# ---------------------------------------------------------------------------
REDDIT_DELAY = 1.0          # seconds between subreddit scans
TRENDS_DELAY = 5.0          # seconds between Google Trends keyword lookups
TRENDS_RETRY_DELAY = 60.0   # seconds to wait before retrying after rate-limit

# ---------------------------------------------------------------------------
# Pain-point signal words (used for relevance scoring)
# ---------------------------------------------------------------------------
PAIN_WORDS = [
    "struggling", "frustrated", "help", "can't", "failing", "losing",
    "stuck", "no leads", "no clients", "waste of money", "doesn't work",
    "what am I doing wrong", "not working", "giving up", "hopeless",
    "overwhelmed", "confused", "desperate", "burned out", "scam",
    "ripped off", "waste of time", "impossible", "broken",
]

# ---------------------------------------------------------------------------
# Content pillars and keywords
# ---------------------------------------------------------------------------
PILLARS = {
    "VISIBILITY": {
        "description": "Why Local Businesses Stay Invisible (SEO / Online Presence)",
        "keywords": [
            "local business website",
            "Google Business Profile",
            "Google Maps listing",
            "small business SEO",
            "online visibility",
            "local search",
            "can't find my business on Google",
            "website not getting traffic",
            "local business marketing",
        ],
        "subreddits": [
            "smallbusiness", "Entrepreneur", "SEO", "marketing",
            "sweatystartup", "realtors", "HVAC", "plumbing",
            "electricians", "landscaping",
        ],
        "trends_keywords": [
            "local business marketing",
            "small business SEO",
            "Google Business Profile",
        ],
    },
    "LEADS": {
        "description": "Why Their Leads Suck (Funnels / Systems)",
        "keywords": [
            "getting more clients",
            "lead generation small business",
            "follow up system",
            "CRM small business",
            "losing leads",
            "website not converting",
            "no one calls from my website",
            "client acquisition",
            "sales funnel small business",
        ],
        "subreddits": [
            "smallbusiness", "Entrepreneur", "marketing",
            "sweatystartup", "realtors",
        ],
        "trends_keywords": [
            "getting more clients",
            "lead generation small business",
        ],
    },
    "NETWORKING": {
        "description": "Why Networking Fails (BNI / Referrals)",
        "keywords": [
            "BNI networking",
            "business referrals",
            "networking tips business",
            "word of mouth marketing",
            "referral partners",
            "networking group worth it",
            "BNI experience",
            "business networking ROI",
        ],
        "subreddits": [
            "smallbusiness", "Entrepreneur", "BNI",
        ],
        "trends_keywords": [
            "BNI networking",
            "business networking ROI",
        ],
    },
}

# ---------------------------------------------------------------------------
# Post structures for content opportunity suggestions
# ---------------------------------------------------------------------------
POST_STRUCTURES = [
    "PAS-D",           # Problem → Agitate → Solve → Diagnose
    "BAB-I",           # Before → After → Bridge → Invite
    "Framework Drop",
    "Story Lesson",
    "Myth Buster",
]
