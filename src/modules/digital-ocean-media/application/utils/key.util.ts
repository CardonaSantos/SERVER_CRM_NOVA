import { randomUUID } from 'crypto';

function sanitizePrefix(s: string) {
  return s.replace(/(\.\.|^[\/\\]+|[\/\\]+$)/g, '').replace(/\s+/g, '-');
}

export function inferExtension(mime: string, fileName?: string) {
  const byMime = mime.split('/')[1]?.split('+')[0];
  const byName = fileName?.split('.').pop();
  const ext = (byMime || byName || 'bin').toLowerCase();
  return ext.startsWith('.') ? ext : `.${ext}`;
}

export function folderFromTipo(t?: string) {
  switch (t) {
    case 'IMAGEN':
      return 'imagenes';
    case 'VIDEO':
      return 'videos';
    case 'AUDIO':
      return 'audios';
    case 'DOCUMENTO':
    case 'DOCUMENT':
      return 'documentos';
    default:
      return 'otros';
  }
}

export function generarKey(p: {
  empresaId: number;
  clienteId?: number;
  albumId?: number;
  tipo?: string; // 'IMAGEN' | 'VIDEO' | ...
  extension: string; // ".webp", ".jpg", ...
  basePrefix?: string; // "crm", "pos/clientes", ...

  /**
   * Si viene informado, reemplaza la carpeta automática
   * derivada de `tipo`.
   */
  subfolder?: string;
}) {
  const now = new Date();

  const yyyy = now.getUTCFullYear();

  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');

  const dd = String(now.getUTCDate()).padStart(2, '0');

  const uuid = randomUUID();

  const root = p.basePrefix ? `${sanitizePrefix(p.basePrefix)}/` : '';

  const empresa = `empresas/${p.empresaId}/`;

  const cliente = p.clienteId ? `clientes/${p.clienteId}/` : '';

  const album = p.albumId ? `albums/${p.albumId}/` : '';

  const subfolder = sanitizeSubfolder(p.subfolder);

  /*
   * IMPORTANTE:
   *
   * - Sin subfolder:
   *   comportamiento histórico.
   *
   * - Con subfolder:
   *   el caller controla esta parte semántica y no
   *   agregamos `imagenes/`, `videos/`, etc.
   */
  const tipoSeg = !subfolder && p.tipo ? `${folderFromTipo(p.tipo)}/` : '';

  return (
    `${root}` +
    `${empresa}` +
    `${cliente}` +
    `${album}` +
    `${subfolder}` +
    `${tipoSeg}` +
    `${yyyy}/${mm}/${dd}/` +
    `${uuid}${p.extension}`
  );
}

// nuevo helper para firmas
function sanitizeSubfolder(value?: string): string {
  if (!value) {
    return '';
  }

  const segments = value
    .split(/[\\/]+/)
    .map((segment) => segment.trim())
    .filter(
      (segment) => segment.length > 0 && segment !== '.' && segment !== '..',
    )
    .map((segment) =>
      segment
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-'),
    )
    .filter(Boolean);

  if (segments.length === 0) {
    return '';
  }

  return `${segments.join('/')}/`;
}
