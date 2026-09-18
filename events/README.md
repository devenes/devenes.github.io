# Speaking Events Archive

This directory documents the structure and client-side routing convention for speaking events on [devenes.github.io](https://devenes.github.io).

## How Events Work

- All event data is centrally maintained in [`/data/events.json`](../data/events.json).
- Photographs for each event are stored in [`/assets/events/<event-id>/`](../assets/events/).
- Event detail views are accessible via shareable URL hashes matching each event's unique ID:
  `https://devenes.github.io/#<event-id>`

  For example:
  - `https://devenes.github.io/#demo-google-devfest-dubai-2025`

## Adding an Event

To add a new event, follow the instructions in the main [README.md](../README.md):
1. Create `assets/events/<event-id>/` and add 1–3 photos (`01.jpg`, `02.jpg`, etc.).
2. Add the event record to `data/events.json`.
3. Commit and push to GitHub.
