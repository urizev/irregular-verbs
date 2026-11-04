import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDefaultStorageState,
  loadStorageState,
  saveStorageState,
  exportStateToJson,
  importStateFromJson,
  resetStorageState,
  STORAGE_KEY,
} from './storageAdapter';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe('storageAdapter', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('devuelve el estado por defecto si el storage está vacío', () => {
    const state = loadStorageState(mockStorage);
    expect(state).toEqual(getDefaultStorageState());
    expect(state.schemaVersion).toBe(1);
    expect(state.progress.unlockedLevel).toBe(1);
  });

  it('guarda y carga el estado correctamente', () => {
    const state = getDefaultStorageState();
    state.progress.unlockedLevel = 4;
    state.settings.soundEnabled = false;

    saveStorageState(state, mockStorage);
    const loaded = loadStorageState(mockStorage);

    expect(loaded.progress.unlockedLevel).toBe(4);
    expect(loaded.settings.soundEnabled).toBe(false);
  });

  it('sanea datos corruptos o incompletos con fallback seguro', () => {
    mockStorage.setItem(STORAGE_KEY, '{"schemaVersion": 1, "progress": "invalid"}');
    const loaded = loadStorageState(mockStorage);

    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.progress.unlockedLevel).toBe(1);
    expect(loaded.settings.soundEnabled).toBe(true);
  });

  it('exporta a JSON e importa correctamente', () => {
    const state = getDefaultStorageState();
    state.progress.unlockedLevel = 3;
    state.statistics.totalAnswersCorrect = 25;

    const json = exportStateToJson(state);
    expect(typeof json).toBe('string');

    const imported = importStateFromJson(json);
    expect(imported.progress.unlockedLevel).toBe(3);
    expect(imported.statistics.totalAnswersCorrect).toBe(25);
  });

  it('falla al importar un JSON no válido o sin schemaVersion', () => {
    expect(() => importStateFromJson('invalid json')).toThrow();
    expect(() => importStateFromJson('{"progress": {}}')).toThrow(/schemaVersion/);
  });

  it('resetStorageState restablece el almacenamiento a valores por defecto', () => {
    const state = getDefaultStorageState();
    state.progress.unlockedLevel = 10;
    saveStorageState(state, mockStorage);

    const resetState = resetStorageState(mockStorage);
    expect(resetState.progress.unlockedLevel).toBe(1);
    expect(loadStorageState(mockStorage).progress.unlockedLevel).toBe(1);
  });
});
