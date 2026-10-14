/** Ruta de inicio según el rol de la sesión. */
export const homeFor = (rol) => (rol === 'ADMIN' ? '/admin' : '/estudiante')
