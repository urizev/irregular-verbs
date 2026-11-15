import {
  ParsedField,
  ParsedVerb,
  FieldValidationResult,
  VerbValidationResult,
  VerbField,
  VERB_FIELDS,
} from '../types';

/**
 * Normaliza la respuesta del usuario:
 * - Convierte a minúsculas
 * - Elimina espacios en blanco iniciales y finales (trim)
 * - Colapsa múltiples espacios intermedios en uno solo
 * - Elimina acentos y diacríticos (para aceptar "oir" por "oír")
 * - Elimina el prefijo "to " si existe al inicio
 */
export function normalizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  let normalized = input.trim().toLowerCase();
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  normalized = normalized.replace(/\s+/g, ' ');

  if (normalized.startsWith('to ')) {
    normalized = normalized.slice(3).trim();
  }

  return normalized;
}

/**
 * Extrae tokens de respuesta admitiendo separadores válidos (coma, punto y coma, barra, punto, espacio).
 */
export function extractTokens(normalizedInput: string, knownOptions: string[] = []): string[] {
  if (!normalizedInput) return [];
  const tokens: string[] = [];
  const segments = normalizedInput
    .split(/[,;/.]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const segment of segments) {
    // Las opciones de varias palabras (p. ej. "llegar a ser") se conservan enteras
    if (knownOptions.includes(segment)) {
      tokens.push(segment);
    } else {
      tokens.push(...segment.split(/\s+/).filter((t) => t.length > 0));
    }
  }
  return tokens;
}

/**
 * Valida un campo individual contra su especificación parseada (& / | / SINGLE).
 */
export function validateField(rawUserInput: string, expectedField: ParsedField): FieldValidationResult {
  const normInput = normalizeInput(rawUserInput);
  const expectedNormOptions = expectedField.options.map((opt) => normalizeInput(opt));
  const tokens = extractTokens(normInput, expectedNormOptions);

  // Campo sin forma válida (p. ej. participio de "can"): solo se acepta la respuesta vacía
  if (expectedField.options.length === 0) {
    return {
      isValid: tokens.length === 0,
      expected: expectedField.options,
      operator: expectedField.operator,
      userInput: rawUserInput,
    };
  }

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
 * Valida los campos de un verbo en un desafío.
 * El campo mostrado al usuario (`givenField`) se da por válido; los otros tres deben rellenarse.
 * Un verbo se considera acertado SOLO si los tres campos solicitados son válidos.
 */
export function validateVerb(
  userInput: { spanish?: string; present?: string; past?: string; participle?: string },
  verb: ParsedVerb,
  givenField: VerbField = 'spanish'
): VerbValidationResult {
  const specs: Record<VerbField, ParsedField> = {
    spanish: verb.spanishField,
    present: verb.present,
    past: verb.past,
    participle: verb.participle,
  };

  const results = {} as Record<VerbField, FieldValidationResult>;
  for (const field of VERB_FIELDS) {
    if (field === givenField) {
      results[field] = {
        isValid: true,
        expected: specs[field].options,
        operator: specs[field].operator,
        userInput: '',
      };
    } else {
      results[field] = validateField(userInput[field] ?? '', specs[field]);
    }
  }

  const isValid = VERB_FIELDS.every((field) => results[field].isValid);

  return {
    isValid,
    givenField,
    spanish: results.spanish,
    present: results.present,
    past: results.past,
    participle: results.participle,
  };
}
