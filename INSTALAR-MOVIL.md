# INSSUP · Guía de instalación móvil (PWA)

INSSUP ahora es una **PWA instalable**. Se eligió **PWA** (no APK nativo) como
solución principal porque:

- No requiere tienda ni firmar binarios.
- Se instala desde la misma web en Android **e** iOS.
- Se actualiza sola con cada deploy (no hay que redistribuir un APK).
- Conserva login, rutas protegidas y el panel admin sin cambios.

La ruta de **APK / Google Play** y **App Store / TestFlight** queda documentada
más abajo como opcional para el futuro.

---

## Qué se implementó

| Área | Cambio |
|------|--------|
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` con `display: standalone`, iconos PNG (192/512 + maskable), `shortcuts`, `theme_color` oscuro. |
| Service worker | `public/sw.js` (network-first en páginas, cache-first en estáticos, **no** intercepta Supabase) + `public/offline.html`. Registrado en `ServiceWorkerRegister`. |
| Iconos | Logo INSSUP recreado en `scripts/gen-icons.mjs` → `public/icons/*.png` + `src/app/icon.png` / `apple-icon.png`. |
| Meta Apple/PWA | En `src/app/layout.tsx`: `apple-mobile-web-app-capable`, `-title`, `-status-bar-style`, `apple-touch-icon`, `theme-color`, OpenGraph. |
| Instalación | `InstallPrompt` detecta el dispositivo: **Android/desktop** → botón que dispara el instalador nativo; **iOS** → modal con los pasos de Safari. Disponible como pill flotante, en el menú de usuario y en el login. |

Todo es responsive y no rompe ninguna ruta existente.

---

## 📱 iPhone / iPad (iOS)

> Apple **no permite** descargar apps (IPA) desde la web. El método correcto es
> **instalar la PWA desde Safari**.

1. Abre **https://inssupp.vercel.app** en **Safari** (no Chrome iOS).
2. Toca **Compartir** (cuadro con flecha hacia arriba).
3. Elige **«Agregar a pantalla de inicio»**.
4. Pulsa **«Agregar»** (arriba a la derecha).

Queda el ícono de INSSUP en la pantalla de inicio y abre en pantalla completa.
La app muestra estos pasos automáticamente cuando detecta un iPhone/iPad.

---

## 🤖 Android

**Opción recomendada — PWA (ya funciona):**
1. Abre **https://inssupp.vercel.app** en **Chrome** (o Edge).
2. Aparece el botón **«Instalar»** dentro de la web (o el menú **⋮ → Instalar
   aplicación**).
3. Confirma. Queda como app con su ícono, en pantalla completa.

**Opción APK / Google Play (opcional, futuro):**
La forma más simple de obtener un APK/AAB desde esta misma PWA es **PWABuilder**
(usa TWA por debajo, sin reescribir código):
1. Entra a <https://www.pwabuilder.com> e ingresa `https://inssupp.vercel.app`.
2. Sección **Android** → **Generate Package** → descarga el `.apk`/`.aab` y el
   archivo `assetlinks.json`.
3. Sube `assetlinks.json` a `public/.well-known/assetlinks.json` y redeploya
   (verifica el dominio para que la TWA abra sin barra de navegador).
4. **APK de prueba:** aloja el `.apk` en `public/downloads/inssup.apk` y enlaza
   con un botón «Descargar para Android». (Android pedirá permitir «orígenes
   desconocidos».) **Firma** el APK antes de distribuirlo.
5. **Google Play:** sube el `.aab` firmado a Play Console (cuenta de desarrollador
   USD 25 única).

**Alternativa con Capacitor** (si se necesita código nativo real):
```bash
npm i -D @capacitor/cli @capacitor/core @capacitor/android
npx cap init INSSUP cl.inssup.app --web-dir=out   # requiere export estático o server URL
npx cap add android
# apuntar a la URL desplegada en capacitor.config.ts (server.url = https://inssupp.vercel.app)
npx cap open android                               # Android Studio → Build > APK firmado
```
> Nota: como INSSUP es una app Next con servidor, lo más limpio con Capacitor es
> cargar la URL desplegada (`server.url`) en vez de exportar estático.

---

## ✅ Checklist de publicación

**Android – descarga web (PWA)**
- [x] Manifest válido con iconos 192/512 + maskable.
- [x] Service worker con fetch handler (instalable).
- [x] HTTPS (Vercel).
- [x] Botón/flujo de instalación en la web.
- [ ] Probar «Instalar» en un Android real con Chrome.

**Google Play (opcional)**
- [ ] Generar AAB con PWABuilder (TWA) o Capacitor.
- [ ] Subir `assetlinks.json` a `/.well-known/`.
- [ ] Firmar el binario.
- [ ] Crear ficha en Play Console y publicar.

**iOS – PWA**
- [x] Meta tags Apple + `apple-touch-icon` PNG.
- [x] `display: standalone` + status bar translucent.
- [x] Modal con pasos de Safari (detección de iPhone/iPad).
- [ ] Probar «Agregar a pantalla de inicio» en un iPhone real.

**App Store / TestFlight (opcional)**
- [ ] Envolver con Capacitor (`@capacitor/ios`) apuntando a la URL desplegada.
- [ ] Cuenta Apple Developer (USD 99/año).
- [ ] Subir build a App Store Connect → TestFlight → revisión.

---

## Regenerar los iconos
Si cambia el logo:
```bash
npm i -D @napi-rs/canvas
node scripts/gen-icons.mjs
npm uninstall @napi-rs/canvas
```
