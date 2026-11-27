/** Orígenes web que pueden llamar a la API y abrir sockets. */
export const ORIGENES_PERMITIDOS: ReadonlySet<string> = new Set<string>([
  'http://localhost:5173',
  'http://localhost:8081',
  'https://nova-crm-server-test-ui-production.up.railway.app',
  'https://pos-crm-nova.up.railway.app',
]);

/**
 * Callback de CORS compartido por HTTP y Socket.IO. Sin `Origin` (app móvil,
 * otro servidor) se permite: CORS solo protege a los navegadores.
 */
export function validarOrigen(
  origin: string | undefined,
  cb: (error: Error | null, permitido?: boolean) => void,
): void {
  cb(null, !origin || ORIGENES_PERMITIDOS.has(origin));
}
