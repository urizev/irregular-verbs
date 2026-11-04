import {
  ParsedVerb,
  ChallengeConfig,
  ChallengeState,
  ChallengeItem,
  VerbStatsEntry,
  AppProgress,
  AppStatistics,
} from '../types';
import { shuffleArray, selectReviewVerbs } from './reviewSelector';
import { validateVerb } from '../validator/answerValidator';

export const VERBS_PER_LEVEL = 5;
export const MAX_LEVELS = 20;

/**
 * Obtiene el límite máximo de fallos permitidos según el índice del desafío (0 a 3).
 * Desafío 1 (0) -> 2 fallos
 * Desafío 2 (1) -> 1 fallo
 * Desafío 3 (2) -> 0 fallos
 * Desafío Final (3) -> 0 fallos
 */
export function getMaxAllowedErrors(challengeIndex: number): number {
  switch (challengeIndex) {
    case 0:
      return 2;
    case 1:
      return 1;
    case 2:
      return 0;
    case 3:
      return 0;
    default:
      return 0;
  }
}

/**
 * Obtiene los verbos base correspondientes a un nivel específico.
 */
export function getLevelVerbs(allVerbs: readonly ParsedVerb[], levelNumber: number): ParsedVerb[] {
  const startIndex = (levelNumber - 1) * VERBS_PER_LEVEL;
  const endIndex = startIndex + VERBS_PER_LEVEL;
  return allVerbs.slice(startIndex, endIndex);
}

/**
 * Genera la configuración para un desafío específico.
 */
export function createChallengeConfig(
  allVerbs: readonly ParsedVerb[],
  levelNumber: number,
  challengeIndex: number,
  verbsStats: { [verbIndex: number]: VerbStatsEntry } = {}
): ChallengeConfig {
  const levelVerbs = getLevelVerbs(allVerbs, levelNumber);
  const maxAllowedErrors = getMaxAllowedErrors(challengeIndex);

  let reviewCount = 0;
  if (challengeIndex === 3) {
    // Desafío final: 5 verbos de niveles anteriores (o menos si no hay suficientes)
    reviewCount = 5;
  } else if (levelNumber >= 2) {
    // Desafíos 1, 2 y 3 en niveles >= 2: 1 verbo de repaso
    reviewCount = 1;
  }

  const reviewVerbs = selectReviewVerbs(allVerbs, levelNumber, reviewCount, verbsStats);
  const combinedVerbs = [...levelVerbs, ...reviewVerbs];
  const shuffledVerbs = shuffleArray(combinedVerbs);

  return {
    levelNumber,
    challengeIndex,
    maxAllowedErrors,
    verbs: shuffledVerbs,
  };
}

/**
 * Inicializa el estado de ejecución de un desafío.
 */
export function initChallengeState(config: ChallengeConfig): ChallengeState {
  const queue: ChallengeItem[] = config.verbs.map((verb) => ({
    verb,
    isRetry: false,
  }));

  const firstItem = queue[0] || null;

  return {
    levelNumber: config.levelNumber,
    challengeIndex: config.challengeIndex,
    maxAllowedErrors: config.maxAllowedErrors,
    errorsCommitted: 0,
    heartsRemaining: config.maxAllowedErrors + 1,
    status: firstItem ? 'playing' : 'victory',
    currentVerb: firstItem ? firstItem.verb : null,
    currentIsRetry: firstItem ? firstItem.isRetry : false,
    queue: queue.slice(1),
    totalInitialQuestions: config.verbs.length,
    completedQuestionsCount: 0,
    lastValidationResult: null,
    starsEarned: 0,
    startedAt: Date.now(),
    finishedAt: null,
  };
}

/**
 * Calcula las estrellas obtenidas según los fallos cometidos.
 */
export function calculateStars(errorsCommitted: number): number {
  if (errorsCommitted === 0) return 3;
  if (errorsCommitted === 1) return 2;
  if (errorsCommitted === 2) return 1;
  return 0;
}

/**
 * Procesa la respuesta del usuario para el verbo actual y devuelve el nuevo estado del desafío.
 */
export function submitAnswer(
  currentState: ChallengeState,
  userInput: { present: string; past: string; participle: string }
): ChallengeState {
  if (currentState.status !== 'playing' || !currentState.currentVerb) {
    return currentState;
  }

  const currentVerb = currentState.currentVerb;
  const validationResult = validateVerb(userInput, currentVerb);

  if (validationResult.isValid) {
    // Acierto: el verbo se da por superado
    const nextQueue = [...currentState.queue];
    const nextItem = nextQueue.shift() || null;
    const completedCount = currentState.completedQuestionsCount + 1;

    if (!nextItem) {
      // Se vació la cola -> Victoria
      const stars = calculateStars(currentState.errorsCommitted);
      return {
        ...currentState,
        status: 'victory',
        currentVerb: null,
        currentIsRetry: false,
        queue: [],
        completedQuestionsCount: completedCount,
        lastValidationResult: validationResult,
        starsEarned: stars,
        finishedAt: Date.now(),
      };
    }

    return {
      ...currentState,
      currentVerb: nextItem.verb,
      currentIsRetry: nextItem.isRetry,
      queue: nextQueue,
      completedQuestionsCount: completedCount,
      lastValidationResult: validationResult,
    };
  }

  // Fallo: incrementa contador de errores y re-encola el verbo al final
  const nextErrors = currentState.errorsCommitted + 1;
  const nextHearts = Math.max(0, currentState.maxAllowedErrors + 1 - nextErrors);
  const isDefeat = nextErrors > currentState.maxAllowedErrors;

  if (isDefeat) {
    return {
      ...currentState,
      errorsCommitted: nextErrors,
      heartsRemaining: 0,
      status: 'defeat',
      lastValidationResult: validationResult,
      finishedAt: Date.now(),
    };
  }

  // Re-encolar al final de la cola para volver a preguntarlo
  const nextQueue = [
    ...currentState.queue,
    { verb: currentVerb, isRetry: true },
  ];

  return {
    ...currentState,
    errorsCommitted: nextErrors,
    heartsRemaining: nextHearts,
    status: 'feedback_error',
    lastValidationResult: validationResult,
    queue: nextQueue,
  };
}

/**
 * Pasa al siguiente verbo tras la pantalla de feedback de error.
 */
export function dismissErrorFeedback(currentState: ChallengeState): ChallengeState {
  if (currentState.status !== 'feedback_error') {
    return currentState;
  }

  const nextQueue = [...currentState.queue];
  const nextItem = nextQueue.shift() || null;

  if (!nextItem) {
    // Caso de borde si la cola estuviera vacía
    const stars = calculateStars(currentState.errorsCommitted);
    return {
      ...currentState,
      status: 'victory',
      currentVerb: null,
      currentIsRetry: false,
      queue: [],
      starsEarned: stars,
      finishedAt: Date.now(),
    };
  }

  return {
    ...currentState,
    status: 'playing',
    currentVerb: nextItem.verb,
    currentIsRetry: nextItem.isRetry,
    queue: nextQueue,
    lastValidationResult: null,
  };
}

/**
 * Aplica el resultado de un desafío completado al progreso del usuario (candado de un solo sentido).
 */
export function applyChallengeVictoryToProgress(
  progress: AppProgress,
  levelNumber: number,
  challengeIndex: number,
  starsEarned: number
): AppProgress {
  const currentLevels = { ...progress.levels };
  const currentLevelData = currentLevels[levelNumber] || { challenges: {} };
  const currentChallengeData = currentLevelData.challenges[challengeIndex] || {
    completed: false,
    bestStars: 0,
    attempts: 0,
  };

  const updatedChallengeData = {
    completed: true,
    bestStars: Math.max(currentChallengeData.bestStars, starsEarned),
    attempts: currentChallengeData.attempts + 1,
  };

  const updatedLevelData = {
    ...currentLevelData,
    challenges: {
      ...currentLevelData.challenges,
      [challengeIndex]: updatedChallengeData,
    },
  };

  let nextUnlockedLevel = progress.unlockedLevel;

  // Si se completó el desafío final (index 3), se desbloquea el siguiente nivel
  if (challengeIndex === 3 && levelNumber === progress.unlockedLevel && levelNumber < MAX_LEVELS) {
    nextUnlockedLevel = levelNumber + 1;
  }

  return {
    ...progress,
    unlockedLevel: nextUnlockedLevel,
    levels: {
      ...currentLevels,
      [levelNumber]: updatedLevelData,
    },
  };
}

/**
 * Registra un intento de desafío fallido en el progreso.
 */
export function applyChallengeDefeatToProgress(
  progress: AppProgress,
  levelNumber: number,
  challengeIndex: number
): AppProgress {
  const currentLevels = { ...progress.levels };
  const currentLevelData = currentLevels[levelNumber] || { challenges: {} };
  const currentChallengeData = currentLevelData.challenges[challengeIndex] || {
    completed: false,
    bestStars: 0,
    attempts: 0,
  };

  const updatedChallengeData = {
    ...currentChallengeData,
    attempts: currentChallengeData.attempts + 1,
  };

  return {
    ...progress,
    levels: {
      ...currentLevels,
      [levelNumber]: {
        ...currentLevelData,
        challenges: {
          ...currentLevelData.challenges,
          [challengeIndex]: updatedChallengeData,
        },
      },
    },
  };
}

/**
 * Actualiza las estadísticas acumuladas de la aplicación tras una respuesta o desafío.
 */
export function updateStatisticsAfterAnswer(
  statistics: AppStatistics,
  verbIndex: number,
  isCorrect: boolean
): AppStatistics {
  const currentVerbsStats = { ...statistics.verbsStats };
  const currentEntry = currentVerbsStats[verbIndex] || {
    timesAsked: 0,
    timesFailed: 0,
    lastPracticedTimestamp: 0,
  };

  const updatedEntry: VerbStatsEntry = {
    timesAsked: currentEntry.timesAsked + 1,
    timesFailed: isCorrect ? currentEntry.timesFailed : currentEntry.timesFailed + 1,
    lastPracticedTimestamp: Date.now(),
  };

  return {
    ...statistics,
    totalAnswersCorrect: isCorrect
      ? statistics.totalAnswersCorrect + 1
      : statistics.totalAnswersCorrect,
    totalAnswersFailed: isCorrect
      ? statistics.totalAnswersFailed
      : statistics.totalAnswersFailed + 1,
    verbsStats: {
      ...currentVerbsStats,
      [verbIndex]: updatedEntry,
    },
  };
}
