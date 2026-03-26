import type { PlayerRanking } from '@/utils/localRanking';

const STORAGE_KEY = 'fiesta-premium-progression-v2';

export type PremiumBadgeRarity = 'bronze' | 'silver' | 'gold' | 'diamond' | 'mythic';

export type PremiumBadgeDef = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: PremiumBadgeRarity;
};

export type PremiumAwardDef = {
  id: string;
  name: string;
  emoji: string;
  description: string;
};

export type PremiumSnapshot = {
  gamesPlayed: number;
  wins: number;
  totalScore: number;
  xp: number;
};

export type PremiumSeasonState = {
  id: string;
  label: string;
  startedAt: string;
  baseline: PremiumSnapshot;
  latest: PremiumSnapshot;
  currentStreak: number;
  bestStreak: number;
  points: number;
  games: number;
  wins: number;
};

export type PremiumProgress = {
  version: 2;
  playerKey: string;
  playerName: string;
  updatedAt: string;
  lastMode?: string;
  currentStreak: number;
  bestStreak: number;
  unlockedBadgeIds: string[];
  specialAwardIds: string[];
  seasons: Record<string, PremiumSeasonState>;
  currentSeasonId: string;
};

export type PremiumStore = {
  version: 2;
  players: Record<string, PremiumProgress>;
};

export type PremiumStatsSource = {
  id?: string | null;
  player_name?: string;
  playerName?: string;
  username?: string;
  avatar_url?: string | null;
  games_played?: number;
  games_won?: number;
  total_score?: number;
  total_xp?: number;
  xp?: number;
  level?: number;
  poker_wins?: number;
  poker_games?: number;
  megamix_wins?: number;
  megamix_games?: number;
  clasico_wins?: number;
  clasico_games?: number;
  picante_wins?: number;
  picante_games?: number;
  parchis_wins?: number;
  parchis_games?: number;
  football_wins?: number;
  football_games?: number;
  culture_wins?: number;
  culture_games?: number;
  win_streak?: number;
  updated_at?: string;
  badges?: any;
};

export type PremiumOverview = {
  badges: Array<PremiumBadgeDef & { unlocked: boolean }>;
  awards: PremiumAwardDef[];
  currentSeason: PremiumSeasonState;
  bestStreak: number;
  currentStreak: number;
  unlockedCount: number;
};

const PREMIUM_BADGES: PremiumBadgeDef[] = [
  { id: 'season_rookie', name: 'Rookie de Temporada', emoji: '🌟', description: 'Juega 3 partidas en la temporada actual.', rarity: 'bronze' },
  { id: 'season_contender', name: 'Contendiente', emoji: '🏁', description: 'Consigue 5 victorias esta temporada.', rarity: 'silver' },
  { id: 'season_mvp', name: 'MVP de Temporada', emoji: '👑', description: 'Supera 800 puntos durante la temporada.', rarity: 'gold' },
  { id: 'streak_3_premium', name: 'Racha x3', emoji: '🔥', description: 'Alcanza una racha de 3 victorias.', rarity: 'bronze' },
  { id: 'streak_5_premium', name: 'Racha x5', emoji: '⚡', description: 'Alcanza una racha de 5 victorias.', rarity: 'silver' },
  { id: 'streak_10_premium', name: 'Tormenta Imparable', emoji: '💎', description: 'Alcanza una racha de 10 victorias.', rarity: 'diamond' },
  { id: 'mode_collector', name: 'Coleccionista de Modos', emoji: '🧩', description: 'Juega al menos 4 modos diferentes.', rarity: 'gold' },
  { id: 'table_royalty', name: 'Realeza del Tablero', emoji: '♟️', description: 'Suma 15 victorias entre Poker y Parchís.', rarity: 'gold' },
  { id: 'all_star', name: 'All‑Star', emoji: '🌠', description: 'Llega a 50 victorias totales.', rarity: 'diamond' },
  { id: 'hall_icon', name: 'Ícono del Hall', emoji: '🏛️', description: 'Juega 100 partidas totales.', rarity: 'mythic' },
];

const PREMIUM_AWARDS: PremiumAwardDef[] = [
  { id: 'award_hot_streak', name: 'Hot Streak', emoji: '🔥', description: 'Racha caliente en curso.' },
  { id: 'award_season_royalty', name: 'Season Royalty', emoji: '👑', description: 'Domina la temporada actual.' },
  { id: 'award_clutch_master', name: 'Clutch Master', emoji: '🎯', description: 'Muchísimas victorias con alta eficacia.' },
  { id: 'award_mode_lord', name: 'Mode Lord', emoji: '🎮', description: 'Juega en muchos modos diferentes.' },
];

function safeNum(value: any): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeKey(name?: string | null, id?: string | null) {
  return (id || name || 'guest').toString().trim().toLowerCase();
}

function defaultSnapshot(): PremiumSnapshot {
  return { gamesPlayed: 0, wins: 0, totalScore: 0, xp: 0 };
}

export function getCurrentSeasonInfo(now = new Date()) {
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const start = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
  const next = new Date(now.getFullYear(), quarter * 3, 1);
  const millisLeft = next.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(millisLeft / (1000 * 60 * 60 * 24)));

  return {
    id: `${now.getFullYear()}-S${quarter}`,
    label: `Temporada S${quarter} ${now.getFullYear()}`,
    startedAt: start.toISOString(),
    endsAt: next.toISOString(),
    daysLeft,
  };
}

export function readPremiumStore(): PremiumStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 2, players: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.players) {
      return { version: 2, players: parsed.players };
    }
  } catch {
    // noop
  }
  return { version: 2, players: {} };
}

export function writePremiumStore(store: PremiumStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // noop
  }
}

export function getSnapshotFromStats(stats: PremiumStatsSource): PremiumSnapshot {
  return {
    gamesPlayed: safeNum(stats.games_played),
    wins: safeNum(stats.games_won),
    totalScore: safeNum((stats as any).total_score),
    xp: safeNum(stats.total_xp) || safeNum(stats.xp),
  };
}

function countModesPlayed(stats: PremiumStatsSource) {
  const checks = [
    safeNum(stats.megamix_games),
    safeNum(stats.clasico_games),
    safeNum(stats.picante_games),
    safeNum(stats.poker_games),
    safeNum(stats.parchis_games),
    safeNum(stats.football_games),
    safeNum(stats.culture_games),
  ];

  return checks.filter((value) => value > 0).length;
}

function ensureProgress(progress: PremiumProgress | undefined, stats: PremiumStatsSource, opts?: { won?: boolean; scoreToAdd?: number; seasonId?: string; seasonLabel?: string; startedAt?: string }) {
  const season = getCurrentSeasonInfo();
  const seasonId = opts?.seasonId || season.id;
  const seasonLabel = opts?.seasonLabel || season.label;
  const startedAt = opts?.startedAt || season.startedAt;
  const snapshot = getSnapshotFromStats(stats);
  const playerName = stats.playerName || stats.player_name || stats.username || 'Jugador';
  const playerKey = normalizeKey(playerName, stats.id || null);

  const baseProgress: PremiumProgress = progress || {
    version: 2,
    playerKey,
    playerName,
    updatedAt: new Date().toISOString(),
    lastMode: undefined,
    currentStreak: safeNum(stats.win_streak),
    bestStreak: safeNum(stats.win_streak),
    unlockedBadgeIds: [],
    specialAwardIds: [],
    seasons: {},
    currentSeasonId: seasonId,
  };

  if (!baseProgress.seasons[seasonId]) {
    const previous: PremiumSnapshot = {
      gamesPlayed: Math.max(0, snapshot.gamesPlayed - 1),
      wins: Math.max(0, snapshot.wins - (opts?.won ? 1 : 0)),
      totalScore: Math.max(0, snapshot.totalScore - safeNum(opts?.scoreToAdd)),
      xp: snapshot.xp,
    };

    baseProgress.seasons[seasonId] = {
      id: seasonId,
      label: seasonLabel,
      startedAt,
      baseline: previous,
      latest: snapshot,
      currentStreak: safeNum(stats.win_streak),
      bestStreak: safeNum(stats.win_streak),
      games: Math.max(0, snapshot.gamesPlayed - previous.gamesPlayed),
      wins: Math.max(0, snapshot.wins - previous.wins),
      points: Math.max(0, snapshot.totalScore - previous.totalScore),
    };
  }

  baseProgress.currentSeasonId = seasonId;
  baseProgress.playerName = playerName;
  baseProgress.playerKey = playerKey;

  return baseProgress;
}

function maybeUnlock(progress: PremiumProgress, badgeId: string) {
  if (!progress.unlockedBadgeIds.includes(badgeId)) {
    progress.unlockedBadgeIds.push(badgeId);
  }
}

function maybeAward(progress: PremiumProgress, awardId: string) {
  if (!progress.specialAwardIds.includes(awardId)) {
    progress.specialAwardIds.push(awardId);
  }
}

function evaluateUnlocks(progress: PremiumProgress, stats: PremiumStatsSource) {
  const seasonState = progress.seasons[progress.currentSeasonId];
  const totalGames = safeNum(stats.games_played);
  const totalWins = safeNum(stats.games_won);
  const currentStreak = progress.currentStreak;
  const bestStreak = progress.bestStreak;
  const seasonGames = seasonState?.games || 0;
  const seasonWins = seasonState?.wins || 0;
  const seasonPoints = seasonState?.points || 0;
  const modesPlayed = countModesPlayed(stats);
  const tableWins = safeNum(stats.poker_wins) + safeNum(stats.parchis_wins);
  const winRate = totalGames > 0 ? totalWins / totalGames : 0;

  if (seasonGames >= 3) maybeUnlock(progress, 'season_rookie');
  if (seasonWins >= 5) maybeUnlock(progress, 'season_contender');
  if (seasonPoints >= 800) maybeUnlock(progress, 'season_mvp');
  if (bestStreak >= 3) maybeUnlock(progress, 'streak_3_premium');
  if (bestStreak >= 5) maybeUnlock(progress, 'streak_5_premium');
  if (bestStreak >= 10) maybeUnlock(progress, 'streak_10_premium');
  if (modesPlayed >= 4) maybeUnlock(progress, 'mode_collector');
  if (tableWins >= 15) maybeUnlock(progress, 'table_royalty');
  if (totalWins >= 50) maybeUnlock(progress, 'all_star');
  if (totalGames >= 100) maybeUnlock(progress, 'hall_icon');

  if (currentStreak >= 4) maybeAward(progress, 'award_hot_streak');
  if (seasonWins >= 10 || seasonPoints >= 1200) maybeAward(progress, 'award_season_royalty');
  if (winRate >= 0.7 && totalGames >= 12) maybeAward(progress, 'award_clutch_master');
  if (modesPlayed >= 5) maybeAward(progress, 'award_mode_lord');
}

export function recordPremiumMatch(params: {
  stats: PremiumStatsSource;
  won: boolean;
  scoreToAdd: number;
  gameMode?: string;
}) {
  const { stats, won, scoreToAdd, gameMode } = params;
  const store = readPremiumStore();
  const playerName = stats.playerName || stats.player_name || stats.username || 'Jugador';
  const playerKey = normalizeKey(playerName, stats.id || null);
  const progress = ensureProgress(store.players[playerKey], stats, {
    won,
    scoreToAdd,
    ...getCurrentSeasonInfo(),
  });

  const seasonState = progress.seasons[progress.currentSeasonId];
  const snapshot = getSnapshotFromStats(stats);

  progress.updatedAt = new Date().toISOString();
  progress.lastMode = gameMode || progress.lastMode;
  progress.currentStreak = safeNum(stats.win_streak);
  progress.bestStreak = Math.max(progress.bestStreak || 0, progress.currentStreak || 0);

  seasonState.latest = snapshot;
  seasonState.currentStreak = progress.currentStreak;
  seasonState.bestStreak = Math.max(seasonState.bestStreak || 0, progress.currentStreak || 0);
  seasonState.games = Math.max(0, snapshot.gamesPlayed - safeNum(seasonState.baseline.gamesPlayed));
  seasonState.wins = Math.max(0, snapshot.wins - safeNum(seasonState.baseline.wins));
  seasonState.points = Math.max(0, snapshot.totalScore - safeNum(seasonState.baseline.totalScore));

  evaluateUnlocks(progress, stats);
  store.players[playerKey] = progress;
  writePremiumStore(store);

  return {
    store,
    progress,
    cloudPayload: { premium: serializePremiumProgress(progress) },
  };
}

function serializePremiumProgress(progress: PremiumProgress) {
  return {
    version: progress.version,
    playerKey: progress.playerKey,
    playerName: progress.playerName,
    updatedAt: progress.updatedAt,
    lastMode: progress.lastMode,
    currentStreak: progress.currentStreak,
    bestStreak: progress.bestStreak,
    unlockedBadgeIds: [...progress.unlockedBadgeIds],
    specialAwardIds: [...progress.specialAwardIds],
    currentSeasonId: progress.currentSeasonId,
    seasons: progress.seasons,
  };
}

export function extractPremiumProgress(raw: any, fallbackStats?: PremiumStatsSource): PremiumProgress | null {
  const season = getCurrentSeasonInfo();
  const maybeProgress = raw?.premium || raw;
  if (!maybeProgress || typeof maybeProgress !== 'object') {
    if (!fallbackStats) return null;
    const base = ensureProgress(undefined, fallbackStats, season);
    evaluateUnlocks(base, fallbackStats);
    return base;
  }

  const base = ensureProgress(
    {
      version: 2,
      playerKey: maybeProgress.playerKey || normalizeKey(fallbackStats?.playerName || fallbackStats?.player_name || fallbackStats?.username, fallbackStats?.id || null),
      playerName: maybeProgress.playerName || fallbackStats?.playerName || fallbackStats?.player_name || fallbackStats?.username || 'Jugador',
      updatedAt: maybeProgress.updatedAt || new Date().toISOString(),
      lastMode: maybeProgress.lastMode,
      currentStreak: safeNum(maybeProgress.currentStreak),
      bestStreak: safeNum(maybeProgress.bestStreak),
      unlockedBadgeIds: Array.isArray(maybeProgress.unlockedBadgeIds) ? maybeProgress.unlockedBadgeIds : [],
      specialAwardIds: Array.isArray(maybeProgress.specialAwardIds) ? maybeProgress.specialAwardIds : [],
      seasons: typeof maybeProgress.seasons === 'object' && maybeProgress.seasons ? maybeProgress.seasons : {},
      currentSeasonId: maybeProgress.currentSeasonId || season.id,
    },
    fallbackStats || {},
    season,
  );

  if (fallbackStats) {
    const seasonState = base.seasons[base.currentSeasonId];
    const snapshot = getSnapshotFromStats(fallbackStats);
    seasonState.latest = snapshot;
    seasonState.games = Math.max(0, snapshot.gamesPlayed - safeNum(seasonState.baseline.gamesPlayed));
    seasonState.wins = Math.max(0, snapshot.wins - safeNum(seasonState.baseline.wins));
    seasonState.points = Math.max(0, snapshot.totalScore - safeNum(seasonState.baseline.totalScore));
    base.currentStreak = Math.max(base.currentStreak, safeNum(fallbackStats.win_streak));
    base.bestStreak = Math.max(base.bestStreak, base.currentStreak);
    evaluateUnlocks(base, fallbackStats);
  }

  return base;
}

export function getPremiumProgressForPlayer(stats: PremiumStatsSource) {
  const store = readPremiumStore();
  const playerName = stats.playerName || stats.player_name || stats.username || 'Jugador';
  const key = normalizeKey(playerName, stats.id || null);
  return extractPremiumProgress(store.players[key], stats);
}

export function getPremiumOverview(stats: PremiumStatsSource, raw?: any): PremiumOverview {
  const progress = extractPremiumProgress(raw, stats) || ensureProgress(undefined, stats, getCurrentSeasonInfo());
  const awards = PREMIUM_AWARDS.filter((award) => progress.specialAwardIds.includes(award.id));
  const badges = PREMIUM_BADGES.map((badge) => ({
    ...badge,
    unlocked: progress.unlockedBadgeIds.includes(badge.id),
  }));

  return {
    badges,
    awards,
    currentSeason: progress.seasons[progress.currentSeasonId],
    currentStreak: progress.currentStreak,
    bestStreak: progress.bestStreak,
    unlockedCount: progress.unlockedBadgeIds.length,
  };
}

export function getPremiumBadgeCatalog() {
  return PREMIUM_BADGES;
}

export function getPremiumAwardCatalog() {
  return PREMIUM_AWARDS;
}

export function getPremiumAwardById(id: string) {
  return PREMIUM_AWARDS.find((award) => award.id === id) || null;
}

export function getPremiumBadgeById(id: string) {
  return PREMIUM_BADGES.find((badge) => badge.id === id) || null;
}

export function buildPremiumSummaryFromRanking(player: PlayerRanking): PremiumOverview {
  return getPremiumOverview({
    id: player.id,
    player_name: player.player_name,
    avatar_url: player.avatar_url,
    games_played: player.games_played,
    games_won: player.games_won,
    total_score: player.total_score,
    xp: player.xp,
    level: player.level,
    poker_wins: player.poker_wins,
    poker_games: player.poker_games,
    megamix_wins: player.megamix_wins,
    megamix_games: player.megamix_games,
    clasico_wins: player.clasico_wins,
    clasico_games: player.clasico_games,
    picante_wins: player.picante_wins,
    picante_games: player.picante_games,
    parchis_wins: player.parchis_wins,
    parchis_games: player.parchis_games,
    football_wins: player.football_wins,
    football_games: player.football_games,
    culture_wins: player.culture_wins,
    culture_games: player.culture_games,
    win_streak: player.win_streak,
    updated_at: player.updated_at,
  });
}
