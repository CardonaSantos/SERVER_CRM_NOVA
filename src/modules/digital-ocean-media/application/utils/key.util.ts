// application/utils/key.util.ts
import { randomUUID } from 'crypto';

function sanitizePrefix(s: string) {
  return s.replace(/(\.\.|^[\/\\]+|[\/\\]+$)/g, '').replace(/\s+/g, '-');
}

export function inferExtension(mime: string, fileName?: string) {
  const byMime = mime.split('/')[1]?.split('+')[0]; // image/webp → webp
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
  const tipoSeg = p.tipo ? `${folderFromTipo(p.tipo)}/` : '';

  return `${root}${empresa}${cliente}${album}${tipoSeg}${yyyy}/${mm}/${dd}/${uuid}${p.extension}`;
}
