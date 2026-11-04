import { describe, it, expect } from 'vitest';
import {
  getMaxAllowedErrors,
  getLevelVerbs,
  createChallengeConfig,
  initChallengeState,
  submitAnswer,
  dismissErrorFeedback,
  calculateStars,
  applyChallengeVictoryToProgress,
  applyChallengeDefeatToProgress,
} from './challengeEngine';
import { parseVerbsList } from '../parser/verbParser';
import verbsData from '../../data/verbs.json';
import { AppProgress } from '../types';

describe('challengeEngine', () => {
  const allVerbs = parseVerbsList(verbsData);

  function getCorrectAnswer(verb: {
    present: { options: string[] };
    past: { options: string[] };
    participle: { options: string[] };
  }) {
    return {
      present: verb.present.options.join(', '),
      past: verb.past.options.join(', '),
      participle: verb.participle.options.join(', '),
    };
  }

  describe('Límites de fallos por desafío', () => {
    it('devuelve los límites correctos: 2, 1, 0, 0', () => {
      expect(getMaxAllowedErrors(0)).toBe(2);
      expect(getMaxAllowedErrors(1)).toBe(1);
      expect(getMaxAllowedErrors(2)).toBe(0);
      expect(getMaxAllowedErrors(3)).toBe(0);
    });
  });

  describe('Composición de verbos por nivel y desafío', () => {
    it('obtiene exactamente 5 verbos para cada nivel', () => {
      const level1 = getLevelVerbs(allVerbs, 1);
      expect(level1).toHaveLength(5);
      expect(level1[0].index).toBe(1);
      expect(level1[4].index).toBe(5);

      const level2 = getLevelVerbs(allVerbs, 2);
      expect(level2).toHaveLength(5);
      expect(level2[0].index).toBe(6);
      expect(level2[4].index).toBe(10);
    });

    it('nivel 1 genera desafíos con exactamente 5 verbos (sin repaso previo)', () => {
      const config0 = createChallengeConfig(allVerbs, 1, 0);
      expect(config0.verbs).toHaveLength(5);
      const configFinal = createChallengeConfig(allVerbs, 1, 3);
      expect(configFinal.verbs).toHaveLength(5);
    });

    it('nivel >= 2 genera desafíos 1-3 con 6 verbos (5 del nivel + 1 de repaso)', () => {
      const config = createChallengeConfig(allVerbs, 2, 0);
      expect(config.verbs).toHaveLength(6);
    });

    it('nivel >= 2 genera desafío final con 10 verbos (5 del nivel + 5 de repaso)', () => {
      const config = createChallengeConfig(allVerbs, 2, 3);
      expect(config.verbs).toHaveLength(10);
    });
  });

  describe('Flujo de preguntas, re-encolado y límites de fallo', () => {
    it('en desafío 1 (máx 2 fallos), fallar 3 veces el mismo verbo provoca derrota', () => {
      const config = createChallengeConfig(allVerbs, 1, 0);
      let state = initChallengeState(config);

      expect(state.status).toBe('playing');
      expect(state.heartsRemaining).toBe(3); // 2 + 1 vidas
      expect(state.errorsCommitted).toBe(0);

      // Fallo 1
      state = submitAnswer(state, { present: 'wrong', past: 'wrong', participle: 'wrong' });
      expect(state.status).toBe('feedback_error');
      expect(state.errorsCommitted).toBe(1);
      expect(state.heartsRemaining).toBe(2);

      state = dismissErrorFeedback(state);
      expect(state.status).toBe('playing');

      // Superamos los 4 verbos restantes acertando
      for (let i = 0; i < 4; i++) {
        const verb = state.currentVerb!;
        state = submitAnswer(state, getCorrectAnswer(verb));
        expect(state.status).toBe('playing');
      }

      // Ahora reaparece el verbo fallado (reintento)
      expect(state.currentIsRetry).toBe(true);

      // Fallo 2 en el mismo verbo
      state = submitAnswer(state, { present: 'wrong', past: 'wrong', participle: 'wrong' });
      expect(state.status).toBe('feedback_error');
      expect(state.errorsCommitted).toBe(2);
      expect(state.heartsRemaining).toBe(1);

      state = dismissErrorFeedback(state);

      // Fallo 3 en el mismo verbo -> Derrota inmediata (supera máx 2 fallos)
      state = submitAnswer(state, { present: 'wrong', past: 'wrong', participle: 'wrong' });
      expect(state.status).toBe('defeat');
      expect(state.errorsCommitted).toBe(3);
      expect(state.heartsRemaining).toBe(0);
    });

    it('en desafío 3 (máx 0 fallos), el primer fallo provoca derrota inmediata', () => {
      const config = createChallengeConfig(allVerbs, 1, 2);
      let state = initChallengeState(config);

      state = submitAnswer(state, { present: 'wrong', past: 'wrong', participle: 'wrong' });
      expect(state.status).toBe('defeat');
      expect(state.errorsCommitted).toBe(1);
    });

    it('calcular estrellas correctamente según fallos cometidos', () => {
      expect(calculateStars(0)).toBe(3);
      expect(calculateStars(1)).toBe(2);
      expect(calculateStars(2)).toBe(1);
      expect(calculateStars(3)).toBe(0);
    });

    it('completar todos los verbos da victoria con cálculo de estrellas', () => {
      const config = createChallengeConfig(allVerbs, 1, 0);
      let state = initChallengeState(config);

      // Acertar todos a la primera
      for (let i = 0; i < config.verbs.length; i++) {
        const verb = state.currentVerb!;
        state = submitAnswer(state, getCorrectAnswer(verb));
      }

      expect(state.status).toBe('victory');
      expect(state.starsEarned).toBe(3);
      expect(state.errorsCommitted).toBe(0);
    });
  });

  describe('Candado de un solo sentido (One-Way Progress Lock)', () => {
    const initialProgress: AppProgress = {
      unlockedLevel: 1,
      levels: {
        1: {
          challenges: {
            0: { completed: true, bestStars: 3, attempts: 1 },
          },
        },
      },
    };

    it('jugar un desafío superado y sacar menos estrellas no degrada el récord', () => {
      const updated = applyChallengeVictoryToProgress(initialProgress, 1, 0, 1);
      expect(updated.levels[1].challenges[0].bestStars).toBe(3);
      expect(updated.levels[1].challenges[0].attempts).toBe(2);
    });

    it('perder un desafío superado no degrada el progreso ni bloquea niveles', () => {
      const updated = applyChallengeDefeatToProgress(initialProgress, 1, 0);
      expect(updated.levels[1].challenges[0].completed).toBe(true);
      expect(updated.levels[1].challenges[0].bestStars).toBe(3);
      expect(updated.levels[1].challenges[0].attempts).toBe(2);
    });

    it('superar el desafío final desbloquea el siguiente nivel', () => {
      const updated = applyChallengeVictoryToProgress(initialProgress, 1, 3, 3);
      expect(updated.unlockedLevel).toBe(2);
      expect(updated.levels[1].challenges[3].completed).toBe(true);
    });
  });
});
