# Control de Asistencia · Frontend

Interfaz web del **Sistema de Registro y Control de Asistencia**, desarrollada por el equipo **CODERS**.

- **React 19** + **Vite 8** (CSS Modules con Lightning CSS)
- **Apollo Client 4** conectado al endpoint **GraphQL** de Django (graphene-django)
- **React Router 8** con carga diferida por ruta: el estudiante nunca descarga el código del panel administrativo

## Requisitos

- Node.js **22.22 o superior** (lo exige React Router 8)
- El backend Django en ejecución (por defecto en `http://127.0.0.1:8000`)

## Puesta en marcha

```bash
# 1. Backend (en otra terminal)
cd backend
venv\Scripts\activate          # Windows
python manage.py runserver

# 2. Frontend
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

En desarrollo, Vite reenvía `/graphql/` al backend (proxy), así que no hay problemas de CORS.

**Probar desde el celular** (misma red Wi-Fi): `npm run dev -- --host` y abre la dirección *Network* que muestra Vite.
Como el frontend usa la ruta relativa `/graphql/`, el teléfono también llega al backend a través del proxy.

| Script            | Uso                                          |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga en vivo   |
| `npm run build`   | Compilación de producción en `dist/`         |
| `npm run preview` | Sirve `dist/` localmente (con el mismo proxy) |
| `npm run lint`    | ESLint (incluye las reglas del React Compiler) |

Variables opcionales (copia `.env.example` como `.env.local`):

| Variable            | Por defecto             | Descripción                                      |
| ------------------- | ----------------------- | ------------------------------------------------ |
| `VITE_BACKEND_URL`  | `http://127.0.0.1:8000` | Destino del proxy de desarrollo                  |
| `VITE_GRAPHQL_URL`  | `/graphql/`             | Endpoint que usa Apollo (en producción, la URL pública) |
| `VITE_APP_TIMEZONE` | `America/La_Paz`        | Debe coincidir con `TIME_ZONE` de Django          |

## Funcionalidades

**Estudiante** (diseño pensado primero para el teléfono)

- Ingreso con correo **o** número de registro (RF-01).
- Botón de marcado habilitado solo el día de clase; guarda la hora real del servidor (RF-03, RN-03, RN-04).
- Historial por mes con estado, hora de marca y resumen; las fechas pasadas sin marca figuran como *Falta* (RF-04, RF-05, RN-05).
- Si el administrador activa un módulo donde el estudiante ya no figura, su sesión se cierra automáticamente.

**Administrador**

- Panel general: asistencia global, avance del módulo, clase de hoy **en vivo**, estudiantes en riesgo y actividad reciente.
- Asistencias por fecha o en matriz general, con filtros por fecha, estudiante y estado, totales y cambios individuales o masivos.
  Cada cambio queda auditado con usuario, fecha, hora y valores anterior y nuevo (RF-06, RF-07, RF-08, RN-06, RN-07).
- Estudiantes: búsqueda, alta manual, edición, retiro del módulo y ficha con su asistencia fecha por fecha.
- Calendario mensual de clases: programar, editar o eliminar fechas.
- Historial de actividad con filtros por estudiante, fecha y tipo de acción (RF-09, RF-10).
- Importación desde Excel con plantillas descargables, validación, errores por fila y vista previa (RF-11, RF-12, RF-16).
- Asistente para activar un nuevo módulo con confirmación escrita; el módulo anterior se conserva (RF-13, RF-15, RN-01, RN-08).
- Exportación a Excel del módulo activo: resumen, detalle por fecha y clases (RF-17).
- Mensajes de confirmación y error en todas las acciones (RF-18), tema claro/oscuro y gestión de administradores.

## Estructura

```
src/
├── apollo/          Cliente Apollo (caché y políticas)
├── graphql/         Consultas, mutaciones y fragmentos (validados contra el esquema del backend)
├── context/         Sesión, tema y notificaciones
├── hooks/           useNow, useCountUp, useDebouncedValue…
├── lib/             Fechas con zona horaria, reglas de asistencia, Excel, errores
├── styles/          Tokens de diseño, base, animaciones y utilidades globales
├── components/
│   ├── ui/          Botones, campos, modales, control segmentado, medidores…
│   ├── charts/      Gráfico de asistencia por clase y barra de estados
│   ├── layout/      Layouts de estudiante y administrador, fondo aurora, guardas de rol
│   └── brand/       Logo e isotipo de CODERS
└── pages/           login · student · admin (dashboard, attendance, students, schedule, activity, import, settings)
```

## Sistema de diseño

- **Tokens** en `src/styles/tokens.css`: el tema claro se define en `:root` y el oscuro solo redefine los roles de color.
- **Materiales de vidrio** estilo iOS (`backdrop-filter` + borde especular) en barras, tarjetas, hojas y notificaciones.
- **CSS Modules** por componente. Lightning CSS aplana el anidamiento nativo, agrega prefijos (por ejemplo `-webkit-backdrop-filter` para Safari)
  y mantiene globales los `@keyframes` de `animations.css`.
- **Animaciones**: entradas escalonadas, control segmentado con indicador deslizante, notificaciones tipo *Dynamic Island*,
  cambio de tema con revelación circular (View Transitions) y botón de marcado con celebración. Todas respetan `prefers-reduced-motion`.
- **Estados de asistencia** siempre con ícono + texto; los colores de los gráficos se validaron para daltonismo y contraste en ambos temas.

## Notas de integración con el backend

- Los campos `id` llegan como `ID` (texto) y las mutaciones esperan `Int`: se convierten con `Number(id)`.
- Los campos `JSONString` (`asistenciasPorClase`, `datosPreview`, `detalles`) se interpretan con `parseJSON`.
- "Hoy" se calcula en la zona horaria del backend, no en la del navegador; las fechas `YYYY-MM-DD` se construyen sin desfase UTC.
- Los archivos Excel se envían como *data URL* en base64, que es lo que esperan las mutaciones de importación (solo `.xlsx`; openpyxl no lee `.xls`).

> **Seguridad:** el backend aún no valida sesiones ni roles en el servidor; cualquier cliente puede invocar mutaciones administrativas
> directamente en `/graphql/`. El frontend restringe la navegación por rol, pero para producción se recomienda autenticación con
> tokens (por ejemplo *django-graphql-jwt*) y verificar el rol en cada resolver.
