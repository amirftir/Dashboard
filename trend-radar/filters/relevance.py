"""
Relevance Scoring & Filtering
==============================
Scores each Reddit / Google News result on a 1–10 scale based on:
  - Keyword match   (0-3)
  - Engagement       (0-3)
  - Recency          (0-2)
  - Pain-point signal (0-2)
"""

from datetime import datetime, timezone, timedelta


def _keyword_score(item, pillar_keywords):
    """0-3 based on how many pillar keywords appear in title + comments."""
    text = ""
    if item.get("title"):
        text += item["title"] + " "
    if item.get("selftext"):
        text += item["selftext"] + " "
    for c in item.get("top_comments", []):
        text += c.get("text", "") + " "
    text = text.lower()

    hits = sum(1 for kw in pillar_keywords if kw.lower() in text)
    if hits >= 3:
        return 3
    if hits == 2:
        return 2
    if hits == 1:
        return 1
    return 0


def _engagement_score(item):
    """0-3 based on upvotes + comments."""
    upvotes = item.get("upvotes", 0)
    comments = item.get("num_comments", 0)
    total = upvotes + comments

    if total >= 500:
        return 3
    if total >= 200:
        return 2
    if total >= 50:
        return 1
    return 0


def _recency_score(item):
    """0-2 based on post age."""
    dt = item.get("created_dt") or item.get("published_dt")
    if dt is None:
        return 0
    now = datetime.now(timezone.utc)
    age = now - dt
    if age <= timedelta(days=1):
        return 2
    if age <= timedelta(days=3):
        return 1
    return 0


def _pain_score(item, pain_words):
    """0-2 based on pain-point language in title + comments."""
    text = ""
    if item.get("title"):
        text += item["title"] + " "
    if item.get("selftext"):
        text += item["selftext"] + " "
    for c in item.get("top_comments", []):
        text += c.get("text", "") + " "
    text = text.lower()

    hits = sum(1 for pw in pain_words if pw.lower() in text)
    if hits >= 2:
        return 2
    if hits >= 1:
        return 1
    return 0


def score_item(item, config):
    """Score a single result dict. Returns the item with a 'relevance_score' key."""
    pillar_name = item.get("pillar", "")
    pillar_cfg = config.PILLARS.get(pillar_name, {})
    keywords = pillar_cfg.get("keywords", [])
    pain_words = getattr(config, "PAIN_WORDS", [])

    ks = _keyword_score(item, keywords)
    es = _engagement_score(item)
    rs = _recency_score(item)
    ps = _pain_score(item, pain_words)

    total = ks + es + rs + ps
    item["relevance_score"] = total
    item["score_breakdown"] = {
        "keyword": ks,
        "engagement": es,
        "recency": rs,
        "pain": ps,
    }
    return item


def score_news_item(item, config):
    """Score a Google News article (engagement metrics not available)."""
    pillar_name = item.get("pillar", "")
    pillar_cfg = config.PILLARS.get(pillar_name, {})
    keywords = pillar_cfg.get("keywords", [])

    # Keyword match
    text = (item.get("title", "") + " " + item.get("news_source", "")).lower()
    hits = sum(1 for kw in keywords if kw.lower() in text)
    ks = min(hits, 3)

    # News articles don't have engagement metrics, give base score of 1
    es = 1

    # Recency
    rs = _recency_score(item)

    # Pain signal in title
    pain_words = getattr(config, "PAIN_WORDS", [])
    pain_hits = sum(1 for pw in pain_words if pw.lower() in text)
    ps = min(pain_hits, 2)

    total = ks + es + rs + ps
    item["relevance_score"] = total
    item["score_breakdown"] = {
        "keyword": ks,
        "engagement": es,
        "recency": rs,
        "pain": ps,
    }
    return item


def filter_results(items, min_score=5):
    """Return items scoring >= min_score, sorted descending."""
    above = [i for i in items if i.get("relevance_score", 0) >= min_score]
    above.sort(key=lambda i: i.get("relevance_score", 0), reverse=True)
    return above


def filter_below(items, min_score=5):
    """Return items scoring below min_score (for the raw data section)."""
    below = [i for i in items if i.get("relevance_score", 0) < min_score]
    below.sort(key=lambda i: i.get("relevance_score", 0), reverse=True)
    return below
