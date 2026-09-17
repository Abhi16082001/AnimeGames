import { config } from '../config';

// -------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------

export interface Player {
  id: string;
  name: string;
}

export interface GameResult {
  playerId: string;
  name: string;
  gameId: string;
  animeId: string;
  score: number;       // 0-1 range
  percentage: number;  // 0-100 range
}

export interface LeaderboardEntry {
  name: string;
  playerId: string;
  gameId: string;
  score: number;
  percentage: number;
}

export interface GameProgress {
  playedQuestionId?: string[];
}

interface FullProgressSchema {
  gameProgress: {
    [gameId: string]: {
      [animeId: string]: GameProgress;
    };
  };
}

// -------------------------------------------------------------
// Player Identity Storage Helpers
// -------------------------------------------------------------

const PLAYER_KEY = "animegames_player";

export function getLocalPlayer(): Player | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PLAYER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as Player;
  } catch (e) {
    console.error("Failed to parse player from localStorage", e);
    return null;
  }
}

export function saveLocalPlayer(player: Player): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
}

// -------------------------------------------------------------
// API Functions (Google Apps Script)
// -------------------------------------------------------------

/**
 * Helper to perform fetch requests to the Google Apps Script Web App.
 * Handles timeouts and exceptions gracefully, returning null on failure.
 */
async function fetchFromAppsScript(action: string, payload: any): Promise<any> {
  const url = config.googleAppsScriptUrl;
  if (!url || url.includes("PLACEHOLDER_API_URL")) {
    console.warn("Apps Script URL is a placeholder or not configured.");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Apps Script request failed [action: ${action}]:`, error);
    return null;
  }
}

/**
 * Registers a new player by checking/generating a unique ID in Apps Script.
 * Falls back to local generation if the service is unavailable.
 */
export async function registerPlayer(name: string): Promise<Player> {
  const sanitizedName = name.trim();
  if (!sanitizedName) throw new Error("Name is required");

  // Attempt remote registration
  const result = await fetchFromAppsScript("registerPlayer", { name: sanitizedName });
  
  if (result && result.success && result.playerId) {
    const player = { id: result.playerId, name: sanitizedName };
    saveLocalPlayer(player);
    return player;
  }

  // Graceful fallback: Client-side ID generation
  const localId = `P-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  const player = { id: localId, name: sanitizedName };
  saveLocalPlayer(player);
  return player;
}

/**
 * Saves a completed game session result to Google Sheets.
 * Stores individual game category best score AND recalculated Combined score.
 * Recalculating combined score should ideally happen server-side or client-side.
 */
export async function saveGameResult(result: GameResult): Promise<boolean> {
  // Save locally in mock history/leaderboard too for offline support or testing
  saveLocalResult(result);

  const response = await fetchFromAppsScript("saveResult", result);
  return !!(response && response.success);
}

/**
 * Fetches the leaderboard data.
 * Falls back to local leaderboard if remote fetch fails.
 */
export async function getLeaderboard(gameId: string | 'Combined'): Promise<LeaderboardEntry[]> {
  const result = await fetchFromAppsScript("getLeaderboard", { gameId });
  if (result && result.success && Array.isArray(result.data)) {
    return result.data as LeaderboardEntry[];
  }
  
  // Return local storage mock leaderboard as fallback
  return getLocalLeaderboard(gameId);
}

// -------------------------------------------------------------
// Question Progress Persistence Helpers
// -------------------------------------------------------------

const PROGRESS_KEY = "animegames_progress";

function getProgressStore(): FullProgressSchema {
  if (typeof window === "undefined") return { gameProgress: {} };
  const data = localStorage.getItem(PROGRESS_KEY);
  if (!data) return { gameProgress: {} };
  try {
    return JSON.parse(data) as FullProgressSchema;
  } catch (e) {
    console.error("Failed to parse progress from localStorage", e);
    return { gameProgress: {} };
  }
}

function saveProgressStore(store: FullProgressSchema): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

/**
 * Updates progress for a normal anime category game session
 */
export function saveAnimeProgress(gameId: string, animeId: string, playedQuestionId: string[]): void {
  const store = getProgressStore();
  if (!store.gameProgress[gameId]) {
    store.gameProgress[gameId] = {};
  }
  store.gameProgress[gameId][animeId] = { playedQuestionId: Array.from(new Set(playedQuestionId)) };
  saveProgressStore(store);
}

/**
 * Clears progress for a normal anime category when cycle is completed
 */
export function clearAnimeProgress(gameId: string, animeId: string): void {
  const store = getProgressStore();
  if (store.gameProgress[gameId] && store.gameProgress[gameId][animeId]) {
    delete store.gameProgress[gameId][animeId];
    if (Object.keys(store.gameProgress[gameId]).length === 0) {
      delete store.gameProgress[gameId];
    }
    saveProgressStore(store);
  }
}

/**
 * Gets progress for a normal anime category
 */
export function getAnimeProgress(gameId: string, animeId: string): string[] {
  const store = getProgressStore();
  return store.gameProgress[gameId]?.[animeId]?.playedQuestionId || [];
}

/**
 * Updates progress for a Miscellaneous game cycle
 */
export function saveMiscProgress(gameId: string, playedQuestionIds: string[]): void {
  const store = getProgressStore();
  if (!store.gameProgress[gameId]) {
    store.gameProgress[gameId] = {};
  }
  
  const currentPlayed = store.gameProgress[gameId]["miscellaneous"]?.playedQuestionId || [];
  const updatedPlayed = Array.from(new Set([...currentPlayed, ...playedQuestionIds]));

  store.gameProgress[gameId]["miscellaneous"] = { playedQuestionId: updatedPlayed };
  saveProgressStore(store);
}

/**
 * Clears progress for a Miscellaneous game category when cycle is completed
 */
export function clearMiscProgress(gameId: string): void {
  const store = getProgressStore();
  if (store.gameProgress[gameId] && store.gameProgress[gameId]["miscellaneous"]) {
    delete store.gameProgress[gameId]["miscellaneous"];
    if (Object.keys(store.gameProgress[gameId]).length === 0) {
      delete store.gameProgress[gameId];
    }
    saveProgressStore(store);
  }
}

/**
 * Gets already played question IDs for Miscellaneous
 */
export function getMiscProgress(gameId: string): string[] {
  const store = getProgressStore();
  return store.gameProgress[gameId]?.[ "miscellaneous" ]?.playedQuestionId || [];
}

// -------------------------------------------------------------
// Local Mock Leaderboard (for offline fallback/testing)
// -------------------------------------------------------------

const LOCAL_RESULTS_KEY = "animegames_local_results";

function getLocalResults(): GameResult[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(LOCAL_RESULTS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as GameResult[];
  } catch (e) {
    return [];
  }
}

function saveLocalResult(result: GameResult): void {
  if (typeof window === "undefined") return;
  const results = getLocalResults();
  results.push(result);
  localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(results));
}

export function getLocalLeaderboard(gameId: string | 'Combined'): LeaderboardEntry[] {
  const results = getLocalResults();
  
  // Aggregate results by Player ID
  // For each player, we need to track their best score per game category
  const playerBests: { [playerId: string]: { name: string; bestScores: { [gId: string]: number } } } = {};

  results.forEach(r => {
    if (!playerBests[r.playerId]) {
      playerBests[r.playerId] = { name: r.name, bestScores: {} };
    }
    const currentBest = playerBests[r.playerId].bestScores[r.gameId] || 0;
    if (r.score > currentBest) {
      playerBests[r.playerId].bestScores[r.gameId] = r.score;
    }
  });

  const leaderboard: LeaderboardEntry[] = [];

  Object.entries(playerBests).forEach(([playerId, data]) => {
    if (gameId === 'Combined') {
      // Average best scores across all game categories (e.g. description, zoomed, colour)
      const categories = ['description', 'zoomed', 'colour'];
      let sum = 0;
      let count = 0;
      categories.forEach(cat => {
        if (data.bestScores[cat] !== undefined) {
          sum += data.bestScores[cat];
          count++;
        }
      });
      // Average is calculated based on category bests
      if (count > 0) {
        const avgScore = sum / 3; // Follow guidelines: Divided by total categories (3)
        leaderboard.push({
          name: data.name,
          playerId,
          gameId: 'Combined',
          score: avgScore,
          percentage: Math.round(avgScore * 100)
        });
      }
    } else {
      // Individual game category best score
      const bestScore = data.bestScores[gameId];
      if (bestScore !== undefined) {
        leaderboard.push({
          name: data.name,
          playerId,
          gameId,
          score: bestScore,
          percentage: Math.round(bestScore * 100)
        });
      }
    }
  });

  // Sort descending by score
  return leaderboard.sort((a, b) => b.score - a.score);
}
