import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ParsedVerb,
  ChallengeState,
  VerbStatsEntry,
} from '../core/types';
import {
  createChallengeConfig,
  initChallengeState,
  submitAnswer,
  dismissErrorFeedback,
} from '../core/challenge/challengeEngine';
import { Button } from '../components/ui/Button';
import { HeartCounter } from '../components/ui/HeartCounter';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CountdownBar } from '../components/ui/CountdownBar';
import { StarRating } from '../components/ui/StarRating';
import { Mascot } from '../components/ui/Mascot';
import { triggerVictoryConfetti } from '../components/ui/Confetti';
import { audioService } from '../services/audioService';

interface ChallengeViewProps {
  levelNumber: number;
  challengeIndex: number;
  allVerbs: readonly ParsedVerb[];
  verbsStats: { [verbIndex: number]: VerbStatsEntry };
  reducedMotion: boolean;
  onVictory: (level: number, challengeIndex: number, stars: number, durationSecs: number) => void;
  onDefeat: (level: number, challengeIndex: number, durationSecs: number) => void;
  onVerbAnswer: (verbIndex: number, isCorrect: boolean) => void;
  onBackToMap: () => void;
  onNextChallenge: (nextLevel: number, nextChallengeIndex: number) => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  levelNumber,
  challengeIndex,
  allVerbs,
  verbsStats,
  reducedMotion,
  onVictory,
  onDefeat,
  onVerbAnswer,
  onBackToMap,
  onNextChallenge,
}) => {
  const [challengeState, setChallengeState] = useState<ChallengeState>(() => {
    const config = createChallengeConfig(allVerbs, levelNumber, challengeIndex, verbsStats);
    return initChallengeState(config);
  });

  const [inputPresent, setInputPresent] = useState('');
  const [inputPast, setInputPast] = useState('');
  const [inputParticiple, setInputParticiple] = useState('');

  const presentInputRef = useRef<HTMLInputElement | null>(null);
  const pastInputRef = useRef<HTMLInputElement | null>(null);
  const participleInputRef = useRef<HTMLInputElement | null>(null);

  const resetInputs = () => {
    setInputPresent('');
    setInputPast('');
    setInputParticiple('');
  };

  // Auto focus al primer input disponible
  useEffect(() => {
    if (challengeState.status === 'playing') {
      presentInputRef.current?.focus();
    }
  }, [challengeState.currentVerb, challengeState.status]);

  // Manejo de sonido y confetti ante victoria o derrota
  useEffect(() => {
    if (challengeState.status === 'victory') {
      audioService.playVictory();
      triggerVictoryConfetti(reducedMotion);
      const durationSecs = (Date.now() - challengeState.startedAt) / 1000;
      onVictory(levelNumber, challengeIndex, challengeState.starsEarned, durationSecs);
    } else if (challengeState.status === 'defeat') {
      audioService.playWrong();
      const durationSecs = (Date.now() - challengeState.startedAt) / 1000;
      onDefeat(levelNumber, challengeIndex, durationSecs);
    }
  }, [
    challengeState.status,
    challengeState.starsEarned,
    challengeState.startedAt,
    levelNumber,
    challengeIndex,
    reducedMotion,
    onVictory,
    onDefeat,
  ]);

  const handleCheckAnswer = () => {
    if (!challengeState.currentVerb || challengeState.status !== 'playing') return;

    const verb = challengeState.currentVerb;
    const nextState = submitAnswer(challengeState, {
      present: inputPresent,
      past: inputPast,
      participle: inputParticiple,
    });

    const isCorrect = nextState.lastValidationResult?.isValid || false;
    onVerbAnswer(verb.index, isCorrect);

    if (isCorrect) {
      audioService.playCorrect();
      resetInputs();
    } else {
      audioService.playWrong();
    }

    setChallengeState(nextState);
  };

  const handleDismissError = useCallback(() => {
    resetInputs();
    setChallengeState((prev) => dismissErrorFeedback(prev));
  }, []);

  const handleRetryChallenge = () => {
    const config = createChallengeConfig(allVerbs, levelNumber, challengeIndex, verbsStats);
    setChallengeState(initChallengeState(config));
    resetInputs();
  };

  const challengeNames = ['Desafío 1', 'Desafío 2', 'Desafío 3', 'Desafío Final 🏆'];
  const title = `Nivel ${levelNumber} • ${challengeNames[challengeIndex]}`;

  // Vista de Victoria
  if (challengeState.status === 'victory') {
    const isFinalChallenge = challengeIndex === 3;
    const nextLevel = isFinalChallenge ? Math.min(20, levelNumber + 1) : levelNumber;
    const nextChIndex = isFinalChallenge ? 0 : challengeIndex + 1;

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 md:p-10 max-w-md w-full shadow-2xl border-4 border-emerald-300 text-center animate-scale-up">
          <Mascot mood="celebrate" size="lg" className="mx-auto mb-4" />
          <h2 className="font-fun font-extrabold text-3xl text-emerald-800 mb-2">
            ¡Desafío Superado!
          </h2>
          <p className="text-slate-600 font-medium mb-6">
            ¡Excelente trabajo! Has completado el {challengeNames[challengeIndex]}.
          </p>

          <div className="mb-8">
            <StarRating stars={challengeState.starsEarned} size="xl" className="justify-center" />
            <p className="text-xs font-bold text-amber-700 mt-2">
              {challengeState.starsEarned === 3
                ? '¡Perfecto! 3 Estrellas conseguidas'
                : `${challengeState.starsEarned} Estrellas conseguidas`}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {levelNumber < 20 || challengeIndex < 3 ? (
              <Button
                variant="success"
                size="lg"
                onClick={() => onNextChallenge(nextLevel, nextChIndex)}
                className="w-full text-lg"
              >
                Siguiente Desafío ➔
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="md"
              onClick={onBackToMap}
              className="w-full"
            >
              Volver al Mapa
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Vista de Derrota
  if (challengeState.status === 'defeat') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-100 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 md:p-10 max-w-md w-full shadow-2xl border-4 border-rose-300 text-center animate-scale-up">
          <Mascot mood="sad" size="lg" className="mx-auto mb-4" />
          <h2 className="font-fun font-extrabold text-2xl md:text-3xl text-rose-800 mb-2">
            ¡Casi lo logras!
          </h2>
          <p className="text-slate-600 font-medium mb-6">
            La práctica hace al maestro. No te desanimes y vuelve a intentarlo con más energía.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="accent"
              size="lg"
              onClick={handleRetryChallenge}
              className="w-full text-lg"
            >
              🔄 Reintentar Desafío
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={onBackToMap}
              className="w-full"
            >
              Volver al Mapa
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentVerb = challengeState.currentVerb;
  const isErrorFeedback = challengeState.status === 'feedback_error';
  const lastValidation = challengeState.lastValidationResult;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-indigo-50 to-pink-50 flex flex-col justify-between p-4 md:p-6">
      {/* Barra superior de estado */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToMap}
          className="text-xs px-3 py-1.5"
        >
          ← Salir
        </Button>

        <h1 className="font-fun font-bold text-sm md:text-base text-indigo-900 text-center truncate">
          {title}
        </h1>

        <HeartCounter
          maxHearts={challengeState.maxAllowedErrors + 1}
          currentHearts={challengeState.heartsRemaining}
        />
      </header>

      {/* Tarjeta Central del Desafío */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="mb-4">
          <ProgressBar
            current={challengeState.completedQuestionsCount}
            total={challengeState.totalInitialQuestions}
          />
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-indigo-200 text-center relative overflow-hidden">
          {challengeState.currentIsRetry && !isErrorFeedback && (
            <div className="bg-amber-100 text-amber-800 font-bold text-xs py-1 px-3 rounded-full inline-block mb-3">
              🔄 ¡Repaso del verbo fallado!
            </div>
          )}

          {/* Verbo en español */}
          <div className="mb-6">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-1">
              Verbo en Español
            </span>
            <p className="text-3xl md:text-4xl font-fun font-extrabold text-slate-800 drop-shadow-sm">
              {currentVerb?.spanish}
            </p>
          </div>

          {/* Formulario de 3 inputs */}
          <div className="space-y-4 mb-6 text-left">
            {/* Input 1: Present */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                1. Infinitive / Present:
              </label>
              <input
                ref={presentInputRef}
                type="text"
                disabled={isErrorFeedback}
                value={inputPresent}
                onChange={(e) => setInputPresent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    pastInputRef.current?.focus();
                  }
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="off"
                placeholder="ej. be / is, are"
                className={`w-full px-4 py-3 rounded-2xl font-fun text-lg border-2 transition-all outline-none ${
                  isErrorFeedback
                    ? lastValidation?.present.isValid
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-rose-500 bg-rose-50 text-rose-900'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                }`}
              />
              {isErrorFeedback && !lastValidation?.present.isValid && (
                <p className="text-xs font-bold text-rose-600 mt-1">
                  Correcto:{' '}
                  <span className="font-mono">{currentVerb?.present.options.join(' / ')}</span>
                </p>
              )}
            </div>

            {/* Input 2: Past Simple */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                2. Past Simple:
              </label>
              <input
                ref={pastInputRef}
                type="text"
                disabled={isErrorFeedback}
                value={inputPast}
                onChange={(e) => setInputPast(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    participleInputRef.current?.focus();
                  }
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="off"
                placeholder="ej. was, were"
                className={`w-full px-4 py-3 rounded-2xl font-fun text-lg border-2 transition-all outline-none ${
                  isErrorFeedback
                    ? lastValidation?.past.isValid
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-rose-500 bg-rose-50 text-rose-900'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                }`}
              />
              {isErrorFeedback && !lastValidation?.past.isValid && (
                <p className="text-xs font-bold text-rose-600 mt-1">
                  Correcto:{' '}
                  <span className="font-mono">{currentVerb?.past.options.join(' / ')}</span>
                </p>
              )}
            </div>

            {/* Input 3: Past Participle */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                3. Past Participle:
              </label>
              <input
                ref={participleInputRef}
                type="text"
                disabled={isErrorFeedback}
                value={inputParticiple}
                onChange={(e) => setInputParticiple(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCheckAnswer();
                  }
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="off"
                placeholder="ej. been"
                className={`w-full px-4 py-3 rounded-2xl font-fun text-lg border-2 transition-all outline-none ${
                  isErrorFeedback
                    ? lastValidation?.participle.isValid
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-rose-500 bg-rose-50 text-rose-900'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                }`}
              />
              {isErrorFeedback && !lastValidation?.participle.isValid && (
                <p className="text-xs font-bold text-rose-600 mt-1">
                  Correcto:{' '}
                  <span className="font-mono">{currentVerb?.participle.options.join(' / ')}</span>
                </p>
              )}
            </div>
          </div>

          {/* Acciones: Comprobar o Barra de Feedback */}
          {!isErrorFeedback ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckAnswer}
              className="w-full text-lg shadow-bouncy-primary"
            >
              Comprobar Respuesta ✔
            </Button>
          ) : (
            <CountdownBar
              durationSeconds={3.5}
              onComplete={handleDismissError}
            />
          )}
        </div>
      </main>

      {/* Espaciador inferior */}
      <footer className="text-center py-2 text-xs text-slate-400">
        Pulsa <kbd className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">Enter</kbd> para avanzar y comprobar
      </footer>
    </div>
  );
};
