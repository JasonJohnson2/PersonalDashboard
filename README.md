# Court & Controller — Personal Dashboard

A personal dashboard combining **NBA game tracking** with a **video game backlog manager**, deployed as a static site on Cloudflare Workers.

## What it does

- **NBA tab** — Shows today's game scores, standings for both conferences, and highlights your favorite team everywhere it appears.
- **Games tab** — Lets you search the RAWG game database and maintain a personal backlog with statuses: *Want*, *Playing*, or *Completed*.
- **Overview** — A summary view surfacing the most relevant info from both sections at a glance: today's games, current standings snapshot, and your active backlog.
- **Favorites** — Pick your NBA team and configure notification preferences (persisted across sessions).

Everything runs entirely in the browser. There is no server, no database, and no login. State lives in `localStorage`.

## Tech stack

| Layer | Choice |
|---|---|
| UI | Vanilla JS (ES6+), HTML5, CSS3 |
| Hosting | Cloudflare Workers (static assets) |
| Game data | [RAWG API](https://rawg.io/apidocs) — free, no auth |
| NBA data | Mock data in Phase 1; [balldontlie API](https://www.balldontlie.io/) planned for Phase 2 |
| Fonts | Google Fonts — Barlow Condensed (headings), DM Sans (body) |

## Project structure

```
PersonalDashboard/
├── index.html          # All HTML — four section panels, sidebar nav, topbar
├── app.js              # All application logic — state, rendering, API calls
├── style.css           # All styles — CSS variables, themes, layout, components
├── wrangler.jsonc      # Cloudflare Workers deployment config
├── _headers            # HTTP security headers (CSP, X-Frame-Options, etc.)
└── docs/
    ├── ARCHITECTURE.md # How the code is organized and why
    └── DECISIONS.md    # Key design decisions and trade-offs
```

## Running locally

The app is plain HTML/CSS/JS — you can open `index.html` directly in a browser for most features. For accurate asset serving (including security headers), use the Wrangler dev server:

```bash
# Install Wrangler if you haven't
npm install -g wrangler

# Start dev server
wrangler dev
```

Then open `http://localhost:8787`.

## Deploying

```bash
wrangler deploy
```

Cloudflare Workers serves the entire `PersonalDashboard/` directory as static assets (configured in `wrangler.jsonc`).

## Current status

**Phase 1 — complete:** Layout, navigation, local storage, RAWG game search, mock NBA data, theming.

**Phase 2 — planned:** Live NBA scores and standings via the balldontlie API, replacing the mock data in `app.js`.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Code structure, data flow, and component breakdown.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — Why vanilla JS, why no build step, why Cloudflare Workers, and other choices explained.
