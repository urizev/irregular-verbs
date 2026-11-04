---
sessionId: session-261104-143859-lman
---

# Requirements

### Overview & Goals
El objetivo de este proyecto es definir la documentación técnica y funcional para una aplicación web educativa interactiva enfocada en el aprendizaje progresivo de los 100 verbos irregulares más comunes en inglés. La aplicación está orientada a una experiencia lúdica e infantil, ejecutándose al 100% en el cliente (sin backend), persistiendo datos en `localStorage` y desplegable en GitHub Pages como PWA offline.

En esta etapa de planificación y documentación, se crearán los archivos de especificación (`docs/mission.md`, `docs/tech-stack.md`, `docs/roadmap.md` y `docs/guidelines.md`) que servirán de referencia estricta para la posterior fase de desarrollo.

### Scope
- **In Scope:**
  - Redacción de `docs/mission.md` con objetivos, reglas del juego, niveles, modelo de 100 verbos, operadores `&`/`|`, validación de respuestas, persistencia y estadísticas.
  - Redacción de `docs/tech-stack.md` con la justificación del stack (Vite + TypeScript + React + Vitest + `vite-plugin-pwa`), arquitectura en capas desacopladas, despliegue en GitHub Pages y directrices de UI/PWA.
  - Redacción de `docs/roadmap.md` con las fases de desarrollo incremental y la especificación de funcionalidades futuras (como Web Speech API para pronunciación).
  - Redacción de `docs/guidelines.md` con estándares de código, testing con Vitest, buenas prácticas de accesibilidad y guía para agregar/modificar verbos.
- **Out of Scope (por el momento):**
  - Implementación de código fuente (`src/`, componentes UI, tests ejecutables).
  - Creación del archivo `src/data/verbs.json` o configuración de empaquetador hasta que se apruebe la documentación.

### User Stories
- **Como desarrollador/mantenedor**, quiero disponer de una documentación exhaustiva y clara de la misión, arquitectura y estándares para implementar el juego de forma modular, libre de errores y con alta cobertura de tests.
- **Como estudiante**, podré aprender verbos irregulares mediante desafíos graduales, recibiendo feedback inmediato y manteniendo mi progreso seguro en mi dispositivo sin necesidad de conexión a internet ni registro de usuario.

### Functional Requirements
- **docs/mission.md:**
  - Descripción del producto, estética infantil y público objetivo.
  - Estructura de niveles (5 verbos consecutivos por nivel, 3 desafíos + 1 desafío final).
  - Reglas de fallos permitidos por desafío (2, 1, 0, 0), re-encolado de verbos fallados y regeneración en caso de derrota.
  - Comportamiento de "candado de un solo sentido" (el progreso no retrocede).
  - Formato del dataset de 100 verbos y semántica de operadores `&` y `|` (prohibiendo su mezcla en un mismo campo).
  - Reglas de normalización de respuestas y separadores permitidos (ignorar "to ", admitir coma, punto y coma, barra, punto y espacio; rechazar "and"/"y").
  - Pantallas de la aplicación (Home / Mapa de progreso, Desafío con 3 inputs y temporizador de feedback, Pantallas de Victoria/Derrota, Estadísticas y Ajustes).
  - Especificación de estadísticas (tiempos, rachas, calendario, ranking de errores) y backup JSON (export/import/reset).
- **docs/tech-stack.md:**
  - Stack tecnológico: Vite, TypeScript, React, Tailwind CSS / CSS modular, Vitest, `vite-plugin-pwa`.
  - Arquitectura modular: Core puro (`src/core/`) desacoplado de la UI (`src/components/`, `src/views/`) y de la persistencia (`src/storage/`).
  - Compatibilidad GitHub Pages: `base` relativo, hash routing / navegación por estado interno, GitHub Actions workflow.
  - Configuración PWA: Service Worker, Web App Manifest, fuentes locales embebidas (Fredoka/Baloo) y soporte offline estricto bajo subpaths.
- **docs/roadmap.md:**
  - Fases de implementación: Fase 1 (Core y tests), Fase 2 (UI y pantallas), Fase 3 (Estadísticas y persistencia), Fase 4 (PWA y CI/CD), Fase 5 (Pulido y audio).
  - Especificación de mejoras futuras: integración desacoplada de Web Speech API (`SpeechService`).
- **docs/guidelines.md:**
  - Convenciones de tipado estricto, inmutabilidad y pruebas unitarias.
  - Formato de commits y checklist de calidad previa a release.
  - Procedimiento para editar o extender la lista de verbos.

### Non-Functional Requirements
- **Documentación estructurada y en español neutro.**
- **Claridad técnica y trazabilidad:** Toda regla de negocio debe ser verificable mediante tests unitarios en la fase de implementación.
- **Portabilidad:** Los documentos deben seguir formato Markdown estándar compatible con lectores en GitHub y entornos locales.

# Technical Design

### Current Implementation
El proyecto se encuentra en un estado inicial vacío (únicamente contiene configuración de IDE en `.idea/`). No existen archivos de documentación ni código fuente previo.

### Key Decisions
1. **Separación estricta de responsabilidades (Clean Core Architecture):**
   - La lógica de negocio (validación de respuestas, parsing de operadores `&`/`|`, selector ponderado de verbos de repaso, máquina de estados de desafíos y cálculo de estadísticas) residirá en módulos TypeScript puros sin dependencias de React o del DOM.
   - *Razón:* Facilita una cobertura de pruebas del 100% con Vitest y asegura que la UI sea un simple consumidor del estado.

2. **Navegación sin History API:**
   - La aplicación utilizará navegación basada en estado interno o Hash Routing (`#/stats`, `#/settings`, etc.).
   - *Razón:* GitHub Pages sirve archivos estáticos y no admite redirección `SPA fallback` a `index.html` en rutas profundas de History API sin hacks de 404.

3. **PWA Offline y Fuentes Locales:**
   - Todos los recursos (incluidas fuentes redondeadas como Fredoka o Baloo y sonidos) se empaquetarán y precachearán mediante el Service Worker de Vite PWA configurando adecuadamente el `scope` y `start_url` basados en el subpath del repositorio.

4. **Persistencia Segura y Migrable:**
   - Estructura de `localStorage` gobernada por `schemaVersion` con adaptadores de validación y migración por defecto en caso de datos corruptos o antiguos.

### Proposed Changes
Se crearán cuatro documentos en el directorio `docs/`:
- `docs/mission.md`: Misión, visión, mecánicas de juego detalladas, especificación de datos de verbos, reglas de validación y pantallas.
- `docs/tech-stack.md`: Justificación del stack tecnológico, diseño de arquitectura de capas, configuración para GitHub Pages y PWA.
- `docs/roadmap.md`: Plan de fases de implementación técnica y backlog de funcionalidades futuras (Web Speech API).
- `docs/guidelines.md`: Guías de estilo, estándares de testing con Vitest, accesibilidad y manual de contribución del dataset de verbos.

### File Structure
```text
docs/
├── mission.md        # Objetivos, mecánicas del juego, modelo de datos y reglas de negocio
├── tech-stack.md     # Stack técnico, arquitectura desacoplada, PWA y despliegue en Pages
├── roadmap.md        # Fases de entrega y roadmap de mejoras futuras (Web Speech API)
└── guidelines.md     # Estándares de desarrollo, pruebas unitarias y contribución
```

### Architecture Diagram
```mermaid
graph TD
    subgraph UI Layer ["Capa de Presentación (React)"]
        HomeView["Home / Camino de Niveles"]
        ChallengeView["Pantalla de Desafío (3 Inputs)"]
        StatsView["Pantalla de Estadísticas"]
        SettingsView["Pantalla de Ajustes / Backup"]
    end

    subgraph Core Layer ["Capa Core Lógica Pura (TypeScript + Vitest)"]
        VerbParser["Verb Parser (& / |)"]
        AnswerValidator["Answer Validator (Normalización)"]
        ChallengeEngine["Challenge Engine (Niveles y Reintentos)"]
        ReviewSelector["Weighted Review Selector"]
        StatsCalculator["Stats Calculator"]
    end

    subgraph Storage Layer ["Capa de Persistencia y Servicios"]
        LocalStorageAdapter["Storage Adapter (schemaVersion)"]
        SpeechService["Speech Service (Web Speech API - Roadmap)"]
    end

    UI Layer --> Core Layer
    UI Layer --> Storage Layer
    ChallengeEngine --> VerbParser
    ChallengeEngine --> AnswerValidator
    ChallengeEngine --> ReviewSelector
    StatsView --> StatsCalculator
```

### Risks
- **Riesgo:** Incompatibilidad de rutas en GitHub Pages al desplegar en un subpath (`/<repo-name>/`).
  - *Mitigación:* Documentar explícitamente en `tech-stack.md` el uso de rutas relativas, `base` dinámico de Vite y navegación por hash o estado.
- **Riesgo:** Acoplamiento de la lógica de evaluación a componentes de React, dificultando los tests automatizados.
  - *Mitigación:* Definir en `guidelines.md` que la lógica de validación debe residir obligatoriamente en `src/core/` con tests unitarios independientes.

# Delivery Steps

### ✓ Step 1: Definir Misión, Dinámicas de Juego y Reglas de Negocio en docs/mission.md
`docs/mission.md` creado y estructurado con la visión del producto, mecánicas del juego, modelo de datos y reglas de negocio.

- Redactar la misión y visión del juego educativo web infantil para el aprendizaje de verbos irregulares en inglés (100% frontend, sin backend).
- Documentar las reglas de dominio del juego: niveles de 5 verbos consecutivos, 3 desafíos graduales por nivel + 1 desafío final de nivel (repaso ponderado de verbos fallados), límites de fallos permitidos (2, 1, 0 y 0) y re-encolado de verbos fallados.
- Especificar el comportamiento de "candado de un solo sentido" (progreso que no retrocede), rejugabilidad de niveles superados y sistema de estrellas (1-3).
- Detallar la especificación del conjunto de datos de 100 verbos en `src/data/verbs.json`, la semántica de operadores `&` (todas las opciones) y `|` (al menos una), la prohibición estricta de mezclar ambos operadores en un mismo campo y el formateo de traducciones en español.
- Definir la lógica de validación de respuestas: normalización (trim, colapso de espacios, ignorar "to " inicial y mayúsculas/minúsculas), separadores admitidos (`,`, `;`, `/`, `.`, espacio), descarte de "and"/"y", y regla de que cualquier campo incorrecto cuenta como 1 fallo global del verbo.
- Especificar las métricas de estadísticas requeridas y la estrategia de persistencia en `localStorage` con versionado de esquema (`schemaVersion`) e histórico acotado.

### ✓ Step 2: Especificar Stack Tecnológico y Arquitectura en docs/tech-stack.md
`docs/tech-stack.md` creado con la selección tecnológica, arquitectura desacoplada, estrategia PWA y configuración de despliegue.

- Justificar y documentar el stack recomendado: Vite + TypeScript + React (o Preact/Svelte), Tailwind CSS / Vanilla CSS con variables temáticas, Vitest y `vite-plugin-pwa`.
- Definir la arquitectura del frontend dividida en tres capas principales: Lógica pura independiente (`src/core/`), Adaptadores de almacenamiento y configuración (`src/storage/`, `src/services/`) y Capa de UI y vistas (`src/components/`, `src/views/`).
- Documentar la estrategia de despliegue en GitHub Pages: configuración de `base` relativo (`/<nombre-repo>/`), navegación mediante estado interno/hash routing (sin History API), y workflow de CI/CD con GitHub Actions.
- Detallar la arquitectura PWA offline: configuración de Web App Manifest, Service Worker con Workbox y caché de assets estáticos y fuentes locales (Fredoka / Baloo), garantizando funcionamiento en el subpath.
- Especificar las directrices de accesibilidad y UI móvil: inputs con atributos `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, `autocomplete="off"`, navegación con Enter entre campos, contraste de color y soporte de `prefers-reduced-motion`.

### ✓ Step 3: Elaborar Hoja de Ruta y Fases en docs/roadmap.md
`docs/roadmap.md` creado con las fases de desarrollo incremental y backlog de futuras funcionalidades.

- Estructurar las fases de implementación técnica del proyecto: Fase 1 (Core y tests unitarios de validación y progreso), Fase 2 (Componentes UI y flujo de juego), Fase 3 (Estadísticas, ajustes e import/export), Fase 4 (PWA, offline y pipeline GitHub Actions) y Fase 5 (Pulido visual, sonidos y accesibilidad).
- Documentar la arquitectura futura y especificación para la funcionalidad de pronunciación con Web Speech API (`speechSynthesis`), dejando definida la interfaz aislada del servicio `SpeechService`.
- Detallar el backlog de posibles extensiones (nuevas listas de verbos avanzados, logros desbloqueables, personalización de avatares/mascota y soporte multilingüe).

### ✓ Step 4: Redactar Guías del Proyecto y Estándares de Calidad en docs/guidelines.md
`docs/guidelines.md` creado con los convenios de desarrollo, testing, buenas prácticas y flujo de trabajo.

- Definir las normas de desarrollo en TypeScript: tipado estricto, inmutabilidad en el manejo de estado, separación absoluta entre lógica de negocio y componentes React.
- Establecer las directrices de testing unitario con Vitest: cobertura obligatoria de parsers `&`/`|`, normalización, generador y ponderador de desafíos, reglas de fallos/reintentos, cálculo de estadísticas y migraciones de `localStorage`.
- Establecer el flujo de contribución para la base de datos de verbos (`src/data/verbs.json`): reglas de validación estática, orden de dificultad y formato de sinónimos.
- Definir la convención de commits, estructura de archivos del proyecto y directrices de revisión antes de despliegue.