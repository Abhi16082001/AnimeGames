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
  );
}

export async function saveClientSession(
  allQuestions: Question[],
  gameId: string,
  animeId: string,
  isMiscellaneous: boolean,
  playedQuestionIds: string[],
  score: number,
  percentage: number,
): Promise<void> {
  const trollMode = getTrollMode(gameId);
  const scopedGameId = progressScope(gameId, trollMode);
  const filteredQuestions = filterQuestionsByTrollMode(allQuestions, trollMode);

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

  if (isMiscellaneous) {
    const previousPlayed = getMiscProgress(scopedGameId);
    const updatedPlayed = Array.from(new Set([...previousPlayed, ...playedQuestionIds]));
    if (filteredQuestions.length === 0 || updatedPlayed.length >= filteredQuestions.length) {
      clearMiscProgress(scopedGameId);
    } else {
      saveMiscProgress(scopedGameId, playedQuestionIds);
    }
    return;
  }

  const lastPlayedId = playedQuestionIds.at(-1);
  if (!lastPlayedId) return;

  const lastIndex = filteredQuestions.findIndex((question) => question.id === lastPlayedId);
  if (lastIndex === filteredQuestions.length - 1) {
    clearAnimeProgress(scopedGameId, animeId);
  } else {
    saveAnimeProgress(scopedGameId, animeId, lastPlayedId);
  }
}
