import React, { useRef, useEffect } from 'react';
import { AppProgress, ParsedVerb } from '../core/types';
import { Button } from '../components/ui/Button';
import { StarRating } from '../components/ui/StarRating';
import { Mascot } from '../components/ui/Mascot';

interface HomeViewProps {
  progress: AppProgress;
  allVerbs: readonly ParsedVerb[];
  onStartChallenge: (level: number, challengeIndex: number) => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  progress,
  allVerbs,
  onStartChallenge,
  onOpenStats,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
}) => {
  const currentLevelRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll al nivel actual desbloqueado al entrar
  useEffect(() => {
    if (currentLevelRef.current) {
      currentLevelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [progress.unlockedLevel]);

  // Encontrar el siguiente desafío prioritario para el botón "¡Jugar!"
  const getNextPlayTarget = (): { level: number; challengeIndex: number } => {
    const curLevel = progress.unlockedLevel;
    const levelData = progress.levels[curLevel]?.challenges || {};

    for (let i = 0; i < 4; i++) {
      if (!levelData[i]?.completed) {
        return { level: curLevel, challengeIndex: i };
      }
    }
    return { level: Math.min(20, curLevel), challengeIndex: 0 };
  };

  const nextTarget = getNextPlayTarget();

  const totalLevels = 20;
  const levelNumbers = Array.from({ length: totalLevels }, (_, i) => i + 1);

  // Calcular total de estrellas
  let totalStars = 0;
  Object.values(progress.levels).forEach((lvl) => {
    Object.values(lvl.challenges).forEach((ch) => {
      totalStars += ch.bestStars || 0;
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-indigo-50 to-pink-50 pb-28">
      {/* Header flotante superior */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mascot mood="happy" size="sm" className="w-10 h-10" />
            <div>
              <h1 className="font-fun font-bold text-xl md:text-2xl text-indigo-900 leading-tight">
                Verbos Irregulares
              </h1>
              <p className="text-sm text-indigo-600 font-semibold">100 Verbos en Inglés</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              <span className="text-amber-500 font-bold text-base">★</span>
              <span className="font-fun font-bold text-sm text-amber-800">{totalStars}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSound}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
              className="p-2 min-w-9"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenStats}
              title="Estadísticas"
              className="p-2 min-w-9"
            >
              📊
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              title="Ajustes"
              className="p-2 min-w-9"
            >
              ⚙️
            </Button>
          </div>
        </div>
      </header>

      {/* Camino de niveles */}
      <main className="max-w-xl mx-auto px-4 pt-6 pb-12">
        <div className="text-center mb-8">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm uppercase tracking-wider font-bold px-3.5 py-1 rounded-full mb-2">
            Camino de Aventura
          </span>
          <h2 className="text-3xl md:text-4xl font-fun font-extrabold text-slate-800">
            ¡Elige tu Desafío!
          </h2>
        </div>

        <div className="relative flex flex-col gap-8">
          {levelNumbers.map((lvlNum) => {
            const isUnlocked = lvlNum <= progress.unlockedLevel;
            const isCurrent = lvlNum === progress.unlockedLevel;
            const levelVerbsStart = (lvlNum - 1) * 5 + 1;
            const levelVerbsEnd = Math.min(allVerbs.length, lvlNum * 5);
            const levelData = progress.levels[lvlNum]?.challenges || {};

            const sampleVerbs = allVerbs
              .slice((lvlNum - 1) * 5, lvlNum * 5)
              .map((v) => v.present.options[0])
              .join(', ');

            return (
              <div
                key={lvlNum}
                ref={isCurrent ? currentLevelRef : null}
                className={`relative rounded-3xl p-5 md:p-6 transition-all duration-300 border-4 ${
                  isCurrent
                    ? 'bg-white border-indigo-400 shadow-xl ring-4 ring-indigo-200'
                    : isUnlocked
                    ? 'bg-white/90 border-emerald-300 shadow-md'
                    : 'bg-slate-100/70 border-slate-300 opacity-60 shadow-none'
                }`}
              >
                {/* Cabecera del nivel */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-fun font-extrabold text-base px-3 py-0.5 rounded-full ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : isUnlocked
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-400 text-white'
                        }`}
                      >
                        Nivel {lvlNum}
                      </span>
                      <span className="text-sm text-slate-600 font-bold">
                        Verbos {levelVerbsStart}-{levelVerbsEnd}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium mt-1.5 truncate max-w-sm">
                      {sampleVerbs}
                    </p>
                  </div>

                  {!isUnlocked ? (
                    <span className="text-2xl" title="Bloqueado">
                      🔒
                    </span>
                  ) : isCurrent ? (
                    <span className="text-sm bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full animate-pulse">
                      ¡Nivel Actual!
                    </span>
                  ) : (
                    <span className="text-xl" title="Desbloqueado">
                      ✨
                    </span>
                  )}
                </div>

                {/* 4 Nodos de Desafío del Nivel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[0, 1, 2, 3].map((chIdx) => {
                    const chData = levelData[chIdx];
                    const isCompleted = chData?.completed;
                    const stars = chData?.bestStars || 0;
                    const isFinal = chIdx === 3;

                    // Un desafío está disponible si el nivel está desbloqueado y
                    // es el primer desafío o el anterior está completado (o ya se completó antes)
                    const isNodeUnlocked =
                      isUnlocked && (chIdx === 0 || levelData[chIdx - 1]?.completed || isCompleted);

                    const challengeNames = [
                      'Desafío 1',
                      'Desafío 2',
                      'Desafío 3',
                      'Desafío Final 🏆',
                    ];
                    const errorLimits = ['2 fallos', '1 fallo', '0 fallos', 'Perfecto'];

                    return (
                      <button
                        key={chIdx}
                        disabled={!isNodeUnlocked}
                        onClick={() => onStartChallenge(lvlNum, chIdx)}
                        className={`flex flex-col items-center justify-between p-3 rounded-2xl text-center transition-all duration-200 select-none ${
                          !isNodeUnlocked
                            ? 'bg-slate-200/50 text-slate-400 cursor-not-allowed border border-slate-300'
                            : isCompleted
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400 text-emerald-900 active:scale-95 shadow-sm'
                            : isFinal
                            ? 'bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 text-amber-900 active:scale-95 shadow-md animate-pulse'
                            : 'bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-400 text-indigo-900 active:scale-95 shadow-sm'
                        }`}
                      >
                        <span className="font-fun font-bold text-sm sm:text-base leading-tight">
                          {challengeNames[chIdx]}
                        </span>
                        <span className="text-xs text-slate-500 font-medium my-1">
                          {errorLimits[chIdx]}
                        </span>

                        <div className="h-5 flex items-center justify-center">
                          {isCompleted ? (
                            <StarRating stars={stars} size="sm" />
                          ) : isNodeUnlocked ? (
                            <span className="text-sm font-bold text-indigo-600">Jugar ➔</span>
                          ) : (
                            <span className="text-sm">🔒</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Botón Flotante "¡Jugar!" en la parte inferior */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-indigo-100 p-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-500">Siguiente objetivo:</p>
            <p className="font-fun font-extrabold text-base md:text-lg text-indigo-900">
              Nivel {nextTarget.level} • Desafío {nextTarget.challengeIndex === 3 ? 'Final' : nextTarget.challengeIndex + 1}
            </p>
          </div>

          <Button
            variant="accent"
            size="lg"
            onClick={() => onStartChallenge(nextTarget.level, nextTarget.challengeIndex)}
            className="flex-1 sm:flex-initial text-lg px-8 py-3.5 shadow-bouncy-accent"
          >
            🎮 ¡Jugar Ahora!
          </Button>
        </div>
      </footer>
    </div>
  );
};
