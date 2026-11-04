# 🌟 Verbos Irregulares en Inglés - Juego Educativo Web

Aplicación web educativa interactiva, accesible y orientada a la gamificación infantil para aprender y dominar los **100 verbos irregulares más comunes del inglés**.

Desarrollada **100% en el cliente (Zero-Backend)**, offline-first como **Progressive Web App (PWA)** y lista para ser desplegada en **GitHub Pages**.

---

## 🚀 Características Principales

- **🎮 Estética y Dinámica Infantil:** Colores vibrantes, botones táctiles con relieve y sonido, estrellas de recompensa ⭐, lluvia de confeti 🎉 y mascota animada con diferentes estados de ánimo.
- **🧭 Camino de 20 Niveles:** 5 verbos por nivel organizados de menor a mayor dificultad, con 3 desafíos graduales (2, 1 y 0 fallos permitidos) + 1 Desafío Final perfecto (0 fallos) que incluye verbos de repaso históricos.
- **🔒 Candado de un solo sentido (One-Way Progress Lock):** El progreso nunca se pierde; los desafíos superados pueden rejugarse como práctica libremente sin degradar estrellas ni bloquear niveles.
- **🔄 Re-encolado inteligente de fallos:** Cualquier verbo fallado se vuelve a preguntar al final de la tanda, mostrando 3.5 segundos de solución con cuenta atrás visual y botón de salto.
- **⚡ Operadores Gramaticales Avanzados:**
  - `&`: Exige escribir **todas** las variantes requeridas (ej. `is, are` o `was were` para `is&are` y `was&were`).
  - `|`: Permite escribir **al menos una** de las variantes válidas (ej. `learned` o `learnt` para `learnt|learned`).
  - Soporte de separadores flexibles (`,`, `;`, `/`, `.`, espacio) y descarte de "to " inicial.
- **📊 Estadísticas Detalladas:** Racha de días consecutivos 🔥, calendario/heatmap de constancia, ranking de verbos más fallados y lista de verbos dominados con síntesis de voz.
- **💾 Persistencia, Backup y Sincronización en la Nube:** Guardado local en `localStorage` con versionado de esquema (`schemaVersion: 1`), exportación/importación en formato JSON y sincronización manual en la nube (Cloudflare Workers + Workers KV) mediante identificación con Usuario y PIN determinista sin contraseñas en texto plano.
- **📱 PWA Offline y Accesibilidad:** Instalable en móvil y escritorio, navegación ágil con tecla `Enter` entre campos y respeto de `prefers-reduced-motion`.

---

## 🛠️ Tecnologías Utilizadas

- **Vite:** Bundler ultrarrápido y servidor de desarrollo.
- **TypeScript:** Tipado estricto en modo `strict: true`.
- **React 18:** Arquitectura basada en componentes declarativos.
- **Tailwind CSS:** Utilidades atómicas y diseño responsive.
- **Vitest:** Suite de pruebas unitarias ultra rápida para el Core de lógica pura.
- **vite-plugin-pwa:** Configuración de Service Worker (Workbox) y Web App Manifest para funcionamiento offline.
- **Canvas Confetti:** Efectos visuales de celebración.

---

## 📦 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd irregularverbs
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Ejecutar tests unitarios (Vitest):**
   ```bash
   npm test
   ```

5. **Compilar para producción (Build):**
   ```bash
   npm run build
   ```
   Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

6. **Previsualizar la versión compilada:**
   ```bash
   npm run preview
   ```

---

## 🌐 Despliegue en GitHub Pages

El proyecto incluye un pipeline automatizado de **GitHub Actions** en `.github/workflows/deploy.yml`:
1. Al hacer `push` a la rama `main` o `master`, el workflow ejecuta automáticamente `npm ci`, `npm test` y `npm run build`.
2. Publica la carpeta `dist/` directamente en **GitHub Pages**.
3. Gracias a la configuración `base: './'` en `vite.config.ts`, la aplicación y la PWA funcionan tanto en la raíz como bajo el subpath del repositorio (`https://<usuario>.github.io/<repositorio>/`).

---

## 📝 Cómo Añadir o Modificar Verbos

La lista de verbos reside en `src/data/verbs.json`. Para añadir o editar verbos:

1. Abre `src/data/verbs.json`.
2. Añade un objeto con la siguiente estructura:
   ```json
   {
     "spanish": "soñar",
     "present": "dream",
     "past": "dreamt|dreamed",
     "participle": "dreamt|dreamed"
   }
   ```
3. **Reglas de sintaxis obligatorias:**
   - Usa `&` cuando el verbo requiera obligatoriamente ambas formas (ej. `"is&are"`).
   - Usa `|` para formas alternativas opcionales (ej. `"learnt|learned"`).
   - **Está prohibido mezclar `&` y `|` en un mismo campo** (ej. `"a&b|c"` lanzará un error de validación en los tests).
   - En `spanish`, usa `&` o `|` para separar significados (se mostrarán automáticamente como `" / "`).
4. Ejecuta `npm test` para verificar que la estructura y validaciones pasen correctamente.

---

## 🗺️ Hoja de Ruta y Mejoras Futuras (Roadmap)

- [ ] **Síntesis de Pronunciación Nativa (Web Speech API):** Integración completa del servicio aislado `SpeechService` con botones de altavoz interactivos en cada desafío.
- [ ] **Nuevas Listas de Verbos:** Modos avanzados para verbos B2/C1 y *Phrasal Verbs*.
- [ ] **Modo Contrarreloj (Time Attack):** Desafío de 60 segundos para acertar la mayor cantidad de verbos posible.
- [ ] **Personalización de Avatar / Mascota:** Desbloqueo de accesorios con las estrellas conseguidas.
- [ ] **Soporte Multilingüe (I18n):** Traducción del juego y de los verbos a francés, alemán, portugués e italiano.

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT.
