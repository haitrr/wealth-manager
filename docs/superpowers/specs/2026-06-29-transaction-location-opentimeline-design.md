# Transaction Location via OpenTimeline Integration

**Date:** 2026-06-29  
**Status:** Approved

## Overview

Add optional location support to transactions by integrating with OpenTimeline — a self-hosted GPS timeline service. When a user adds or edits a transaction, wealth-manager auto-suggests the place they were at based on the transaction's date/time. Users can also manually search OpenTimeline places as a fallback.

## Architecture

Wealth-manager adds a backend proxy layer that reads the OpenTimeline URL from the user's settings and forwards requests server-side. The frontend never calls OpenTimeline directly.

```
Transaction Form
  → (on date change) GET /api/integrations/opentimeline/visits?at=<ISO>
      → UserSettings.openTimelineUrl → OpenTimeline GET /api/visits
  → (manual search)  GET /api/integrations/opentimeline/places?q=<term>
      → UserSettings.openTimelineUrl → OpenTimeline GET /api/places?q=<term>
```

If `openTimelineUrl` is not configured, the location field is hidden entirely — no broken UI.

## Data Model

### `UserSettings` — add OpenTimeline URL

```prisma
model UserSettings {
  // ...existing fields...
  openTimelineUrl  String?   // e.g. "http://localhost:3000"
}
```

### `Transaction` — add location reference

```prisma
model Transaction {
  // ...existing fields...
  locationPlaceId    String?   // OpenTimeline place ID
  locationPlaceName  String?   // Denormalized name for display without a live query
}
```

`locationPlaceName` is stored alongside the ID so the transaction list and detail views can display the place name without hitting OpenTimeline on every render.

## API Routes

Both routes are authenticated via the existing session auth.

### `GET /api/integrations/opentimeline/visits?at=<ISO>`

- Reads `openTimelineUrl` from the current user's settings
- Calls `GET <openTimelineUrl>/api/visits?start=<at>&end=<at+1min>&status=confirmed`
- Returns `{ placeId, placeName }` for the first matching visit, or `null` if none found
- Returns `503` if `openTimelineUrl` is not configured

### `GET /api/integrations/opentimeline/places?q=<term>`

- Reads `openTimelineUrl` from the current user's settings
- Calls `GET <openTimelineUrl>/api/places?q=<term>`
- Returns `{ places: [{ id, name }] }`
- Returns `503` if `openTimelineUrl` is not configured

## Settings UI

Add an **Integrations** section to the existing settings area (`/app/settings/`). It contains a single field: **OpenTimeline URL** (text input, e.g. `http://localhost:3000`). Saved to `UserSettings.openTimelineUrl`.

## Transaction Form UX

A new optional **Location** field is added between Details and the save button.

### Auto-suggest flow

1. On form mount (or when date changes), query `/api/integrations/opentimeline/visits?at=<date>`
2. If a place is returned, show a suggested pill: place name with Accept / Clear actions
3. Accept locks in the place; Clear falls through to the manual search state

### Manual search fallback

- If no suggestion found, or after clearing, show a `Search location...` text input
- Debounced query to `/api/integrations/opentimeline/places?q=<term>` as the user types
- Dropdown of matching places to select from

### Display in list/detail views

Show `locationPlaceName` as a small secondary line under the description — no live query needed.

## Out of Scope

- Syncing or caching OpenTimeline data locally
- Creating new OpenTimeline places from within wealth-manager
- Showing a map or coordinates in the UI
- Authentication/API key support for OpenTimeline (plain URL only for now)
