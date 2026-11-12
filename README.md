# Enes Turan — Global Speaking Atlas

An interactive, data-driven 3D **Global Speaking Atlas** and technical speaking archive for **Enes Turan (@devenes)**, Google Developer Expert (Cloud & AI) and Platform Engineer.

Live site: [https://devenes.github.io](https://devenes.github.io)

---

## Architecture & Concept

The website combines an interactive 3D WebGL Earth globe with a structured multi-mode discovery deck, synchronized from a single authoritative data source ([`data/events.json`](data/events.json) and [`data/locations.json`](data/locations.json)):

1. **Interactive 3D Earth Globe (`Three.js`)**: Plots 23 verified physical speaking destinations across 12 countries using spherical latitude/longitude conversion, great-circle geodesic flight arcs (`Slerp`), custom atmospheric Fresnel shaders, Natural Earth 110m vector coastlines ([`data/land.json`](data/land.json)), and occlusion-aware 2D city markers.
2. **4-Mode Discovery Deck**:
   - **Globe View**: Prominent speaking hubs, full destination selector, and a tabbed city inspector (**Talks**, **Photos**, **About**).
   - **Regions View**: Geographic distribution across **Türkiye**, **Central Asia**, **Middle East & North Africa**, **Europe, Balkans & Caucasus**, and **Online & Global Broadcasts**.
   - **Timeline View**: Chronological era narratives and talk cards across **2023 → 2026**.
   - **Topics View**: 5 core architectural tracks (**AI Agents & GenAI**, **Kubernetes & Platform Engineering**, **AI/ML & MLOps**, **Cloud & Serverless Architecture**, **DevOps, SRE & Community**).
3. **Chronological Timeline Strip**: Bottom horizontal signal strip with year tabs (including per-year talk counts), active topic filter badges, and smooth scroll controls.
4. **Searchable Full Archive Modal (`⌘K` / `/`)**: Full-screen native `<dialog>` matrix supporting instant free-text search, session format filters (`All`, `Talk`, `Workshop`, `Keynote`), topic cluster filters, year filters, and city filters.
5. **Event Dossier Drawer**: Native modal `<dialog>` displaying session type, coordinates, abstract, topic tags, verified event photography, external resources (event page, slides, recording, LinkedIn), and related regional sessions. Supports direct URL hash deep-linking (`#<event-id>` and `#<city-id>`).

---

## Repository Structure

```text
/
├── astro.config.mjs                # Astro 5 static build & root asset pipeline config
├── package.json                    # Scripts & dependencies (Astro 5, Three.js, Tailwind, Vitest, Playwright)
├── README.md                       # Site documentation & maintenance guide
│
├── data/
│   ├── events.json                 # Authoritative speaking event database (44 talks)
│   ├── locations.json              # Verified city coordinates, country codes & regional notes (23 physical cities)
│   └── land.json                   # Public-domain Natural Earth 110m vector land geometry
│
├── assets/
│   ├── profile/                    # Speaker portrait assets
│   └── events/                     # Event photograph folders (<event-id>/01.jpg, 02.jpg...)
│
├── public/
│   └── textures/
│       └── earth-atlas.webp        # Locally generated 2048x1024 equirectangular Earth texture
│
├── src/
│   ├── pages/
│   │   └── index.astro             # Main application shell, SEO/JSON-LD metadata & modern CSS rules
│   ├── components/
│   │   ├── TopNav.astro            # Primary navigation header
│   │   ├── HeroOverview.astro      # Speaker identity, headline & live metric counters
│   │   ├── DestinationPanel.astro  # 4-mode right-hand inspector deck (Globe, Regions, Timeline, Topics)
│   │   ├── RecentSignals.astro     # Bottom chronological timeline strip & year filters
│   │   ├── ArchiveMatrix.astro     # Full searchable archive <dialog> (⌘K / /)
│   │   ├── SignalDrawer.astro      # Event dossier <dialog>
│   │   └── AboutModal.astro        # Speaker biography <dialog>
│   ├── scripts/
│   │   ├── earthGlobe.ts           # Three.js WebGL Earth controller, geodesic arcs & label projection
│   │   └── atlasController.ts      # UI state machine, filtering, dialogs & URL hash deep-linking
│   └── utils/
│       ├── geography.ts            # Build-time & runtime aggregation of events, cities, regions & topics
│       └── paths.ts                # Coordinate formatting, date formatting & base URL resolution
│
└── tests/
    ├── unit/                       # Vitest unit tests (geography aggregation, coordinate & date formatting)
    └── e2e/                        # Playwright E2E test suite
```

---

## Event Data Schema

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
| `city` | `string` | **Yes** | `"<City>, <Country>"` (mapped in `data/locations.json`) or `"Online"` |
| `talk` | `string` | **Yes** | Title of presentation, workshop, or keynote |
| `photos` | `array` | **Yes** | Array of image paths (empty `[]` or `["assets/events/<id>/01.jpg"]`) |
| `description` | `string` | **Yes** | Abstract or summary of session |
| `topics` | `array` | **Yes** | Technical tags (e.g. `["Kubernetes", "AI Agents"]`) |
| `slidesUrl` | `string` | No | Link to slide deck |
| `recordingUrl` | `string` | No | Link to video recording |
| `eventUrl` | `string` | No | Official event or schedule page |
| `linkedinUrl` | `string` | No | LinkedIn post or announcement |

---

## How to Add a New Event

1. **(Optional)** If you have stage photos, create `assets/events/<new-event-id>/` and place `01.jpg`, `02.jpg`, etc.
2. **Verify City Coordinates**: Ensure the physical city exists in [`data/locations.json`](data/locations.json) and its `"<City>, <Country>"` string is mapped in `CITY_STRING_TO_LOCATION_ID` in [`src/utils/geography.ts`](src/utils/geography.ts).
3. **Add the JSON object** in reverse chronological order (newest `date` first) to [`data/events.json`](data/events.json).
4. **Validate and test**:
   ```bash
   python3 .agents/skills/add-speaking-event/scripts/validate_events.py
   npm test
   ```

---

## Local Development & Verification

```bash
# Start Astro dev server (http://localhost:4321)
npm run dev

# Run TypeScript & Astro type checks
npm run check

# Run unit tests (Vitest)
npm run test:unit

# Build production site and run full Playwright E2E suite
npm test
```

---

## Accessibility & Modern Web Standards

- **Native `<dialog>` Elements**: `#signal-drawer`, `#archive-matrix-modal`, and `#about-modal` use native `<dialog closedby="any">` with `showModal()`, top-layer focus management, `overscroll-behavior: contain`, light-dismiss fallback, and automatic WebGL render loop pause when open.
- **Keyboard Navigation**: Arrow-key navigation across `tablist` controls (`Globe · Regions · Timeline · Topics` and `Talks · Photos · About`), global `⌘K` / `Ctrl+K` and `/` archive shortcuts, and `Escape` dismissal.
- **Typography & Layout Stability**: Metric-adjusted `@font-face` fallbacks (`size-adjust`, `ascent-override`, `descent-override`), `text-wrap: balance` on headings, `text-wrap: pretty` on body copy, and `tabular-nums` on telemetry counters.
- **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)` and provides explicit Pause/Resume motion controls on both desktop and mobile viewports.