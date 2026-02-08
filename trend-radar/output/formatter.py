"""
Markdown Output Formatter
=========================
Formats scored results into the trend briefing Markdown file.
"""

from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Suggested-angle templates — keyed by pillar for variety
# ---------------------------------------------------------------------------
_ANGLE_HINTS = {
    "VISIBILITY": [
        "Many business owners have a website but are invisible on Google. The site exists — the visibility doesn't.",
        "Contractors and tradespeople know they need 'SEO' but have no idea what actually moves the needle locally.",
        "Algorithm changes are happening that affect your clients' visibility. Position as the person who stays on top of this.",
        "Spending more on ads doesn't equal being found. Strategy beats budget every time.",
        "More people than ever are searching for how to get visible locally. The demand for what you teach is growing.",
    ],
    "LEADS": [
        "Most businesses don't have a lead problem — they have a follow-up problem.",
        "Your website might be getting traffic but if there's no system, those visitors disappear forever.",
        "The gap between 'getting leads' and 'getting clients' is a system, not more marketing spend.",
        "Speed to lead is everything — the business that responds first wins, not the one with the best offer.",
        "Before chasing new leads, fix the leak in the bucket you already have.",
    ],
    "NETWORKING": [
        "Networking doesn't fail because it doesn't work — it fails because people do it wrong.",
        "BNI works when you treat it like a system, not a social hour.",
        "The ROI of networking is invisible for months, then compounds. Most people quit too early.",
        "Referral partners aren't found — they're built through consistent, strategic relationship deposits.",
        "Word of mouth isn't luck — it's engineered through process and follow-through.",
    ],
}

_POST_STRUCTURES = ["PAS-D", "BAB-I", "Framework Drop", "Story Lesson", "Myth Buster"]


def _pick_angle(pillar, index):
    hints = _ANGLE_HINTS.get(pillar, _ANGLE_HINTS["VISIBILITY"])
    return hints[index % len(hints)]


def _pick_structure(index):
    return _POST_STRUCTURES[index % len(_POST_STRUCTURES)]


def _fmt_reddit(items, pillar_name):
    """Format Reddit results for one pillar."""
    if not items:
        return "_No Reddit results met the relevance threshold for this pillar._\n"

    lines = []
    for i, item in enumerate(items, 1):
        sub = item.get("subreddit", "?")
        title = item.get("title", "")
        upvotes = item.get("upvotes", 0)
        num_comments = item.get("num_comments", 0)
        url = item.get("url", "")
        score = item.get("relevance_score", 0)

        lines.append(f'{i}. **[r/{sub}] "{title}"**')
        lines.append(f"   - Upvotes: {upvotes:,} | Comments: {num_comments:,}")

        top_comments = item.get("top_comments", [])
        labels = ["Top comment", "Second comment", "Third comment"]
        for j, c in enumerate(top_comments[:3]):
            label = labels[j] if j < len(labels) else f"Comment {j+1}"
            lines.append(f'   - {label}: "{c["text"]}"')

        lines.append(f"   - Relevance score: {score}/10")
        lines.append(f"   - Link: {url}")
        lines.append(f"   - **Suggested angle:** {_pick_angle(pillar_name, i)}")
        lines.append("")

    return "\n".join(lines)


def _fmt_news(items, pillar_name):
    """Format Google News results for one pillar."""
    if not items:
        return "_No Google News results met the relevance threshold for this pillar._\n"

    lines = []
    for i, item in enumerate(items, 1):
        title = item.get("title", "")
        source = item.get("news_source", "")
        published = item.get("published", "")
        url = item.get("url", "")

        date_str = ""
        if published:
            try:
                dt = datetime.fromisoformat(published)
                date_str = dt.strftime("%b %-d, %Y")
            except Exception:
                date_str = published

        source_str = f" — {source}" if source else ""
        lines.append(f'{i}. **"{title}"**{source_str}')
        if date_str:
            lines.append(f"   - Published: {date_str}")
        if url:
            lines.append(f"   - Link: {url}")
        lines.append(f"   - **Suggested angle:** {_pick_angle(pillar_name, i + 2)}")
        lines.append("")

    return "\n".join(lines)


def _fmt_trends(items, pillar_name):
    """Format Google Trends results for one pillar."""
    if not items:
        return "_No Google Trends data available for this pillar._\n"

    lines = []
    for item in items:
        kw = item.get("keyword", "")
        interest = item.get("interest")
        rising = item.get("rising_queries", [])
        topics = item.get("related_topics", [])

        if interest:
            change = interest.get("change_pct", 0)
            direction = "Rising" if change > 0 else ("Declining" if change < 0 else "Flat")
            lines.append(f'- **"{kw}"** — {direction} {abs(change)}% this week in Canada')
        else:
            lines.append(f'- **"{kw}"** — No trend data available')

        for rq in rising[:5]:
            q = rq.get("query", "")
            val = rq.get("value", "")
            lines.append(f'  - Related rising query: "{q}" (+{val}%)')

        for tp in topics[:3]:
            t = tp.get("title", "")
            v = tp.get("value", "")
            lines.append(f'  - Related rising topic: "{t}" (+{v}%)')

    lines.append("")
    lines.append(f"- **Suggested angle:** {_pick_angle(pillar_name, 4)}")
    lines.append("")
    return "\n".join(lines)


def _top_opportunities(all_reddit, all_news, all_trends, config):
    """Pick the top 5 content opportunities across all pillars."""
    candidates = []

    for item in all_reddit:
        candidates.append({
            "pillar": item.get("pillar", ""),
            "score": item.get("relevance_score", 0),
            "title": item.get("title", ""),
            "source_label": f'r/{item.get("subreddit", "")} thread',
            "engagement": f'{item.get("upvotes", 0):,} upvotes',
            "type": "reddit",
        })

    for item in all_news:
        candidates.append({
            "pillar": item.get("pillar", ""),
            "score": item.get("relevance_score", 0),
            "title": item.get("title", ""),
            "source_label": f'{item.get("news_source", "news")} article',
            "engagement": "",
            "type": "news",
        })

    # Trends contribute ideas but don't have per-item scores the same way
    for item in all_trends:
        rising = item.get("rising_queries", [])
        if rising:
            top_query = rising[0].get("query", "")
            candidates.append({
                "pillar": item.get("pillar", ""),
                "score": 6,  # base score for a rising trend
                "title": top_query,
                "source_label": "Google Trends rising query",
                "engagement": f'+{rising[0].get("value", "")}%',
                "type": "trends",
            })

    # Sort by score descending, take top 5
    candidates.sort(key=lambda x: x["score"], reverse=True)
    top5 = candidates[:5]

    lines = []
    for i, c in enumerate(top5, 1):
        pillar_num = {"VISIBILITY": 1, "LEADS": 2, "NETWORKING": 3}.get(c["pillar"], "?")
        structure = _pick_structure(i)
        engagement_note = f" with {c['engagement']}" if c["engagement"] else ""
        lines.append(
            f'{i}. **[PILLAR {pillar_num} — {structure}]** '
            f'"{c["title"]}" — inspired by {c["source_label"]}{engagement_note}'
        )

    return "\n".join(lines) if lines else "_Not enough data to generate opportunities._"


def _fmt_raw(items):
    """Summarised listing of low-scoring items for the raw-data section."""
    if not items:
        return "_No additional low-scoring results._\n"

    lines = []
    for item in items[:20]:
        title = item.get("title", item.get("keyword", ""))
        score = item.get("relevance_score", "?")
        src = item.get("source", item.get("source_type", ""))
        sub = item.get("subreddit", "")
        label = f"[{src}]" if src else ""
        if sub:
            label = f"[r/{sub}]"
        lines.append(f"- {label} {title} (score: {score}/10)")

    return "\n".join(lines)


def format_briefing(reddit_above, reddit_below, news_above, news_below,
                    trends_data, config, days_back=7):
    """
    Build the full Markdown briefing string.

    Parameters
    ----------
    reddit_above : list   — Reddit items scoring >= threshold, by pillar
    reddit_below : list   — Reddit items below threshold
    news_above   : list   — News items scoring >= threshold, by pillar
    news_below   : list   — News items below threshold
    trends_data  : list   — Raw Google Trends results
    config       : module — config.py
    days_back    : int

    Returns the Markdown string.
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    pillars_order = list(config.PILLARS.keys())

    sections = []
    sections.append(f"# TREND BRIEFING")
    sections.append(f"**Generated:** {now}")
    sections.append(f"**Period:** Last {days_back} days")
    sections.append("**Sources:** Reddit, Google News, Google Trends")
    sections.append("")
    sections.append("---")
    sections.append("")

    for idx, pname in enumerate(pillars_order, 1):
        desc = config.PILLARS[pname]["description"]
        sections.append(f"## PILLAR {idx}: {pname} ({desc})")
        sections.append("")

        # Reddit
        pillar_reddit = [r for r in reddit_above if r.get("pillar") == pname]
        sections.append("### Top Reddit Discussions")
        sections.append(_fmt_reddit(pillar_reddit, pname))

        # News
        pillar_news = [n for n in news_above if n.get("pillar") == pname]
        sections.append("### Google News Headlines")
        sections.append(_fmt_news(pillar_news, pname))

        # Trends
        pillar_trends = [t for t in trends_data if t.get("pillar") == pname]
        sections.append("### Google Trends Signals")
        sections.append(_fmt_trends(pillar_trends, pname))

        sections.append("---")
        sections.append("")

    # Top 5 opportunities
    sections.append("## TOP 5 CONTENT OPPORTUNITIES THIS WEEK")
    sections.append("")
    sections.append(
        "Based on engagement, relevance, and timeliness, here are the "
        "strongest content angles:"
    )
    sections.append("")
    sections.append(_top_opportunities(reddit_above, news_above, trends_data, config))
    sections.append("")
    sections.append("---")
    sections.append("")

    # Raw data
    all_below = reddit_below + news_below
    sections.append("## RAW DATA (for reference)")
    sections.append("")
    sections.append(
        "_Results that scored below the relevance threshold, included here "
        "in case you want to dig deeper._"
    )
    sections.append("")
    sections.append(_fmt_raw(all_below))
    sections.append("")

    return "\n".join(sections)
