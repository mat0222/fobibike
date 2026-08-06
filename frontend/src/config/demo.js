/** Activo en builds de GitHub Pages (`VITE_DEMO_MODE=true`). */
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_USER = { usuario: 'visitante' };

export const DEMO_MESSAGE = {
  title: 'Datos no visibles en esta demo',
  body: 'Esta es una vista previa de la estructura del panel de FOBI Bike. El inventario, ventas e información del local están ocultos por privacidad.',
};

/** Rutas de archivos públicos (respetan el base de GitHub Pages). */
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL || '/';
  const clean = String(path).replace(/^\//, '');
  return `${base}${clean}`;
}
