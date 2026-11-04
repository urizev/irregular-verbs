import { describe, it, expect } from 'vitest';
import {
  normalizeUsername,
  validateCredentials,
  deriveSyncKeyId,
} from './cloudSyncCrypto';

describe('cloudSyncCrypto', () => {
  describe('normalizeUsername', () => {
    it('debe convertir a minúsculas y eliminar espacios en los extremos', () => {
      expect(normalizeUsername('  JuanPerez  ')).toBe('juanperez');
    });

    it('debe colapsar espacios múltiples intermedios', () => {
      expect(normalizeUsername('Maria   Elena   Gomez')).toBe('maria elena gomez');
    });

    it('debe normalizar caracteres Unicode (NFKC)', () => {
      // Caracteres compuestos vs descompuestos
      const composed = 'áéíóúñ';
      const decomposed = 'a\u0301e\u0301i\u0301o\u0301u\u0301n\u0303';
      expect(normalizeUsername(composed)).toBe(normalizeUsername(decomposed));
    });

    it('debe manejar entradas vacías o nulas', () => {
      expect(normalizeUsername('')).toBe('');
    });
  });

  describe('validateCredentials', () => {
    it('debe aceptar credenciales válidas', () => {
      const result = validateCredentials('Lucas', '1234');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('debe rechazar nombres de usuario demasiado cortos', () => {
      const result = validateCredentials('a', '1234');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/al menos 2 caracteres/i);
    });

    it('debe rechazar nombres de usuario demasiado largos', () => {
      const longName = 'a'.repeat(51);
      const result = validateCredentials(longName, '1234');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/no puede superar los 50 caracteres/i);
    });

    it('debe rechazar PINs demasiado cortos', () => {
      const result = validateCredentials('Lucas', '123');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/al menos 4 caracteres/i);
    });

    it('debe rechazar PINs vacíos', () => {
      const result = validateCredentials('Lucas', '');
      expect(result.isValid).toBe(false);
    });
  });

  describe('deriveSyncKeyId', () => {
    it('debe ser determinista (mismo usuario y PIN producen el mismo ID)', async () => {
      const id1 = await deriveSyncKeyId('Alex', '9876');
      const id2 = await deriveSyncKeyId('alex', '9876');
      const id3 = await deriveSyncKeyId('  ALEX  ', '9876');

      expect(id1).toBe(id2);
      expect(id1).toBe(id3);
      expect(typeof id1).toBe('string');
      expect(id1).toHaveLength(64); // SHA-256 en hex
    });

    it('debe generar IDs completamente distintos para PINs diferentes', async () => {
      const idA = await deriveSyncKeyId('Sofia', '1111');
      const idB = await deriveSyncKeyId('Sofia', '1112');

      expect(idA).not.toBe(idB);
    });

    it('debe evitar colisiones por desplazamiento o delimitadores', async () => {
      // "ab" con PIN "c" vs "a" con PIN "bc"
      const id1 = await deriveSyncKeyId('ab', '12345');
      const id2 = await deriveSyncKeyId('a', 'b12345');

      expect(id1).not.toBe(id2);
    });

    it('no debe contener el nombre de usuario ni el PIN en texto plano', async () => {
      const id = await deriveSyncKeyId('supersecretplayer', '987654321');
      expect(id.toLowerCase().includes('supersecretplayer')).toBe(false);
      expect(id.includes('987654321')).toBe(false);
    });

    it('debe fallar si usuario o PIN están vacíos', async () => {
      await expect(deriveSyncKeyId('', '1234')).rejects.toThrow();
      await expect(deriveSyncKeyId('user', '')).rejects.toThrow();
    });
  });
});
