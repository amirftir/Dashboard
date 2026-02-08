"""
Google News RSS Scanner
=======================
Fetches Google News RSS feeds for pillar keywords.
Completely free — no API key required.
"""

import time
import re
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False


def _build_rss_url(keyword):
    """Build a Google News RSS search URL for a keyword (Canada / English)."""
    from urllib.parse import quote_plus
    encoded = quote_plus(keyword)
    return (
        f"https://news.google.com/rss/search?"
        f"q={encoded}&hl=en-CA&gl=CA&ceid=CA:en"
    )


def _clean_html(raw):
    """Strip HTML tags from a string."""
    return re.sub(r"<[^>]+>", "", raw).strip()


def _parse_entry(entry, pillar_name, keywords):
    """Convert a feedparser entry into a plain dict."""
    title = _clean_html(entry.get("title", ""))
    link = entry.get("link", "")
    source = ""
    # Google News often puts the source after " - " in the title
    if " - " in title:
        parts = title.rsplit(" - ", 1)
        title = parts[0].strip()
        source = parts[1].strip()

    published_str = entry.get("published", "")
    try:
        published = parsedate_to_datetime(published_str).astimezone(timezone.utc)
    except Exception:
        published = None

    # Keyword matching
    text_lower = title.lower()
    matched = [kw for kw in keywords if kw.lower() in text_lower]

    return {
        "source_type": "google_news",
        "pillar": pillar_name,
        "title": title,
        "news_source": source,
        "url": link,
        "published": published.isoformat() if published else "",
        "published_dt": published,
        "matched_keywords": matched,
    }


def scan(config, pillar_filter=None, verbose=False):
    """
    Scan Google News RSS for articles matching pillar keywords.

    Returns a list of article dicts.
    """
    if not FEEDPARSER_AVAILABLE:
        if verbose:
            print("  [news] feedparser not installed — run: pip install feedparser")
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=config.DAYS_BACK)
    results = []
    seen_titles = set()  # for deduplication

    pillars = config.PILLARS
    if pillar_filter:
        key = pillar_filter.upper()
        if key in pillars:
            pillars = {key: pillars[key]}

    for pillar_name, pillar in pillars.items():
        keywords = pillar["keywords"]
        pillar_results = []

        if verbose:
            print(f"  [news] Scanning pillar: {pillar_name}")

        for kw in keywords:
            if len(pillar_results) >= config.MAX_RESULTS_PER_SOURCE:
                break

            url = _build_rss_url(kw)
            if verbose:
                print(f"    [news] Fetching RSS for: \"{kw}\"")

            try:
                feed = feedparser.parse(url)
                for entry in feed.entries:
                    article = _parse_entry(entry, pillar_name, keywords)

                    # Skip articles outside time window
                    if article["published_dt"] and article["published_dt"] < cutoff:
                        continue

                    # Deduplicate by normalised title
                    norm_title = article["title"].lower().strip()
                    if norm_title in seen_titles:
                        continue
                    seen_titles.add(norm_title)

                    pillar_results.append(article)

                    if len(pillar_results) >= config.MAX_RESULTS_PER_SOURCE:
                        break

            except Exception as exc:
                if verbose:
                    print(f"    [news] Error fetching \"{kw}\": {exc}")

            # Small delay to be polite
            time.sleep(0.5)

        results.extend(pillar_results)

    if verbose:
        print(f"  [news] Done — {len(results)} articles collected.")
    return results
