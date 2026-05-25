# Architecture

This document explains how the codebase is organized and how the pieces fit together.

## File responsibilities

There are only three source files. Each has a single, clear job.

### `index.html` — Structure

Declares the four section panels, sidebar navigation, and topbar. Contains no logic. Section panels are hidden/shown by toggling a CSS class — there is no routing, no virtual DOM, and no templates. What you see in the HTML is the permanent skeleton; JavaScript populates the content containers at runtime.

The four sections:
- `#section-overview` — dashboard summary
- `#section-nba` — scores and standings
- `#section-games` — backlog and search
- `#section-favorites` — team picker and settings

### `style.css` — Appearance

All layout and theming live here. The file is organized as:

1. **CSS custom properties** (`:root`) — colors, spacing, font stacks. Dark theme is the default. Light theme overrides the same variables on a `[data-theme="light"]` attribute on `<body>`.
2. **Layout primitives** — sidebar, topbar, main content area.
3. **Component styles** — cards, game rows, standings tables, backlog grid, toggles, skeleton loaders.

Because the entire theme is expressed as CSS variables, switching from dark to light requires changing exactly one attribute. JavaScript never touches colors or font values directly.

### `app.js` — Logic

All application behavior in one file. It is not a module system or framework — it is procedural code organized into logical groups by comment headers:

| Lines | Responsibility |
|---|---|
| 1–54 | State initialization, localStorage helpers, mock NBA data |
| 57–111 | Navigation, theme toggle, utility rendering helpers |
| 120–212 | NBA section — game rows, game cards, standings |
| 220–309 | Games/backlog — render, add, update status, remove |
| 320–387 | RAWG API search with debounce |
| 399–450 | Favorites — team picker, notification toggles |
| 460+ | Initialization on `DOMContentLoaded` |

## State model

All persistent state is a flat object stored as JSON in `localStorage` under a single key. The shape:

```js
{
  backlog: [
    { id, name, cover, year, status, addedAt }
  ],
  favoriteTeam: "LAL",   // NBA team abbreviation, or null
  settings: {
    gameStart: false,
    scores: false,
    backlogReminder: false
  },
  theme: "dark"          // "dark" | "light"
}
```

There is no in-memory state object separate from the DOM. When data changes, the relevant section is re-rendered from scratch by reading back from `localStorage`. This is intentional — see [`DECISIONS.md`](DECISIONS.md).

## Data flow

```
User action
    │
    ▼
Event handler in app.js
    │
    ├─► Mutate localStorage
    │
    └─► Re-render affected DOM section
            │
            └─► Read from localStorage → build HTML string → innerHTML
```

For NBA data (Phase 1), the flow short-circuits at the top: `MOCK_GAMES`, `MOCK_STANDINGS_EAST`, and `MOCK_STANDINGS_WEST` are constants defined at the top of `app.js`. The rendering functions consume these exactly as they will consume live API responses in Phase 2 — the render functions do not know or care where the data came from.

For game search, the flow adds an async step:

```
User types in search box
    │
    ▼ (debounced 400ms)
fetch() to RAWG API
    │
    ▼
Render search results overlay
    │
User clicks "Add"
    │
    ▼
addToBacklog() → localStorage → re-render backlog
```

## Navigation

`navigateTo(section)` is the only routing mechanism. It:
1. Removes `active` class from all sections and nav items.
2. Adds `active` to the target section and its nav item.
3. Updates the topbar title text.
4. Closes the mobile sidebar if open.

There are no URLs involved. The browser URL never changes. This means the page always opens to the Overview section on load, which is the intended behavior for a personal dashboard.

## Theme system

The theme toggle button calls `toggleTheme()`, which flips `document.body`'s `data-theme` attribute between `"dark"` and `"light"` and persists the preference. All visual differences are expressed in CSS, so JavaScript is only responsible for setting the attribute.

## Favorite team highlighting

When a favorite team is set, `loadGames()` and `loadStandings()` check each item's team abbreviation against `state.favoriteTeam`. Matching items receive a CSS class (`favorite-highlight` on game rows, `fav-row` on standings rows) that the stylesheet uses to apply the accent color treatment. No special rendering path is needed — it is just a class toggle.

## Security headers

`_headers` applies HTTP response headers to all routes served by Cloudflare Workers. Key policies:

- **CSP** — restricts scripts to `self`, fonts to Google Fonts, images to RAWG's CDN and data URIs, and API calls to RAWG and balldontlie. Nothing else can be loaded.
- **X-Frame-Options: DENY** — prevents the page from being embedded in iframes.
- **X-Content-Type-Options: nosniff** — prevents MIME-type sniffing.
- **Referrer-Policy** — sends the origin on cross-origin requests but not the full URL.

These are set at the Cloudflare edge and apply regardless of what JavaScript does, so they cannot be bypassed by client-side code.
