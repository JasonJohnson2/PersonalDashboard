/* ── games.js — RAWG API module ───────────────────────
   Requires window.CONFIG.RAWG_KEY (set in js/config.js,
   which is gitignored). Get a free key at rawg.io/apidocs
   ───────────────────────────────────────────────────── */

const BASE = 'https://api.rawg.io/api';

const PLATFORM_SHORT = {
  'PlayStation 5': 'PS5', 'PlayStation 4': 'PS4',
  'Xbox Series S/X': 'XSX', 'Xbox One': 'XBO',
  'Nintendo Switch': 'Switch', 'PC': 'PC',
};

function rawgFetch(path, params = {}) {
  const key = window.CONFIG?.RAWG_KEY;
  if (!key) throw new Error('NO_KEY');
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`RAWG ${r.status}`);
    return r.json();
  });
}

function normaliseGame(g) {
  return {
    id: g.id,
    name: g.name,
    cover: g.background_image || '',
    year: g.released ? g.released.slice(0, 4) : '',
    rating: g.rating ? Math.round(g.rating * 10) / 10 : null,
    metacritic: g.metacritic || null,
    playtime: g.playtime || null,
    platforms: (g.platforms || [])
      .slice(0, 3)
      .map(p => PLATFORM_SHORT[p.platform.name] || p.platform.name),
  };
}

export async function searchGames(query) {
  const data = await rawgFetch('/games', { search: query, page_size: 8 });
  return (data.results || []).map(normaliseGame);
}

export async function getGameDetails(id) {
  const g = await rawgFetch(`/games/${id}`);
  return {
    ...normaliseGame(g),
    description: g.description_raw || '',
    developers: (g.developers || []).map(d => d.name),
  };
}

export async function getUpcomingGames() {
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
  const data = await rawgFetch('/games', { dates: `${today},${future}`, ordering: '-added', page_size: 8 });
  return (data.results || []).map(normaliseGame);
}

export async function getGamesByGenre(slug) {
  const data = await rawgFetch('/games', { genres: slug, ordering: '-rating', page_size: 8 });
  return (data.results || []).map(normaliseGame);
}
