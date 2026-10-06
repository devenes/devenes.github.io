# Enes Turan — Technical Speaker Archive & Data Visualizations

An interactive, data-driven technical speaking archive featuring two complementary visualizations for **Enes Turan (@devenes)**, Google Developer Expert and Platform Engineer:

1. **The Technical River**: Topic evolution and distribution across cloud, Kubernetes, and AI themes over time.
2. **The Speaking Journey (Global Speaking Signal)**: A cinematic timeline visualization tracing real speaking voyages chronologically across Eurasia, the Mediterranean, Middle East, and Central Asia.

Live site: [https://devenes.github.io](https://devenes.github.io)

---

## Architecture & Concept

The website couples two specialized data art visualizations sharing a single authoritative data source:

1. **The Technical River**: Visualizes the evolution and distribution of speaking topics over time. Time flows horizontally from 2023 to 2026. Each flowing channel represents a core technical theme (Cloud & Infrastructure, Kubernetes & Platforms, AI/ML & MLOps, GenAI & Autonomous Agents), expanding and converging based on real speaking volume across years.
2. **The Speaking Journey (Global Speaking Signal)**: A cinematic timeline visualization—data visualization, not cartography. Rather than an interactive map dashboard, the camera automatically travels through real speaking locations in chronological order. Utilizes an orthographic globe projection in D3, calculating great-circle spherical geodesics, distance-adaptive camera timing and zoom, calm arrival holds, seamless repeated-city handling, and global online interludes.
3. **Discrete Event Signals**: Individual talks are situated along their respective theme channels as discrete interactive nodes (`●`). Hovering or focusing displays talk metadata, while clicking opens the full speaking dossier dialog.
4. **"Play History" Mode**: Chronologically animates through 2023 → 2024 → 2025 → 2026 accompanied by contextual editorial commentary explaining the architectural shifts.
5. **Data-Driven Geographic Reach**: A lightweight regional distribution ribbon and cards break down speaking impact across 23 cities and 5 major regions (Türkiye, Central Asia, MENA, Balkans & Caucasus, and Online/Global), with an in-place talks inspector.
6. **Accessible Chronological Ledger**: Beneath the visualizations sits a semantic, accessible chronological ledger allowing visitors to read, filter, search, and scan talks in detail.
7. **Unified Application State**: All views (River, Journey, Reach, Ledger, Dossier) synchronize from [`data/events.json`](data/events.json). Inspecting a talk from any visualization automatically updates the shared event dossier.
8. **Zero-Dependency Lightweight Core**: Fully self-contained with local land geometry ([`data/land.json`](data/land.json)) and vendored D3 ([`assets/vendor/d3.min.js`](assets/vendor/d3.min.js)). No third-party API tokens, Mapbox dependencies, or external runtime build steps. Deploys cleanly via GitHub Pages.

---

## Repository Structure

```text
/
├── index.html                  # Accessible semantic markup & landmarks
├── styles.css                  # Editorial, Technical River & Speaking Journey design system
├── app.js                      # River SVG engine, D3 Globe Journey engine & dialog system
├── README.md                   # Site documentation & maintenance guide
│
├── data/
│   ├── events.json             # Central authoritative speaking event database (43 talks)
│   └── land.json               # Lightweight self-contained world land geometry (Natural Earth)
│
├── assets/
│   ├── vendor/
│   │   └── d3.min.js           # Self-contained D3 library for spherical orthographic projections
│   ├── profile/                # Headshot & speaker profile assets
│   ├── events/                 # Event photograph folders (<event-id>/01.jpg, 02.jpg...)
│   └── icons/                  # SVG icons (links, badges, indicators)
│
└── .github/
    └── workflows/
        └── pages.yml           # Automated GitHub Pages deployment workflow
```

---

## Interaction Model

- **Year Focus**: Select any year (`ALL YEARS`, `2026`, `2025`, `2024`, `2023`) to isolate talks delivered in that period.
- **Play History**: Click `▶ PLAY HISTORY` to watch a guided, animated progression through the 4-year technical journey.
- **Topic Streams**: Select or hover over any topic chip or river channel to illuminate its stream while others gently recede.
- **Signal Context**: Hovering or focusing on any talk signal along the river displays its exact date, location, event, and abstract preview.
- **Search**: Type in the search box (or press `/` from anywhere on the page) to filter talks across titles, events, cities, descriptions, and topics.
- **Event Dossier Dialog**: Click or press `Enter`/`Space` on any talk signal or archive row to open an accessible modal dialog. Deep-links (`#<event-id>`) are automatically shareable and support browser back/forward history.
- **Geographic Reach**: The regional distribution bar, summary cards, and city roster highlight international speaking reach across host communities without heavy cartographic maps.

---

## Event Data Fields

All speaking history is maintained in [`data/events.json`](data/events.json):

```json
{
  "id": "devfest-dubai-2026",
  "date": "2026-09-27",
  "event": "DevFest Dubai 2026",
  "city": "Dubai, UAE",
  "talk": "Kubernetes for AI",
  "photos": [],
  "description": "Architecting resilient AI model serving on Google Kubernetes Engine.",
  "topics": ["Kubernetes", "AI", "GKE", "Google Cloud"],
  "slidesUrl": "https://speakerdeck.com/example",
  "recordingUrl": "https://youtube.com/watch?v=example",
  "eventUrl": "https://example.com",
  "linkedinUrl": "https://linkedin.com/posts/example"
}
```

### Supported Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | Unique URL slug (e.g. `"devfest-dubai-2026"`) |
| `date` | `string` | **Yes** | Event date in `YYYY-MM-DD` format |
| `event` | `string` | **Yes** | Conference, summit, or meetup name |
| `city` | `string` | **Yes** | City and country (or `"Online"`) |
| `talk` | `string` | **Yes** | Title of presentation or keynote |
| `photos` | `array` | **Yes** | Array of image paths (empty `[]` or `["assets/events/.../01.jpg"]`) |
| `description` | `string` | No | Abstract or summary of session |
| `topics` | `array` | No | Technical tags (e.g. `["Kubernetes", "AI Agents"]`) |
| `slidesUrl` | `string` | No | Link to slide deck |
| `recordingUrl` | `string` | No | Link to video recording |
| `eventUrl` | `string` | No | Official event or schedule page |
| `linkedinUrl` | `string` | No | LinkedIn post or announcement |

---

## Photo Structure & Guidelines

- **Folder Location**: `assets/events/<event-id>/`
- **File Naming**: `01.jpg`, `02.jpg`, `03.jpg`
- **Graceful Photo States**:
  - **0 photos**: Displays an authentic, refined archival dossier state: *"Archival record filed · Media pending verified upload"*.
  - **1 photo**: Displays a high-resolution cover image with responsive framing and lazy loading.
  - **2–3 photos**: Displays an interactive gallery carousel with photo counter (`01 / 03`), prev/next navigation, clickable thumbnail strip, and arrow key support.

---

## How to Add a New Event

1. **(Optional)** If you have photos, create `assets/events/<new-event-id>/` and place `01.jpg`, `02.jpg`, etc.
2. **Add the JSON object** to [`data/events.json`](data/events.json).
3. **Commit and push** to the `master` branch:
   ```bash
   git add .
   git commit -m "feat: add speaking event <event-name>"
   git push origin master
   ```
4. GitHub Pages will build and deploy the update in under 2 minutes.

---

## Local Development & Testing

Run a local HTTP server from the root directory:

```bash
# Python 3:
python3 -m http.server 8080

# Then open in your browser:
# http://localhost:8080
```

Verify JavaScript syntax:

```bash
node --check app.js
```

---

## Accessibility & Standards Compliance

- **Semantic landmarks**: `<header>`, `<main>`, `<section>`, `<dialog>`, `<footer>`, `<nav>`, `<article>`, `<time>`.
- **Keyboard navigation**: Every node, filter, and archive row is focusable with clear focus rings.
- **Native `<dialog>`**: Built with native dialog semantics, `closedby="any"` light dismiss, focus restoration to previous element, and escape key listener.
- **Reduced motion**: Respects `@media (prefers-reduced-motion: reduce)` by disabling transitions and animations.
- **Zero build dependencies**: Native ESM / Vanilla JS and CSS variables compatible with modern browsers.