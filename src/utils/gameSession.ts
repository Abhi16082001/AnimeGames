// gameSession.ts - Shared game session logic for all game types

import gamescategory from '../../database/gamescategory.json';

export interface Question {
  id: string;
  troll: boolean;
  [key: string]: any;
}

export interface GameSessionData {
  gameId: string;
  animeId: string;
  isMiscellaneous: boolean;
  questionLimit: number;
  questions: Question[];
  trollMode: boolean;
  currentQuestionIndex: number;
  correctCount: number;
  wrongCount: number;
  scores: number[];
  playedQuestionIds: string[];
  startTime: number;
}

const TROLL_MODE_KEY = 'animegames_trollmode';

/**
 * Load questions from the static JSON file
 */
export async function loadQuestions(gameId: string, animeId: string): Promise<Question[]> {
  try {
    const response = await fetch(`/database/${gameId}/${animeId}/question.json`);
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}

/**
 * Load and combine questions for Miscellaneous mode
 */
export async function loadMiscQuestions(gameId: string, animecategory: any[]): Promise<Question[]> {
  const supportedAnime = animecategory.filter(a => a.gameCategoryIds.includes(gameId));
  const allQuestions: Question[] = [];
  
  for (const anime of supportedAnime) {
    try {
      const response = await fetch(`/database/${gameId}/${anime.id}/question.json`);
      if (response.ok) {
        const questions = await response.json();
        allQuestions.push(...questions.map((q: Question) => ({
          ...q,
          _animeId: anime.id,
          _animeName: anime.name
        })));
      }
    } catch (error) {
      console.error(`Error loading questions for ${anime.id}:`, error);
    }
  }
  
  return allQuestions;
}

/**
 * Filter questions by Troll Mode
 */
export function filterQuestionsByTrollMode(questions: Question[], trollMode: boolean): Question[] {
  return questions.filter(q => q.troll === trollMode);
}

/** Checks an exact lower-case user answer against the accepted answers in question.json. */
export function isAnswerInList(userAnswer: string, configuredAnswers: string[] | string): boolean {
  // Keep existing single-string question files playable while new files use lower-case arrays.
  const acceptedAnswers = Array.isArray(configuredAnswers) ? configuredAnswers : [configuredAnswers.toLowerCase()];
  return acceptedAnswers.includes(userAnswer.toLowerCase());
}

/** Uses the primary accepted answer when revealing a question. */
export function getPrimaryAnswer(configuredAnswers: string[] | string): string {
  return Array.isArray(configuredAnswers) ? configuredAnswers[0] ?? '' : configuredAnswers;
}

/**
 * Get question limit for a game
 */
export function getQuestionLimit(gameId: string): number {
  const game = gamescategory.find(g => g.id === gameId);
  return game?.questionLimit ?? 0;
}

/**
 * Get Troll Mode state from localStorage
 */
export function getTrollMode(_gameId?: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(TROLL_MODE_KEY);
      return data === 'true';
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Save Troll Mode state to localStorage
 */
export function setTrollMode(_gameId: string | undefined, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TROLL_MODE_KEY, String(enabled));
  } catch (error) {
    console.error('Failed to save Troll Mode:', error);
  }
}

/**
 * Select session questions based on progress
 */
export function selectSessionQuestions(
  questions: Question[],
  gameId: string,
  animeId: string,
  questionLimit: number,
  isMiscellaneous: boolean,
  getProgress: (gameId: string, animeId: string) => string[],
  getMiscProgress: (gameId: string) => string[],
  clearProgress?: (gameId: string, animeId: string, isMiscellaneous: boolean) => void,
): Question[] {
  const shuffle = (items: Question[]): Question[] => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  };
  // An ID represents one question in a round, even if malformed source data repeats it.
  const uniqueQuestions = Array.from(new Map(questions.map(question => [question.id, question])).values());
  const playedIds = isMiscellaneous ? getMiscProgress(gameId) : getProgress(gameId, animeId);
  const playedSet = new Set(playedIds);
  const unplayed = uniqueQuestions.filter(question => !playedSet.has(question.id));

  if (unplayed.length === 0) {
    clearProgress?.(gameId, animeId, isMiscellaneous);
    return shuffle(uniqueQuestions).slice(0, questionLimit);
  }

  const selected = shuffle(unplayed).slice(0, questionLimit);
  if (selected.length < questionLimit) {
    const selectedIds = new Set(selected.map(question => question.id));
    const oldPoolQuestions = uniqueQuestions.filter(question => playedSet.has(question.id) && !selectedIds.has(question.id));
    selected.push(...shuffle(oldPoolQuestions).slice(0, questionLimit - selected.length));
    clearProgress?.(gameId, animeId, isMiscellaneous);
  }

  return selected;
}

/**
 * Calculate score percentage
 */
export function calculatePercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Calculate average score (0-1 range)
 */
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}

/**
 * Format time duration
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Save game result to localStorage and Apps Script
 */
export async function saveGameResult(
  gameId: string,
  animeId: string,
  score: number,
  percentage: number,
  saveResult: (result: any) => Promise<boolean>
): Promise<boolean> {
  const player = getLocalPlayer();
  if (!player) return false;
  
  const result = {
    playerId: player.id,
    name: player.name,
    gameId,
    animeId,
    score,
    percentage
  };
  
  return await saveResult(result);
}
