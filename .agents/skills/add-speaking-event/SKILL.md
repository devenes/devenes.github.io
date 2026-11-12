---
name: add-speaking-event
description: >-
  Add, update, or document technical speaking events and conference activities in the devenes.github.io repository.
  Use when the user asks to add a new talk, speech activity, workshop, keynote, or conference appearance to the website.
  Handles ID generation, city coordinate mapping in data/locations.json and src/utils/geography.ts, topic categorization,
  English translation, events.json reverse chronological ordering, assets folder creation, and automated validation.
---

# Add Speaking Event Skill

Use this runbook to add a new speaking engagement, keynote, or workshop to [devenes.github.io](https://devenes.github.io).

The Astro 5 + Three.js **Global Speaking Atlas** computes all metrics, regional distributions, city markers, timeline strips, and searchable archive rows dynamically at build time from [`data/events.json`](../../../data/events.json) and [`data/locations.json`](../../../data/locations.json) via [`src/utils/geography.ts`](../../../src/utils/geography.ts).

---

## Workflow Steps

### Step 1: Parse & Normalize Input Data
Extract or clarify the following properties:
- **Title (`talk`):** English session title (e.g., `"Transforming Surgical Problems into AI Projects with Google AI Agents Workshop"`).
- **Event Name (`event`):** Conference or event name. Can include official bilingual names if applicable (e.g., `"1st National AI in Surgery Congress (1. Ulusal Yapay Zeka Cerrahi Kongresi)"`).
- **Date (`date`):** Standard `YYYY-MM-DD` format (e.g., `"2026-10-10"`).
- **Location (`city`):** City and Country in English (e.g., `"Istanbul, Türkiye"`, `"Dubai, UAE"`) or `"Online"`.
- **ID Slug (`id`):** Unique, kebab-case identifier following `<event-or-topic>-<city-or-slug>-<year>` (e.g., `"ai-surgery-congress-istanbul-2026"`).
- **Topics (`topics`):** Canonical technical tags: `"AI Agents"`, `"Generative AI"`, `"Kubernetes"`, `"MLOps"`, `"Google Cloud"`, `"GKE"`, `"SRE"`, `"Healthcare AI"`, etc.
- **Description / Abstract (`description`):** Comprehensive session abstract and agenda in English. Paragraph breaks (`\n\n`) are preserved and rendered with `white-space: pre-line` in the dossier dialog.
- **Photos (`photos`):** Initialized to `[]` if photographs are not yet available, or `["assets/events/<event-id>/01.jpg"]`.
- **Optional Links:** `slidesUrl`, `recordingUrl`, `eventUrl`, `linkedinUrl` if provided.

### Step 2: Verify Geographic Coordinates (`data/locations.json` & `src/utils/geography.ts`)
1. Check if `event.city` is `"Online"` or already mapped in `CITY_STRING_TO_LOCATION_ID` in [`src/utils/geography.ts`](../../../src/utils/geography.ts) and [`data/locations.json`](../../../data/locations.json).
2. If it is a new physical city:
   - Add a new entry to `locations` in [`data/locations.json`](../../../data/locations.json) with `{ id, city, country, countryCode, lat, lon, eventsCount, years, highlights, note }`.
   - Add the `'City, Country': '<city-id>'` mapping to `CITY_STRING_TO_LOCATION_ID` in [`src/utils/geography.ts`](../../../src/utils/geography.ts) and ensure `COUNTRY_METADATA` includes its country code, flag, and `regionId`.

### Step 3: Insert Event into `data/events.json`
Events **must be ordered in reverse chronological order** (newest `date` first).
1. Locate the correct index in [`data/events.json`](../../../data/events.json) based on `date`.
2. Insert the JSON record with proper formatting.

### Step 4: Create Event Asset Directory
Ensure the photograph folder exists for future asset uploads:
```bash
mkdir -p assets/events/<event-id>
```

### Step 5: Update README & Automated Verification
1. If the total talk or city count changed, update any static count notes in [`README.md`](../../../README.md) (and E2E expectations in [`tests/e2e/orbit.spec.ts`](../../../tests/e2e/orbit.spec.ts) if applicable).
2. Run the automated validation script and test suite:
```bash
python3 .agents/skills/add-speaking-event/scripts/validate_events.py
npm run check
npm run test:unit
```
Confirm `validate_events.py`, `npm run check`, and `npm run test:unit` pass with zero errors.

---

## Detailed References
- Complete schema specifications, topic categories, and location mappings: [schema.md](./references/schema.md)
- Validator script: [validate_events.py](./scripts/validate_events.py)
