# Design Decisions

Answers to "why is it done this way?" for the choices that aren't obvious from reading the code.

## Why vanilla JS with no framework?

This is a personal dashboard — one user, one page, no team. The added complexity of a framework (build step, node_modules, JSX/templates, component lifecycle) would cost more than it buys.

Vanilla JS with `innerHTML` and direct DOM manipulation is fast to write, fast to debug, and has zero build-time dependencies. The entire app loads as three files. Anyone can open DevTools and see exactly what is happening without needing to understand a framework's mental model.

## Why no build step?

For the same reason — it's a personal tool, not a product. No bundler means:
- `wrangler dev` serves files directly, no compilation needed.
- Editing a file is immediately reflected on reload.
- There are no source maps to configure, no transpilation targets to manage.

If the project grows to the point where a build step pays for itself (e.g., TypeScript types become valuable, or the JS file splits into modules that need bundling), adding one is straightforward. The tradeoff of adding it now would be complexity with no current benefit.

## Why localStorage with no backend?

Personal dashboards don't need a server for state. The data (backlog, team preference, settings) is personal to one browser. localStorage is:
- Zero cost to operate
- Available offline
- Zero latency on read/write
- No auth system required

The downside is that state doesn't sync across devices. That is an acceptable limitation for a tool used on one machine. If cross-device sync becomes important, the state shape is simple enough to replace with a small API call — the localStorage reads and writes are already isolated in helper functions (`loadState`, `saveState`).

## Why re-render entire sections instead of patching the DOM?

Simplicity. Diffing and patching requires tracking previous state, which adds complexity. For the scale of data here (a handful of game rows, a backlog that might reach dozens of items), re-rendering an entire section is imperceptibly fast — milliseconds at most.

The alternative would be granular update functions for every possible mutation (add item, change status, remove item, change favorite team, etc.). Each of those would need to know what changed and how to reflect it without touching the rest. `innerHTML` on a container sidesteps all of that.

## Why is all the JavaScript in one file?

Phase 1 is an MVP with a single page and roughly 460 lines of JS. Splitting it into modules (`nba.js`, `backlog.js`, `search.js`, etc.) would add import/export boilerplate and require either a bundler or ES module `<script type="module">` with CORS-aware serving. None of that is worth it yet.

When the file grows substantially — likely when Phase 2 adds real API integration and error handling — splitting into modules will be the natural next step.

## Why mock NBA data instead of a live API in Phase 1?

The [balldontlie API](https://www.balldontlie.io/) requires API keys for reliable access. Setting that up during Phase 1 would have mixed "get the layout working" with "get API auth working," making it harder to iterate on the UI. Mock data lets the rendering code be written and tested independently of the data source.

The rendering functions (`renderGameRow`, `renderFullGameCard`, `renderStandingsMini`, `renderStandingsFull`) take plain data objects and don't know or care where the data came from. Replacing the mock constants with API calls in Phase 2 requires changing the data-loading functions only, not the rendering functions.

## Why Cloudflare Workers instead of Netlify/Vercel/GitHub Pages?

Cloudflare Workers serves assets from the edge (close to users globally) at very low cost, and `_headers` files give precise control over HTTP response headers without needing a backend. The CSP, `X-Frame-Options`, and other security headers applied in `_headers` are enforced at the network layer — they can't be accidentally removed by a JS change.

Netlify and Vercel offer similar capabilities (`_headers` files work on Netlify too). Cloudflare was chosen for familiarity and because the free tier comfortably covers a personal project.

## Why the RAWG API for game search?

RAWG's game database is large (~500,000 games), well-maintained, and the free tier doesn't require an API key for basic search — which means no credentials to manage, no auth headers to set, and no secrets to keep out of the repository. The CSP in `_headers` explicitly allows RAWG's CDN for cover art images.

If RAWG's API is unavailable or returns an error, the search UI shows a fallback message and a direct link to RAWG's website so the user isn't left stranded.

## Why 400ms debounce on search?

Search fires on every keystroke. Without a debounce, a five-character search term triggers five API calls, most of which are for incomplete queries the user doesn't care about. 400ms is long enough that normal typing won't produce spurious requests, but short enough that it feels responsive when you pause to think.

## Why is the favorite team stored as an abbreviation (e.g., `"LAL"`) rather than a full name?

Abbreviations are short, stable identifiers. The full name displayed in the UI is always looked up from a mapping in `app.js`. This means if a team's display name ever needs to change (e.g., a rebrand), only the mapping changes — not the stored value in every user's localStorage.

## Why are security headers in `_headers` instead of a Worker script?

For a fully static site, there is no Worker script running per-request — Cloudflare Workers serves the files directly. The `_headers` file is the Cloudflare convention for attaching headers to static asset responses. This keeps the security configuration co-located with the deployment configuration rather than requiring a separate runtime file.
