import React, { useState, useRef } from 'react';
import { AppSettings, AppStorageState } from '../core/types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CloudSyncManager } from '../components/cloud/CloudSyncManager';

interface SettingsViewProps {
  currentState: AppStorageState;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportBackup: () => string;
  onImportBackup: (jsonString: string) => void;
  onRestoreState: (state: AppStorageState) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentState,
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onRestoreState,
  onResetProgress,
  onBack,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importContent, setImportContent] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    try {
      const json = onExportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `irregular-verbs-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage({ text: 'Backup exportado correctamente ✔', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Error al exportar el backup', type: 'error' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportContent(content);
        setShowImportModal(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importContent) return;
    try {
      onImportBackup(importContent);
      setShowImportModal(false);
      setImportContent(null);
      setStatusMessage({ text: 'Progreso importado con éxito ✔', type: 'success' });
    } catch (err) {
      setShowImportModal(false);
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Error al importar datos',
        type: 'error',
      });
    }
  };

  const handleConfirmReset = () => {
    onResetProgress();
    setShowResetModal(false);
    setStatusMessage({ text: 'Progreso restablecido a valores de fábrica', type: 'success' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-indigo-50 to-pink-50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Volver
          </Button>
          <h1 className="font-fun font-bold text-lg text-indigo-900">Ajustes y Datos ⚙️</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-center font-bold text-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Preferencias */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 space-y-5">
          <h2 className="font-fun font-bold text-base text-slate-800 flex items-center gap-2">
            <span>🎮</span> Preferencias de Juego
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-fun font-bold text-sm text-slate-800 block">
                Efectos de Sonido
              </span>
              <span className="text-xs text-slate-500">
                Chimes y fanfarrias de acierto y victoria
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 ${
                settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <span className="font-fun font-bold text-sm text-slate-800 block">
                Reducir Movimiento
              </span>
              <span className="text-xs text-slate-500">
                Desactiva confeti y animaciones intensas
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 ${
                settings.reducedMotion ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sincronización en la Nube */}
        <CloudSyncManager
          currentState={currentState}
          onRestoreState={onRestoreState}
        />

        {/* Copias de Seguridad y Datos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 space-y-4">
          <h2 className="font-fun font-bold text-base text-slate-800 flex items-center gap-2">
            <span>💾</span> Copias de Seguridad (Backup)
          </h2>
          <p className="text-xs text-slate-500">
            Tus datos se guardan en tu navegador. Puedes exportarlos a un archivo JSON para moverlos a otro dispositivo o restaurarlos en cualquier momento.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button variant="outline" size="md" onClick={handleExport} className="w-full">
              📥 Exportar Backup
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              📤 Importar Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Zona de Peligro: Reinicio */}
        <div className="bg-rose-50/70 rounded-3xl p-6 border-2 border-rose-200 space-y-4">
          <h2 className="font-fun font-bold text-base text-rose-800 flex items-center gap-2">
            <span>⚠️</span> Zona de Peligro
          </h2>
          <p className="text-xs text-rose-700">
            Esta acción borrará todo tu progreso de niveles, estrellas y estadísticas acumuladas.
          </p>
          <Button
            variant="heart"
            size="md"
            onClick={() => setShowResetModal(true)}
            className="w-full"
          >
            🗑️ Reiniciar Todo el Progreso
          </Button>
        </div>
      </main>

      {/* Modal de Confirmación de Importación */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="¿Importar copia de seguridad?"
      >
        <p className="text-sm text-slate-600 mb-6 text-center">
          Al importar este archivo, se sobrescribirá tu progreso y estadísticas actuales. ¿Deseas continuar?
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmImport}>
            Sí, Importar
          </Button>
        </div>
      </Modal>

      {/* Modal de Confirmación de Reinicio */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="¿Reiniciar todo el progreso?"
      >
        <p className="text-sm text-slate-600 mb-6 text-center">
          ¿Estás seguro de que deseas reiniciar todos los niveles, estrellas y estadísticas? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancelar
          </Button>
          <Button variant="heart" onClick={handleConfirmReset}>
            Sí, Reiniciar
          </Button>
        </div>
      </Modal>
    </div>
  );
};
