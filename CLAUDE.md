# Exercise Tracker — Claude Code Instructions

> En local, las reglas globales están en `~/.claude/CLAUDE.md`. En las corridas de
> GitHub Actions ese archivo **no existe**, así que la política de autonomía está
> repetida abajo a propósito. Si cambias una, cambia la otra.

## Política de autonomía

**🟢 Verde — hazlo y mergéalo solo.** Typos, dependencias patch/minor, parches de
seguridad, código muerto, lint, tests nuevos, accesibilidad que no cambia el layout
(`aria-label`, `alt`, contraste hasta WCAG AA), bugs evidentes con fix de pocas líneas.
Todas estas condiciones deben cumplirse: `npm run build` pasa, CI en verde, no toca
auth ni reglas de Firestore ni esquema de datos, diff < 150 líneas, sin dependencias
nuevas. Si falla una sola → pasa a 🟡.

**🟡 Amarillo — abre PR y espera aprobación.** Cualquier cambio visible de UI, features,
refactors, deps major, cambios de esquema, dependencias nuevas, o > 150 líneas.
Haz el trabajo completo y deja el PR listo. **No lo mergees.**

**🔴 Rojo — pregunta antes de empezar.** Borrar datos, migraciones destructivas, reglas
de Firestore, variables de entorno y secretos, push directo a `main`, cualquier cosa que
cueste dinero, publicar hacia fuera, reescrituras grandes.

Ante la duda entre dos niveles, elige el más restrictivo.

**Git:** nunca commitees a `main`. Rama `claude/<tipo>-<descripción>` (tipos: `fix`,
`feat`, `chore`, `a11y`, `deps`, `test`). `npm run build` siempre antes de commitear.

**Agentes:** en `.claude/agents/` — `pm` (prioriza y cuestiona a los demás),
`bug-hunter`, `ui-reviewer`, `deps-security`, `test-quality`. Todo pasa por `pm`
antes de llegar a Cristina.

---

## Qué es

PWA personal de seguimiento de ejercicio. Español, mobile-first, instalable en el teléfono.
Cristina guarda videos de ejercicios (YouTube / Vimeo / Instagram / subidos), los agrupa en
rutinas, y marca lo que hace cada día. Estética calmada tipo revista — no app de gym agresiva.

Repo: https://github.com/CRISTINAGOMEZR/excercise-tracker · Deploy: Vercel (auto desde `main`)

## Stack

- **Next.js 15.5** (App Router, TypeScript) · React 18
- **Tailwind CSS** con paleta custom (sin librería de componentes)
- **Firebase** — Firestore (datos) + Auth + Cloud Messaging (push). `firebase-admin` en el server.
- **Cloudinary** — subida de videos, unsigned upload desde el browser
- **@carbon/icons-react** — todos los iconos (migrado desde SVGs inline)
- **PWA** — `manifest.json` + `sw.js` + `firebase-messaging-sw.js`

## Diseño

Paleta en `tailwind.config.ts` y como CSS vars en `app/globals.css`:

| Token | Valor | Uso |
|---|---|---|
| `sand-50` / `--color-bg` | `#faf8f5` | Fondo |
| `sand-100` / `--color-bg-card` | `#f4f0ea` | Cards |
| `sand-200` / `--color-border` | `#e8dfd3` | Bordes |
| `carbon-800` / `--color-text` | `#2a2a2a` | Texto |
| `--color-muted` | `#7a7a7a` | Texto secundario |
| `sage-500` / `--color-accent` | `#7a9670` | Acento, estados completados |
| `terracotta-500` | `#b56f54` | Acento cálido secundario |

Tipografía: **Cormorant** (serif) para h1/h2/h3 · **DM Sans** para el resto.
Tap targets mínimo 44px — forzado globalmente en `globals.css` sobre `button`, `a`, `[role=button]`.

⚠️ Ese `min-height/min-width: 44px` global sobre **todos** los `<a>` es agresivo: afecta también a
links dentro de párrafos. Si algo se ve con espaciado raro en texto corrido, es esto.

## Mapa de archivos

```
app/
  page.tsx                  # Home
  today/page.tsx            # Vista del día — marcar ejercicios hechos
  library/page.tsx          # Biblioteca de ejercicios y rutinas
  library/[id]/page.tsx     # Detalle — aquí viven editar y borrar
  add/page.tsx              # Añadir ejercicio / rutina
  stats/page.tsx            # Racha, heatmap, logros
  login/page.tsx
  layout.tsx
  globals.css               # CSS vars + reset + tap targets
  api/
    oembed/route.ts         # Metadata de videos (Instagram/Vimeo) sin API key
    send-reminders/route.ts # Cron diario de push — protegido por CRON_SECRET

components/
  GuidedSession.tsx         # Sesión guiada: countdown, mute, fullscreen, autoplay
  LogActivitySheet.tsx      # Bottom sheet para registrar actividad libre
  RoutineForm.tsx           # Crear/editar rutina (items por fase)
  AddExerciseForm.tsx
  ExerciseCard.tsx · RoutineCard.tsx
  VideoPlayer.tsx           # Embeds YouTube/Vimeo/Instagram
  Heatmap.tsx · Celebration.tsx
  Nav.tsx · AuthGuard.tsx
  NotificationToggle.tsx · PWARegister.tsx · InstallPrompt.tsx
  icons.tsx                 # Re-exports de @carbon/icons-react

lib/
  firestore.ts              # TODAS las operaciones de datos
  firebase.ts               # SDK cliente · firebase-admin.ts (server)
  stats.ts                  # Funciones PURAS: ymd, countByDate, rachaMasLarga,
                            #   totalEsteMes, porCategoria, calcularLogros
  videoUtils.ts             # Funciones PURAS: parseo de URLs, embeds, thumbnails
  storage.ts                # Upload a Cloudinary
  messaging.ts              # Permisos y tokens FCM

types/index.ts              # Exercise, Registro, ActividadGuardada, Rutina,
                            #   RutinaItem, Fase, Categoria
```

## Modelo de datos (Firestore)

- `Exercise` — un video. `tipo: 'upload' | 'link'`, categoría de `CATEGORIAS`.
- `Rutina` — agrupa varios `RutinaItem`, cada uno con una `Fase`
  (`Calentamiento` → `Normal` → `Enfriamiento`, orden en `ORDEN_FASE`).
- `Registro` — una cosa hecha un día. `fecha` es string `YYYY-MM-DD`, **no** Date.
  Puede apuntar a `ejercicioId`, a `rutinaId`, o llevar solo `actividad` (texto libre).
- `ActividadGuardada` — actividades libres que se guardan solas para reusar como pills,
  ordenadas por `usos`.

⚠️ **Las fechas se guardan como string local `YYYY-MM-DD`** (ver `ymd()` en `lib/stats.ts`).
No las conviertas a UTC ni a `Date` para comparar — se rompe la racha en el cambio de día.
Este es el punto más frágil del proyecto.

## Variables de entorno

En `.env.local` (dev) y en Vercel (prod). Ver `.env.local` para la lista completa y los comentarios
de dónde sacar cada una.

Públicas (`NEXT_PUBLIC_*`): config de Firebase, Cloudinary cloud name + upload preset, VAPID key.
Privadas: `CRON_SECRET`, `FIREBASE_SERVICE_ACCOUNT` (JSON en una sola línea).

La subida a Cloudinary es **unsigned** a propósito — el API Secret no se usa y nunca debe llegar
al cliente.

## Cron

`vercel.json` corre `/api/send-reminders` todos los días a las **15:00 UTC**. El endpoint valida
`CRON_SECRET`. Vercel Hobby solo permite crons diarios — si hiciera falta algo más frecuente, el
patrón que se usó en Alba es GitHub Actions llamando al endpoint.

## Reglas al trabajar aquí

- **Antes de que el `pm` elija el foco del día, tiene que revisar las pull requests
  abiertas** (`list_pull_requests` / `gh pr list --state all`), no solo el backlog de
  este archivo. El fix de fechas UTC→local (`ymd()` en `lib/stats.ts`) se propuso de
  forma independiente **al menos 9 veces** entre el 10 y el 22 de agosto de 2026 (PRs
  #9, #12, #13, #16, #18, #20, #21, #22 — casi todas con diffs casi idénticos) porque
  cada corrida autónoma redescubría el mismo bug sin comprobar que ya había una PR
  abierta arreglándolo. Un `pm` ya hizo la consolidación el 15-ago (ver comentario en
  #9): recomienda mergear **#9** (tiene `ymdOffset()` anclado al mediodía, a prueba de
  cambio de horario), cerrar el resto como duplicadas, y de #10 rescatar solo el fix
  de regex de enlaces de video (no el de fechas, que va en dirección contraria).
  Sigue pendiente de que Cristina decida — nadie más debe tocar esta lógica de fechas
  hasta que se resuelva ese cúmulo.
  **Regla:** si el hallazgo de bug-hunter/ui-reviewer/deps-security/test-quality ya
  tiene una PR abierta tocando los mismos archivos con el mismo fix, no abrir otra —
  comentar en la existente si hay algo nuevo que aportar, o elegir otro foco.
- **Regla (05-sep-2026):** si hay **4 o más PRs abiertas** esperando revisión, esa corrida
  no manda a ningún especialista a buscar más trabajo — el cuello de botella es la atención
  de Cristina, no la falta de hallazgos. En vez de eso, el `pm` revisa el estado de la cola
  (duplicadas, obsoletas, cuál priorizar) y esa revisión es el resultado del día. A 05-sep
  hay 8 PRs abiertas (la más vieja del 6-ago) y ninguna se ha mergeado desde el 22-ago.
  **Corrección (18-sep-2026): "abiertas" cuenta borradores (`draft`) aparte de las que de
  verdad esperan revisión.** Un PR en `draft` no se puede mergear en GitHub pase lo que
  pase, así que no es parte de la cola de revisión de Cristina — es trabajo del propio
  `pm`/especialista sin terminar de dejar listo. Ver la nota del 18-sep en "Estado actual":
  de las 8 PRs de esta cola, 6 son `draft` y solo 2 estaban realmente esperando a Cristina.
  La regla de 4+ sigue aplicando contando **todas** las abiertas (draft incluido) porque 8
  PRs de trabajo sin cerrar siguen siendo el cuello de botella, aunque el motivo cambie.
- **Condición de parada (10-sep-2026), enmienda a la regla anterior:** esa revisión de la cola
  solo se commitea **si aporta información nueva** (una PR cambió de estado, apareció un
  conflicto, cambió el orden de merge). Si el resultado es el mismo que la corrida anterior,
  la corrida **no abre PR ni toca este archivo** — se reporta a Cristina y se acaba. Motivo:
  los tres últimos commits en `main` (#22, #29, #30) son docs del `pm` sobre la cola atascada,
  cero PRs de código mergeadas en el mismo periodo. Documentar la parálisis por cuarta vez no
  la resuelve; solo gasta la atención que es justamente el recurso escaso. Desbloquear la cola
  es de Cristina, no del `pm`.
- ⚠️ **Segundo cúmulo de duplicadas naciendo, mismo patrón que el de fechas:** #5 y #28
  arreglan el mismo bug (registro duplicado por doble toque en `complete()` de
  `components/GuidedSession.tsx`) con el mismo guard (`useRef` síncrono). Ninguna es superset
  de la otra: #28 es superset en `GuidedSession.tsx` (guard + `disabled` en el botón + mute/
  countdown/fullscreen), pero #5 también cubre el guard de doble toque en `app/today/page.tsx`
  y `app/library/[id]/page.tsx`, que #28 no toca. Antes de mergear cualquiera de las dos,
  hay que quedarse con #28 para `GuidedSession.tsx` y rebasear #5 para dejar solo los otros
  dos archivos. No mandar a `bug-hunter` a por este bug otra vez — ya está encontrado dos veces.
- ⚠️ **#10 está mal autoetiquetada 🟢.** Aunque el fix de regex de video en `lib/videoUtils.ts`
  sí es verde, la misma PR también toca `getRachaActual`/`getTotalSemana` en `lib/firestore.ts`
  (`setDate`→`setUTCDate`), que es lógica de fechas — congelada por el cúmulo de arriba y en
  dirección contraria a `ymdOffset()` de #9. No mergear #10 tal cual ni tratarla como auto-merge;
  al resolver el cúmulo, rescatar de ahí solo `lib/videoUtils.ts`.
- ⚠️ **Corrección (06-sep-2026) al orden del 05-sep: #5 y #9 chocan, no son independientes.**
  Verificado con `merge-tree`: las dos tocan las mismas tres líneas de `fecha: new
  Date().toISOString().split('T')[0]` en `app/today/page.tsx` — #9 las cambia a `hoyStr()`
  (fix del bug UTC), #5 las envuelve en un `try/finally` sin tocar el cálculo (conserva el bug).
  Si se mergea #5 antes que #9 como sugería el orden viejo, el bug de fechas queda re-cementado
  dentro de código nuevo y hay que volver a tocarlo. **Orden correcto: #17 → #9 → #28 → #5
  rebaseada** (solo `app/today/page.tsx` y `app/library/[id]/page.tsx`, quitando
  `components/GuidedSession.tsx` que ya cubre #28, y con el guard de doble-toque escrito sobre
  `hoyStr()` en vez de `new Date().toISOString()`) → cherry-pick de `lib/videoUtils.ts` desde
  #10 y cerrar #10.
- ⚠️ **#7 y #10 ya no mergean limpio contra `main`** (06-sep-2026) — conflicto de merge en este
  mismo `CLAUDE.md`, colateral de que #29 tocó las mismas secciones. Antes de retomar #7 (el P1
  de acotar `min-height: 44px`: pasar de `button, a, [role=button]` a `button, [role=button],
  nav a` + `min-h-touch` en los links de estados vacíos — coherente con `spacing.touch: 44px`
  que ya existe en `tailwind.config.ts`), hay que rebasear quitando su parte de `CLAUDE.md`, que
  quedó obsoleta.
- `npm run build` **siempre** antes de commitear.
- No hay tests todavía. Si vas a añadirlos, empieza por `lib/stats.ts` y `lib/videoUtils.ts` —
  son puras y es donde están las reglas de negocio.
- Iconos: siempre `@carbon/icons-react` vía `components/icons.tsx`. No añadas SVGs inline.
- Todo el copy de la UI va en español.
- Editar y borrar viven en el **detalle** (`library/[id]`), no en las cards. Fue una decisión
  explícita (commit `5155e2d`) — no las devuelvas a las cards.

## Estado actual

Sin cambios de código sin commitear. **Corrección (18-sep-2026) a la premisa de las corridas del
05, 06 y 10-sep:** las tres documentaron "8 PRs esperando revisión, cola atascada" sin mirar el
campo `draft` de cada una. Verificado hoy contra la API de GitHub: **6 de las 8 son `draft`**
(#5, #7, #10, #23, #26, #28) — GitHub no permite mergearlas pase lo que pase, así que nunca
llegaron a Cristina para revisión. Solo **#17 y #9 son PRs reales, no-draft, `mergeable: true`**.
#17 pasó de `draft` a `ready_for_review` el 14-sep (evento de timeline, no hallazgo nuevo de
código); #9 pasó a ready el 24-ago. Los checks de ambas: `build` (GitHub Actions) en verde,
`Vercel` en rojo pero pre-existente y ya documentado como fuera de alcance en un comentario de
#17 del 18-ago (no bloquea el merge en GitHub, solo el deploy preview).

El orden de merge y el análisis del cúmulo de fechas de las secciones de arriba **siguen siendo
válidos** — lo que cambia es que 6 de las 8 PRs de ese orden no están listas para que Cristina
las revise todavía (siguen en `draft`, con el trabajo pendiente ya descrito: rebase de #5 y #7,
conflicto de #7/#10, etc.). Solo #17 y #9 están accionables hoy.

**Lo único que hace falta hoy: que Cristina mergee #17 y después #9.** Las dos son PRs reales
(no draft), mergean limpio, y son los primeros dos pasos del orden de merge ya documentado
(`#17 → #9 → #28 → #5 rebaseada`). Esto desbloquea el resto sin que nadie escriba código.

Las corridas del 05, 06 y 10-sep no mandaron especialistas (regla de 4+ PRs) y las tres llegaron
a la misma conclusión sin cuestionar si las 8 PRs contaban igual. La condición de parada del
10-sep sigue vigente: esta corrida sí aporta información nueva (el descubrimiento de los
`draft`), así que se documenta; una corrida futura que no encuentre nada nuevo no debe tocar
este archivo. Descartado en su momento: #26 (tests que evitan a propósito la lógica de fechas
que los justificaba) y #23 (deps) detrás de las prioritarias — ambas siguen en `draft` de
cualquier forma.

## Backlog

### P0
- [ ] **Que Cristina mergee #17 y #9 — son las únicas dos PRs realmente listas.** De las 8 de
      la cola, 6 están en `draft` (#5, #7, #10, #23, #26, #28) y GitHub no las deja mergear
      todavía (ver "Estado actual", 18-sep). Orden completo ya corregido el 06-sep (el orden del
      05-sep hacía chocar #5 con #9, ver "Reglas al trabajar aquí"):
      1) mergear #17 (10 líneas, corrige pérdida de datos, ya verificado que build pasa),
      2) mergear #9 (fechas UTC→local),
      3) sacar #28 de `draft` y mergearla (superset del guard de doble-toque en
      `GuidedSession.tsx`), 4) rebasear #5, sacarla de `draft` (solo `app/today/page.tsx` y
      `app/library/[id]/page.tsx` sobre `hoyStr()`) y mergearla, 5) cherry-pick
      `lib/videoUtils.ts` de #10 y cerrar #10.
      #7, #23 y #26 pueden esperar detrás de esas cinco (#7 necesita rebase, ver arriba).
- [ ] **Resolver el cúmulo de PRs duplicadas del fix de fechas UTC→local** — ver la nota en
      "Reglas al trabajar aquí" arriba. Candidata a mergear: #9, **antes** que #5 (no después).
      De #10, rescatar solo el fix de regex de video (no el cambio a
      `getRachaActual`/`getTotalSemana`, que va en dirección contraria).

### P1
- [ ] Tests para `lib/stats.ts` — sobre todo `rachaMasLarga` y el manejo de fechas en cambio de día
- [ ] Revisar el `min-height: 44px` global sobre `<a>`: acotarlo a botones y links de navegación

### P2
- [ ] Estados vacíos de biblioteca y stats
- [ ] Manejo de error cuando un video embebido ya no existe o es privado
- [ ] Auditoría de accesibilidad WCAG AA (contraste de `--color-muted` sobre `sand-50` está justo)

### Hecho ✅
- [x] Editar/borrar movidos al detalle + migración de iconos a Carbon (`5155e2d`)
- [x] Sesión guiada: countdown al inicio, mute, fullscreen, video más grande (`f80d8e9`, `7db04bd`)
- [x] Hoja de registro: cierra al elegir, bloquea scroll de fondo, por encima del menú (`4643a97`, `b4a9607`)
- [x] CI con `npm run build` en `.github/workflows/check.yml`
- [x] Fredoka retirada de `app/globals.css`
