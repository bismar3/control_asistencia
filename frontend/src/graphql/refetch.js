/** Consultas activas que deben refrescarse después de modificar una asistencia. */
export const ATTENDANCE_REFETCH = ['AsistenciasPorClase', 'ReporteGeneral', 'ClasesModulo', 'HistorialActividades']

/** Consultas que dependen de la lista de estudiantes del módulo activo. */
export const STUDENTS_REFETCH = ['EstudiantesModuloActivo', 'ReporteGeneral', 'ModuloActivo']

/** Consultas que dependen del calendario de clases. */
export const SCHEDULE_REFETCH = ['ClasesModulo', 'ReporteGeneral', 'ModuloActivo']
