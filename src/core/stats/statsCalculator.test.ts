import { describe, it, expect } from 'vitest';
import {
  calculateStreak,
  computeAppStatistics,
  formatPlayTime,
} from './statsCalculator';
import { parseVerbsList } from '../parser/verbParser';
import verbsData from '../../data/verbs.json';
import { AppProgress, AppStatistics } from '../types';

describe('statsCalculator', () => {
  const allVerbs = parseVerbsList(verbsData);

  describe('formatPlayTime', () => {
    it('formatea correctamente segundos, minutos y horas', () => {
      expect(formatPlayTime(45)).toBe('45s');
      expect(formatPlayTime(125)).toBe('2m 5s');
      expect(formatPlayTime(3665)).toBe('1h 1m');
    });
  });

  describe('calculateStreak', () => {
    it('calcula 0 si no hay historial de actividad', () => {
      expect(calculateStreak({}, '2026-11-04')).toEqual({ currentStreak: 0, bestStreak: 0 });
    });

    it('calcula racha de días consecutivos correctamente', () => {
      const history = {
        '2026-11-01': 2,
        '2026-11-02': 1,
        '2026-11-03': 3,
        '2026-11-04': 2,
      };
      const result = calculateStreak(history, '2026-11-04');
      expect(result.currentStreak).toBe(4);
      expect(result.bestStreak).toBe(4);
    });

    it('mantiene racha activa si hoy aún no se ha jugado pero ayer sí', () => {
      const history = {
        '2026-11-02': 1,
        '2026-11-03': 3,
      };
      const result = calculateStreak(history, '2026-11-04');
      expect(result.currentStreak).toBe(2);
      expect(result.bestStreak).toBe(2);
    });

    it('reinicia racha actual si hubo un día vacío intermedio pero conserva la mejor racha', () => {
      const history = {
        '2026-10-20': 1,
        '2026-10-21': 1,
        '2026-10-22': 1,
        '2026-11-04': 1, // Salto de varios días
      };
      const result = calculateStreak(history, '2026-11-04');
      expect(result.currentStreak).toBe(1);
      expect(result.bestStreak).toBe(3);
    });
  });

  describe('computeAppStatistics', () => {
    const stats: AppStatistics = {
      totalPlayTimeSeconds: 150,
      totalAnswersCorrect: 8,
      totalAnswersFailed: 2,
      lastPlayedTimestamp: Date.now(),
      lastPlayedResult: 'victory',
      currentStreakDays: 1,
      bestStreakDays: 1,
      lastActiveDateString: '2026-11-04',
      activeDaysHistory: { '2026-11-04': 1 },
      verbsStats: {
        1: { timesAsked: 4, timesFailed: 2, lastPracticedTimestamp: Date.now() },
        2: { timesAsked: 3, timesFailed: 0, lastPracticedTimestamp: Date.now() },
      },
    };

    const progress: AppProgress = {
      unlockedLevel: 1,
      levels: {
        1: {
          challenges: {
            0: { completed: true, bestStars: 3, attempts: 1 },
          },
        },
      },
    };

    it('calcula porcentaje de aciertos, verbos fallados y dominados', () => {
      const computed = computeAppStatistics(stats, progress, allVerbs);
      expect(computed.accuracyPercentage).toBe(80); // 8 / 10 = 80%
      expect(computed.totalChallengesCompleted).toBe(1);
      expect(computed.totalStarsEarned).toBe(3);
      expect(computed.mostFailedVerbs).toHaveLength(1);
      expect(computed.mostFailedVerbs[0].verb.index).toBe(1);
      expect(computed.mostFailedVerbs[0].errorRate).toBe(50);
      expect(computed.masteredVerbs).toHaveLength(1);
      expect(computed.masteredVerbs[0].index).toBe(2);
    });
  });
});
