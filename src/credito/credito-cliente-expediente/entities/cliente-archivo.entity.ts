import { TipoArchivoCliente } from '@prisma/client';

export class ClienteArchivo {
  private constructor(
    private readonly id: number | null,
    private readonly expedienteId: number,
    private readonly tipo: TipoArchivoCliente,
    private readonly url: string,
    private readonly descripcion?: string,
  ) {}

  static crear(params: {
    expedienteId: number;
    tipo: TipoArchivoCliente;
    url: string;
    descripcion?: string;
  }): ClienteArchivo {
    return new ClienteArchivo(
      null,
      params.expedienteId,
      params.tipo,
      params.url,
      params.descripcion,
    );
  }

  static rehidratar(props: {
    id: number;
    expedienteId: number;
    tipo: TipoArchivoCliente;
    url: string;
    descripcion?: string;
  }): ClienteArchivo {
    return new ClienteArchivo(
      props.id,
      props.expedienteId,
      props.tipo,
      props.url,
      props.descripcion,
    );
  }

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
}
