import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppStorageState,
  AppSettings,
  ParsedVerb,
} from '../core/types';
import {
  loadStorageState,
  saveStorageState,
  exportStateToJson,
  importStateFromJson,
  resetStorageState,
} from '../storage/storageAdapter';
import {
  applyChallengeVictoryToProgress,
  applyChallengeDefeatToProgress,
  updateStatisticsAfterAnswer,
} from '../core/challenge/challengeEngine';
import { getTodayDateString } from '../core/stats/statsCalculator';
import { parseVerbsList } from '../core/parser/verbParser';
import rawVerbsData from '../data/verbs.json';
import { audioService } from '../services/audioService';

export function useGameStorage() {
  const [state, setState] = useState<AppStorageState>(() => loadStorageState());

  const allVerbs: ParsedVerb[] = useMemo(() => {
    return parseVerbsList(rawVerbsData);
  }, []);

  // Sincronizar audioService con la configuración guardada
  useEffect(() => {
    audioService.soundEnabled = state.settings.soundEnabled;
  }, [state.settings.soundEnabled]);

  const updateStateAndPersist = useCallback((newState: AppStorageState) => {
    setState(newState);
    saveStorageState(newState);
  }, []);

  const updateSettings = useCallback(
    (settingsUpdate: Partial<AppSettings>) => {
      const next: AppStorageState = {
        ...state,
        settings: {
          ...state.settings,
          ...settingsUpdate,
        },
      };
      updateStateAndPersist(next);
    },
    [state, updateStateAndPersist]
  );

  const recordVerbAnswer = useCallback(
    (verbIndex: number, isCorrect: boolean) => {
      const todayStr = getTodayDateString();
      const updatedStats = updateStatisticsAfterAnswer(state.statistics, verbIndex, isCorrect);
      const activeDays = { ...updatedStats.activeDaysHistory };
      activeDays[todayStr] = (activeDays[todayStr] || 0) + 1;

      const next: AppStorageState = {
        ...state,
        statistics: {
          ...updatedStats,
          lastActiveDateString: todayStr,
          activeDaysHistory: activeDays,
        },
      };
      updateStateAndPersist(next);
    },
    [state, updateStateAndPersist]
  );

  const recordPlayTime = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return;
      const next: AppStorageState = {
        ...state,
        statistics: {
          ...state.statistics,
          totalPlayTimeSeconds: state.statistics.totalPlayTimeSeconds + Math.round(seconds),
        },
      };
      updateStateAndPersist(next);
    },
    [state, updateStateAndPersist]
  );

  const recordChallengeVictory = useCallback(
    (levelNumber: number, challengeIndex: number, starsEarned: number, durationSeconds: number) => {
      const todayStr = getTodayDateString();
      const nextProgress = applyChallengeVictoryToProgress(
        state.progress,
        levelNumber,
        challengeIndex,
        starsEarned
      );

      const activeDays = { ...state.statistics.activeDaysHistory };
      activeDays[todayStr] = (activeDays[todayStr] || 0) + 1;

      const next: AppStorageState = {
        ...state,
        progress: nextProgress,
        statistics: {
          ...state.statistics,
          totalPlayTimeSeconds: state.statistics.totalPlayTimeSeconds + Math.round(durationSeconds),
          lastPlayedTimestamp: Date.now(),
          lastPlayedResult: 'victory',
          lastActiveDateString: todayStr,
          activeDaysHistory: activeDays,
        },
      };

      updateStateAndPersist(next);
    },
    [state, updateStateAndPersist]
  );

  const recordChallengeDefeat = useCallback(
    (levelNumber: number, challengeIndex: number, durationSeconds: number) => {
      const todayStr = getTodayDateString();
      const nextProgress = applyChallengeDefeatToProgress(state.progress, levelNumber, challengeIndex);

      const activeDays = { ...state.statistics.activeDaysHistory };
      activeDays[todayStr] = (activeDays[todayStr] || 0) + 1;

      const next: AppStorageState = {
        ...state,
        progress: nextProgress,
        statistics: {
          ...state.statistics,
          totalPlayTimeSeconds: state.statistics.totalPlayTimeSeconds + Math.round(durationSeconds),
          lastPlayedTimestamp: Date.now(),
          lastPlayedResult: 'defeat',
          lastActiveDateString: todayStr,
          activeDaysHistory: activeDays,
        },
      };

      updateStateAndPersist(next);
    },
    [state, updateStateAndPersist]
  );

  const exportBackup = useCallback(() => {
    return exportStateToJson(state);
  }, [state]);

  const importBackup = useCallback(
    (jsonString: string) => {
      const imported = importStateFromJson(jsonString);
      updateStateAndPersist(imported);
    },
    [updateStateAndPersist]
  );

  const resetAllProgress = useCallback(() => {
    const fresh = resetStorageState();
    setState(fresh);
  }, []);

  return {
    state,
    allVerbs,
    updateSettings,
    recordVerbAnswer,
    recordPlayTime,
    recordChallengeVictory,
    recordChallengeDefeat,
    exportBackup,
    importBackup,
    resetAllProgress,
  };
}
