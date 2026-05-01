# Star Wars Data Grid (Angular)

Single-page Angular app that displays **Starships** from **SWAPI** in a feature-rich data grid.

## Setup

```bash
npm install
npm start
```

Open: http://localhost:4200

## SWAPI Resource

- Resource used: `https://swapi.dev/api/starships/`

## Data Grid Features

### Infinite scroll (server-side pagination)
- Uses SWAPI pagination via `?page=`
- Fetches next page automatically when you scroll near the bottom of the grid
- **No loader / spinner while scrolling** (rows appear seamlessly)
- Pages are cached client-side in-memory so they are not requested again
- When `next === null`, the grid shows an “End of list” message and stops requesting more pages

### Search
- Global search input above the grid
- Filters rows by **name**
- Shows a clear empty state when no rows match
- To avoid overfetch, the app **does not fetch more pages while searching** (search filters already-loaded rows)

### Editable cells
- The **Crew** column is editable (client-state only)
- Start editing by **double-clicking** the Crew cell
- Confirm with **Enter** (or blur)
- Cancel with **Escape**
- Edits are stored in client state (`Map<starshipId, Partial<Starship>>`) and do not write to SWAPI
- This is designed so it can be replaced later with API writes

### Column resizing
- Columns can be resized by dragging the handle on the right side of a header cell
- Width is applied immediately in the UI

## Error handling
- Initial load: shows an error message + **Retry**
- Load-more errors (while scrolling): shows a small non-blocking banner + **Retry**

## Testing

```bash
npm test
```

Includes:
- 1 unit test suite for `SwapiService` (cache + pagination helpers + error stream)
- 1 unit test suite for `StarshipGridComponent` (editing + empty state)

## Third-party packages
- Tailwind CSS (styling)
- Angular Material is installed but the UI is primarily Tailwind in this solution

## Trade-offs / limitations
- Search is client-side and only filters already-loaded rows (no server-side search)
- Infinite scroll is disabled while searching to prevent overfetch
- SWAPI availability is an external dependency. If `swapi.dev` has an invalid TLS certificate (for example `net::ERR_CERT_DATE_INVALID`), browsers will block requests and the app will show the built-in error + retry UI until SWAPI is fixed.
