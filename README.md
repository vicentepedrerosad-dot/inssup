# INSSUP · Control Operacional de Telecomunicaciones

Plataforma web **ejecutiva y operacional** para **INSSUP**, empresa chilena de
telecomunicaciones dedicada a instalaciones, supervisión, mantenimiento, site
survey, enlaces MMOO, sitios celulares 2G/3G/4G/LTE y servicios de emergencia
24/7.

Reemplaza el control manual en Excel/WhatsApp por un sistema moderno donde
**gerencia, supervisores y cuadrillas** ven, registran y controlan el avance de
proyectos de telecomunicaciones a lo largo de Chile, desde Arica hasta
Magallanes.

> Aplicación web **responsive / PWA**: pensada primero para celular en terreno,
> impecable en tablet y desktop. La primera pantalla es el **dashboard
> operativo**, no una landing.

---

## ✨ Características principales

- **Dashboard ejecutivo** con mapa de Chile georreferenciado (Leaflet), 10 KPIs
  operacionales y financieros, panel de alertas en vivo y 7 gráficos.
- **Mapa operacional** con marcadores por estado: 🟢 terminado · 🟡 ejecución ·
  🔴 atrasado · ⚪ pendiente · 🔵 programado.
- **Gestión de proyectos**: lista, kanban por estado, ficha con resumen
  financiero, y crear/editar.
- **Gestión de sitios**: tabla avanzada ordenable, vista mapa, vista de
  programación (calendario) y ficha detallada con checklist, evidencias y
  actividad.
- **Cuadrillas y productividad**: ranking, índice compuesto, cumplimiento de
  fechas y alertas de bajo rendimiento.
- **Registro en terreno** mobile-first: cambio de estado, avance, horas,
  evidencia simulada, checklist, GPS simulado y reporte de bloqueos.
- **Clientes**, **finanzas operacionales** (con semáforo financiero por
  proyecto) y **reportes** con exportación CSV real y PDF simulado.
- **Roles simulados** (administrador, gerente, supervisor, jefe de cuadrilla,
  técnico, cliente externo) con navegación y permisos por rol.
- **Persistencia local** con `localStorage`: los cambios (avances, estados,
  proyectos nuevos) se conservan entre sesiones.

---

## 🧱 Stack técnico

| Capa            | Tecnología                                        |
| --------------- | ------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, Turbopack)            |
| Lenguaje        | **TypeScript**                                    |
| UI              | **Tailwind CSS v4** + componentes propios         |
| Iconos          | **lucide-react**                                  |
| Gráficos        | **Recharts**                                      |
| Mapa            | **Leaflet** + tiles CartoDB (carga diferida)      |
| Notificaciones  | **sonner** (toasts)                               |
| Estado / datos  | React Context + `localStorage` (mock/seed)        |

Arquitectura preparada para conectar luego con **Supabase / PostgreSQL** (los
datos mock están tipados y aislados en `src/lib/data`).

---

## 🚀 Cómo correr el proyecto

Requisitos: **Node.js 20.9+**.

```bash
# 1. Instalar dependencias
npm install

# 2. Entorno de desarrollo (http://localhost:3000)
npm run dev

# 3. Build de producción
npm run build
npm run start

# Calidad
npm run lint        # ESLint
npx tsc --noEmit    # Typecheck
```

La app arranca directamente en el **Dashboard Ejecutivo** con un dataset seed
realista ya cargado. No requiere backend ni variables de entorno.

---

## 👥 Usuarios y roles simulados

Cambia de usuario/rol con el **selector inferior del menú lateral**. Cada rol ve
una navegación y permisos distintos:

| Rol                | Usuario demo       | Alcance                              |
| ------------------ | ------------------ | ------------------------------------ |
| Administrador      | Joaquín Adille     | Acceso total                         |
| Gerente            | Antonio Adille     | Visión ejecutiva y financiera        |
| Supervisor         | Rodrigo Fuentes    | Proyectos y sitios a cargo           |
| Jefe de cuadrilla  | Jorge Cáceres      | Sitios de su cuadrilla + terreno     |
| Técnico            | Luis Marín         | Registro en terreno                  |
| Cliente externo    | Cristián Vera      | Solo sus proyectos (Entel)           |

En **Terreno**, el jefe/técnico ve automáticamente los sitios de su cuadrilla.

---

## 🗂️ Módulos implementados

1. **Dashboard Ejecutivo** — mapa, KPIs, alertas, gráficos y filtros.
2. **Proyectos** — lista, kanban, detalle, crear/editar, resumen financiero.
3. **Sitios** — tabla avanzada, mapa, calendario/programación, ficha detalle.
4. **Cuadrillas** — productividad, ranking, carga y alertas de rendimiento.
5. **Terreno** — interfaz mobile-first de registro y actualización.
6. **Clientes** — rollups por cliente, proyectos, ingresos y contactos.
7. **Finanzas** — ingresos, costos, márgenes, semáforo financiero, facturación.
8. **Reportes** — 6 reportes con exportación CSV real / PDF simulada.

### Filtros y funcionalidades transversales

Búsqueda, filtros combinables (cliente, región, proyecto, estado, cuadrilla,
tipo, fechas), ordenamiento de tablas, estados vacíos, toasts, drawers/modales,
indicador automático de atraso (SLA) y modo mobile cuidado.

---

## 📊 Datos mock

Dataset generado de forma **determinística** (`src/lib/data/seed.ts`):

- **64 sitios** distribuidos en **14 regiones** de Chile con coordenadas reales
  aproximadas de ciudades.
- **12 proyectos** de 7 clientes (Entel, Movistar, WOM, ClaroVTR, Torres Chile,
  American Tower, Codelco Redes).
- **8 cuadrillas** con técnicos, especialidades y bases regionales.
- Mezcla realista de estados, con sitios atrasados, bloqueos y alertas.

---

## 🏗️ Arquitectura del código

```
src/
├── app/                      # Rutas (App Router)
│   ├── page.tsx              # Dashboard
│   ├── sitios/ proyectos/ …  # Módulos + rutas dinámicas [id]
│   ├── manifest.ts           # PWA
│   └── layout.tsx            # Shell + providers
├── components/
│   ├── ui/                   # Primitivos (Card, Table, Drawer, Badge, …)
│   ├── layout/               # Sidebar, Topbar, AppShell, nav
│   ├── charts/ map/ site/ …  # Componentes de dominio
├── lib/
│   ├── types.ts              # Modelo de dominio
│   ├── data/                 # Seed, entidades, geografía (aislado)
│   ├── kpi.ts                # Cálculos de KPIs, alertas, rollups
│   ├── status.ts             # Etiquetas y colores de estado
│   ├── filters.ts            # Filtros de sitios
│   ├── store.tsx             # Store (Context + localStorage)
│   └── utils.ts / export.ts  # Helpers y exportación CSV
```

---

## 📱 PWA

Incluye `manifest.webmanifest`, iconos, `theme-color` y meta mobile. Es
instalable en el celular (Añadir a pantalla de inicio) y funciona como app
independiente.

---

## 🛣️ Roadmap futuro

- Autenticación real y control de acceso por rol.
- Backend con **Supabase / PostgreSQL** (esquema ya modelado en tipos).
- Carga real de fotos y evidencias.
- GPS real desde el celular en terreno.
- **Modo offline** para terreno (sincronización diferida).
- Firma digital de recepción de sitios.
- Importación/exportación real con Excel/CSV.
- Integración con ERP / facturación.
- Notificaciones por WhatsApp / email.
- App nativa (React Native / Flutter) si el cliente lo requiere.
- Panel dedicado para clientes externos.
- **IA** para predicción de atrasos y resumen ejecutivo automático.

---

_Demo construida como propuesta de plataforma operacional para INSSUP._
