import React, { useMemo } from 'react';
import { AppProgress, AppStatistics, ParsedVerb } from '../core/types';
import { computeAppStatistics, getTodayDateString } from '../core/stats/statsCalculator';
import { Button } from '../components/ui/Button';
import { speechService } from '../services/speechService';

interface StatsViewProps {
  statistics: AppStatistics;
  progress: AppProgress;
  allVerbs: readonly ParsedVerb[];
  onBack: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  statistics,
  progress,
  allVerbs,
  onBack,
}) => {
  const computed = useMemo(() => {
    return computeAppStatistics(statistics, progress, allVerbs);
  }, [statistics, progress, allVerbs]);

  // Generar últimos 14 días para el mini-heatmap
  const recentDays = useMemo(() => {
    const days: { dateStr: string; label: string; count: number }[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getTodayDateString(d.getTime());
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'narrow' });
      const dayNum = d.getDate();
      const count = statistics.activeDaysHistory[dateStr] || 0;

      days.push({
        dateStr,
        label: `${dayName} ${dayNum}`,
        count,
      });
    }
    return days;
  }, [statistics.activeDaysHistory]);

  const handleSpeak = (text: string) => {
    speechService.speak(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-indigo-50 to-pink-50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Volver
          </Button>
          <h1 className="font-fun font-bold text-lg text-indigo-900">Tus Estadísticas 📊</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Resumen Principal KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Precisión */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-indigo-100 text-center">
            <span className="text-2xl block mb-1">🎯</span>
            <span className="text-2xl font-fun font-extrabold text-indigo-700">
              {computed.accuracyPercentage}%
            </span>
            <span className="block text-xs text-slate-500 font-bold mt-0.5">
              Precisión Global
            </span>
            <span className="text-[10px] text-slate-400">
              {computed.totalAnswersCorrect} aciertos / {computed.totalAnswers} resp.
            </span>
          </div>

          {/* Racha */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-amber-100 text-center">
            <span className="text-2xl block mb-1">🔥</span>
            <span className="text-2xl font-fun font-extrabold text-amber-600">
              {computed.currentStreakDays} {computed.currentStreakDays === 1 ? 'día' : 'días'}
            </span>
            <span className="block text-xs text-slate-500 font-bold mt-0.5">Racha Actual</span>
            <span className="text-[10px] text-slate-400">
              Mejor racha: {computed.bestStreakDays} días
            </span>
          </div>

          {/* Tiempo jugado */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-pink-100 text-center col-span-2 sm:col-span-1">
            <span className="text-2xl block mb-1">⏱️</span>
            <span className="text-2xl font-fun font-extrabold text-pink-600">
              {computed.totalPlayTimeFormatted}
            </span>
            <span className="block text-xs text-slate-500 font-bold mt-0.5">Tiempo Jugado</span>
            <span className="text-[10px] text-slate-400">Total acumulado</span>
          </div>
        </div>

        {/* Progreso en el juego */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-100">
          <h2 className="font-fun font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
            <span>🏆</span> Progreso del Juego
          </h2>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-indigo-50 rounded-2xl p-3">
              <span className="text-xs text-indigo-700 font-bold block">Nivel Desbloqueado</span>
              <span className="text-2xl font-fun font-extrabold text-indigo-900">
                {computed.unlockedLevel} / 20
              </span>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3">
              <span className="text-xs text-amber-700 font-bold block">Estrellas Totales</span>
              <span className="text-2xl font-fun font-extrabold text-amber-800 flex items-center justify-center gap-1">
                ★ {computed.totalStarsEarned} / {computed.maxPossibleStars}
              </span>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-3">
              <span className="text-xs text-emerald-700 font-bold block">Desafíos Superados</span>
              <span className="text-2xl font-fun font-extrabold text-emerald-900">
                {computed.totalChallengesCompleted} / 80
              </span>
            </div>

            <div className="bg-purple-50 rounded-2xl p-3">
              <span className="text-xs text-purple-700 font-bold block">Intentos Medios</span>
              <span className="text-2xl font-fun font-extrabold text-purple-900">
                {computed.averageAttemptsPerChallenge}
              </span>
            </div>
          </div>
        </div>

        {/* Calendario de Actividad (Heatmap 14 días) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-100">
          <h2 className="font-fun font-bold text-base text-slate-800 mb-2 flex items-center gap-2">
            <span>📅</span> Constancia (Últimos 14 días)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Cada día que practicas consolidas tu memoria a largo plazo.
          </p>

          <div className="grid grid-cols-7 gap-2">
            {recentDays.map((day) => (
              <div
                key={day.dateStr}
                className="flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all"
                style={{
                  backgroundColor:
                    day.count > 0 ? `rgba(16, 185, 129, ${Math.min(1, 0.2 + day.count * 0.25)})` : '#F8FAFC',
                  borderColor: day.count > 0 ? '#10B981' : '#E2E8F0',
                }}
              >
                <span className="text-[10px] font-bold text-slate-600 block">{day.label}</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1">
                  {day.count > 0 ? '✔' : '·'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Verbos Más Fallados */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
          <h2 className="font-fun font-bold text-base text-rose-800 mb-2 flex items-center gap-2">
            <span>⚠️</span> Verbos que Requieren Más Atención
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Estos verbos tienen mayor tasa de fallos. El juego los incluirá en los desafíos de repaso.
          </p>

          {computed.mostFailedVerbs.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">
              ¡Sin fallos registrados aún! Sigue jugando para registrar estadísticas.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {computed.mostFailedVerbs.map((item) => (
                <div key={item.verb.index} className="py-2.5 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <span className="font-fun font-bold text-sm text-slate-800">
                      {item.verb.spanish}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {item.verb.present.options[0]} • {item.verb.past.options[0]} •{' '}
                      {item.verb.participle.options[0]}
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <button
                      onClick={() => handleSpeak(item.verb.present.options[0])}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition"
                      title="Escuchar pronunciación"
                    >
                      🔊
                    </button>
                    <div>
                      <span className="bg-rose-100 text-rose-700 font-bold text-xs px-2 py-0.5 rounded-full inline-block">
                        {item.timesFailed} {item.timesFailed === 1 ? 'fallo' : 'fallos'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.errorRate}% error
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verbos Dominados */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100">
          <h2 className="font-fun font-bold text-base text-emerald-800 mb-2 flex items-center gap-2">
            <span>🌟</span> Verbos Dominados ({computed.masteredVerbs.length})
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Verbos practicados múltiples veces con 100% de aciertos.
          </p>

          {computed.masteredVerbs.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">
              Practica más verbos sin cometer fallos para coronarlos como dominados.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {computed.masteredVerbs.slice(0, 12).map((verb) => (
                <div
                  key={verb.index}
                  className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-fun font-bold text-xs text-emerald-950 block">
                      {verb.spanish}
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      {verb.present.options[0]} - {verb.past.options[0]}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSpeak(verb.present.options[0])}
                    className="p-1 text-emerald-600 hover:text-emerald-800"
                    title="Escuchar pronunciación"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
