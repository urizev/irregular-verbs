import { useState, useEffect, useCallback } from 'react';
import { useGameStorage } from './hooks/useGameStorage';
import { HomeView } from './views/HomeView';
import { ChallengeView } from './views/ChallengeView';
import { StatsView } from './views/StatsView';
import { SettingsView } from './views/SettingsView';

type ViewMode = 'home' | 'challenge' | 'stats' | 'settings';

interface ActiveChallenge {
  level: number;
  challengeIndex: number;
}

export function App() {
  const {
    state,
    allVerbs,
    updateSettings,
    recordVerbAnswer,
    recordChallengeVictory,
    recordChallengeDefeat,
    exportBackup,
    importBackup,
    restoreFullState,
    resetAllProgress,
  } = useGameStorage();

  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null);

  // Sincronización básica con hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/challenge/')) {
        const parts = hash.replace('#/challenge/', '').split('/');
        const lvl = parseInt(parts[0], 10);
        const ch = parseInt(parts[1], 10);
        if (!isNaN(lvl) && !isNaN(ch) && lvl >= 1 && lvl <= 20 && ch >= 0 && ch <= 3) {
          setActiveChallenge({ level: lvl, challengeIndex: ch });
          setCurrentView('challenge');
          return;
        }
      } else if (hash === '#/stats') {
        setCurrentView('stats');
        return;
      } else if (hash === '#/settings') {
        setCurrentView('settings');
        return;
      }
      setCurrentView('home');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((view: ViewMode, challenge?: ActiveChallenge) => {
    setCurrentView(view);
    if (view === 'challenge' && challenge) {
      setActiveChallenge(challenge);
      window.location.hash = `#/challenge/${challenge.level}/${challenge.challengeIndex}`;
    } else if (view === 'stats') {
      window.location.hash = '#/stats';
    } else if (view === 'settings') {
      window.location.hash = '#/settings';
    } else {
      window.location.hash = '#/';
    }
  }, []);

  const handleStartChallenge = (level: number, challengeIndex: number) => {
    navigateTo('challenge', { level, challengeIndex });
  };

  const handleBackToMap = () => {
    navigateTo('home');
  };

  const handleNextChallenge = (nextLevel: number, nextChallengeIndex: number) => {
    navigateTo('challenge', { level: nextLevel, challengeIndex: nextChallengeIndex });
  };

  const handleToggleSound = () => {
    updateSettings({ soundEnabled: !state.settings.soundEnabled });
  };

  return (
    <div className="font-fun min-h-screen text-slate-800 antialiased selection:bg-indigo-200">
      {currentView === 'home' && (
        <HomeView
          progress={state.progress}
          allVerbs={allVerbs}
          onStartChallenge={handleStartChallenge}
          onOpenStats={() => navigateTo('stats')}
          onOpenSettings={() => navigateTo('settings')}
          soundEnabled={state.settings.soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {currentView === 'challenge' && activeChallenge && (
        <ChallengeView
          key={`${activeChallenge.level}-${activeChallenge.challengeIndex}`}
          levelNumber={activeChallenge.level}
          challengeIndex={activeChallenge.challengeIndex}
          allVerbs={allVerbs}
          verbsStats={state.statistics.verbsStats}
          reducedMotion={state.settings.reducedMotion}
          onVictory={recordChallengeVictory}
          onDefeat={recordChallengeDefeat}
          onVerbAnswer={recordVerbAnswer}
          onBackToMap={handleBackToMap}
          onNextChallenge={handleNextChallenge}
        />
      )}

      {currentView === 'stats' && (
        <StatsView
          statistics={state.statistics}
          progress={state.progress}
          allVerbs={allVerbs}
          onBack={handleBackToMap}
        />
      )}

      {currentView === 'settings' && (
        <SettingsView
          currentState={state}
          settings={state.settings}
          onUpdateSettings={updateSettings}
          onExportBackup={exportBackup}
          onImportBackup={importBackup}
          onRestoreState={restoreFullState}
          onResetProgress={resetAllProgress}
          onBack={handleBackToMap}
        />
      )}
    </div>
  );
}
export default App;
