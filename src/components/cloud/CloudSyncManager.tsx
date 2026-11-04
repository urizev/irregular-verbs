import React, { useState, useEffect } from 'react';
import { AppStorageState } from '../../core/types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  deriveSyncKeyId,
  validateCredentials,
  normalizeUsername,
} from '../../services/cloudSyncCrypto';
import {
  checkRemoteSave,
  uploadRemoteSave,
  extractStorageStateFromCloud,
  CloudSyncDocument,
  getCloudSyncApiUrl,
  setCustomSyncApiUrl,
} from '../../services/cloudSyncService';

interface CloudSyncManagerProps {
  currentState: AppStorageState;
  onRestoreState: (state: AppStorageState) => void;
}

export const CloudSyncManager: React.FC<CloudSyncManagerProps> = ({
  currentState,
  onRestoreState,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'upload' | 'restore' | null>(null);

  const [identifiedUser, setIdentifiedUser] = useState<{
    displayName: string;
    keyId: string;
  } | null>(null);

  const [remoteExists, setRemoteExists] = useState<boolean | null>(null);
  const [remoteDoc, setRemoteDoc] = useState<CloudSyncDocument | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  useEffect(() => {
    setCustomUrlInput(getCloudSyncApiUrl());
  }, []);

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    const validation = validateCredentials(usernameInput, pinInput);
    if (!validation.isValid) {
      setStatusMessage({ text: validation.error || 'Credenciales inválidas', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const keyId = await deriveSyncKeyId(usernameInput, pinInput);
      const normalizedName = normalizeUsername(usernameInput);

      const checkResult = await checkRemoteSave(keyId);

      setIdentifiedUser({
        displayName: normalizedName,
        keyId,
      });

      setRemoteExists(checkResult.exists);
      setRemoteDoc(checkResult.document || null);

      if (checkResult.exists && checkResult.document) {
        const dateStr = new Date(checkResult.document.lastUpdated).toLocaleString('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        setStatusMessage({
          text: `Partida remota encontrada (Última copia: ${dateStr}).`,
          type: 'info',
        });
      } else {
        setStatusMessage({
          text: 'No existe ninguna partida previa para este usuario. Puedes guardar tu partida actual.',
          type: 'info',
        });
      }
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Error al conectar con el servidor',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!identifiedUser) return;
    setStatusMessage(null);
    setActionLoading('upload');

    try {
      const result = await uploadRemoteSave(identifiedUser.keyId, currentState);

      // Actualizar info remota tras guardar
      const checkResult = await checkRemoteSave(identifiedUser.keyId);
      setRemoteExists(true);
      setRemoteDoc(checkResult.document || null);

      const dateFormatted = new Date(result.lastUpdated).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setStatusMessage({
        text: `¡Progreso guardado correctamente en la nube! (${dateFormatted}) ✔`,
        type: 'success',
      });
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Error al guardar en la nube',
        type: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmRestore = () => {
    if (!remoteDoc) return;
    try {
      const restored = extractStorageStateFromCloud(remoteDoc);
      onRestoreState(restored);
      setShowRestoreModal(false);
      setStatusMessage({
        text: '¡Partida recuperada de la nube con éxito! Tu progreso local se ha actualizado. ✔',
        type: 'success',
      });
    } catch (err) {
      setShowRestoreModal(false);
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Error al restaurar los datos',
        type: 'error',
      });
    }
  };

  const handleDisconnect = () => {
    setIdentifiedUser(null);
    setPinInput('');
    setRemoteExists(null);
    setRemoteDoc(null);
    setStatusMessage({
      text: 'Sesión de sincronización cerrada.',
      type: 'info',
    });
  };

  const handleSaveServerConfig = () => {
    setCustomSyncApiUrl(customUrlInput);
    setShowConfigModal(false);
    setStatusMessage({
      text: 'Configuración del servidor de sincronización actualizada.',
      type: 'success',
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-fun font-bold text-base text-slate-800 flex items-center gap-2">
          <span>☁️</span> Sincronización en la Nube
        </h2>
        <button
          onClick={() => setShowConfigModal(true)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
          title="Configurar servidor"
        >
          ⚙️ Servidor
        </button>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Guarda y recupera tu partida en cualquier dispositivo con solo tu <strong>nombre de usuario</strong> y un <strong>PIN secreto</strong>. Sin contraseñas complicadas ni registros.
      </p>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-center font-bold text-xs transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {!identifiedUser ? (
        /* Formulario de Identificación */
        <form onSubmit={handleConnect} className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Ej. Alex"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              PIN Secreto
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Mínimo 4 caracteres (ej. 1234)"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-sm"
                aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              >
                {showPin ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading || !usernameInput.trim() || !pinInput.trim()}
            className="w-full mt-2"
          >
            {isLoading ? '⏳ Comprobando...' : '🔍 Conectar y Comprobar Nube'}
          </Button>
        </form>
      ) : (
        /* Panel de Control de Sincronización cuando está Identificado */
        <div className="space-y-4 pt-1">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-600 font-medium block">Usuario activo:</span>
              <span className="font-bold text-base text-indigo-950 font-fun">
                👤 {identifiedUser.displayName}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-xs"
            >
              Cambiar 🔄
            </Button>
          </div>

          {/* Información del Estado Remoto */}
          {remoteExists && remoteDoc ? (
            <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl space-y-1.5 text-xs text-emerald-950">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <span>☁️</span> Copia remota disponible
              </div>
              <div>
                <strong>Nivel en la nube:</strong> {remoteDoc.progress.unlockedLevel} / 20
              </div>
              <div>
                <strong>Última actualización:</strong>{' '}
                {new Date(remoteDoc.lastUpdated).toLocaleString('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <span>ℹ️</span> Sin guardado en la nube
              </div>
              <p>Todavía no has subido ninguna partida con este usuario. Pulsa «Guardar en la Nube» para crearla.</p>
            </div>
          )}

          {/* Botones de Acción de Sincronización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveToCloud}
              disabled={actionLoading !== null}
              className="w-full"
            >
              {actionLoading === 'upload' ? '⏳ Guardando...' : '☁️ Guardar en la Nube'}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setShowRestoreModal(true)}
              disabled={!remoteExists || actionLoading !== null}
              className="w-full"
            >
              📥 Recuperar de la Nube
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Restauración */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="¿Recuperar partida de la nube?"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600">
            Esta acción descargará tu partida guardada en la nube y reemplazará los datos actuales de este navegador.
          </p>

          {remoteDoc && (
            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-xs text-indigo-900 text-left space-y-1">
              <div><strong>Nivel a restaurar:</strong> {remoteDoc.progress.unlockedLevel}</div>
              <div>
                <strong>Fecha de la copia:</strong>{' '}
                {new Date(remoteDoc.lastUpdated).toLocaleString('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowRestoreModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmRestore}
            >
              Confirmar y Restaurar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Configuración de Servidor */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configuración de Servidor de Nube"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-600 leading-relaxed">
            Por defecto se utiliza el Cloudflare Worker oficial. Si has desplegado tu propio worker, puedes introducir su URL base aquí:
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Base del Worker (API)
            </label>
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://tu-worker.workers.dev"
              className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveServerConfig}
            >
              Guardar URL
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
