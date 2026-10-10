# Event Schema & Architectural Reference

This reference details the data structures, geographical mapping, stream classification, and visual engine synchronization for speaking events on [devenes.github.io](https://devenes.github.io).

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

## 2. City Coordinates (`app.js`)

All physical locations must be defined in `CITY_COORDINATES` in `app.js` with exact geographic coordinates:

```javascript
'City Name, Country': { lat: 41.0082, lon: 28.9784, label: 'City Name', country: 'Country' }
```

If a new city is introduced, add it to `CITY_COORDINATES` and ensure it maps to one of the regional groupings in `REGION_DEFINITIONS`:
- `turkiye`: Türkiye
- `central-asia`: Kazakhstan, Uzbekistan, Kyrgyzstan, Mongolia
- `mena`: UAE, Egypt, Tunisia, Morocco, Saudi Arabia, etc.
- `balkans-caucasus`: Kosovo, Bosnia and Herzegovina, Azerbaijan
- `online`: Online

---

## 3. Technical River Streams

The visualization engine classifies each talk into one of six core architectural tracks based on `topics` and title keywords:

| Stream ID | Label | Color | Keywords |
| :--- | :--- | :--- | :--- |
| `agents` | Autonomous AI Agents & ADK | `#e11d48` | `ai agents`, `adk`, `agent`, `intelligent agents`, `agentic` |
| `genai` | Generative AI Systems | `#9333ea` | `generative ai`, `genai`, `gemini`, `ai trends`, `build with ai` |
| `mlops` | AI/ML & MLOps Platforms | `#6366f1` | `mlops`, `ai/ml`, `vertex ai`, `machine learning`, `kubernetes for ai` |
| `devops-sre` | DevOps & Global SRE | `#d97706` | `sre`, `reliability`, `observability`, `devops`, `software delivery` |
| `kubernetes` | Kubernetes & GKE Platforms | `#0284c7` | `kubernetes`, `gke`, `gke enterprise`, `scheduling`, `containers` |
| `cloud` | Cloud Architecture & Serverless | `#2563eb` | `google cloud`, `cloud architecture`, `serverless`, `cloud run` |

---

## 4. Milestone Callouts (`app.js`)

Keynotes and flagship sessions can be featured along the river timeline by registering an entry in `MILESTONE_CALLOUTS`:

```javascript
const MILESTONE_CALLOUTS = {
  // ...
  '<event-id>': 'Short Milestone Label'
};
```
