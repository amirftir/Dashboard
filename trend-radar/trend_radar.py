#!/usr/bin/env python3
"""
Trend Radar — LinkedIn Content Intelligence Tool
=================================================
Scans Reddit, Google News RSS, and Google Trends for trending conversations
related to your content pillars. Outputs a clean Markdown briefing file.

Usage:
    python trend_radar.py                          # full scan, default settings
    python trend_radar.py --pillar visibility      # scan one pillar only
    python trend_radar.py --days 3                 # look back 3 days
    python trend_radar.py --verbose                # show progress details
    python trend_radar.py --output ~/my-file.md    # custom output path
    python trend_radar.py --skip-reddit            # skip Reddit source
    python trend_radar.py --skip-trends            # skip Google Trends source
"""

import argparse
import sys
import time
from pathlib import Path

import config
from sources import reddit_scanner, google_news, google_trends
from filters.relevance import score_item, score_news_item, filter_results, filter_below
from output.formatter import format_briefing


# ---------------------------------------------------------------------------
# Progress indicator
# ---------------------------------------------------------------------------
class Progress:
    """Simple progress printer for the terminal."""

    def __init__(self, verbose=False):
        self.verbose = verbose
        self._start = time.time()

    def step(self, msg):
        elapsed = time.time() - self._start
        print(f"[{elapsed:5.1f}s] {msg}")

    def detail(self, msg):
        if self.verbose:
            elapsed = time.time() - self._start
            print(f"[{elapsed:5.1f}s]   {msg}")

    def done(self, output_path):
        elapsed = time.time() - self._start
        print()
        print(f"Done in {elapsed:.1f}s")
        print(f"Briefing saved to: {output_path}")
        print()
        print("Paste it into Claude.ai and say 'Monday batch' or 'Thursday batch'")


# ---------------------------------------------------------------------------
# CLI argument parsing
# ---------------------------------------------------------------------------
def parse_args():
    parser = argparse.ArgumentParser(
        description="Trend Radar — scan Reddit, Google News, and Google Trends for content ideas.",
    )
    parser.add_argument(
        "--pillar",
        type=str,
        choices=["visibility", "leads", "networking"],
        default=None,
        help="Only scan a specific pillar.",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=None,
        help=f"Days to look back (default: {config.DAYS_BACK}).",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed scanning progress.",
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help=f"Custom output file path (default: {config.OUTPUT_PATH}).",
    )
    parser.add_argument(
        "--skip-reddit",
        action="store_true",
        help="Skip the Reddit source.",
    )
    parser.add_argument(
        "--skip-news",
        action="store_true",
        help="Skip the Google News source.",
    )
    parser.add_argument(
        "--skip-trends",
        action="store_true",
        help="Skip the Google Trends source.",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    args = parse_args()

    # Override config values from CLI flags
    if args.days is not None:
        config.DAYS_BACK = args.days
    output_path = Path(args.output or config.OUTPUT_PATH).expanduser()

    prog = Progress(verbose=args.verbose)

    print()
    print("=" * 56)
    print("  TREND RADAR — LinkedIn Content Intelligence Scanner")
    print("=" * 56)
    print()

    pillar_filter = args.pillar  # None = all pillars

    # ---- Reddit ----
    reddit_results = []
    if not args.skip_reddit:
        prog.step("Scanning Reddit...")
        try:
            reddit_results = reddit_scanner.scan(
                config, pillar_filter=pillar_filter, verbose=args.verbose,
            )
        except Exception as exc:
            prog.step(f"Reddit scan failed: {exc}")
    else:
        prog.step("Skipping Reddit (--skip-reddit)")

    # ---- Google News ----
    news_results = []
    if not args.skip_news:
        prog.step("Scanning Google News RSS...")
        try:
            news_results = google_news.scan(
                config, pillar_filter=pillar_filter, verbose=args.verbose,
            )
        except Exception as exc:
            prog.step(f"Google News scan failed: {exc}")
    else:
        prog.step("Skipping Google News (--skip-news)")

    # ---- Google Trends ----
    trends_results = []
    if not args.skip_trends:
        prog.step("Scanning Google Trends...")
        try:
            trends_results = google_trends.scan(
                config, pillar_filter=pillar_filter, verbose=args.verbose,
            )
        except Exception as exc:
            prog.step(f"Google Trends scan failed: {exc}")
    else:
        prog.step("Skipping Google Trends (--skip-trends)")

    # ---- Score & Filter ----
    prog.step("Scoring and filtering results...")

    # Score Reddit results
    for item in reddit_results:
        score_item(item, config)

    # Score Google News results
    for item in news_results:
        score_news_item(item, config)

    reddit_above = filter_results(reddit_results, min_score=5)
    reddit_below_list = filter_below(reddit_results, min_score=5)
    news_above = filter_results(news_results, min_score=5)
    news_below_list = filter_below(news_results, min_score=5)

    prog.step(
        f"Results — Reddit: {len(reddit_above)} above threshold, "
        f"News: {len(news_above)} above threshold, "
        f"Trends: {len(trends_results)} keyword reports"
    )

    # ---- Format output ----
    prog.step("Generating Markdown briefing...")

    briefing = format_briefing(
        reddit_above=reddit_above,
        reddit_below=reddit_below_list,
        news_above=news_above,
        news_below=news_below_list,
        trends_data=trends_results,
        config=config,
        days_back=config.DAYS_BACK,
    )

    # ---- Write file ----
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(briefing, encoding="utf-8")

    prog.done(output_path)


if __name__ == "__main__":
    main()
