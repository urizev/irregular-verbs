import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  prepareCloudSyncDocument,
  sanitizeCloudDocument,
  extractStorageStateFromCloud,
  checkRemoteSave,
  fetchRemoteSave,
  uploadRemoteSave,
  getCloudSyncApiUrl,
  setCustomSyncApiUrl,
} from './cloudSyncService';
import { getDefaultStorageState } from '../storage/storageAdapter';
import { AppStorageState } from '../core/types';

describe('cloudSyncService', () => {
  beforeEach(() => {
    setCustomSyncApiUrl(null);
  });

  describe('prepareCloudSyncDocument', () => {
    it('debe preparar un documento completo con timestamp y versiones', () => {
      const state = getDefaultStorageState();
      state.progress.unlockedLevel = 5;
      const doc = prepareCloudSyncDocument(state, '2026-11-04T12:00:00.000Z');

      expect(doc.schemaVersion).toBe(1);
      expect(doc.lastUpdated).toBe('2026-11-04T12:00:00.000Z');
      expect(doc.clientVersion).toBe('1.0.0');
      expect(doc.progress.unlockedLevel).toBe(5);
      expect(doc.settings.soundEnabled).toBe(true);
    });
  });

  describe('sanitizeCloudDocument y extractStorageStateFromCloud', () => {
    it('debe validar y sanear un documento válido', () => {
      const raw = {
        schemaVersion: 1,
        lastUpdated: '2026-11-04T10:00:00.000Z',
        clientVersion: '1.0.0',
        settings: { soundEnabled: false, reducedMotion: true },
        progress: { unlockedLevel: 3, levels: {} },
        statistics: { totalPlayTimeSeconds: 120 },
      };

      const sanitized = sanitizeCloudDocument(raw);
      expect(sanitized.progress.unlockedLevel).toBe(3);
      expect(sanitized.settings.soundEnabled).toBe(false);

      const storageState = extractStorageStateFromCloud(sanitized);
      expect(storageState.progress.unlockedLevel).toBe(3);
      expect(storageState.settings.reducedMotion).toBe(true);
      expect(storageState.statistics.totalPlayTimeSeconds).toBe(120);
    });

    it('debe lanzar error si el documento no tiene formato de objeto o schemaVersion', () => {
      expect(() => sanitizeCloudDocument(null)).toThrow();
      expect(() => sanitizeCloudDocument({ foo: 'bar' })).toThrow();
      expect(() => sanitizeCloudDocument({ schemaVersion: 0 })).toThrow();
    });
  });

  describe('Operaciones de red (checkRemoteSave, fetchRemoteSave, uploadRemoteSave)', () => {
    const mockKeyId = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    it('checkRemoteSave debe devolver exists: false ante un status 404', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await checkRemoteSave(mockKeyId, 'https://test-worker.dev', mockFetch as unknown as typeof fetch);
      expect(result.exists).toBe(false);
      expect(result.document).toBeUndefined();
    });

    it('checkRemoteSave debe devolver exists: true y el documento si el status es 200', async () => {
      const validDoc = prepareCloudSyncDocument(getDefaultStorageState(), '2026-11-04T15:00:00.000Z');
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => validDoc,
      });

      const result = await checkRemoteSave(mockKeyId, 'https://test-worker.dev', mockFetch as unknown as typeof fetch);
      expect(result.exists).toBe(true);
      expect(result.lastUpdated).toBe('2026-11-04T15:00:00.000Z');
      expect(result.document?.schemaVersion).toBe(1);
    });

    it('fetchRemoteSave debe devolver el documento si existe', async () => {
      const validDoc = prepareCloudSyncDocument(getDefaultStorageState(), '2026-11-04T15:00:00.000Z');
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => validDoc,
      });

      const doc = await fetchRemoteSave(mockKeyId, 'https://test-worker.dev', mockFetch as unknown as typeof fetch);
      expect(doc.lastUpdated).toBe('2026-11-04T15:00:00.000Z');
    });

    it('fetchRemoteSave debe fallar si no existe el guardado', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      });

      await expect(
        fetchRemoteSave(mockKeyId, 'https://test-worker.dev', mockFetch as unknown as typeof fetch)
      ).rejects.toThrow(/No se encontró ninguna partida/i);
    });

    it('uploadRemoteSave debe enviar el documento con PUT y responder éxito', async () => {
      const state: AppStorageState = {
        ...getDefaultStorageState(),
        progress: { unlockedLevel: 8, levels: {} },
      };

      let sentBody = '';
      const mockFetch = vi.fn().mockImplementation((_url, options) => {
        sentBody = options.body;
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ success: true, lastUpdated: '2026-11-04T17:00:00.000Z' }),
        });
      });

      const result = await uploadRemoteSave(mockKeyId, state, 'https://test-worker.dev', mockFetch as unknown as typeof fetch);
      expect(result.success).toBe(true);
      expect(result.lastUpdated).toBe('2026-11-04T17:00:00.000Z');

      const parsedSent = JSON.parse(sentBody);
      expect(parsedSent.progress.unlockedLevel).toBe(8);
      expect(parsedSent.schemaVersion).toBe(1);
    });

    it('uploadRemoteSave debe reportar error si el servidor devuelve error', async () => {
      const state = getDefaultStorageState();
      const mockFetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        text: async () => 'Internal Server Error',
        statusText: 'Internal Error',
      });

      await expect(
        uploadRemoteSave(mockKeyId, state, 'https://test-worker.dev', mockFetch as unknown as typeof fetch)
      ).rejects.toThrow(/Error al guardar en la nube/i);
    });
  });

  describe('Configuración de URL personalizada', () => {
    it('debe permitir cambiar y restablecer la URL del worker', () => {
      setCustomSyncApiUrl('https://my-custom-sync.workers.dev/');
      expect(getCloudSyncApiUrl()).toBe('https://my-custom-sync.workers.dev');

      setCustomSyncApiUrl(null);
      expect(getCloudSyncApiUrl()).not.toBe('https://my-custom-sync.workers.dev');
    });
  });
});
