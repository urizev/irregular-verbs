/**
 * Utilidades criptográficas para la identificación de usuario y sincronización en la nube.
 *
 * Principios:
 * 1. Normalización estricta de nombres de usuario (minúsculas, trim, NFKC, espacios colapsados).
 * 2. Derivación determinista e irreversible del ID de repositorio mediante SHA-256 y separación de dominios.
 * 3. Prevención de colisiones por inyección de delimitadores (longitudes prefijadas).
 * 4. El PIN nunca se almacena en texto plano ni se transmite directamente.
 */

const DOMAIN_SALT = 'irregular-verbs-cloud-sync-v1';

/**
 * Normaliza el nombre de usuario para evitar discrepancias por mayúsculas,
 * espacios intermedios redundantes o formas compuestas Unicode.
 */
export function normalizeUsername(username: string): string {
  if (!username) return '';
  return username
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Valida los datos de identificación introducidos por el jugador.
 */
export function validateCredentials(username: string, pin: string): { isValid: boolean; error?: string } {
  const normalizedUser = normalizeUsername(username);
  const cleanPin = pin ? pin.trim() : '';

  if (!normalizedUser || normalizedUser.length < 2) {
    return {
      isValid: false,
      error: 'El nombre de usuario debe tener al menos 2 caracteres.',
    };
  }

  if (normalizedUser.length > 50) {
    return {
      isValid: false,
      error: 'El nombre de usuario no puede superar los 50 caracteres.',
    };
  }

  if (!cleanPin || cleanPin.length < 4) {
    return {
      isValid: false,
      error: 'El PIN secreto debe tener al menos 4 caracteres o dígitos.',
    };
  }

  if (cleanPin.length > 32) {
    return {
      isValid: false,
      error: 'El PIN secreto no puede superar los 32 caracteres.',
    };
  }

  return { isValid: true };
}

/**
 * Deriva un identificador de repositorio remoto seguro, determinista y no reversible
 * a partir de la combinación de usuario normalizado y PIN.
 *
 * Utiliza Web Crypto API (disponible en navegadores, Cloudflare Workers y Node 18+).
 */
export async function deriveSyncKeyId(username: string, pin: string): Promise<string> {
  const normalizedUser = normalizeUsername(username);
  const cleanPin = pin.trim();

  if (!normalizedUser || !cleanPin) {
    throw new Error('Usuario y PIN son requeridos para derivar el identificador de sincronización.');
  }

  // Prevenir colisiones con prefijos de longitud explícitos
  // Formato: <salt>:<user_len>:<user>:<pin_len>:<pin>
  const payload = `${DOMAIN_SALT}:${normalizedUser.length}:${normalizedUser}:${cleanPin.length}:${cleanPin}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto;

  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('La API Web Crypto no está disponible en este entorno.');
  }

  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return hexHash;
}
