import { AppStorageState, AppSettings, AppProgress, AppStatistics } from '../core/types';

export const STORAGE_KEY = 'irregular_verbs_data';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Genera el estado inicial limpio por defecto.
 */
export function getDefaultStorageState(): AppStorageState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: {
      soundEnabled: true,
      reducedMotion: false,
    },
    progress: {
      unlockedLevel: 1,
      levels: {},
    },
    statistics: {
      totalPlayTimeSeconds: 0,
      totalAnswersCorrect: 0,
      totalAnswersFailed: 0,
      lastPlayedTimestamp: null,
      lastPlayedResult: null,
      currentStreakDays: 0,
      bestStreakDays: 0,
      lastActiveDateString: null,
      activeDaysHistory: {},
      verbsStats: {},
    },
  };
}

/**
 * Valida y migra un objeto crudo de almacenamiento si es necesario.
 */
export function sanitizeStorageState(raw: unknown): AppStorageState {
  if (!raw || typeof raw !== 'object') {
    return getDefaultStorageState();
  }

  const obj = raw as Partial<AppStorageState>;

  // Verificar schemaVersion
  if (typeof obj.schemaVersion !== 'number' || obj.schemaVersion < 1) {
    return getDefaultStorageState();
  }

  const defaultState = getDefaultStorageState();

  const settings: AppSettings = {
    soundEnabled:
      typeof obj.settings?.soundEnabled === 'boolean'
        ? obj.settings.soundEnabled
        : defaultState.settings.soundEnabled,
    reducedMotion:
      typeof obj.settings?.reducedMotion === 'boolean'
        ? obj.settings.reducedMotion
        : defaultState.settings.reducedMotion,
  };

  const progress: AppProgress = {
    unlockedLevel:
      typeof obj.progress?.unlockedLevel === 'number' && obj.progress.unlockedLevel >= 1
        ? Math.min(20, Math.max(1, obj.progress.unlockedLevel))
        : 1,
    levels: (obj.progress?.levels && typeof obj.progress.levels === 'object')
      ? obj.progress.levels
      : {},
  };

  const statistics: AppStatistics = {
    totalPlayTimeSeconds:
      typeof obj.statistics?.totalPlayTimeSeconds === 'number'
        ? Math.max(0, obj.statistics.totalPlayTimeSeconds)
        : 0,
    totalAnswersCorrect:
      typeof obj.statistics?.totalAnswersCorrect === 'number'
        ? Math.max(0, obj.statistics.totalAnswersCorrect)
        : 0,
    totalAnswersFailed:
      typeof obj.statistics?.totalAnswersFailed === 'number'
        ? Math.max(0, obj.statistics.totalAnswersFailed)
        : 0,
    lastPlayedTimestamp:
      typeof obj.statistics?.lastPlayedTimestamp === 'number'
        ? obj.statistics.lastPlayedTimestamp
        : null,
    lastPlayedResult:
      obj.statistics?.lastPlayedResult === 'victory' || obj.statistics?.lastPlayedResult === 'defeat'
        ? obj.statistics.lastPlayedResult
        : null,
    currentStreakDays:
      typeof obj.statistics?.currentStreakDays === 'number'
        ? Math.max(0, obj.statistics.currentStreakDays)
        : 0,
    bestStreakDays:
      typeof obj.statistics?.bestStreakDays === 'number'
        ? Math.max(0, obj.statistics.bestStreakDays)
        : 0,
    lastActiveDateString:
      typeof obj.statistics?.lastActiveDateString === 'string'
        ? obj.statistics.lastActiveDateString
        : null,
    activeDaysHistory:
      (obj.statistics?.activeDaysHistory && typeof obj.statistics.activeDaysHistory === 'object')
        ? obj.statistics.activeDaysHistory
        : {},
    verbsStats:
      (obj.statistics?.verbsStats && typeof obj.statistics.verbsStats === 'object')
        ? obj.statistics.verbsStats
        : {},
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings,
    progress,
    statistics,
  };
}

/**
 * Carga el estado persistido desde localStorage de forma segura.
 */
export function loadStorageState(storage: Storage = window.localStorage): AppStorageState {
  try {
    const rawData = storage.getItem(STORAGE_KEY);
    if (!rawData) {
      return getDefaultStorageState();
    }
    const parsed = JSON.parse(rawData);
    return sanitizeStorageState(parsed);
  } catch {
    return getDefaultStorageState();
  }
}

/**
 * Guarda el estado en localStorage.
 */
export function saveStorageState(state: AppStorageState, storage: Storage = window.localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

/**
 * Exporta el estado a una cadena JSON formateada.
 */
export function exportStateToJson(state: AppStorageState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Importa y valida una cadena JSON, devolviendo el estado migrado o lanzando error.
 */
export function importStateFromJson(jsonString: string): AppStorageState {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('El archivo de backup está vacío o no es válido.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('El archivo no contiene un formato JSON válido.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Estructura de backup inválida.');
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.schemaVersion !== 'number') {
    throw new Error('El archivo de backup no contiene una versión de esquema válida (schemaVersion).');
  }

  if (!obj.progress || typeof obj.progress !== 'object') {
    throw new Error('El archivo de backup no contiene información de progreso válida.');
  }

  return sanitizeStorageState(parsed);
}

/**
 * Reinicia el estado de localStorage a los valores por defecto.
 */
export function resetStorageState(storage: Storage = window.localStorage): AppStorageState {
  const fresh = getDefaultStorageState();
  saveStorageState(fresh, storage);
  return fresh;
}
