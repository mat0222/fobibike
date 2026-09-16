/** Activo en builds de GitHub Pages (`VITE_DEMO_MODE=true`). */
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_USER = { usuario: 'visitante' };

export const DEMO_MESSAGE = {
  title: 'Datos operativos reservados',
  body: 'Esta demostración muestra la estructura del panel. El inventario y las ventas del local permanecen ocultos. Facturación y reparaciones se pueden recorrer con datos de muestra.',
};

/** Rutas de archivos públicos (respetan el base de GitHub Pages). */
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL || '/';
  const clean = String(path).replace(/^\//, '');
  return `${base}${clean}`;
}
