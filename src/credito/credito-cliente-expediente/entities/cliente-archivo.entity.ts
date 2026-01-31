import { TipoArchivoCliente } from '@prisma/client';

export class ClienteArchivo {
  private constructor(
    private readonly id: number | null,

    private readonly expedienteId: number | null,
    private readonly tipo: TipoArchivoCliente,
    private readonly url: string,
    private readonly descripcion?: string,

    // 👇 nuevos (storage)
    private readonly key?: string,
    private readonly bucket?: string,
    private readonly mimeType?: string,
    private readonly size?: number,

    // control
    private readonly estado: string = 'LISTO',
    private readonly eliminadoAt?: Date,
  ) {}

  // 👉 para archivos nuevos
  static crear(params: {
    expedienteId: number;
    tipo: TipoArchivoCliente;
    url: string;
    descripcion?: string;

    key?: string;
    bucket?: string;
    mimeType?: string;
    size?: number;
  }): ClienteArchivo {
    if (!params.url) {
      throw new Error('URL requerida');
    }

    return new ClienteArchivo(
      null,
      params.expedienteId,
      params.tipo,
      params.url,
      params.descripcion,

      params.key,
      params.bucket,
      params.mimeType,
      params.size,

      'LISTO',
      undefined,
    );
  }

  // 👉 para DB → dominio
  static rehidratar(props: {
    id: number;
    expedienteId: number;

    tipo: TipoArchivoCliente;
    url: string;
    descripcion?: string;

    key?: string;
    bucket?: string;
    mimeType?: string;
    size?: number;

    estado?: string;
    eliminadoAt?: Date;
  }): ClienteArchivo {
    return new ClienteArchivo(
      props.id,
      props.expedienteId,
      props.tipo,
      props.url,
      props.descripcion,

      props.key,
      props.bucket,
      props.mimeType,
      props.size,

      props.estado ?? 'LISTO',
      props.eliminadoAt,
    );
  }

  // ===== getters =====

  getId() {
    return this.id;
  }

  getExpedienteId() {
    return this.expedienteId;
  }

  getTipo() {
    return this.tipo;
  }

  getUrl() {
    return this.url;
  }

  getDescripcion() {
    return this.descripcion;
  }

  getStorageKey() {
    return this.key;
  }

  getBucket() {
    return this.bucket;
  }

  getMimeType() {
    return this.mimeType;
  }

  getSize() {
    return this.size;
  }

  getEstado() {
    return this.estado;
  }

  getEliminadoAt() {
    return this.eliminadoAt;
  }
}
