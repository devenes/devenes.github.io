# Event Schema & Architectural Reference

This reference details the data structures, geographical mapping, and topic classification for speaking events on [devenes.github.io](https://devenes.github.io).

---

## 1. Event Record Schema (`data/events.json`)

Each event in `data/events.json` is a JSON object with the following fields:

| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | Unique URL slug (kebab-case) | `"ai-surgery-congress-istanbul-2026"` |
| `date` | `string` | **Yes** | Date in `YYYY-MM-DD` format | `"2026-10-10"` |
| `event` | `string` | **Yes** | Event / conference name | `"1st National AI in Surgery Congress"` |
| `city` | `string` | **Yes** | `"<City>, <Country>"` or `"Online"` | `"Istanbul, Türkiye"` |
| `talk` | `string` | **Yes** | Presentation or workshop title | `"Transforming Surgical Problems into AI Projects with Google AI Agents Workshop"` |
| `photos` | `string[]` | **Yes** | Image paths relative to repo root | `[]` or `["assets/events/<id>/01.jpg"]` |
| `description` | `string` | **Yes** | Abstract / agenda (supports `\n\n` paragraphs) | Full session abstract and syllabus |
| `topics` | `string[]` | **Yes** | Array of technical tags | `["AI Agents", "Healthcare AI", "Computer Vision"]` |
| `slidesUrl` | `string` | No | Link to presentation deck | `"https://speakerdeck.com/example"` |
| `recordingUrl` | `string` | No | Link to recorded talk / session | `"https://youtube.com/watch?v=..."` |
| `eventUrl` | `string` | No | Link to official event website | `"https://example.com/event"` |
| `linkedinUrl` | `string` | No | Link to post or announcement | `"https://linkedin.com/posts/..."` |

### Ordering Rule
Events in `data/events.json` **must be sorted in reverse chronological order** (newest `date` first).

---

## 2. City Coordinates (`data/locations.json` & `src/utils/geography.ts`)

All physical locations are stored in `data/locations.json` (`locations` array) with exact geographic coordinates:

```json
{
  "id": "istanbul-tr",
  "city": "Istanbul",
  "country": "Türkiye",
  "countryCode": "TR",
  "lat": 41.0082,
  "lon": 28.9784,
  "eventsCount": 7,
  "years": [2023, 2024, 2025, 2026],
  "highlights": ["KCD Istanbul", "DevFest Istanbul"],
  "note": "Primary engineering hub"
}
```

And mapped in `src/utils/geography.ts` via `CITY_STRING_TO_LOCATION_ID` and `COUNTRY_METADATA` into one of five regional groupings (`RegionId`):
- `turkiye`: Türkiye
- `central-asia`: Kazakhstan, Uzbekistan, Kyrgyzstan, Mongolia
- `mena`: UAE, Egypt, Tunisia, Morocco
- `europe-caucasus`: Kosovo, Bosnia and Herzegovina, Azerbaijan
- `online`: Online & Global Broadcasts

---

## 3. Topic Categories (`src/utils/geography.ts`)

`classifyTopicCategories()` maps each talk's `topics` and title keywords into one or more of five core topic tracks (`TopicCategoryId`):

| Category ID | Name | Accent Color |
| :--- | :--- | :--- |
| `ai-agents` | AI Agents & GenAI | `#38BDF8` |
| `kubernetes` | Kubernetes & Platform Engineering | `#60A5FA` |
| `mlops` | AI/ML & MLOps | `#818CF8` |
| `cloud` | Cloud & Serverless Architecture | `#2DD4BF` |
| `devops-sre` | DevOps, SRE & Community | `#F59E0B` |
