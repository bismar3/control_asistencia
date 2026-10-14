import { createBrowserRouter } from 'react-router'
import RootLayout from './components/layout/RootLayout'
import RouteError from './components/layout/RouteError'
import FullScreenLoader from './components/layout/FullScreenLoader'
import RequireRole, { HomeRedirect } from './components/layout/RequireRole'

/* Cada página se descarga solo cuando se visita: el estudiante nunca carga el código del panel admin. */
const lazyPage = (load) => async () => ({ Component: (await load()).default })

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: FullScreenLoader,
    children: [
      { index: true, Component: HomeRedirect },
      {
        path: 'login',
        lazy: lazyPage(() => import('./pages/login/LoginPage')),
        handle: { title: 'Iniciar sesión' },
      },
      {
        path: 'estudiante',
        element: <RequireRole role="ESTUDIANTE" />,
        children: [
          {
            lazy: lazyPage(() => import('./components/layout/student/StudentLayout')),
            children: [
              { index: true, lazy: lazyPage(() => import('./pages/student/StudentHome')), handle: { title: 'Inicio' } },
              {
                path: 'historial',
                lazy: lazyPage(() => import('./pages/student/StudentHistory')),
                handle: { title: 'Mi historial' },
              },
              {
                path: 'perfil',
                lazy: lazyPage(() => import('./pages/student/StudentProfile')),
                handle: { title: 'Mi perfil' },
              },
            ],
          },
        ],
      },
      {
        path: 'admin',
        element: <RequireRole role="ADMIN" />,
        children: [
          {
            lazy: lazyPage(() => import('./components/layout/admin/AdminLayout')),
            children: [
              {
                index: true,
                lazy: lazyPage(() => import('./pages/admin/dashboard/DashboardPage')),
                handle: { title: 'Panel general' },
              },
              {
                path: 'asistencias',
                lazy: lazyPage(() => import('./pages/admin/attendance/AttendancePage')),
                handle: { title: 'Asistencias' },
              },
              {
                path: 'estudiantes',
                lazy: lazyPage(() => import('./pages/admin/students/StudentsPage')),
                handle: { title: 'Estudiantes' },
              },
              {
                path: 'calendario',
                lazy: lazyPage(() => import('./pages/admin/schedule/SchedulePage')),
                handle: { title: 'Calendario' },
              },
              {
                path: 'actividad',
                lazy: lazyPage(() => import('./pages/admin/activity/ActivityPage')),
                handle: { title: 'Historial de actividad' },
              },
              {
                path: 'importar',
                lazy: lazyPage(() => import('./pages/admin/import/ImportPage')),
                handle: { title: 'Importar y módulos' },
              },
              {
                path: 'ajustes',
                lazy: lazyPage(() => import('./pages/admin/settings/SettingsPage')),
                handle: { title: 'Ajustes' },
              },
            ],
          },
        ],
      },
      {
        path: '*',
        lazy: lazyPage(() => import('./pages/NotFound')),
        handle: { title: 'Página no encontrada' },
      },
    ],
  },
])
