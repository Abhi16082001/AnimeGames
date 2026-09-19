import { config } from '../config';

// -------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------

export interface Player {
  id: string;
  name: string;
}

export class PlayerRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlayerRegistrationError';
  }
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  gameCategory: string;
  percentage: number;
}

export interface GoogleLeaderboards {
  Combined: LeaderboardEntry[];
  Description: LeaderboardEntry[];
  Colour: LeaderboardEntry[];
  Zoom: LeaderboardEntry[];
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
    const player = JSON.parse(data) as Partial<Player>;
    if (typeof player.id !== 'string' || !player.id.trim()) return null;
    return { id: player.id, name: typeof player.name === 'string' ? player.name : '' };
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
    const formData = new URLSearchParams({ action });
    Object.entries(payload).forEach(([key, value]) => formData.set(key, String(value)));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        // application/x-www-form-urlencoded is CORS-safelisted and avoids an OPTIONS preflight.
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
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
 * Creates a player through the registration API. Player IDs are API-issued only.
 */
export async function registerPlayer(name: string): Promise<Player> {
  const existingPlayer = getLocalPlayer();
  if (existingPlayer?.id) return existingPlayer;

  const sanitizedName = name.trim();
  if (!sanitizedName) throw new PlayerRegistrationError("Name is required");

  let response: Response;
  try {
    response = await fetch(config.googleAppsScriptUrl, {
      method: 'POST',
      // A form-encoded POST is CORS-simple, so Google Apps Script receives this
      // request directly instead of the browser issuing an OPTIONS preflight.
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'createPlayer',
        playerName: sanitizedName,
      }).toString(),
    });
  } catch (error) {
    console.error('Player registration request failed:', error);
    throw new PlayerRegistrationError('Unable to reach the registration service. Please check your connection and try again.');
  }

  if (!response.ok) {
    throw new PlayerRegistrationError(`Registration service returned an error (${response.status}). Please try again.`);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    console.error('Player registration returned invalid JSON:', error);
    throw new PlayerRegistrationError('The registration service returned an invalid response. Please try again.');
  }

  if (!result || typeof result !== 'object') {
    throw new PlayerRegistrationError('The registration service returned an unexpected response. Please try again.');
  }

  const data = result as { success?: unknown; playerId?: unknown; playerName?: unknown; error?: unknown };
  if (data.success !== true) {
    const message = typeof data.error === 'string' && data.error.trim()
      ? data.error
      : 'Player registration failed. Please try again.';
    throw new PlayerRegistrationError(message);
  }

  if (typeof data.playerId !== 'string' || !data.playerId || typeof data.playerName !== 'string') {
    throw new PlayerRegistrationError('The registration service returned an incomplete response. Please try again.');
  }

  const player = { id: data.playerId, name: data.playerName };
  saveLocalPlayer(player);
  return player;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/** Sends a contact message to the existing Google Apps Script web app. */
export async function submitContactForm(data: ContactFormData): Promise<string> {
  let response: Response;
  try {
    response = await fetch(config.googleAppsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'contact',
        name: data.name,
        email: data.email,
        message: data.message,
      }).toString(),
    });
  } catch (error) {
    console.error('Contact request failed:', error);
    throw new Error('Unable to send your message. Please check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error(`Contact service returned an error (${response.status}). Please try again.`);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    console.error('Contact response returned invalid JSON:', error);
    throw new Error('The contact service returned an invalid response. Please try again.');
  }

  const responseData = result as { success?: unknown; message?: unknown };
  if (responseData.success !== true) {
    throw new Error(typeof responseData.message === 'string' ? responseData.message : 'Unable to send your message. Please try again.');
  }

  return typeof responseData.message === 'string' ? responseData.message : 'Contact form submitted successfully';
}

// -------------------------------------------------------------
// Local Best Scores and Score Sync
// -------------------------------------------------------------

export interface LocalBestScores {
  Description: number;
  Colour: number;
  Zoom: number;
}

type ScoreCategory = keyof LocalBestScores;

const BEST_SCORES_KEY = 'animegames_best_scores';
const EMPTY_BEST_SCORES: LocalBestScores = { Description: 0, Colour: 0, Zoom: 0 };

function scoreCategoryFor(gameId: string): ScoreCategory | null {
  const categories: Record<string, ScoreCategory> = {
    description: 'Description',
    colour: 'Colour',
    zoomed: 'Zoom',
  };
  return categories[gameId] ?? null;
}

/** Gets best percentage scores by game category, never by anime. */
export function getLocalBestScores(): LocalBestScores {
  if (typeof window === 'undefined') return { ...EMPTY_BEST_SCORES };
  try {
    const data = localStorage.getItem(BEST_SCORES_KEY);
    if (!data) return { ...EMPTY_BEST_SCORES };
    const saved = JSON.parse(data) as Partial<LocalBestScores>;
    return {
      Description: typeof saved.Description === 'number' ? saved.Description : 0,
      Colour: typeof saved.Colour === 'number' ? saved.Colour : 0,
      Zoom: typeof saved.Zoom === 'number' ? saved.Zoom : 0,
    };
  } catch (error) {
    console.error('Failed to read local best scores:', error);
    return { ...EMPTY_BEST_SCORES };
  }
}

/** Saves and reports a new category best only when the completed round improves it. */
export function saveLocalBestScore(gameId: string, currentScore: number): boolean {
  const category = scoreCategoryFor(gameId);
  if (!category) return false;

  const bestScores = getLocalBestScores();
  if (currentScore <= bestScores[category]) return false;

  bestScores[category] = currentScore;
  localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(bestScores));
  return true;
}

/** Sends only one improved category score; the other API category values remain zero. */
export async function updateBestScore(playerId: string, gameId: string, currentScore: number): Promise<boolean> {
  const category = scoreCategoryFor(gameId);
  if (!category) return false;

  const scores: LocalBestScores = { ...EMPTY_BEST_SCORES, [category]: currentScore };
  const response = await fetchFromAppsScript('updateScores', {
    playerId,
    scores: JSON.stringify(scores),
  });
  if (!response?.success) {
    console.error('Google Sheets score update was rejected:', response?.error ?? 'No valid API response received.', {
      playerId,
      scores,
    });
    return false;
  }
  return true;
}

/** Fetches all Google Sheets leaderboard categories in one GET request. */
export async function getGoogleLeaderboards(): Promise<GoogleLeaderboards> {
  const url = new URL(config.googleAppsScriptUrl);
  url.search = new URLSearchParams({ action: 'getAllLeaderboard' }).toString();

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (error) {
    console.error('Leaderboard request failed:', error);
    throw new Error('Unable to reach the leaderboard service.');
  }

  if (!response.ok) {
    throw new Error(`Leaderboard service returned an error (${response.status}).`);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    console.error('Leaderboard returned invalid JSON:', error);
    throw new Error('The leaderboard service returned an invalid response.');
  }

  const data = result as { success?: unknown; leaderboards?: unknown; error?: unknown };
  if (data?.success !== true || !data.leaderboards || typeof data.leaderboards !== 'object') {
    throw new Error(typeof data?.error === 'string' ? data.error : 'The leaderboard service returned an unexpected response.');
  }

  const leaderboards = data.leaderboards as Partial<GoogleLeaderboards>;
  return {
    Combined: Array.isArray(leaderboards.Combined) ? leaderboards.Combined : [],
    Description: Array.isArray(leaderboards.Description) ? leaderboards.Description : [],
    Colour: Array.isArray(leaderboards.Colour) ? leaderboards.Colour : [],
    Zoom: Array.isArray(leaderboards.Zoom) ? leaderboards.Zoom : [],
  };
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
