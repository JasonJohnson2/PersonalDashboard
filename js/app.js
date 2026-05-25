/* ── Court & Controller — app.js ──────────────────────
   Phase 1: Layout + navigation + local storage backlog
   Phase 2: Swap mock NBA data for real API calls
   ───────────────────────────────────────────────────── */

import { searchGames } from './games.js';

// ── Local Storage Helpers ──────────────────────────────
const storage = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// ── State ──────────────────────────────────────────────
const state = {
  backlog: storage.get('backlog', []),
  favoriteTeam: storage.get('favoriteTeam', ''),
  settings: storage.get('settings', { gameStart: false, scores: false, backlogReminder: false }),
  activeSection: 'overview',
  activeTab: 'scores',
  activeFilter: 'all',
  searchTimer: null,
};

// ── Mock NBA Data (replace with real API in Phase 2) ───
const MOCK_GAMES = [
  { id: 1, away: 'Boston Celtics', awayCity: 'Boston', home: 'New York Knicks', homeCity: 'New York', awayScore: 112, homeScore: 108, status: 'Final', quarter: null },
  { id: 2, away: 'Golden State Warriors', awayCity: 'Golden State', home: 'Los Angeles Lakers', homeCity: 'Los Angeles', awayScore: 87, homeScore: 91, status: 'Live', quarter: 'Q3 4:22' },
  { id: 3, away: 'Miami Heat', awayCity: 'Miami', home: 'Chicago Bulls', homeCity: 'Chicago', awayScore: 0, homeScore: 0, status: 'Upcoming', quarter: '7:30 PM ET' },
  { id: 4, away: 'Denver Nuggets', awayCity: 'Denver', home: 'Phoenix Suns', homeCity: 'Phoenix', awayScore: 0, homeScore: 0, status: 'Upcoming', quarter: '9:00 PM ET' },
  { id: 5, away: 'Milwaukee Bucks', awayCity: 'Milwaukee', home: 'Philadelphia 76ers', homeCity: 'Philadelphia', awayScore: 104, homeScore: 99, status: 'Final', quarter: null },
];

const MOCK_STANDINGS_EAST = [
  { rank: 1, team: 'Boston Celtics', wins: 58, losses: 14, gb: '-' },
  { rank: 2, team: 'New York Knicks', wins: 51, losses: 22, gb: '7.5' },
  { rank: 3, team: 'Cleveland Cavaliers', wins: 49, losses: 24, gb: '9.5' },
  { rank: 4, team: 'Orlando Magic', wins: 46, losses: 27, gb: '12.5' },
  { rank: 5, team: 'Indiana Pacers', wins: 46, losses: 28, gb: '13' },
  { rank: 6, team: 'Philadelphia 76ers', wins: 43, losses: 30, gb: '15.5' },
  { rank: 7, team: 'Miami Heat', wins: 40, losses: 33, gb: '18.5' },
  { rank: 8, team: 'Chicago Bulls', wins: 37, losses: 36, gb: '21.5' },
];

const MOCK_STANDINGS_WEST = [
  { rank: 1, team: 'Oklahoma City Thunder', wins: 57, losses: 16, gb: '-' },
  { rank: 2, team: 'Los Angeles Lakers', wins: 52, losses: 22, gb: '5.5' },
  { rank: 3, team: 'Denver Nuggets', wins: 50, losses: 24, gb: '7.5' },
  { rank: 4, team: 'Minnesota Timberwolves', wins: 49, losses: 25, gb: '8.5' },
  { rank: 5, team: 'Golden State Warriors', wins: 47, losses: 27, gb: '10.5' },
  { rank: 6, team: 'Dallas Mavericks', wins: 44, losses: 30, gb: '13.5' },
  { rank: 7, team: 'Phoenix Suns', wins: 41, losses: 33, gb: '16.5' },
  { rank: 8, team: 'Sacramento Kings', wins: 38, losses: 36, gb: '19.5' },
];

// ── Navigation ─────────────────────────────────────────
function navigateTo(section) {
  state.activeSection = section;
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`section-${section}`);
  if (target) target.classList.add('active');
  const navItem = document.querySelector(`[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');
  const titles = { overview: 'Overview', nba: 'NBA', games: 'Games', favorites: 'Favorites' };
  document.getElementById('sectionTitle').textContent = titles[section] || section;
  document.querySelector('.sidebar').classList.remove('open');
}

document.querySelectorAll('[data-section]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.section); });
});

// ── Tabs (NBA section) ─────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.dataset.tab;
    state.activeTab = tabId;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tabId}`)?.classList.add('active');
  });
});

// ── Theme toggle ───────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.dataset.theme === 'dark';
  html.dataset.theme = isDark ? 'light' : 'dark';
  themeToggle.querySelector('.theme-icon').textContent = isDark ? '🌙' : '☀';
  themeToggle.querySelector('.theme-label').textContent = isDark ? 'Dark mode' : 'Light mode';
  storage.set('theme', isDark ? 'light' : 'dark');
});

const savedTheme = storage.get('theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  if (savedTheme === 'light') {
    themeToggle.querySelector('.theme-icon').textContent = '🌙';
    themeToggle.querySelector('.theme-label').textContent = 'Dark mode';
  }
}

// ── Mobile menu ────────────────────────────────────────
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

// ── Date ───────────────────────────────────────────────
const dateEl = document.getElementById('currentDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── NBA: Render game row (compact) ─────────────────────
function renderGameRow(game, favoriteTeam) {
  const isFavorite = favoriteTeam && (game.away === favoriteTeam || game.home === favoriteTeam);
  const scoreText = game.status === 'Upcoming'
    ? `<span class="game-score" style="font-size:0.95rem;letter-spacing:0">${game.quarter}</span>`
    : `<span class="game-score">${game.awayScore} <span style="color:var(--text-3)">-</span> ${game.homeScore}</span>`;
  return `
    <div class="game-row ${isFavorite ? 'favorite-game' : ''}">
      <span class="team-name team-away">${game.away.split(' ').pop()}</span>
      <div class="game-score-block">
        ${scoreText}
        <span class="game-status ${game.status === 'Live' ? 'live' : ''}">${game.status === 'Live' ? game.quarter : game.status}</span>
      </div>
      <span class="team-name team-home">${game.home.split(' ').pop()}</span>
    </div>`;
}

// ── NBA: Render full game card ─────────────────────────
function renderFullGameCard(game, favoriteTeam) {
  const isFavorite = favoriteTeam && (game.away === favoriteTeam || game.home === favoriteTeam);
  const statusClass = game.status === 'Live' ? 'status-live' : game.status === 'Final' ? 'status-final' : 'status-upcoming';
  const scoreDisplay = game.status === 'Upcoming'
    ? `<span class="score-main" style="font-size:1.4rem;letter-spacing:0">${game.quarter}</span>`
    : `<span class="score-main">${game.awayScore}<span class="score-sep">-</span>${game.homeScore}</span>`;
  return `
    <div class="game-card-full ${isFavorite ? 'favorite-game' : ''}">
      <div class="team-block away">
        <span class="city">${game.awayCity}</span>
        <span class="name">${game.away.split(' ').pop()}</span>
      </div>
      <div class="score-center">
        ${scoreDisplay}
        <span class="status-tag ${statusClass}">${game.status === 'Live' ? game.quarter : game.status}</span>
      </div>
      <div class="team-block">
        <span class="city">${game.homeCity}</span>
        <span class="name">${game.home.split(' ').pop()}</span>
      </div>
    </div>`;
}

// ── NBA: Load today's games ────────────────────────────
function loadGames() {
  const favoriteTeam = state.favoriteTeam;
  const listEl = document.getElementById('todayGamesList');
  if (listEl) listEl.innerHTML = MOCK_GAMES.map(g => renderGameRow(g, favoriteTeam)).join('');
  const fullEl = document.getElementById('fullGamesList');
  if (fullEl) fullEl.innerHTML = MOCK_GAMES.map(g => renderFullGameCard(g, favoriteTeam)).join('');
  const statEl = document.getElementById('statGamesToday');
  if (statEl) statEl.textContent = MOCK_GAMES.length;
}

// ── NBA: Standings ─────────────────────────────────────
function renderStandingsMini(data, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = data.slice(0, 5).map(row => `
    <div class="standings-row">
      <span class="standings-row-rank">${row.rank}</span>
      <span class="standings-row-team">${row.team}</span>
      <span class="standings-row-record">${row.wins}-${row.losses}</span>
    </div>`).join('');
}

function renderStandingsFull(data, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const favoriteTeam = state.favoriteTeam;
  el.querySelector('tbody').innerHTML = data.map(row => `
    <tr class="${row.rank <= 6 ? 'playoff-row' : ''}">
      <td>${row.rank}</td>
      <td>${row.team}${row.team === favoriteTeam ? ' ⭐' : ''}</td>
      <td>${row.wins}</td>
      <td>${row.losses}</td>
      <td>${row.gb}</td>
    </tr>`).join('');
}

function loadStandings() {
  renderStandingsMini(MOCK_STANDINGS_EAST, 'standingsMiniEast');
  renderStandingsFull(MOCK_STANDINGS_EAST, 'standingsEast');
  renderStandingsFull(MOCK_STANDINGS_WEST, 'standingsWest');
}

// ── Backlog: Save ──────────────────────────────────────
function saveBacklog() {
  storage.set('backlog', state.backlog);
}

// ── Backlog: Render full grid ──────────────────────────
function renderBacklog() {
  const grid = document.getElementById('backlogGrid');
  if (!grid) return;

  const filter = state.activeFilter;
  const filtered = filter === 'all'
    ? state.backlog
    : state.backlog.filter(g => g.status === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state empty-state--large">
      <span class="empty-icon">🎮</span>
      <p>${filter === 'all' ? 'Your backlog is empty.<br>Search for a game above to get started.' : `No games with status "${filter}".`}</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(game => {
    let mcBadge = '';
    if (game.metacritic) {
      const cls = game.metacritic >= 75 ? 'mc-green' : game.metacritic >= 50 ? 'mc-yellow' : 'mc-red';
      mcBadge = `<span class="mc-badge ${cls}">${game.metacritic}</span>`;
    }
    const playtime = game.playtime ? `<span class="backlog-playtime">~${game.playtime}h avg</span>` : '';
    const metaRow = (mcBadge || playtime)
      ? `<div class="backlog-meta-row">${mcBadge}${playtime}</div>` : '';

    return `
      <div class="backlog-game-card" data-id="${game.id}">
        ${game.cover ? `<img class="backlog-cover" src="${game.cover}" alt="${game.name}" loading="lazy" onerror="this.style.display='none'">` : '<div class="backlog-cover"></div>'}
        <div class="backlog-info">
          <div class="backlog-name">${game.name}</div>
          ${metaRow}
          <div class="backlog-actions">
            <select class="status-select" onchange="updateStatus(${game.id}, this.value)">
              <option value="want" ${game.status === 'want' ? 'selected' : ''}>Want</option>
              <option value="playing" ${game.status === 'playing' ? 'selected' : ''}>Playing</option>
              <option value="completed" ${game.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button class="delete-btn" onclick="removeFromBacklog(${game.id})" aria-label="Remove ${game.name}">✕</button>
          </div>
        </div>
      </div>`;
  }).join('');

  updateStats();
}

// ── Backlog: Render mini lists (overview) ──────────────
function renderBacklogMini() {
  const nowPlayingEl = document.getElementById('nowPlayingList');
  const recentEl = document.getElementById('recentBacklogList');
  const playing = state.backlog.filter(g => g.status === 'playing');
  const recent = state.backlog.slice(-4).reverse();

  const miniItem = (g) => `
    <div class="backlog-mini-item">
      ${g.cover ? `<img class="backlog-mini-cover" src="${g.cover}" alt="${g.name}" loading="lazy" onerror="this.style.background='var(--bg-4)'">` : '<div class="backlog-mini-cover"></div>'}
      <div class="backlog-mini-info">
        <div class="backlog-mini-name">${g.name}</div>
        <div class="backlog-mini-status">${g.year || ''}</div>
      </div>
    </div>`;

  if (nowPlayingEl) {
    nowPlayingEl.innerHTML = playing.length
      ? playing.map(miniItem).join('')
      : `<div class="empty-state"><span class="empty-icon">🎮</span><p>No games in progress.</p></div>`;
  }
  if (recentEl) {
    recentEl.innerHTML = recent.length
      ? recent.map(miniItem).join('')
      : `<div class="empty-state"><span class="empty-icon">📋</span><p>No games added yet.</p></div>`;
  }
}

// ── Backlog: Add / Update / Remove ─────────────────────
function addToBacklog(game, status = 'want') {
  if (state.backlog.find(g => g.id === game.id)) return;
  state.backlog.unshift({ ...game, status, addedAt: Date.now() });
  saveBacklog();
  renderBacklog();
  renderBacklogMini();
  updateStats();
}

window.updateStatus = (id, status) => {
  const game = state.backlog.find(g => g.id === id);
  if (game) { game.status = status; saveBacklog(); renderBacklogMini(); updateStats(); }
};

window.removeFromBacklog = (id) => {
  state.backlog = state.backlog.filter(g => g.id !== id);
  saveBacklog();
  renderBacklog();
  renderBacklogMini();
  updateStats();
};

// ── Stats bar ──────────────────────────────────────────
function updateStats() {
  const totalEl = document.getElementById('statBacklog');
  const playingEl = document.getElementById('statPlaying');
  if (totalEl) totalEl.textContent = state.backlog.length;
  if (playingEl) playingEl.textContent = state.backlog.filter(g => g.status === 'playing').length;
}

// ── Game search ────────────────────────────────────────
const searchInput = document.getElementById('gameSearchInput');
const resultsEl = document.getElementById('gameSearchResults');

// Game data store — avoids embedding JSON in HTML onclick attributes
const _gameStore = new Map();

if (searchInput) {
  searchInput.addEventListener('input', () => {
    clearTimeout(state.searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) { resultsEl?.classList.add('hidden'); return; }
    state.searchTimer = setTimeout(() => doGameSearch(q), 400);
  });
}

// Delegated click handler for search result buttons
resultsEl?.addEventListener('click', e => {
  const btn = e.target.closest('.result-add-btn');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const game = _gameStore.get(id);
  if (game) window.handleAddGame(game);
});

async function doGameSearch(query) {
  if (!resultsEl) return;
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = '<div class="spinner"></div>';
  _gameStore.clear();

  try {
    const games = await searchGames(query);

    if (!games.length) {
      resultsEl.innerHTML = '<div class="loading-msg">No games found.</div>';
      return;
    }

    resultsEl.innerHTML = games.map(g => {
      _gameStore.set(g.id, g);
      const inList = state.backlog.find(b => b.id === g.id);
      const stars = g.rating ? `<span class="result-rating">★ ${g.rating}</span>` : '';
      const platforms = g.platforms.length
        ? `<div class="result-platforms">${g.platforms.map(p => `<span class="result-platform-tag">${p}</span>`).join('')}</div>`
        : '';
      return `
        <div class="search-result-item">
          ${g.cover ? `<img class="result-cover" src="${g.cover}" alt="${g.name}" loading="lazy">` : '<div class="result-cover"></div>'}
          <div class="result-info">
            <div class="result-name">${g.name}</div>
            <div class="result-meta">
              ${g.year ? `<span class="result-year">${g.year}</span>` : ''}
              ${stars}
            </div>
            ${platforms}
          </div>
          <button class="result-add-btn" data-id="${g.id}">
            ${inList ? '✓ In backlog' : '+ Add to backlog'}
          </button>
        </div>`;
    }).join('');
  } catch (err) {
    const noKey = err.message === 'NO_KEY';
    resultsEl.innerHTML = `<div class="loading-msg" style="color:var(--text-2)">
      ${noKey
        ? `Add your RAWG API key to <code>js/config.js</code> to enable search.
           <a href="https://rawg.io/apidocs" target="_blank" style="color:var(--accent)">Get a free key →</a>`
        : `Couldn't reach RAWG. Check your connection or API key.`
      }
      <br><br>
      <button onclick="addMockGame()" style="color:var(--accent);font-size:0.8rem;text-decoration:underline;background:none;border:none;cursor:pointer">Add a sample game to test the backlog</button>
    </div>`;
  }
}

window.handleAddGame = (game) => {
  addToBacklog(game, 'want');
  document.querySelectorAll('.result-add-btn').forEach(btn => {
    if (Number(btn.dataset.id) === game.id) btn.textContent = '✓ In backlog';
  });
};

window.addMockGame = () => {
  addToBacklog({ id: 999, name: 'NBA 2K25', cover: '', year: '2024' }, 'playing');
  resultsEl?.classList.add('hidden');
  if (searchInput) searchInput.value = '';
};

// ── Filter buttons ─────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeFilter = btn.dataset.filter;
    renderBacklog();
  });
});

// ── Favorite team ──────────────────────────────────────
const teamPicker = document.getElementById('teamPicker');
const teamDisplay = document.getElementById('favoriteTeamDisplay');
const statFavorite = document.getElementById('statFavorite');

function updateFavoriteTeam(team) {
  state.favoriteTeam = team;
  storage.set('favoriteTeam', team);

  if (statFavorite) statFavorite.textContent = team ? team.split(' ').pop() : '—';

  if (teamDisplay) {
    if (team) {
      teamDisplay.innerHTML = `
        <div class="team-display-name">${team}</div>
        <div class="team-display-hint">Highlighted on your dashboard</div>`;
      teamDisplay.classList.remove('hidden');
    } else {
      teamDisplay.classList.add('hidden');
    }
  }

  loadGames();
  loadStandings();
}

if (teamPicker) {
  teamPicker.addEventListener('change', () => updateFavoriteTeam(teamPicker.value));
  if (state.favoriteTeam) {
    teamPicker.value = state.favoriteTeam;
    updateFavoriteTeam(state.favoriteTeam);
  }
}

// ── Toggle switches ────────────────────────────────────
function setupToggle(id, settingKey) {
  const el = document.getElementById(id);
  if (!el) return;
  if (state.settings[settingKey]) el.classList.add('on');
  el.addEventListener('click', () => {
    el.classList.toggle('on');
    state.settings[settingKey] = el.classList.contains('on');
    storage.set('settings', state.settings);
  });
}
setupToggle('toggleGameStart', 'gameStart');
setupToggle('toggleScores', 'scores');
setupToggle('toggleBacklog', 'backlogReminder');

// ── Init ───────────────────────────────────────────────
function init() {
  loadGames();
  loadStandings();
  renderBacklog();
  renderBacklogMini();
  updateStats();
}

init();
