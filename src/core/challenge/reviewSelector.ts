import { ParsedVerb, VerbStatsEntry } from '../types';

/**
 * Mezcla aleatoriamente un array usando el algoritmo Fisher-Yates (función pura).
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selecciona verbos de repaso de niveles anteriores ponderando aquellos con mayor historial de fallos.
 *
 * - Si currentLevel == 1: retorna [] (no hay niveles anteriores).
 * - Para desafíos 1-3 en niveles >= 2: count = 1.
 * - Para desafío final en niveles >= 2: count = 5.
 */
export function selectReviewVerbs(
  allVerbs: readonly ParsedVerb[],
  currentLevel: number,
  count: number,
  verbsStats: { [verbIndex: number]: VerbStatsEntry } = {}
): ParsedVerb[] {
  if (currentLevel <= 1 || count <= 0) {
    return [];
  }

  // Verbos de niveles anteriores (niveles 1 a currentLevel - 1)
  const maxPreviousVerbIndex = (currentLevel - 1) * 5;
  const previousVerbs = allVerbs.filter((v) => v.index <= maxPreviousVerbIndex);

  if (previousVerbs.length === 0) {
    return [];
  }

  const effectiveCount = Math.min(count, previousVerbs.length);

  // Separar verbos con fallos registrados y sin fallos
  const verbsWithFailures: { verb: ParsedVerb; failures: number }[] = [];
  const verbsWithoutFailures: ParsedVerb[] = [];

  for (const verb of previousVerbs) {
    const stats = verbsStats[verb.index];
    const failures = stats ? stats.timesFailed : 0;
    if (failures > 0) {
      verbsWithFailures.push({ verb, failures });
    } else {
      verbsWithoutFailures.push(verb);
    }
  }

  // Ordenar los que tienen fallos de mayor a menor número de fallos con cierto factor aleatorio
  verbsWithFailures.sort((a, b) => b.failures - a.failures);

  const selected: ParsedVerb[] = [];

  // Tomamos primero de los más fallados
  for (const item of verbsWithFailures) {
    if (selected.length < effectiveCount) {
      selected.push(item.verb);
    }
  }

  // Si aún faltan para completar 'count', completamos con los restantes barajados aleatoriamente
  if (selected.length < effectiveCount) {
    const remainingToPick = effectiveCount - selected.length;
    const shuffledClean = shuffleArray(verbsWithoutFailures);
    selected.push(...shuffledClean.slice(0, remainingToPick));
  }

  return selected;
}
