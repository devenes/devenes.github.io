# Event Photographs

Photographs for each speaking event are organized in dedicated subdirectories named after the event `id`.

## Directory Structure

```text
assets/events/
├── README.md
├── <event-id-1>/
│   ├── 01.jpg
│   ├── 02.jpg
│   └── 03.jpg
└── <event-id-2>/
    ├── 01.jpg
    └── 02.jpg
```

## Guidelines

1. **Folder Name**: Must match the `id` field defined in `data/events.json`.
2. **File Naming**: Use clean, sequential numbers such as `01.jpg`, `02.jpg`, `03.jpg`.
3. **Primary Photo**: `01.jpg` is displayed as the primary cover photo on the homepage grid card.
4. **Dimensions & Size**:
   - Landscape 16:9 or 3:2 aspect ratios work best.
   - Standard resolution: ~1600–1920px width.
   - Compress JPEG photos (quality ~80–85%) to stay around 200–500 KB per photo for rapid GitHub Pages delivery.
