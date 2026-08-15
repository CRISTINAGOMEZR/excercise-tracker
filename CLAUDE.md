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

- `npm run build` **siempre** antes de commitear.
- No hay tests todavía. Si vas a añadirlos, empieza por `lib/stats.ts` y `lib/videoUtils.ts` —
  son puras y es donde están las reglas de negocio.
- Iconos: siempre `@carbon/icons-react` vía `components/icons.tsx`. No añadas SVGs inline.
- Todo el copy de la UI va en español.
- Editar y borrar viven en el **detalle** (`library/[id]`), no en las cards. Fue una decisión
  explícita (commit `5155e2d`) — no las devuelvas a las cards.

## Estado actual

**Sin commitear ahora mismo:** `app/globals.css` añade la fuente **Fredoka** al import de Google
Fonts, pero no está declarada en `tailwind.config.ts` ni usada en ningún componente. O es trabajo
a medias, o quedó suelto. Preguntar a Cristina antes de borrarlo o de terminarlo.

## Backlog

### P1
- [ ] Tests para `lib/stats.ts` — sobre todo `rachaMasLarga` y el manejo de fechas en cambio de día
- [ ] Revisar el `min-height: 44px` global sobre `<a>`: acotarlo a botones y links de navegación
- [ ] Decidir qué pasa con Fredoka

### P2
- [ ] Estados vacíos de biblioteca y stats
- [ ] Manejo de error cuando un video embebido ya no existe o es privado
- [ ] Auditoría de accesibilidad WCAG AA (contraste de `--color-muted` sobre `sand-50` está justo)

### Hecho ✅
- [x] CI: `.github/workflows/check.yml` corre `npm run build` en push a `main` y en cada PR
- [x] Editar/borrar movidos al detalle + migración de iconos a Carbon (`5155e2d`)
- [x] Sesión guiada: countdown al inicio, mute, fullscreen, video más grande (`f80d8e9`, `7db04bd`)
- [x] Hoja de registro: cierra al elegir, bloquea scroll de fondo, por encima del menú (`4643a97`, `b4a9607`)
