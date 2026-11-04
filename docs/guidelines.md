# Guías de Desarrollo, Estándares de Calidad y Contribución

Este documento establece las directrices de código, buenas prácticas de arquitectura, estándares de pruebas automatizadas y procedimientos de contribución para el proyecto de verbos irregulares.

---

## 1. Principios de Código y Estilo TypeScript

### 1.1. Tipado Estricto
- La configuración de `tsconfig.json` debe mantener activadas todas las banderas estrictas (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUnusedLocals: true`, `noUnusedParameters: true`).
- **Prohibido el uso de `any`:** Si un tipo es desconocido o genérico, utilizar `unknown` acompañado de guardas de tipo (`type guards`) o validación de esquemas.
- Definir interfaces explícitas para todos los modelos de dominio, configuraciones y estados de almacenamiento.

### 1.2. Inmutabilidad y Funciones Puras
- Los estados de la aplicación y las estructuras de datos deben tratarse como inmutables.
- Preferir `Readonly<T>`, `ReadonlyArray<T>` y operadores de propagación (`spread`) para transformaciones de estado.
- Las funciones de cálculo de estadísticas, validación de gramática y filtrado deben ser **funciones puras sin efectos secundarios**.

### 1.3. Aislamiento del Dominio (Clean Core)
- Ningún archivo dentro de `src/core/` puede importar módulos de React, hooks, bibliotecas de UI, ni hacer referencia a objetos globales del navegador (`window`, `document`, `localStorage`).
- La interacción con el entorno (navegador, almacenamiento, audio) se realiza exclusivamente a través de los adaptadores en `src/storage/` y `src/services/`.

---

## 2. Estándares de Pruebas Unitarias con Vitest

Todas las reglas de negocio descritas en `docs/mission.md` deben contar con una suite de pruebas unitarias exhaustiva antes de cualquier despliegue.

### 2.1. Casos de Prueba Obligatorios

| Módulo Core | Casos de Prueba Requeridos |
|---|---|
| **Verb Parser** | • Parseo exitoso de campos simples (`"run"`).<br>• Parseo de conjunción con `&` (`"is&are"` $\rightarrow$ requiere ambas).<br>• Parseo de disyunción con `\|` (`"learnt\|learned"` $\rightarrow$ cualquiera de las dos).<br>• **Lanzamiento de excepción explícita** si un campo combina `&` y `\|` (ej. `"a&b\|c"`).<br>• Validación estática de integridad del archivo `src/data/verbs.json` (exactamente 100 verbos con campos requeridos). |
| **Answer Validator** | • Insensibilidad a mayúsculas/minúsculas (`"RAN"` == `"ran"`).<br>• Trim y colapso de espacios múltiples (`"  was ,   were "` == `"was&were"`).<br>• Descarte automático del prefijo `"to "` (`"to run"` == `"run"`).<br>• Aceptación de separadores válidos para `&` (`,`, `;`, `/`, `.`, espacio).<br>• **Rechazo explícito de conectores lingüísticos** (`"was and were"`, `"was y were"` $\rightarrow$ inválido).<br>• Verificación de que 3 campos correctos $\rightarrow$ acierto; cualquier campo erróneo $\rightarrow$ 1 fallo global. |
| **Challenge Engine** | • Límites de fallos por desafío: Desafío 1 (2 fallos), Desafío 2 (1 fallo), Desafío 3 (0 fallos), Desafío Final (0 fallos).<br>• Re-encolado de verbos fallados al final de la tanda hasta su resolución o derrota.<br>• Derrota tras cometer $N+1$ fallos (ej. 3 fallos en Desafío 1 por fallar 3 veces el mismo verbo).<br>• Regeneración completa del desafío tras derrota (nuevo orden aleatorio y nuevo verbo de repaso).<br>• Cálculo preciso de estrellas (3 estrellas = 0 fallos, 2 estrellas = 1 fallo, 1 estrella = 2 fallos). |
| **Review Selector** | • Selección de 1 verbo en desafíos 1-3 (niveles $\ge 2$) ponderado según historial de errores.<br>• Selección de 5 verbos en Desafío Final priorizando los más fallados y completando con aleatorios.<br>• Caso base: Nivel 1 solo contiene los 5 verbos del nivel sin repaso previo. |
| **One-Way Progress Lock** | • Superar un desafío persiste el estado desbloqueado permanentemente.<br>• Jugar en modo práctica o perder un intento no degrada el progreso ni las mejores estrellas guardadas. |
| **Storage & Migrations** | • Inicialización segura con estado por defecto si `localStorage` está vacío o corrupto.<br>• Migración automática de datos ante cambios de `schemaVersion`.<br>• Exportación a JSON e importación con validación rigurosa de esquema antes de sobrescribir. |
| **Stats Calculator** | • Cálculo de rachas de días consecutivos (`currentStreak`, `bestStreak`).<br>• Cálculo de porcentajes de acierto global y tiempos medios.<br>• Generación correcta del ranking de verbos más fallados y verbos dominados. |

### 2.2. Convenciones de Nomenclatura de Tests
- Los archivos de test deben ubicarse junto al módulo correspondiente o en un directorio espejo con sufijo `.test.ts` (ej. `answerValidator.test.ts`).
- Estructura `describe` / `it` en español o inglés claro:
  ```typescript
  describe('AnswerValidator', () => {
    it('debe aceptar múltiples formas con operador & separadas por coma o espacio', () => {
      const result = validateField('was, were', 'was&were');
      expect(result.isValid).toBe(true);
    });
  });
  ```

---

## 3. Guía de Contribución para el Dataset de Verbos

### 3.1. Requisitos del Dataset (`src/data/verbs.json`)
1. **Total Exacto:** El archivo debe contener exactamente **100 verbos**.
2. **Estructura Estricta:**
   ```json
   {
     "spanish": "string",
     "present": "string",
     "past": "string",
     "participle": "string"
   }
   ```
3. **Orden Pedagógico:** Los verbos se ordenan de menor a mayor dificultad / mayor a menor frecuencia de uso cotidiano.
   - *Nivel 1 (1-5):* Verbos ultra básicos (`be`, `have`, `do`, `go`, `say`).
   - *Niveles intermedios (6-15):* Verbos comunes de acción y comunicación (`run`, `see`, `make`, `take`, `come`, etc.).
   - *Niveles avanzados (16-20):* Verbos con variaciones complejas o menor frecuencia (`shrink`, `swear`, `weave`, etc.).
4. **Reglas de Sintaxis:**
   - Usar `&` únicamente cuando el verbo requiera ambas formas gramaticales obligatorias (ej. `was&were`).
   - Usar `|` para variantes ortográficas válidas en inglés británico y americano (ej. `learnt|learned`, `dreamt|dreamed`).
   - **Nunca mezclar `&` y `|` en un mismo campo.**

---

## 4. Convención de Commits y Flujo Git

### 4.1. Formato de Commits (Conventional Commits)
Los mensajes de commit deben seguir el estándar:
`tipo(alcance opcional): descripción breve en imperativo o presente`

- `feat:` Nueva funcionalidad o pantalla.
- `fix:` Corrección de errores en la lógica o UI.
- `docs:` Modificaciones o adiciones en la documentación (`docs/`, `README.md`).
- `test:` Adición o actualización de tests unitarios.
- `refactor:` Cambios en el código que no alteran el comportamiento visible.
- `chore:` Tareas de configuración, dependencias o CI/CD.

*Ejemplo:* `feat(core): implement queue retry logic in challenge engine`

### 4.2. Checklist de Calidad Previo a Release
Antes de fusionar cambios a la rama `main` o publicar una versión:
- [ ] `npm test`: Todos los tests unitarios de Vitest pasan sin advertencias.
- [ ] `npm run build`: La compilación de TypeScript y empaquetado de Vite se completan con código de salida 0.
- [ ] **Validación Offline:** La PWA carga correctamente sin conexión en el navegador.
- [ ] **Accesibilidad:** Los inputs de respuesta permiten navegación completa con teclado (`Enter`).
- [ ] **Sin Errores en Consola:** No hay warnings de React ni excepciones no capturadas.
