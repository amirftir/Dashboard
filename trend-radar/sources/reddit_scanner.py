"""
Reddit Scanner
==============
Scans configured subreddits and Reddit search for posts matching pillar keywords.
Uses PRAW (Python Reddit API Wrapper).
"""

import time
from datetime import datetime, timezone, timedelta

try:
    import praw
    from praw.exceptions import PRAWException
    PRAW_AVAILABLE = True
except ImportError:
    PRAW_AVAILABLE = False


def _create_client(config, verbose=False):
    """Create and return an authenticated Reddit client."""
    if not PRAW_AVAILABLE:
        if verbose:
            print("  [reddit] praw not installed — run: pip install praw")
        return None

    cid = config.REDDIT_CLIENT_ID
    secret = config.REDDIT_CLIENT_SECRET
    agent = config.REDDIT_USER_AGENT

    if "YOUR_" in cid or "YOUR_" in secret:
        if verbose:
            print("  [reddit] Credentials not configured in config.py — skipping Reddit.")
        return None

    try:
        reddit = praw.Reddit(
            client_id=cid,
            client_secret=secret,
            user_agent=agent,
        )
        # Test connection with a lightweight call
        reddit.subreddit("smallbusiness").id
        return reddit
    except Exception as exc:
        if verbose:
            print(f"  [reddit] Authentication failed: {exc}")
        return None


def _extract_top_comments(submission, count=3):
    """Return the top `count` comments (by score) as plain text."""
    try:
        submission.comment_sort = "best"
        submission.comments.replace_more(limit=0)
        comments = sorted(submission.comments.list(), key=lambda c: c.score, reverse=True)
        results = []
        for c in comments[:count]:
            body = c.body.strip()
            # Truncate very long comments
            if len(body) > 500:
                body = body[:497] + "..."
            results.append({"text": body, "score": c.score})
        return results
    except Exception:
        return []


def _post_to_dict(submission, subreddit_name, pillar_name, keywords):
    """Convert a PRAW submission into a plain dict."""
    created = datetime.fromtimestamp(submission.created_utc, tz=timezone.utc)
    title = submission.title.strip()
    selftext = (submission.selftext or "").strip()
    if len(selftext) > 1000:
        selftext = selftext[:997] + "..."

    top_comments = _extract_top_comments(submission)

    # Count keyword matches in title + selftext + top comments
    combined_text = (title + " " + selftext + " " +
                     " ".join(c["text"] for c in top_comments)).lower()
    matched_keywords = [kw for kw in keywords if kw.lower() in combined_text]

    return {
        "source": "reddit",
        "pillar": pillar_name,
        "subreddit": subreddit_name,
        "title": title,
        "selftext": selftext,
        "url": f"https://www.reddit.com{submission.permalink}",
        "upvotes": submission.score,
        "num_comments": submission.num_comments,
        "created_utc": created.isoformat(),
        "created_dt": created,
        "top_comments": top_comments,
        "matched_keywords": matched_keywords,
    }


def scan(config, pillar_filter=None, verbose=False):
    """
    Scan Reddit for posts matching pillar keywords.

    Returns a list of post dicts grouped by pillar.
    """
    reddit = _create_client(config, verbose=verbose)
    if reddit is None:
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=config.DAYS_BACK)
    results = []
    seen_ids = set()

    pillars = config.PILLARS
    if pillar_filter:
        key = pillar_filter.upper()
        if key in pillars:
            pillars = {key: pillars[key]}

    for pillar_name, pillar in pillars.items():
        keywords = pillar["keywords"]
        subreddits = pillar["subreddits"]

        if verbose:
            print(f"  [reddit] Scanning pillar: {pillar_name}")

        # --- 1. Top posts from each subreddit (last week) ---
        for sub_name in subreddits:
            if verbose:
                print(f"    [reddit] r/{sub_name} — top posts this week")
            try:
                subreddit = reddit.subreddit(sub_name)
                for submission in subreddit.top(time_filter="week", limit=25):
                    if submission.id in seen_ids:
                        continue
                    if datetime.fromtimestamp(submission.created_utc, tz=timezone.utc) < cutoff:
                        continue
                    if submission.score < config.MIN_UPVOTES:
                        continue
                    if submission.num_comments < config.MIN_COMMENTS:
                        continue

                    # Check keyword relevance (title or selftext)
                    text = (submission.title + " " + (submission.selftext or "")).lower()
                    if not any(kw.lower() in text for kw in keywords):
                        continue

                    seen_ids.add(submission.id)
                    results.append(_post_to_dict(submission, sub_name, pillar_name, keywords))

                    if len([r for r in results if r["pillar"] == pillar_name]) >= config.MAX_RESULTS_PER_SOURCE:
                        break

            except Exception as exc:
                if verbose:
                    print(f"    [reddit] Error scanning r/{sub_name}: {exc}")

            time.sleep(config.REDDIT_DELAY)

        # --- 2. Keyword search across all of Reddit ---
        for kw in keywords:
            if len([r for r in results if r["pillar"] == pillar_name]) >= config.MAX_RESULTS_PER_SOURCE:
                break
            if verbose:
                print(f"    [reddit] Searching all of Reddit for: \"{kw}\"")
            try:
                for submission in reddit.subreddit("all").search(kw, sort="top", time_filter="week", limit=10):
                    if submission.id in seen_ids:
                        continue
                    if datetime.fromtimestamp(submission.created_utc, tz=timezone.utc) < cutoff:
                        continue
                    if submission.score < config.MIN_UPVOTES:
                        continue
                    if submission.num_comments < config.MIN_COMMENTS:
                        continue

                    seen_ids.add(submission.id)
                    sub_name = submission.subreddit.display_name
                    results.append(_post_to_dict(submission, sub_name, pillar_name, keywords))

                    if len([r for r in results if r["pillar"] == pillar_name]) >= config.MAX_RESULTS_PER_SOURCE:
                        break

            except Exception as exc:
                if verbose:
                    print(f"    [reddit] Search error for \"{kw}\": {exc}")

            time.sleep(config.REDDIT_DELAY)

    if verbose:
        print(f"  [reddit] Done — {len(results)} posts collected.")
    return results
