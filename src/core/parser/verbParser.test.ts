import { describe, it, expect } from 'vitest';
import { parseField, formatSpanish, parseVerb, parseVerbsList } from './verbParser';
import verbsData from '../../data/verbs.json';

describe('verbParser', () => {
  it('parsea correctamente campos individuales simples', () => {
    const field = parseField('run', 1, 'present');
    expect(field).toEqual({
      operator: 'SINGLE',
      options: ['run'],
    });
  });

  it('parsea conjunciones con operador &', () => {
    const field = parseField('is&are', 1, 'present');
    expect(field).toEqual({
      operator: 'AND',
      options: ['is', 'are'],
    });
  });

  it('parsea disyunciones con operador |', () => {
    const field = parseField('learnt|learned', 76, 'past');
    expect(field).toEqual({
      operator: 'OR',
      options: ['learnt', 'learned'],
    });
  });

  it('lanza excepción explícita si se mezclan & y | en un mismo campo', () => {
    expect(() => parseField('was&were|been', 1, 'past')).toThrowError(
      /Mezcla inválida de operadores '&' y '\|'/
    );
  });

  it('formatea correctamente la traducción en español', () => {
    expect(formatSpanish('ser&estar')).toBe('ser / estar');
    expect(formatSpanish('conseguir|obtener')).toBe('conseguir / obtener');
    expect(formatSpanish('correr')).toBe('correr');
  });

  it('parsea un verbo completo correctamente', () => {
    const parsed = parseVerb(
      { spanish: 'ser&estar', present: 'is&are', past: 'was&were', participle: 'been' },
      1
    );
    expect(parsed.index).toBe(1);
    expect(parsed.spanish).toBe('ser / estar');
    expect(parsed.present.operator).toBe('AND');
    expect(parsed.present.options).toEqual(['is', 'are']);
    expect(parsed.past.operator).toBe('AND');
    expect(parsed.past.options).toEqual(['was', 'were']);
    expect(parsed.participle.operator).toBe('SINGLE');
    expect(parsed.participle.options).toEqual(['been']);
  });

  it('valida la integridad estática de los verbos en src/data/verbs.json', () => {
    expect(verbsData).toHaveLength(102);
    const parsedList = parseVerbsList(verbsData);
    expect(parsedList).toHaveLength(102);
    parsedList.forEach((verb, idx) => {
      expect(verb.index).toBe(idx + 1);
      expect(verb.spanish.length).toBeGreaterThan(0);
      expect(verb.present.options.length).toBeGreaterThan(0);
      expect(verb.past.options.length).toBeGreaterThan(0);
      // Solo el verbo defectivo "can" carece de participio
      if (verb.present.options[0] === 'can') {
        expect(verb.participle.options).toEqual([]);
      } else {
        expect(verb.participle.options.length).toBeGreaterThan(0);
      }
    });
  });

  it('permite un participio vacío (verbo "can") pero no otros campos vacíos', () => {
    const parsed = parseVerb({ spanish: 'poder', present: 'can', past: 'could', participle: '' }, 1);
    expect(parsed.participle).toEqual({ operator: 'SINGLE', options: [] });
    expect(() =>
      parseVerb({ spanish: 'poder', present: 'can', past: '', participle: '' }, 1)
    ).toThrowError(/Estructura incompleta/);
    expect(() => parseField('', 1, 'past')).toThrowError(/vacío o inválido/);
  });
});
