# Implementation Plan — Star Wars Data Grid (Angular)

## Goal
Build a **single-page Angular** (front-end only) app that displays **Starships** from **SWAPI** in a feature-rich grid.

**External API (read-only):** https://swapi.dev/
**Resource used:** `/api/starships/`

## What the project requires (checklist)
- Single page with:
  - Header/toolbar title
  - Search/filter area
  - Scrollable grid that fills remaining viewport height
- Data grid with multiple columns (name/model/manufacturer/crew/passengers/hyperdrive/etc.)
- **Infinite scroll** using SWAPI pagination (`?page=`)
  - Append rows seamlessly
  - **No “loading more” indicator while scrolling**
  - Cache fetched pages (no refetch)
  - Stop requesting when there are no more pages
- **Search** above grid
  - Clear empty state when no rows match
- **Editable cells**
  - At least one editable column (client state only)
  - Enter/blur to save; Escape to cancel (nice-to-have)
- UX:
  - Initial loader allowed
  - On API error: show message + retry
  - Responsive layout (horizontal scroll allowed)
- Minimal tests:
  - 1 unit test for SWAPI service
  - 1 unit test for grid component
- README describing: setup, chosen resource, infinite scroll behavior, caching, editable column storage, column resizing, trade-offs.

## Repository file map (actual)
- `src/app/app.ts` / `src/app/app.html`: root layout + search input
- `src/app/components/starship-grid/*`: grid UI, infinite scroll, resize, editing, error states
- `src/app/services/swapi.service.ts`: SWAPI fetch + page cache + in-flight de-dupe
- `src/app/models/starship.model.ts`: Starship model + id derived from SWAPI URL
- `README.md`: deliverable documentation
- `PLAN.md`: this plan

---

## Step-by-step plan

### 1) Project setup
- Ensure Angular is a recent version.
- Add Tailwind (or UI lib). Keep styling simple and readable.

### 2) Types & model
- Define SWAPI list response type (`count/next/previous/results`).
- Create `Starship` model and derive a stable `id` from `dto.url`.

### 3) SWAPI service (pagination + caching)
Implement a `SwapiService` that:
- Fetches pages with `fetch()` (GET only).
- Caches pages in-memory: `Map<page, response>`.
- De-dupes in-flight requests so the same page isn’t fetched twice concurrently.
- Exposes helpers for pagination/merging if needed.

### 4) Base layout (single page)
- Header with title (e.g. “Star Wars Directory”).
- Search input above the grid.
- Main area is a flex container so the grid fills the viewport height.

### 5) Grid: columns + rendering
- Render a table with useful starship columns:
  - Name, Model, Manufacturer, Crew, Passengers, Hyperdrive rating, MGLT, Class, …
- Support smaller screens via horizontal scroll (`min-w-max`).

### 6) Infinite scroll (server-side pagination)
- Listen to the grid container scroll event.
- When close to bottom, fetch `nextPage` and append.
- Do **not** show a spinner/skeleton tied to load-more.
- Stop when `next === null` and show an “End of list” row.
- Prevent overfetch:
  - Guard with `loadingMore` / `hasReachedEnd`.
  - Track `loadedPages` defensively.

### 7) Search
- Filter by `name`.
- Show an empty state when no rows match.
- To avoid overfetch, **do not load more pages while searching** (search applies to already loaded rows).

### 8) Editable cell (client-only state)
- Make at least one column editable (Crew).
- UX:
  - Start editing via double-click
  - Save on Enter or blur
  - Cancel on Escape
- Store edits in client state:
  - `Map<starshipId, Partial<Starship>>`
- Display patched values in the grid.

### 9) Column resizing
- Add a resize handle in each resizable header.
- On drag, update the width immediately.
- Enforce a min width per column.

### 10) Error handling + retry
- Initial load errors: show message + Retry.
- Load-more errors: show a small banner + Retry.

### 11) Minimal tests (required)
- SwapiService test: caching / pagination helper / error behavior.
- Grid component test: editing or search empty state.

### 12) README (deliverable)
Document:
- How to run
- Chosen SWAPI resource
- Infinite scroll + caching + “no loader while scrolling”
- Editable column(s) and where edits are stored
- Column resizing approach
- Trade-offs / limitations

---

## Important note — SWAPI TLS availability
If `swapi.dev` has an invalid TLS certificate (example: `net::ERR_CERT_DATE_INVALID`), browsers will block requests.
This is an external dependency issue: the app will show its error + retry UI until SWAPI is fixed.
