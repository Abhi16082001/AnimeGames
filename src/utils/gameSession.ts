// gameSession.ts - Shared game session logic for all game types

import { config } from '../config';
import gamescategory from '../../database/gamescategory.json';
import type { GameProgress } from './api';

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

/**
 * Get question limit for a game
 */
export function getQuestionLimit(gameId: string): number {
  const game = gamescategory.find(g => g.id === gameId);
  return game?.questionLimit || 3;
}

/**
 * Get Troll Mode state from localStorage
 */
export function getTrollMode(gameId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const data = localStorage.getItem(`${TROLL_MODE_KEY}_${gameId}`);
    return data === 'true';
  } catch {
    return false;
  }
}

/**
 * Save Troll Mode state to localStorage
 */
export function setTrollMode(gameId: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${TROLL_MODE_KEY}_${gameId}`, String(enabled));
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
  getProgress: (gameId: string, animeId: string) => string | null,
  getMiscProgress: (gameId: string) => string[]
): Question[] {
  if (isMiscellaneous) {
    const playedIds = getMiscProgress(gameId);
    const available = questions.filter(q => !playedIds.includes(q.id));
    
    // Shuffle available questions
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, questionLimit);
  }
  
  // Normal anime category - use lastPlayedQuestionId
  const lastPlayedId = getProgress(gameId, animeId);
  let startIndex = 0;
  
  if (lastPlayedId) {
    const lastIndex = questions.findIndex(q => q.id === lastPlayedId);
    if (lastIndex !== -1) {
      startIndex = lastIndex + 1;
    }
  }
  
  // If we've reached the end, cycle is complete - start from beginning
  if (startIndex >= questions.length) {
    startIndex = 0;
  }
  
  return questions.slice(startIndex, startIndex + questionLimit);
}

/**
 * Save progress after a session
 */
export function saveSessionProgress(
  gameId: string,
  animeId: string,
  isMiscellaneous: boolean,
  playedQuestionIds: string[],
  getProgress: (gameId: string, animeId: string) => string | null,
  getMiscProgress: (gameId: string) => string[],
  saveAnimeProgress: (gameId: string, animeId: string, lastPlayedQuestionId: string) => void,
  saveMiscProgress: (gameId: string, playedQuestionIds: string[]) => void,
  clearAnimeProgress: (gameId: string, animeId: string) => void,
  clearMiscProgress: (gameId: string) => void,
  allQuestions: Question[]
): void {
  if (isMiscellaneous) {
    const currentPlayed = getMiscProgress(gameId);
    const updatedPlayed = Array.from(new Set([...currentPlayed, ...playedQuestionIds]));
    
    // Check if all available questions have been played
    const availableCount = allQuestions.filter(q => !currentPlayed.includes(q.id)).length;
    if (updatedPlayed.length >= allQuestions.length || availableCount === 0) {
      clearMiscProgress(gameId);
    } else {
      saveMiscProgress(gameId, updatedPlayed);
    }
  } else {
    if (playedQuestionIds.length > 0) {
      const lastPlayedId = playedQuestionIds[playedQuestionIds.length - 1];
      
      // Check if this was the last question
      const lastIndex = allQuestions.findIndex(q => q.id === lastPlayedId);
      if (lastIndex === allQuestions.length - 1) {
        // Completed the cycle
        clearAnimeProgress(gameId, animeId);
      } else {
        saveAnimeProgress(gameId, animeId, lastPlayedId);
      }
    }
  }
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

