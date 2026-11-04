import { RawVerb, ParsedField, ParsedVerb } from '../types';

/**
 * Parsea un campo individual de conjugación verbal validando que no se mezclen los operadores '&' y '|'.
 */
export function parseField(fieldStr: string, verbIndex = 0, fieldName = 'unknown'): ParsedField {
  if (typeof fieldStr !== 'string' || fieldStr.trim() === '') {
    throw new Error(`Campo '${fieldName}' vacío o inválido en el verbo #${verbIndex}`);
  }

  const hasAnd = fieldStr.includes('&');
  const hasOr = fieldStr.includes('|');

  if (hasAnd && hasOr) {
    throw new Error(
      `Mezcla inválida de operadores '&' y '|' en el campo '${fieldName}' del verbo #${verbIndex}: "${fieldStr}"`
    );
  }

  if (hasAnd) {
    const options = fieldStr
      .split('&')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
    return {
      operator: 'AND',
      options,
    };
  }

  if (hasOr) {
    const options = fieldStr
      .split('|')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
    return {
      operator: 'OR',
      options,
    };
  }

  return {
    operator: 'SINGLE',
    options: [fieldStr.trim()],
  };
}

/**
 * Formatea la traducción en español reemplazando operadores '&' y '|' por ' / '.
 */
export function formatSpanish(spanishStr: string): string {
  if (!spanishStr) return '';
  return spanishStr
    .split(/[&|]/)
    .map((s) => s.trim())
    .join(' / ');
}

/**
 * Parsea y valida un verbo crudo del dataset.
 */
export function parseVerb(raw: RawVerb, index: number): ParsedVerb {
  if (!raw.spanish || !raw.present || !raw.past || !raw.participle) {
    throw new Error(`Estructura incompleta en el verbo #${index}`);
  }

  return {
    index,
    spanish: formatSpanish(raw.spanish),
    rawSpanish: raw.spanish,
    present: parseField(raw.present, index, 'present'),
    past: parseField(raw.past, index, 'past'),
    participle: parseField(raw.participle, index, 'participle'),
    raw,
  };
}

/**
 * Parsea y valida una lista completa de verbos crudos.
 */
export function parseVerbsList(rawList: RawVerb[]): ParsedVerb[] {
  if (!Array.isArray(rawList)) {
    throw new Error('El dataset de verbos debe ser un array.');
  }

  return rawList.map((raw, idx) => parseVerb(raw, idx + 1));
}
