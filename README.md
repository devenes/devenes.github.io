# Enes Turan — Technical Speaker Archive & Constellation

An interactive, data-driven technical speaking archive and visual constellation for **Enes Turan (@devenes)**, Google Developer Expert and Platform Engineer.

Live site: [https://devenes.github.io](https://devenes.github.io)

---

## Architecture & Concept

The website is architected around the **Technical Constellation** concept:

1. **Spatial Constellation Discovery**: The verified speaking history is mapped as an interactive constellation. Time flows along the horizontal axis (from 2023 to 2026), and shared technical topics form visible, data-driven threads across conferences.
2. **Accessible Chronological Ledger**: Beneath the constellation sits a semantic, accessible chronological ledger allowing visitors to read, filter, search, and scan talks in detail.
3. **Data-Driven Architecture**: The entire site is rendered dynamically from [`data/events.json`](data/events.json). Adding an event automatically updates the total talk count, year timeline, constellation nodes, topic strip, technical threads, geographic reach, and archive rows without manual markup updates.
4. **Zero-Dependency Lightweight Core**: Built entirely with pure static HTML, CSS, Vanilla JavaScript, and JSON. No frameworks, build steps, or external dependencies. Deploys cleanly via GitHub Pages and GitHub Actions.

---

## Repository Structure

```text
/
├── index.html                  # Accessible semantic markup & landmarks
├── styles.css                  # Editorial & constellation design system
├── app.js                      # Constellation canvas, filtering & dialog engine
├── README.md                   # Site documentation & maintenance guide
│
├── data/
│   └── events.json             # Central authoritative speaking event database (43 talks)
│
├── assets/
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
- **Topic Illuminations**: Select or hover over any topic chip (e.g. `Kubernetes`, `AI Agents`, `Google Cloud`, `AI Infrastructure`) to trace its technical thread across years.
- **Node Context**: Hovering, focusing, or tapping on any node in the constellation illuminates connected talks sharing common technical topics and reveals the talk title, conference name, and date directly at the node.
- **Search**: Type in the search box (or press `/` from anywhere on the page) to filter talks across titles, events, cities, descriptions, and topics.
- **Event Dossier Dialog**: Click or press `Enter`/`Space` on any talk (in the constellation, city inspector, or archive ledger) to open an accessible modal dialog. Deep-links (`#<event-id>`) are automatically shareable and support browser back/forward history.
- **Geographic Layer**: The vector map projection and city roster highlight international speaking reach. Selecting any city marker or location pill highlights the community with an active pulse beacon and opens an in-place talks inspector without jumping away from the map.

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