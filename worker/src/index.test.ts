import { describe, it, expect, vi } from 'vitest';
import { handleRequest, isValidKeyId, validateDocumentPayload, Env } from './index';

describe('Cloudflare Worker - Sync Handler', () => {
  const validKeyId = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const mockKvStore: Record<string, string> = {};

  const mockEnv: Env = {
    SYNC_KV: {
      get: vi.fn().mockImplementation(async (key: string, type?: string) => {
        const val = mockKvStore[key];
        if (!val) return null;
        if (type === 'json') return JSON.parse(val);
        return val;
      }),
      put: vi.fn().mockImplementation(async (key: string, val: string) => {
        mockKvStore[key] = val;
      }),
      delete: vi.fn().mockImplementation(async (key: string) => {
        delete mockKvStore[key];
      }),
    },
  };

  describe('isValidKeyId', () => {
    it('debe validar hashes hexadecimales de 64 caracteres', () => {
      expect(isValidKeyId(validKeyId)).toBe(true);
      expect(isValidKeyId('short')).toBe(false);
      expect(isValidKeyId('g'.repeat(64))).toBe(false); // Caracteres no hex
    });
  });

  describe('validateDocumentPayload', () => {
    it('debe validar documentos válidos', () => {
      const valid = {
        schemaVersion: 1,
        progress: {},
        statistics: {},
        settings: {},
      };
      expect(validateDocumentPayload(valid).isValid).toBe(true);
    });

    it('debe rechazar cargas sin los campos obligatorios', () => {
      expect(validateDocumentPayload({}).isValid).toBe(false);
      expect(validateDocumentPayload({ schemaVersion: 1 }).isValid).toBe(false);
    });
  });

  describe('handleRequest', () => {
    it('debe responder a OPTIONS con cabeceras CORS (204)', async () => {
      const req = new Request(`https://worker.dev/sync/${validKeyId}`, {
        method: 'OPTIONS',
      });

      const res = await handleRequest(req, mockEnv);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('debe responder a /health con 200', async () => {
      const req = new Request('https://worker.dev/health', { method: 'GET' });
      const res = await handleRequest(req, mockEnv);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ok');
    });

    it('debe devolver 404 al hacer GET de un usuario que no tiene datos', async () => {
      const req = new Request(`https://worker.dev/sync/${validKeyId}`, { method: 'GET' });
      const res = await handleRequest(req, mockEnv);
      expect(res.status).toBe(404);
    });

    it('debe guardar un documento con PUT y permitir recuperarlo con GET', async () => {
      const docPayload = {
        schemaVersion: 1,
        lastUpdated: '2026-11-04T12:00:00.000Z',
        progress: { unlockedLevel: 4, levels: {} },
        statistics: { totalAnswersCorrect: 25 },
        settings: { soundEnabled: true },
      };

      // 1. Guardar con PUT
      const putReq = new Request(`https://worker.dev/sync/${validKeyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docPayload),
      });

      const putRes = await handleRequest(putReq, mockEnv);
      expect(putRes.status).toBe(200);
      const putJson = await putRes.json();
      expect(putJson.success).toBe(true);

      // 2. Recuperar con GET
      const getReq = new Request(`https://worker.dev/sync/${validKeyId}`, { method: 'GET' });
      const getRes = await handleRequest(getReq, mockEnv);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.progress.unlockedLevel).toBe(4);
      expect(getJson.statistics.totalAnswersCorrect).toBe(25);
    });

    it('debe rechazar PUT con JSON malformado', async () => {
      const req = new Request(`https://worker.dev/sync/${validKeyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{ malformed json',
      });

      const res = await handleRequest(req, mockEnv);
      expect(res.status).toBe(400);
    });

    it('debe rechazar peticiones con keyId inválido', async () => {
      const req = new Request('https://worker.dev/sync/invalid-key', { method: 'GET' });
      const res = await handleRequest(req, mockEnv);
      expect(res.status).toBe(400);
    });
  });
});
