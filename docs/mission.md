# Misión, Dinámicas de Juego y Reglas de Negocio

## 1. Visión y Misión del Producto

### 1.1. Misión
Proporcionar una aplicación web interactiva, lúdica y accesible para que estudiantes (especialmente niños y jóvenes estudiantes de inglés) dominen los **100 verbos irregulares más comunes del inglés** a través de la práctica deliberada, el refuerzo espaciado y la gamificación por niveles.

### 1.2. Principios Fundamentales de Diseño
- **100% Client-Side (Zero-Backend):** La aplicación no requiere servidor de backend ni autenticación. Todo el cómputo y estado se ejecutan en el navegador del usuario.
- **Offline-First (PWA):** Diseñada para funcionar sin conexión a internet una vez cargada, permitiendo su uso en cualquier dispositivo y entorno escolar o doméstico.
- **Privacidad y Soberanía de Datos:** Todos los datos y estadísticas se almacenan localmente en el dispositivo (`localStorage`), con capacidades completas de exportación, importación y reseteo.
- **Estética Infantil y Motivacional:** Interfaz visual atractiva, amigable, con paleta de colores vivos, tipografías redondeadas, animaciones suaves y recompensas inmediatas (estrellas, confeti, feedback positivo).
- **Pedagogía Positiva y Sin Frustración:** El progreso alcanzado nunca se pierde ("candado de un solo sentido"). Los fallos son oportunidades de aprendizaje con explicación visual inmediata.

---

## 2. Estructura de Niveles y Desafíos

### 2.1. Organización del Dataset en Niveles
- La base de datos contiene **100 verbos irregulares** ordenados de menor a mayor dificultad / mayor a menor frecuencia de uso.
- El juego se divide en **20 niveles** consecutivos de **5 verbos** cada uno:
  - **Nivel 1:** Verbos 1 a 5.
  - **Nivel 2:** Verbos 6 a 10.
  - ...
  - **Nivel 20:** Verbos 96 a 100.
*(Nota: Si en futuras expansiones el último nivel tuviese menos de 5 verbos, las reglas aplican de idéntica forma sobre los verbos disponibles).*

### 2.2. Progresión dentro de un Nivel
Cada nivel consta de **4 desafíos secuenciales**:
1. **Desafío 1 (Introducción / Guiado):** Permite hasta **2 fallos**.
2. **Desafío 2 (Consolidación):** Permite hasta **1 fallo**.
3. **Desafío 3 (Maestría del Nivel):** Permite **0 fallos** (tolerancia cero).
4. **Desafío Final del Nivel (Evaluación y Repaso Integral):** Permite **0 fallos** (perfecto). Superar este desafío desbloquea el siguiente nivel en el mapa.

```
[ Nivel N ]
  ├── Desafío 1 (5 verbos + 1 repaso* | máx 2 fallos)
  ├── Desafío 2 (5 verbos + 1 repaso* | máx 1 fallo)
  ├── Desafío 3 (5 verbos + 1 repaso* | máx 0 fallos)
  └── Desafío Final (5 verbos nivel + 5 repaso histórico | máx 0 fallos) ──► Desbloquea Nivel N+1
      * Repaso en desafíos 1-3 solo aplica para niveles >= 2.
```

---

## 3. Dinámica del Juego y Mecánicas de Desafío

### 3.1. Formato de Pregunta
- Los verbos se preguntan **siempre de uno en uno**.
- Se muestra la traducción al español en tipografía grande y destacada (ej. `ser / estar` o `correr`).
- El usuario dispone de 3 campos de texto para introducir las formas verbales en inglés:
  1. **Infinitive / Present**
  2. **Past Simple**
  3. **Past Participle**
- **Orden aleatorio:** En **todos** los desafíos (incluido el Desafío Final), el orden de presentación de los verbos es completamente aleatorio.

### 3.2. Composición de Verbos por Desafío
- **Desafíos 1, 2 y 3:**
  - **Nivel 1:** Contiene exactamente los 5 verbos del nivel actual.
  - **Nivel $\ge$ 2:** Contiene los 5 verbos del nivel actual + **1 verbo aleatorio de niveles anteriores**, seleccionado mediante algoritmo ponderado que prioriza los verbos con mayor tasa histórica de fallos en `localStorage`.
- **Desafío Final del Nivel:**
  - **Nivel 1:** Contiene los 5 verbos del Nivel 1.
  - **Nivel $\ge$ 2:** Contiene los 5 verbos del nivel actual + **5 verbos de niveles anteriores**, priorizando los más fallados históricamente. Si no hay suficientes verbos con fallos registrados, se completa con verbos aleatorios no repetidos de los niveles ya superados.

### 3.3. Regla de Fallos y Re-encolado (Queue Re-try)
- Si el usuario comete un error en un verbo:
  1. Se consume **1 fallo/vida** del límite del desafío.
  2. El verbo fallado **se re-encola al final de la lista de pendientes del desafío actual** para ser preguntado nuevamente más adelante.
  3. Cada fallo posterior en ese mismo verbo (o en cualquier otro) sigue consumiendo vidas del límite.
  - *Ejemplo en Desafío 1 (límite 2 fallos permitidos):* El jugador puede fallar 2 veces en total durante toda la sesión. Al cometer el 3.ᵉʳ fallo global (por ejemplo, fallando el mismo verbo 3 veces consecutivas o 3 verbos distintos), el desafío se pierde.
  - *Ejemplo en Desafío 3 o Desafío Final (límite 0 fallos):* El primer fallo cometido provoca la derrota inmediata del intento.

### 3.4. Derrota y Regeneración de Desafío
- Al superar el límite de fallos permitidos:
  - El desafío finaliza y se presenta una pantalla de derrota amable y motivadora (ej. "¡Casi lo logras! La práctica hace al maestro").
  - Se ofrece un botón destacado para **Reintentar**.
  - Al reintentar, el desafío se **regenera por completo**: se genera un nuevo orden aleatorio de preguntas y una nueva selección aleatoria/ponderada del verbo de repaso.
  - No existe límite de intentos diarios ni penalizaciones por reintentar.

### 3.5. Regla del "Candado de un Solo Sentido" (One-Way Progress Lock)
- El progreso es estrictamente incremental:
  - **Una vez que un desafío o nivel es superado, queda desbloqueado para siempre.**
  - Perder un desafío únicamente reinicia el intento en curso; nunca degrada estrellas ni bloquea niveles previamente completados.
- **Rejugabilidad:** El usuario puede volver a jugar cualquier nivel o desafío anterior cuantas veces desee en modo de práctica. Las estrellas guardadas reflejarán siempre la **mejor puntuación histórica**, y las estadísticas de aciertos/fallos se seguirán acumulando.

### 3.6. Sistema de Estrellas (1 a 3 Estrellas)
Cada desafío superado otorga de 1 a 3 estrellas según la precisión lograda en el intento:
- ⭐⭐⭐ **3 Estrellas:** Superado con **0 fallos**.
- ⭐⭐ **2 Estrellas:** Superado con **1 fallo**.
- ⭐ **1 Estrella:** Superado con **2 fallos** (solo alcanzable en Desafío 1).
*(En los Desafíos 3 y Finales, al exigir 0 fallos, su superación siempre concede 3 estrellas).*

---

## 4. Especificación del Modelo de Datos de Verbos

### 4.1. Estructura del JSON (`src/data/verbs.json`)
El dataset está formado por un array plano de exactamente 100 objetos:

```json
[
  {
    "spanish": "ser&estar",
    "present": "is&are",
    "past": "was&were",
    "participle": "been"
  },
  {
    "spanish": "aprender",
    "present": "learn",
    "past": "learnt|learned",
    "participle": "learnt|learned"
  },
  {
    "spanish": "ir",
    "present": "go",
    "past": "went",
    "participle": "gone"
  }
]
```

### 4.2. Semántica de Operadores de Conjugación
1. **Operador `&` (Conjunción estricta - "Y"):**
   - Exige que el usuario introduzca **todas** las variantes obligatorias especificadas, en cualquier orden.
   - Ejemplo: `is&are` exige que la respuesta contenga tanto `is` como `are`.
2. **Operador `|` (Disyunción - "O"):**
   - Permite que el usuario introduzca **al menos una** de las variantes válidas.
   - Ejemplo: `learnt|learned` es válido con `learnt` o con `learned`.
3. **Prohibición de Mezcla de Operadores:**
   - **Bajo ninguna circunstancia se permite combinar `&` y `|` en un mismo campo** (ej. `a&b|c` es inválido).
   - El módulo cargador de datos debe validar estáticamente el JSON al iniciar la aplicación. Si detecta una mezcla, lanzará una excepción explícita indicando el índice del verbo, el infinitivo y el campo erróneo.
4. **Formato en Campo `spanish`:**
   - En el campo `spanish`, tanto `&` como `|` tienen propósitos de presentación y se formatean en pantalla como `" / "` (ej. `"ser&estar"` se visualiza como `"ser / estar"`).

---

## 5. Reglas de Validación y Normalización de Respuestas

### 5.1. Normalización de Entrada (Input Sanitization)
Antes de evaluar cualquier campo de respuesta:
1. **Case-Insensitive:** Se convierte toda la cadena a minúsculas.
2. **Trim & Whitespace Collapse:** Se eliminan espacios en blanco al inicio y al final, y se colapsan múltiples espacios intermedios en un solo espacio.
3. **Prefijo "to " ignorado:** Si el usuario escribe `"to go"`, `"to be"`, etc., se elimina el prefijo `"to "` inicial de forma transparente.
4. **Eliminación de signos de puntuación no válidos:** Caracteres ajenos a letras o separadores válidos se limpian o rechazan.

### 5.2. Separadores Admitidos para el Operador `&`
Cuando un campo requiere múltiples respuestas (operador `&`), el usuario puede separarlas usando cualquiera de los siguientes delimitadores:
- Coma: `,` (ej. `was, were`)
- Punto y coma: `;` (ej. `was; were`)
- Barra: `/` (ej. `was/were`)
- Punto: `.` (ej. `was.were`)
- Espacio en blanco: ` ` (ej. `was were`)
- Mayúsculas/minúsculas indiferentes: `WAS, were` o `were, was`.

### 5.3. Rechazo de Conectores Lingüísticos
- **No se admiten conectores como palabras:** Queda prohibido el uso de `"and"` o `"y"` como separadores (ej. `was and were` o `was y were` se considerarán respuestas erróneas). La razón es pedagógica: evitar ambigüedades con formas verbales.

### 5.4. Criterio de Acierto Global del Verbo
- Un intento de verbo se considera **acertado únicamente si los 3 campos (present, past, participle) son válidos simultáneamente**.
- Si falla 1, 2 o los 3 campos, se computa como **1 único fallo global** para ese verbo y desafío, descontando 1 corazón.

---

## 6. Feedback Visual e Interacción

### 6.1. Experiencia ante Acierto
- Animación festiva inmediata (destello verde, rebote del elemento).
- Sonido opcional de éxito (chime suave).
- Transición automática al siguiente verbo sin fricción ni demoras.

### 6.2. Experiencia ante Fallo
- La pantalla no avanza de golpe: **se muestra la solución correcta durante 3 a 4 segundos**.
- Se resalta con claridad visual (borde rojo / icono ❌) cuáles campos específicos estuvieron mal y cuáles bien.
- Se muestra una **barra de cuenta atrás visual** que decrece con el tiempo.
- Se proporciona un botón explícito **"Continuar"** para permitir al estudiante saltar la espera si ya ha comprendido el error.

### 6.3. Elementos de Estado en Pantalla de Desafío
- **Contador de Vidas / Oportunidades:** Representado mediante iconos de corazones ❤️ (o indicadores de fallos permitidos restantes).
- **Barra de Progreso del Desafío:** Indicador visual de verbos superados vs. pendientes en la tanda actual.
- **Teclado y Accesibilidad:**
  - Al pulsar `Enter` en el campo *Present*, el foco pasa automáticamente a *Past*.
  - Al pulsar `Enter` en *Past*, el foco pasa a *Participle*.
  - Al pulsar `Enter` en *Participle*, se ejecuta la acción de "Comprobar".

---

## 7. Persistencia y Esquema de Datos (`localStorage`)

### 7.1. Versionado y Resiliencia
- El almacenamiento en `localStorage` estará gobernado por la clave de versión `schemaVersion: 1`.
- Si los datos están corruptos o provienen de una versión no compatible, el adaptador ejecutará una migración automática o inicializará un estado limpio por defecto sin romper la ejecución de la app.
- El tamaño del almacenamiento se mantendrá acotado guardando agregados acumulativos por verbo y un histórico acotado a las últimas $N$ partidas (ej. $N = 50$).

### 7.2. Estructura del Estado Persistente
```typescript
interface AppStorageState {
  schemaVersion: number;
  settings: {
    soundEnabled: boolean;
    reducedMotion: boolean;
  };
  progress: {
    unlockedLevel: number; // 1 a 20
    levels: {
      [levelNumber: number]: {
        challenges: {
          [challengeIndex: number]: { // 0: Desafío 1, 1: Desafío 2, 2: Desafío 3, 3: Desafío Final
            completed: boolean;
            bestStars: number; // 0 a 3
            attempts: number;
          };
        };
      };
    };
  };
  statistics: {
    totalPlayTimeSeconds: number;
    totalAnswersCorrect: number;
    totalAnswersFailed: number;
    lastPlayedTimestamp: number | null;
    lastPlayedResult: 'victory' | 'defeat' | null;
    currentStreakDays: number;
    bestStreakDays: number;
    lastActiveDateString: string | null; // YYYY-MM-DD
    activeDaysHistory: { [dateString: string]: number }; // Conteo de partidas por fecha YYYY-MM-DD
    verbsStats: {
      [verbIndex: number]: {
        timesAsked: number;
        timesFailed: number;
        lastPracticedTimestamp: number;
      };
    };
  };
}
```

---

## 8. Pantallas de la Aplicación

### 8.1. Pantalla Principal (Home / Mapa de Niveles)
- **Camino de Niveles (World Map):** Representación visual vertical tipo "sendero de aventuras" con nodos para cada nivel y desafío.
- **Estados de Nodo:** Bloqueado (candado), Desbloqueado/Actual (resaltado con animación de pulso), Superado (con sus estrellas correspondientes ⭐⭐⭐).
- **Botón "¡Jugar!":** Botón prominente en la parte inferior o central que lleva directamente al desafío más prioritario pendiente de completar.
- **Accesos directos:** Botones visibles para navegar a **Estadísticas** y **Ajustes**.

### 8.2. Pantalla de Desafío
- Encabezado con nivel, desafío actual, vidas restantes (❤️) y barra de progreso.
- Tarjeta central con el verbo en español.
- Tres campos de entrada accesibles (Present, Past, Participle).
- Botón de acción principal "Comprobar".

### 8.3. Pantallas de Fin de Desafío
- **Pantalla de Victoria:** Mensaje alegre, cálculo de estrellas obtenidas, lluvia de confeti (respetando accesibilidad), resumen de aciertos y botón "Siguiente Desafío" o "Volver al Mapa".
- **Pantalla de Derrota:** Mascota comprensiva, mensaje alentador, opción de "Reintentar Desafío" (regenerado) o "Volver al Mapa".

### 8.4. Pantalla de Estadísticas
- Visualización de KPIs clave:
  - Tiempo total jugado y tiempo medio de respuesta por verbo.
  - Aciertos vs. fallos globales y porcentaje de precisión.
  - Racha de días consecutivos y calendario/heatmap de constancia.
  - **Ranking de Verbos más Fallados:** Lista de verbos con mayor porcentaje de error y número de fallos para enfocar el estudio.
  - **Verbos Dominados:** Verbos con 0 fallos y múltiples repeticiones exitosas.
  - Total de estrellas conseguidas sobre el máximo posible.
  - Promedio de intentos requeridos por desafío.

### 8.5. Pantalla de Ajustes y Gestión de Datos
- Conmutador de Sonido (activar / silenciar efectos).
- **Exportar Progreso:** Descarga inmediata de un archivo `irregular-verbs-backup.json`.
- **Importar Progreso:** Carga de archivo JSON con validación rigurosa de esquema y confirmación previa antes de sobrescribir el estado local.
- **Reiniciar Progreso:** Restablecimiento total a valores de fábrica, protegido por diálogo de confirmación explícito.
