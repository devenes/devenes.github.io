#!/usr/bin/env python3
"""
Validation script for devenes.github.io speaking events.
Checks events.json format, reverse chronological ordering, and location mapping in data/locations.json.
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
EVENTS_JSON_PATH = REPO_ROOT / "data" / "events.json"
LOCATIONS_JSON_PATH = REPO_ROOT / "data" / "locations.json"


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

    # 4. Check location mappings in data/locations.json
    city_keys = set()
    if LOCATIONS_JSON_PATH.exists():
        try:
            with open(LOCATIONS_JSON_PATH, "r", encoding="utf-8") as f:
                loc_list = json.load(f)
                if isinstance(loc_list, list):
                    for loc in loc_list:
                        if "cityKey" in loc:
                            city_keys.add(loc["cityKey"])
        except Exception as e:
            errors.append(f"Invalid JSON in data/locations.json: {e}")

    for ev in events:
        city = ev.get("city", "Online")
        if city and city != "Online":
            if city_keys and city not in city_keys:
                warnings.append(
                    f"City '{city}' for event '{ev.get('id')}' is not mapped as a cityKey in data/locations.json"
                )

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
