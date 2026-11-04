# Irregular Verbs Cloud Sync Worker (Cloudflare Workers + Workers KV)

Servicio backend serverless para sincronización y recuperación de partidas en la nube de la aplicación Verbos Irregulares.

## Arquitectura

- **Tecnología:** Cloudflare Workers con TypeScript y Workers KV.
- **Identificación:** Criptográfica determinista sin almacenar credenciales en texto plano ni contraseñas. Cada usuario y PIN derivan en un identificador SHA-256 no reversible con separación de dominios.
- **Formato:** Un documento JSON por usuario conteniendo `schemaVersion`, `lastUpdated`, `settings`, `progress` y `statistics`.
- **CORS:** Soporte completo para permitir peticiones seguras desde GitHub Pages, localhost o cualquier origen web de la PWA.

## Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/sync/:keyId` | Obtiene el documento JSON de la partida guardada (404 si no existe). |
| `HEAD` | `/sync/:keyId` | Comprueba si existe partida para el `keyId` sin transferir el cuerpo. |
| `PUT` | `/sync/:keyId` | Valida y guarda/actualiza el documento JSON de la partida. |
| `GET` | `/health` | Comprobación de estado y disponibilidad del Worker. |

## Despliegue en Cloudflare

1. Instalar Wrangler (si no está instalado):
   ```bash
   npm install -g wrangler
   ```

2. Autenticarse con Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Crear el namespace de Workers KV:
   ```bash
   npx wrangler kv:namespace create SYNC_KV
   npx wrangler kv:namespace create SYNC_KV --preview
   ```

4. Colocar los IDs generados en `worker/wrangler.toml`.

5. Desplegar el Worker:
   ```bash
   cd worker && npx wrangler deploy
   ```
