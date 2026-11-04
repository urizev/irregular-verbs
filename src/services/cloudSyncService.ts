import { AppStorageState } from '../core/types';
import { sanitizeStorageState, CURRENT_SCHEMA_VERSION } from '../storage/storageAdapter';

export interface CloudSyncDocument {
  schemaVersion: number;
  lastUpdated: string;
  clientVersion: string;
  settings: AppStorageState['settings'];
  progress: AppStorageState['progress'];
  statistics: AppStorageState['statistics'];
}

export interface RemoteCheckResult {
  exists: boolean;
  lastUpdated?: string;
  document?: CloudSyncDocument;
}

export const CLOUD_SYNC_CLIENT_VERSION = '1.0.0';

function getEnvSyncUrl(): string | undefined {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string> };
    if (meta && meta.env && typeof meta.env.VITE_CLOUD_SYNC_URL === 'string') {
      return meta.env.VITE_CLOUD_SYNC_URL;
    }
  } catch {
    // Ignore meta errors
  }
  return undefined;
}

export const DEFAULT_WORKER_URL = getEnvSyncUrl() || 'https://irregular-verbs-sync.workers.dev';

export const CUSTOM_API_URL_STORAGE_KEY = 'irregular_verbs_custom_sync_url';

let inMemoryCustomUrl: string | null = null;

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

/**
 * Obtiene la URL base configurada para la API de sincronización.
 */
export function getCloudSyncApiUrl(): string {
  const storage = getStorage();
  if (storage) {
    try {
      const custom = storage.getItem(CUSTOM_API_URL_STORAGE_KEY);
      if (custom && custom.trim().length > 0) {
        return custom.trim().replace(/\/+$/, '');
      }
    } catch {
      // Ignore read errors
    }
  }

  if (inMemoryCustomUrl && inMemoryCustomUrl.trim().length > 0) {
    return inMemoryCustomUrl.trim().replace(/\/+$/, '');
  }

  return DEFAULT_WORKER_URL.replace(/\/+$/, '');
}

/**
 * Permite configurar una URL personalizada del worker (útil para despliegues propios).
 */
export function setCustomSyncApiUrl(url: string | null): void {
  inMemoryCustomUrl = url;
  const storage = getStorage();
  if (storage) {
    try {
      if (!url || url.trim().length === 0) {
        storage.removeItem(CUSTOM_API_URL_STORAGE_KEY);
      } else {
        storage.setItem(CUSTOM_API_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
      }
    } catch {
      // Ignore write errors
    }
  }
}

/**
 * Convierte el estado local del juego en un documento listo para sincronizar.
 */
export function prepareCloudSyncDocument(
  state: AppStorageState,
  lastUpdatedIso: string = new Date().toISOString()
): CloudSyncDocument {
  const sanitized = sanitizeStorageState(state);
  return {
    schemaVersion: sanitized.schemaVersion,
    lastUpdated: lastUpdatedIso,
    clientVersion: CLOUD_SYNC_CLIENT_VERSION,
    settings: sanitized.settings,
    progress: sanitized.progress,
    statistics: sanitized.statistics,
  };
}

/**
 * Valida y sanea un documento recibido de la nube.
 */
export function sanitizeCloudDocument(raw: unknown): CloudSyncDocument {
  if (!raw || typeof raw !== 'object') {
    throw new Error('El documento remoto recibido no tiene un formato válido.');
  }

  const obj = raw as Partial<CloudSyncDocument>;

  if (typeof obj.schemaVersion !== 'number' || obj.schemaVersion < 1) {
    throw new Error('El documento remoto no contiene una versión de esquema compatible.');
  }

  const sanitizedState = sanitizeStorageState(obj);

  const lastUpdated =
    typeof obj.lastUpdated === 'string' && !isNaN(Date.parse(obj.lastUpdated))
      ? obj.lastUpdated
      : new Date().toISOString();

  const clientVersion =
    typeof obj.clientVersion === 'string' && obj.clientVersion.length > 0
      ? obj.clientVersion
      : CLOUD_SYNC_CLIENT_VERSION;

  return {
    schemaVersion: sanitizedState.schemaVersion,
    lastUpdated,
    clientVersion,
    settings: sanitizedState.settings,
    progress: sanitizedState.progress,
    statistics: sanitizedState.statistics,
  };
}

/**
 * Extrae el estado puro de almacenamiento (`AppStorageState`) a partir de un `CloudSyncDocument`.
 */
export function extractStorageStateFromCloud(doc: CloudSyncDocument): AppStorageState {
  return sanitizeStorageState({
    schemaVersion: doc.schemaVersion || CURRENT_SCHEMA_VERSION,
    settings: doc.settings,
    progress: doc.progress,
    statistics: doc.statistics,
  });
}

/**
 * Comprueba si existe un guardado remoto para el identificador dado.
 */
export async function checkRemoteSave(
  keyId: string,
  customBaseUrl?: string,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<RemoteCheckResult> {
  const baseUrl = (customBaseUrl || getCloudSyncApiUrl()).replace(/\/+$/, '');
  const url = `${baseUrl}/sync/${encodeURIComponent(keyId)}`;

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      return { exists: false };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Error del servidor remoto (${response.status}): ${errorText || response.statusText || 'Error desconocido'}`
      );
    }

    const data = await response.json();
    const validatedDoc = sanitizeCloudDocument(data);

    return {
      exists: true,
      lastUpdated: validatedDoc.lastUpdated,
      document: validatedDoc,
    };
  } catch (err) {
    if (err instanceof Error) {
      // Si el mensaje ya está formateado
      if (err.message.includes('servidor remoto') || err.message.includes('documento')) {
        throw err;
      }
      throw new Error(`No se pudo conectar con el servidor de guardado: ${err.message}`);
    }
    throw new Error('Error inesperado al consultar el guardado en la nube.');
  }
}

/**
 * Descarga y valida el documento guardado en la nube.
 */
export async function fetchRemoteSave(
  keyId: string,
  customBaseUrl?: string,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<CloudSyncDocument> {
  const checkResult = await checkRemoteSave(keyId, customBaseUrl, fetchFn);
  if (!checkResult.exists || !checkResult.document) {
    throw new Error('No se encontró ninguna partida guardada en la nube para este usuario.');
  }
  return checkResult.document;
}

/**
 * Guarda o actualiza el estado del juego en la nube.
 */
export async function uploadRemoteSave(
  keyId: string,
  state: AppStorageState,
  customBaseUrl?: string,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<{ success: boolean; lastUpdated: string }> {
  const baseUrl = (customBaseUrl || getCloudSyncApiUrl()).replace(/\/+$/, '');
  const url = `${baseUrl}/sync/${encodeURIComponent(keyId)}`;

  const nowIso = new Date().toISOString();
  const document = prepareCloudSyncDocument(state, nowIso);

  try {
    const response = await fetchFn(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Error al guardar en la nube (${response.status}): ${errorText || response.statusText || 'Error desconocido'}`
      );
    }

    const responseData = await response.json().catch(() => ({}));

    return {
      success: true,
      lastUpdated: responseData.lastUpdated || document.lastUpdated,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('Error al guardar')) {
        throw err;
      }
      throw new Error(`No se pudo completar la sincronización en la nube: ${err.message}`);
    }
    throw new Error('Error inesperado al guardar datos en la nube.');
  }
}
