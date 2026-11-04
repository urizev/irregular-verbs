import { ParsedField, ParsedVerb, FieldValidationResult, VerbValidationResult } from '../types';

/**
 * Normaliza la respuesta del usuario:
 * - Convierte a minúsculas
 * - Elimina espacios en blanco iniciales y finales (trim)
 * - Colapsa múltiples espacios intermedios en uno solo
 * - Elimina el prefijo "to " si existe al inicio
 */
export function normalizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  let normalized = input.trim().toLowerCase();
  normalized = normalized.replace(/\s+/g, ' ');

  if (normalized.startsWith('to ')) {
    normalized = normalized.slice(3).trim();
  }

  return normalized;
}

/**
 * Extrae tokens de respuesta admitiendo separadores válidos (coma, punto y coma, barra, punto, espacio).
 */
export function extractTokens(normalizedInput: string): string[] {
  if (!normalizedInput) return [];
  return normalizedInput
    .split(/[,;/.\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Valida un campo individual contra su especificación parseada (& / | / SINGLE).
 */
export function validateField(rawUserInput: string, expectedField: ParsedField): FieldValidationResult {
  const normInput = normalizeInput(rawUserInput);
  const tokens = extractTokens(normInput);
  const expectedNormOptions = expectedField.options.map((opt) => normalizeInput(opt));

  if (tokens.length === 0) {
    return {
      isValid: false,
      expected: expectedField.options,
      operator: expectedField.operator,
      userInput: rawUserInput,
      missingOptions: expectedField.options,
    };
  }

  // Verifica que ningún token sea ajeno a las opciones válidas (descarta conectores "and", "y", etc.)
  const allTokensValid = tokens.every((token) => expectedNormOptions.includes(token));

  if (!allTokensValid) {
    return {
      isValid: false,
      expected: expectedField.options,
      operator: expectedField.operator,
      userInput: rawUserInput,
    };
  }

  if (expectedField.operator === 'AND') {
    // Deben estar TODAS las opciones requeridas
    const tokenSet = new Set(tokens);
    const missing = expectedNormOptions.filter((opt) => !tokenSet.has(opt));
    const isValid = missing.length === 0;

    return {
      isValid,
      expected: expectedField.options,
      operator: expectedField.operator,
      userInput: rawUserInput,
      missingOptions: missing.length > 0 ? missing : undefined,
    };
  }

  if (expectedField.operator === 'OR') {
    // Basta con al menos una opción válida y que no haya tokens erróneos
    const hasAtLeastOne = expectedNormOptions.some((opt) => tokens.includes(opt));
    return {
      isValid: hasAtLeastOne,
      expected: expectedField.options,
      operator: expectedField.operator,
      userInput: rawUserInput,
    };
  }

  // Operador SINGLE
  const expectedSingle = expectedNormOptions[0];
  const isValid = tokens.length === 1 && tokens[0] === expectedSingle;

  return {
    isValid,
    expected: expectedField.options,
    operator: expectedField.operator,
    userInput: rawUserInput,
  };
}

/**
 * Valida los 3 campos de un verbo en un desafío.
 * Un verbo se considera acertado SOLO si los 3 campos son válidos.
 */
export function validateVerb(
  userInput: { present: string; past: string; participle: string },
  verb: ParsedVerb
): VerbValidationResult {
  const present = validateField(userInput.present, verb.present);
  const past = validateField(userInput.past, verb.past);
  const participle = validateField(userInput.participle, verb.participle);

  const isValid = present.isValid && past.isValid && participle.isValid;

  return {
    isValid,
    present,
    past,
    participle,
  };
}
