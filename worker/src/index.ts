/**
 * Cloudflare Worker para la sincronización de partidas de Verbos Irregulares con Workers KV.
 *
 * Endpoints:
 * - OPTIONS /sync/:keyId    -> CORS preflight
 * - GET /sync/:keyId        -> Recupera el documento JSON del usuario desde Workers KV
 * - HEAD /sync/:keyId       -> Comprueba si existe guardado sin descargar el cuerpo
 * - PUT /sync/:keyId        -> Almacena/actualiza el documento JSON validado en Workers KV
 * - GET /health             -> Healthcheck del servicio
 */

export interface Env {
  SYNC_KV: {
    get(key: string, type?: 'text' | 'json'): Promise<unknown>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  };
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
};

function createJsonResponse(data: unknown, status: number = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function createCorsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Valida que el keyId sea un hash hexadecimal SHA-256 de 64 caracteres.
 */
export function isValidKeyId(keyId: string): boolean {
  return typeof keyId === 'string' && /^[a-f0-9]{64}$/i.test(keyId);
}

/**
 * Valida la estructura básica del documento recibido para asegurar que no se guarde basura.
 */
export function validateDocumentPayload(raw: unknown): { isValid: boolean; error?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { isValid: false, error: 'El cuerpo debe ser un objeto JSON.' };
  }

  const doc = raw as Record<string, unknown>;

  if (typeof doc.schemaVersion !== 'number' || doc.schemaVersion < 1) {
    return { isValid: false, error: 'schemaVersion inválido o ausente.' };
  }

  if (!doc.progress || typeof doc.progress !== 'object') {
    return { isValid: false, error: 'El objeto progress es requerido.' };
  }

  if (!doc.statistics || typeof doc.statistics !== 'object') {
    return { isValid: false, error: 'El objeto statistics es requerido.' };
  }

  if (!doc.settings || typeof doc.settings !== 'object') {
    return { isValid: false, error: 'El objeto settings es requerido.' };
  }

  return { isValid: true };
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '');

  // 1. Preflight CORS
  if (request.method === 'OPTIONS') {
    return createCorsResponse();
  }

  // 2. Healthcheck
  if (pathname === '/health' || pathname === '/api/health') {
    return createJsonResponse({ status: 'ok', service: 'irregular-verbs-sync' });
  }

  // 3. Rutas de sincronización: /sync/:keyId o /api/sync/:keyId
  const match = pathname.match(/^(?:\/api)?\/sync\/([a-zA-Z0-9_-]+)$/);
  if (!match) {
    return createJsonResponse({ error: 'not_found', message: 'Ruta no encontrada' }, 404);
  }

  const keyId = match[1].toLowerCase();

  if (!isValidKeyId(keyId)) {
    return createJsonResponse(
      {
        error: 'invalid_key',
        message: 'El identificador de repositorio proporcionado no es válido.',
      },
      400
    );
  }

  // Comprobar enlace de KV
  if (!env || !env.SYNC_KV) {
    return createJsonResponse(
      {
        error: 'kv_not_configured',
        message: 'El namespace Workers KV no está vinculado en el entorno del Worker.',
      },
      500
    );
  }

  try {
    if (request.method === 'GET') {
      const stored = await env.SYNC_KV.get(keyId, 'json');
      if (!stored) {
        return createJsonResponse(
          {
            error: 'not_found',
            message: 'No existen datos guardados en la nube para este usuario.',
          },
          404
        );
      }
      return createJsonResponse(stored, 200);
    }

    if (request.method === 'HEAD') {
      const stored = await env.SYNC_KV.get(keyId, 'json');
      if (!stored) {
        return new Response(null, {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
      return new Response(null, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      });
    }

    if (request.method === 'PUT') {
      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        return createJsonResponse(
          {
            error: 'invalid_json',
            message: 'El cuerpo de la petición no contiene un JSON válido.',
          },
          400
        );
      }

      const validation = validateDocumentPayload(rawBody);
      if (!validation.isValid) {
        return createJsonResponse(
          {
            error: 'validation_error',
            message: validation.error || 'Documento no válido',
          },
          400
        );
      }

      const doc = rawBody as Record<string, unknown>;
      const lastUpdated =
        typeof doc.lastUpdated === 'string' && !isNaN(Date.parse(doc.lastUpdated))
          ? doc.lastUpdated
          : new Date().toISOString();

      doc.lastUpdated = lastUpdated;

      await env.SYNC_KV.put(keyId, JSON.stringify(doc));

      return createJsonResponse({
        success: true,
        lastUpdated,
      });
    }

    return createJsonResponse({ error: 'method_not_allowed', message: 'Método HTTP no soportado' }, 405);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno';
    return createJsonResponse(
      {
        error: 'internal_error',
        message: errorMsg,
      },
      500
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
