#!/usr/bin/env python3
"""
Validation script for devenes.github.io speaking events.
Checks events.json format, chronological ordering, coordinate mapping, and site counter consistency.
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
EVENTS_JSON_PATH = REPO_ROOT / "data" / "events.json"
APP_JS_PATH = REPO_ROOT / "app.js"
INDEX_HTML_PATH = REPO_ROOT / "index.html"
README_PATH = REPO_ROOT / "README.md"


def validate():
    errors = []
    warnings = []

    # 1. Validate data/events.json
    if not EVENTS_JSON_PATH.exists():
        errors.append(f"events.json not found at {EVENTS_JSON_PATH}")
        return errors, warnings

    try:
        with open(EVENTS_JSON_PATH, "r", encoding="utf-8") as f:
            events = json.load(f)
    except Exception as e:
        errors.append(f"Invalid JSON in data/events.json: {e}")
        return errors, warnings

    if not isinstance(events, list):
        errors.append("data/events.json must be an array of event objects")
        return errors, warnings

    total_events = len(events)
    print(f"Loaded {total_events} events from data/events.json")

    # 2. Check each event schema and unique IDs
    seen_ids = set()
    dates = []
    required_fields = ["id", "date", "event", "city", "talk", "photos", "description", "topics"]

    for idx, ev in enumerate(events):
        ev_id = ev.get("id")
        if not ev_id:
            errors.append(f"Event at index {idx} missing 'id'")
            continue

        if ev_id in seen_ids:
            errors.append(f"Duplicate event id '{ev_id}' at index {idx}")
        seen_ids.add(ev_id)

        for rf in required_fields:
            if rf not in ev:
                errors.append(f"Event '{ev_id}' missing required field: {rf}")

        date_val = ev.get("date", "")
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", date_val):
            errors.append(f"Event '{ev_id}' has invalid date format '{date_val}', expected YYYY-MM-DD")
        else:
            dates.append(date_val)

        if not isinstance(ev.get("topics", []), list) or len(ev.get("topics", [])) == 0:
            warnings.append(f"Event '{ev_id}' has empty or invalid 'topics'")

    # 3. Check reverse chronological ordering
    sorted_dates = sorted(dates, reverse=True)
    if dates != sorted_dates:
        errors.append("Events in data/events.json are not sorted in reverse chronological order (newest first)")

    # 4. Check coordinates mapping in app.js
    if APP_JS_PATH.exists():
        with open(APP_JS_PATH, "r", encoding="utf-8") as f:
            app_js_content = f.read()

        for ev in events:
            city = ev.get("city", "Online")
            if city and city != "Online":
                if f"'{city}'" not in app_js_content and f'"{city}"' not in app_js_content:
                    # Check partial city label match
                    city_base = city.split(",")[0].strip()
                    if city_base not in app_js_content:
                        warnings.append(f"City '{city}' for event '{ev.get('id')}' might not be mapped in CITY_COORDINATES in app.js")

    # 5. Check counter consistency across index.html
    if INDEX_HTML_PATH.exists():
        with open(INDEX_HTML_PATH, "r", encoding="utf-8") as f:
            index_html = f.read()

        hero_talk_count_match = re.search(r'<strong id="hero-talk-count">(\d+)</strong>', index_html)
        if hero_talk_count_match:
            count = int(hero_talk_count_match.group(1))
            if count != total_events:
                warnings.append(f"index.html hero-talk-count is {count}, but events.json has {total_events} events")

        archive_count_match = re.search(r'<span class="archive-count" id="archive-count"[^>]*>(\d+)\s+talks</span>', index_html)
        if archive_count_match:
            count = int(archive_count_match.group(1))
            if count != total_events:
                warnings.append(f"index.html archive-count is {count}, but events.json has {total_events} events")

    return errors, warnings


if __name__ == "__main__":
    errs, warns = validate()
    for w in warns:
        print(f"[WARN] {w}")
    for e in errs:
        print(f"[ERROR] {e}", file=sys.stderr)

    if errs:
        print(f"\nFAILED: {len(errs)} error(s) found.")
        sys.exit(1)
    else:
        print(f"\nPASSED: All validation checks passed successfully!")
        sys.exit(0)
