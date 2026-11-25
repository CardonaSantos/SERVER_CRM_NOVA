import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type GenerarKeyMediaParams = {
  empresaId: number;
  clienteId?: number;
  albumId?: number;
  /** 'IMAGEN' | 'VIDEO' | … decide la carpeta automática. */
  tipo?: string;
  /** Con punto: ".webp", ".jpg". */
  extension: string;
  /** "crm", "usuarios", "pos/clientes"… */
  basePrefix?: string;
  /** Si viene, reemplaza la carpeta automática derivada de `tipo`. */
  subfolder?: string;
  /** Instante de la subida (del RELOJ); da la parte YYYY/MM/DD (UTC). */
  fecha: Date;
};

/**
 * Genera la key (ruta) de un archivo en el almacenamiento y su extensión.
 * Formato histórico, sin cambios:
 *
 *   [basePrefix/]empresas/{id}/[clientes/{id}/][albums/{id}/]
 *   [subfolder/ | {imagenes|videos|audios|documentos|otros}/]
 *   YYYY/MM/DD/{uuid}{ext}
 */
@Injectable()
export class MediaKeyService {
  generarKey(p: GenerarKeyMediaParams): string {
    const yyyy = p.fecha.getUTCFullYear();
    const mm = String(p.fecha.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(p.fecha.getUTCDate()).padStart(2, '0');

    const root = p.basePrefix ? `${sanitizarPrefijo(p.basePrefix)}/` : '';
    const empresa = `empresas/${p.empresaId}/`;
    const cliente = p.clienteId ? `clientes/${p.clienteId}/` : '';
    const album = p.albumId ? `albums/${p.albumId}/` : '';
    const subfolder = sanitizarSubcarpeta(p.subfolder);

    // Con subfolder el llamador controla la ruta: no se agrega la carpeta del tipo.
    const tipoSeg = !subfolder && p.tipo ? `${carpetaDeTipo(p.tipo)}/` : '';

    return (
      `${root}${empresa}${cliente}${album}${subfolder}${tipoSeg}` +
      `${yyyy}/${mm}/${dd}/${randomUUID()}${p.extension}`
    );
  }

  /** ".jpeg" desde "image/jpeg"; si no, la del nombre; si no, ".bin". */
  inferirExtension(mime: string, fileName?: string): string {
    const porMime = mime.split('/')[1]?.split('+')[0];
    const porNombre = fileName?.split('.').pop();
    const ext = (porMime || porNombre || 'bin').toLowerCase();

    return ext.startsWith('.') ? ext : `.${ext}`;
  }
}

function sanitizarPrefijo(valor: string): string {
  return valor.replace(/(\.\.|^[/\\]+|[/\\]+$)/g, '').replace(/\s+/g, '-');
}

function carpetaDeTipo(tipo: string): string {
  switch (tipo) {
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

function sanitizarSubcarpeta(valor?: string): string {
  if (!valor) return '';

  const segmentos = valor
    .split(/[\\/]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== '.' && s !== '..')
    .map((s) =>
      s
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-'),
    )
    .filter(Boolean);

  return segmentos.length ? `${segmentos.join('/')}/` : '';
}
