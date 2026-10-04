# Enes Turan — Speaking Archive

A modern, photo-first public speaking archive for **Enes Turan (@devenes)**, Google Developer Expert and public speaker.

Live site: [https://devenes.github.io](https://devenes.github.io)

---

## How to Add a New Speaking Event

Adding a new event requires **zero HTML or CSS changes**. You only upload 1–3 photographs and add one JSON object.

### The 5-Step Workflow

1. **Create the event folder**:
   ```text
   assets/events/my-event-2026/
   ```

2. **Upload 1–3 photographs** into that folder:
   ```text
   01.jpg
   02.jpg
   03.jpg
   ```

3. **Add the event object** to [`data/events.json`](data/events.json):
   ```json
   {
     "id": "my-event-2026",
     "date": "2026-10-10",
     "event": "Example Conference",
     "city": "Istanbul, Türkiye",
     "talk": "My Talk Title",
     "photos": [
       "assets/events/my-event-2026/01.jpg",
       "assets/events/my-event-2026/02.jpg"
     ]
   }
   ```

4. **Commit and push** your changes to GitHub:
   ```bash
   git add .
   git commit -m "Add speaking event: Example Conference 2026"
   git push origin master
   ```

5. **The website updates automatically** via GitHub Actions &amp; GitHub Pages in about 1–2 minutes!

---

## Event Data Fields

### Required Fields (v1)

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique URL-friendly slug | `"my-event-2026"` |
| `date` | `string` | Event date in `YYYY-MM-DD` format | `"2026-10-10"` |
| `event` | `string` | Conference / meetup / event name | `"Google DevFest Istanbul"` |
| `city` | `string` | City and Country | `"Istanbul, Türkiye"` |
| `talk` | `string` | Title of your session or talk | `"Kubernetes with Google Cloud"` |
| `photos` | `array` | List of relative image paths (1–3 photos) | `["assets/events/.../01.jpg"]` |

### Optional Extensible Fields

You can optionally include extra metadata at any time:

```json
{
  "id": "cloud-summit-2026",
  "date": "2026-11-15",
  "event": "Cloud Summit 2026",
  "city": "London, UK",
  "talk": "Architecting Resilient Cloud Systems",
  "photos": [
    "assets/events/cloud-summit-2026/01.jpg"
  ],
  "organizer": "Cloud Native Foundation",
  "description": "Keynote presentation on distributed resiliency patterns and multi-region failover.",
  "topics": ["Cloud", "Kubernetes", "Architecture"],
  "eventUrl": "https://example.com",
  "slidesUrl": "https://speakerdeck.com/example",
  "recordingUrl": "https://youtube.com/watch?v=example",
  "linkedinUrl": "https://linkedin.com/posts/example"
}
```

---

## Repository Structure

```text
/
├── index.html                  # Semantic, accessible website markup
├── styles.css                  # Editorial design system & responsive archive styles
├── app.js                      # Vanilla JavaScript rendering engine
├── README.md                   # Site documentation & maintenance guide
│
├── data/
│   └── events.json             # Central speaking event database
│
├── events/
│   └── README.md               # Details on event archive & URL routing
│
├── assets/
│   ├── profile/
│   │   └── README.md           # Instructions for speaker headshots
│   │
│   ├── events/
│   │   └── README.md           # Instructions for event photo directories
│   │
│   └── icons/                  # SVG icons (calendar, location, links, etc.)
│
└── .github/
    └── workflows/
        └── pages.yml           # Automated GitHub Pages deployment
```

---

## Photo Guidelines

- **Folder Location**: `assets/events/<event-id>/`
- **File Names**: `01.jpg`, `02.jpg`, `03.jpg`
- **Primary Cover**: `01.jpg` is shown on the homepage card.
- **Aspect Ratio**: 16:9 or 3:2 landscape photos look best.
- **Graceful Placeholder**: If you add an event before uploading photos, or if an image file is missing, the site automatically renders a tasteful CSS placeholder with the event title.

---

## Local Development & Testing

To preview the website locally on your computer:

```bash
# Using Python 3 built-in server:
python3 -m http.server 8080

# Then open in your browser:
# http://localhost:8080
```

---

## GitHub Pages Deployment

The site is built with pure static HTML, CSS, and vanilla JavaScript.

When you push to the `master` branch, the GitHub Actions workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml) triggers automatically and deploys to:

[https://devenes.github.io](https://devenes.github.io)

To ensure GitHub Pages is enabled:
1. Go to your repository **Settings** &gt; **Pages**.
2. Under **Build and deployment** &gt; **Source**, select **GitHub Actions**.