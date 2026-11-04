import { AppProgress, AppStatistics, ParsedVerb, VerbStatsEntry } from '../types';

export interface VerbRankItem {
  verb: ParsedVerb;
  timesAsked: number;
  timesFailed: number;
  errorRate: number; // 0 to 100
}

export interface ComputedStatistics {
  totalPlayTimeFormatted: string;
  totalPlayTimeSeconds: number;
  totalAnswersCorrect: number;
  totalAnswersFailed: number;
  totalAnswers: number;
  accuracyPercentage: number;
  currentStreakDays: number;
  bestStreakDays: number;
  mostFailedVerbs: VerbRankItem[];
  masteredVerbs: ParsedVerb[];
  totalChallengesCompleted: number;
  totalStarsEarned: number;
  maxPossibleStars: number;
  unlockedLevel: number;
  averageAttemptsPerChallenge: number;
}

/**
 * Obtiene la cadena de fecha actual en formato YYYY-MM-DD.
 */
export function getTodayDateString(timestamp = Date.now()): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea segundos a "Xh Ym" o "Xm Ys".
 */
export function formatPlayTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Calcula la racha de días consecutivos jugados.
 */
export function calculateStreak(
  activeDaysHistory: { [dateString: string]: number },
  todayStr = getTodayDateString()
): { currentStreak: number; bestStreak: number } {
  const dates = Object.keys(activeDaysHistory)
    .filter((d) => (activeDaysHistory[d] || 0) > 0)
    .sort();

  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Comprobar racha actual hacia atrás desde hoy o ayer
  const dateSet = new Set(dates);
  let checkDate = new Date(todayStr);

  // Si hoy no se ha jugado aún, comprobar si ayer se jugó
  const todayPlayed = dateSet.has(todayStr);
  if (!todayPlayed) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let currentStreak = 0;
  while (true) {
    const dStr = checkDate.toISOString().slice(0, 10);
    if (dateSet.has(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calcular mejor racha histórica
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of dates) {
    const curDate = new Date(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
  };
}

/**
 * Calcula el resumen completo de estadísticas computadas para la pantalla de Stats.
 */
export function computeAppStatistics(
  stats: AppStatistics,
  progress: AppProgress,
  allVerbs: readonly ParsedVerb[]
): ComputedStatistics {
  const totalAnswers = stats.totalAnswersCorrect + stats.totalAnswersFailed;
  const accuracyPercentage =
    totalAnswers > 0 ? Math.round((stats.totalAnswersCorrect / totalAnswers) * 100) : 0;

  const verbsMap = new Map<number, ParsedVerb>();
  allVerbs.forEach((v) => verbsMap.set(v.index, v));

  const failedItems: VerbRankItem[] = [];
  const masteredList: ParsedVerb[] = [];

  for (const verb of allVerbs) {
    const entry: VerbStatsEntry = stats.verbsStats[verb.index] || {
      timesAsked: 0,
      timesFailed: 0,
      lastPracticedTimestamp: 0,
    };

    if (entry.timesFailed > 0) {
      const rate =
        entry.timesAsked > 0 ? Math.round((entry.timesFailed / entry.timesAsked) * 100) : 0;
      failedItems.push({
        verb,
        timesAsked: entry.timesAsked,
        timesFailed: entry.timesFailed,
        errorRate: rate,
      });
    }

    if (entry.timesAsked >= 2 && entry.timesFailed === 0) {
      masteredList.push(verb);
    }
  }

  // Ordenar los más fallados por número de fallos descendente y luego por tasa de error
  failedItems.sort((a, b) => {
    if (b.timesFailed !== a.timesFailed) {
      return b.timesFailed - a.timesFailed;
    }
    return b.errorRate - a.errorRate;
  });

  // Métricas de progreso
  let totalChallengesCompleted = 0;
  let totalStarsEarned = 0;
  let totalAttemptsSum = 0;
  let challengesWithAttemptsCount = 0;

  Object.values(progress.levels).forEach((lvl) => {
    Object.values(lvl.challenges).forEach((ch) => {
      if (ch.completed) {
        totalChallengesCompleted++;
        totalStarsEarned += ch.bestStars;
      }
      if (ch.attempts > 0) {
        totalAttemptsSum += ch.attempts;
        challengesWithAttemptsCount++;
      }
    });
  });

  const averageAttemptsPerChallenge =
    challengesWithAttemptsCount > 0
      ? Number((totalAttemptsSum / challengesWithAttemptsCount).toFixed(1))
      : 1;

  const maxPossibleStars = 20 * 4 * 3; // 20 niveles * 4 desafíos * 3 estrellas = 240

  const streaks = calculateStreak(stats.activeDaysHistory);

  return {
    totalPlayTimeFormatted: formatPlayTime(stats.totalPlayTimeSeconds),
    totalPlayTimeSeconds: stats.totalPlayTimeSeconds,
    totalAnswersCorrect: stats.totalAnswersCorrect,
    totalAnswersFailed: stats.totalAnswersFailed,
    totalAnswers,
    accuracyPercentage,
    currentStreakDays: streaks.currentStreak,
    bestStreakDays: Math.max(streaks.bestStreak, stats.bestStreakDays),
    mostFailedVerbs: failedItems.slice(0, 10),
    masteredVerbs: masteredList,
    totalChallengesCompleted,
    totalStarsEarned,
    maxPossibleStars,
    unlockedLevel: progress.unlockedLevel,
    averageAttemptsPerChallenge,
  };
}
