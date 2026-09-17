import {
  filterQuestionsByTrollMode,
  getTrollMode,
  selectSessionQuestions,
  type Question,
} from './gameSession';
import {
  clearAnimeProgress,
  clearMiscProgress,
  getAnimeProgress,
  getLocalPlayer,
  getMiscProgress,
  saveAnimeProgress,
  saveGameResult,
  saveMiscProgress,
} from './api';
import { loadQuestions } from './gameSession';

function progressScope(gameId: string, trollMode: boolean): string {
  return trollMode ? `${gameId}:troll` : gameId;
}

export function getClientSessionQuestions(
  allQuestions: Question[],
  gameId: string,
  animeId: string,
  questionLimit: number,
  isMiscellaneous: boolean,
): Question[] {
  const trollMode = getTrollMode(gameId);
  const scopedGameId = progressScope(gameId, trollMode);
  const filteredQuestions = filterQuestionsByTrollMode(allQuestions, trollMode);

  return selectSessionQuestions(
    filteredQuestions,
    scopedGameId,
    animeId,
    questionLimit,
    isMiscellaneous,
    getAnimeProgress,
    getMiscProgress,
    (progressGameId, progressAnimeId, miscellaneous) => {
      if (miscellaneous) clearMiscProgress(progressGameId);
      else clearAnimeProgress(progressGameId, progressAnimeId);
    },
  );
}

/** Read the current question files at game start, including every source in Miscellaneous mode. */
export async function loadCurrentClientQuestions(
  fallbackQuestions: Question[],
  gameId: string,
  animeId: string,
  isMiscellaneous: boolean,
): Promise<Question[]> {
  if (!isMiscellaneous) return loadQuestions(gameId, animeId);

  const animeIds = Array.from(new Set(fallbackQuestions.map(question => question._animeId).filter(Boolean)));
  const questionGroups = await Promise.all(animeIds.map(async (sourceAnimeId) => {
    const questions = await loadQuestions(gameId, sourceAnimeId);
    return questions.map(question => ({ ...question, _animeId: sourceAnimeId }));
  }));
  return questionGroups.flat();
}

export async function saveClientSession(
  gameId: string,
  animeId: string,
  isMiscellaneous: boolean,
  playedQuestionIds: string[],
  score: number,
  percentage: number,
): Promise<void> {
  const trollMode = getTrollMode(gameId);
  const scopedGameId = progressScope(gameId, trollMode);
  if (isMiscellaneous) {
    const previousPlayed = getMiscProgress(scopedGameId);
    const updatedPlayed = Array.from(new Set([...previousPlayed, ...playedQuestionIds]));
    saveMiscProgress(scopedGameId, updatedPlayed);
  } else if (playedQuestionIds.length) {
    const previousPlayed = getAnimeProgress(scopedGameId, animeId);
    saveAnimeProgress(scopedGameId, animeId, Array.from(new Set([...previousPlayed, ...playedQuestionIds])));
  }

  const player = getLocalPlayer();
  if (player) {
    await saveGameResult({
      playerId: player.id,
      name: player.name,
      gameId,
      animeId,
      score,
      percentage,
    });
  }
}
