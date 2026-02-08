"""
Google Trends Scanner
=====================
Uses the pytrends library to pull rising queries, interest over time,
and related topics for pillar keywords.  Free — no API key needed.

Google Trends rate-limits aggressively; the scanner adds delays between
requests and retries once on failure.
"""

import time
import random

try:
    from pytrends.request import TrendReq
    PYTRENDS_AVAILABLE = True
except ImportError:
    PYTRENDS_AVAILABLE = False


def _build_pytrends(verbose=False):
    """Create a pytrends client with a randomised user-agent."""
    agents = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    ]
    try:
        pt = TrendReq(
            hl="en-CA",
            tz=300,  # EST offset
            requests_args={"headers": {"User-Agent": random.choice(agents)}},
        )
        return pt
    except Exception as exc:
        if verbose:
            print(f"  [trends] Failed to create pytrends client: {exc}")
        return None


def _fetch_with_retry(fn, config, verbose=False):
    """Call `fn()`, retry once after TRENDS_RETRY_DELAY on failure."""
    try:
        return fn()
    except Exception as exc:
        if verbose:
            print(f"    [trends] Request failed ({exc}), retrying after delay…")
        time.sleep(config.TRENDS_RETRY_DELAY)
        try:
            return fn()
        except Exception as exc2:
            if verbose:
                print(f"    [trends] Retry also failed: {exc2}")
            return None


def _get_related_queries(pt, keyword, config, verbose=False):
    """Fetch rising related queries for a keyword in Canada."""
    def _do():
        pt.build_payload([keyword], cat=0, timeframe="now 7-d", geo="CA")
        data = pt.related_queries()
        return data

    raw = _fetch_with_retry(_do, config, verbose=verbose)
    if raw is None:
        return []

    rising = []
    try:
        df = raw.get(keyword, {}).get("rising")
        if df is not None and not df.empty:
            for _, row in df.head(10).iterrows():
                rising.append({
                    "query": row.get("query", ""),
                    "value": str(row.get("value", "")),
                })
    except Exception:
        pass
    return rising


def _get_interest_over_time(pt, keyword, config, verbose=False):
    """Fetch 7-day interest-over-time for a keyword in Canada."""
    def _do():
        pt.build_payload([keyword], cat=0, timeframe="now 7-d", geo="CA")
        df = pt.interest_over_time()
        return df

    df = _fetch_with_retry(_do, config, verbose=verbose)
    if df is None or df.empty:
        return None

    try:
        values = df[keyword].tolist()
        if len(values) < 2:
            return None
        first_half = values[: len(values) // 2]
        second_half = values[len(values) // 2:]
        avg_first = sum(first_half) / len(first_half) if first_half else 1
        avg_second = sum(second_half) / len(second_half) if second_half else 0
        if avg_first == 0:
            change_pct = 0
        else:
            change_pct = round(((avg_second - avg_first) / avg_first) * 100)
        return {
            "avg_first_half": round(avg_first, 1),
            "avg_second_half": round(avg_second, 1),
            "change_pct": change_pct,
        }
    except Exception:
        return None


def _get_related_topics(pt, keyword, config, verbose=False):
    """Fetch rising related topics for a keyword in Canada."""
    def _do():
        pt.build_payload([keyword], cat=0, timeframe="now 7-d", geo="CA")
        data = pt.related_topics()
        return data

    raw = _fetch_with_retry(_do, config, verbose=verbose)
    if raw is None:
        return []

    topics = []
    try:
        df = raw.get(keyword, {}).get("rising")
        if df is not None and not df.empty:
            for _, row in df.head(5).iterrows():
                title = row.get("topic_title", "")
                topic_type = row.get("topic_type", "")
                value = str(row.get("value", ""))
                topics.append({"title": title, "type": topic_type, "value": value})
    except Exception:
        pass
    return topics


def scan(config, pillar_filter=None, verbose=False):
    """
    Scan Google Trends for each pillar's primary keywords.

    Returns a list of trend dicts grouped by pillar.
    """
    if not PYTRENDS_AVAILABLE:
        if verbose:
            print("  [trends] pytrends not installed — run: pip install pytrends")
        return []

    pt = _build_pytrends(verbose=verbose)
    if pt is None:
        return []

    results = []

    pillars = config.PILLARS
    if pillar_filter:
        key = pillar_filter.upper()
        if key in pillars:
            pillars = {key: pillars[key]}

    for pillar_name, pillar in pillars.items():
        trend_keywords = pillar.get("trends_keywords", pillar["keywords"][:3])
        if verbose:
            print(f"  [trends] Scanning pillar: {pillar_name}")

        for kw in trend_keywords:
            if verbose:
                print(f"    [trends] Keyword: \"{kw}\"")

            related_queries = _get_related_queries(pt, kw, config, verbose=verbose)
            time.sleep(config.TRENDS_DELAY)

            interest = _get_interest_over_time(pt, kw, config, verbose=verbose)
            time.sleep(config.TRENDS_DELAY)

            related_topics = _get_related_topics(pt, kw, config, verbose=verbose)
            time.sleep(config.TRENDS_DELAY)

            results.append({
                "source_type": "google_trends",
                "pillar": pillar_name,
                "keyword": kw,
                "rising_queries": related_queries,
                "interest": interest,
                "related_topics": related_topics,
            })

    if verbose:
        print(f"  [trends] Done — {len(results)} keyword results collected.")
    return results
