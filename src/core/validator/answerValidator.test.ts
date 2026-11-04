import { describe, it, expect } from 'vitest';
import { normalizeInput, validateField, validateVerb } from './answerValidator';
import { parseVerb } from '../parser/verbParser';

describe('answerValidator', () => {
  describe('normalizeInput', () => {
    it('ignora mayúsculas/minúsculas', () => {
      expect(normalizeInput('RAN')).toBe('ran');
      expect(normalizeInput('LeArNed')).toBe('learned');
    });

    it('hace trim y colapsa espacios múltiples', () => {
      expect(normalizeInput('   was    were  ')).toBe('was were');
    });

    it('descarta automáticamente el prefijo "to "', () => {
      expect(normalizeInput('to run')).toBe('run');
      expect(normalizeInput('To Be')).toBe('be');
      expect(normalizeInput('  TO   go  ')).toBe('go');
    });
  });

  describe('validateField con operador &', () => {
    const andField = { operator: 'AND' as const, options: ['is', 'are'] };

    it('acepta todas las opciones separadas por coma', () => {
      expect(validateField('is, are', andField).isValid).toBe(true);
      expect(validateField('are, is', andField).isValid).toBe(true);
    });

    it('acepta separadores variados (barra, punto y coma, punto, espacio)', () => {
      expect(validateField('is/are', andField).isValid).toBe(true);
      expect(validateField('Are; IS', andField).isValid).toBe(true);
      expect(validateField('is.are', andField).isValid).toBe(true);
      expect(validateField('is are', andField).isValid).toBe(true);
    });

    it('falla si falta alguna opción', () => {
      expect(validateField('is', andField).isValid).toBe(false);
      expect(validateField('are', andField).isValid).toBe(false);
    });

    it('rechaza explícitamente conectores lingüísticos como "and" o "y"', () => {
      expect(validateField('is and are', andField).isValid).toBe(false);
      expect(validateField('is y are', andField).isValid).toBe(false);
    });

    it('rechaza respuestas con tokens adicionales no válidos', () => {
      expect(validateField('is, are, was', andField).isValid).toBe(false);
    });
  });

  describe('validateField con operador |', () => {
    const orField = { operator: 'OR' as const, options: ['learnt', 'learned'] };

    it('acepta cualquiera de las opciones válidas', () => {
      expect(validateField('learnt', orField).isValid).toBe(true);
      expect(validateField('learned', orField).isValid).toBe(true);
      expect(validateField('Learned', orField).isValid).toBe(true);
    });

    it('falla con opciones incorrectas', () => {
      expect(validateField('learning', orField).isValid).toBe(false);
    });
  });

  describe('validateVerb (3 campos simultáneos)', () => {
    const verbBe = parseVerb(
      { spanish: 'ser&estar', present: 'is&are', past: 'was&were', participle: 'been' },
      1
    );

    it('es válido solo cuando los 3 campos son correctos', () => {
      const result = validateVerb(
        { present: 'is, are', past: 'was were', participle: 'to been' },
        verbBe
      );
      expect(result.isValid).toBe(true);
      expect(result.present.isValid).toBe(true);
      expect(result.past.isValid).toBe(true);
      expect(result.participle.isValid).toBe(true);
    });

    it('falla si al menos un campo es incorrecto', () => {
      const result = validateVerb(
        { present: 'is, are', past: 'was', participle: 'been' }, // past incompleto
        verbBe
      );
      expect(result.isValid).toBe(false);
      expect(result.present.isValid).toBe(true);
      expect(result.past.isValid).toBe(false);
      expect(result.participle.isValid).toBe(true);
    });
  });
});
