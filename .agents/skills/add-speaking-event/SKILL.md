---
name: add-speaking-event
description: >-
  Add, update, or document technical speaking events and conference activities in the devenes.github.io repository.
  Use when the user asks to add a new talk, speech activity, workshop, keynote, or conference appearance to the website.
  Handles ID generation, city coordinate mapping, stream assignment, English translation, events.json reverse chronological ordering,
  river milestone registration, counter synchronization across index.html/README.md, assets folder creation, and automated validation.
---

# Add Speaking Event Skill

Use this runbook to add a new speaking engagement, keynote, or workshop to [devenes.github.io](https://devenes.github.io).

The site maintains synchronized state across two data visualizations (**The Technical River** and **The Speaking Journey Globe**), the accessible chronological archive ledger, and modal dossiers—all driven by [`data/events.json`](../../../data/events.json).

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
- **Photos (`photos`):** Initialized to `[]` if photographs are not yet available.
- **Optional Links:** `slidesUrl`, `recordingUrl`, `eventUrl`, `linkedinUrl` if provided.

### Step 2: Verify Geographic Coordinates
Check if `event.city` exists in `CITY_COORDINATES` in [`app.js`](../../../app.js).
- If it exists (e.g. `'Istanbul, Türkiye'`), proceed.
- If it is a new physical city, add the coordinate entry to `CITY_COORDINATES`:
  ```javascript
  'City, Country': { lat: XX.XXXX, lon: YY.YYYY, label: 'City', country: 'Country' }
  ```
  And verify that `REGION_DEFINITIONS` includes this country.

### Step 3: Insert Event into `data/events.json`
Events **must be ordered in reverse chronological order** (newest `date` first).
1. Locate the correct index in [`data/events.json`](../../../data/events.json) based on `date`.
2. Insert the JSON record with proper formatting.

### Step 4: Register Visual Milestone & Narratives in `app.js`
1. **Milestone Callout:** If the event is a keynote or notable milestone, add an entry to `MILESTONE_CALLOUTS` in `app.js`:
   ```javascript
   '<event-id>': 'Short Milestone Label'
   ```
2. **Era Narrative:** If the total talk count changed (e.g., 43 → 44), update:
   - `ERA_NARRATIVES.all.text`: `"Tracing <N> speaking engagements across 4 years..."`
   - Year narrative (e.g., `2026`) if the new talk introduces a new theme.
   - Any fallback signal indices (e.g., `seqIndex || <N>`).

### Step 5: Synchronize Talk Counters in `index.html` & `README.md`
When a new talk increments the total count (e.g. `44`):
1. In [`index.html`](../../../index.html):
   - `<meta name="description">` & `<meta property="og:description">` & `<meta name="twitter:description">`
   - `<strong id="hero-talk-count">`
   - Section description in `#river`
   - `#field-status` and `#era-text`
   - `#journey-counter` (`STOP 01 / <N>`)
   - Scrubber comment (`<!-- Dynamically populated <N> stop notches -->`)
   - `#archive-count` (`<N> talks`)
   - `#dialog-index` (`01 / <N>`)
2. In [`README.md`](../../../README.md):
   - Update `data/events.json # Central authoritative speaking event database (<N> talks)`

### Step 6: Create Event Asset Directory
Ensure the photograph folder exists for future asset uploads:
```bash
mkdir -p assets/events/<event-id>
```

### Step 7: Automated Verification
Run the automated validation script and check JavaScript syntax:
```bash
python3 .agents/skills/add-speaking-event/scripts/validate_events.py
node -c app.js
```
Confirm:
1. `validate_events.py` reports `PASSED: All validation checks passed successfully!`.
2. `node -c app.js` finishes with zero syntax errors.
3. Review changes using `rtk git status` and `rtk git diff`.

---

## Detailed References
- Complete schema specifications, stream mappings, and coordinates: [schema.md](./references/schema.md)
- Validator script: [validate_events.py](./scripts/validate_events.py)
