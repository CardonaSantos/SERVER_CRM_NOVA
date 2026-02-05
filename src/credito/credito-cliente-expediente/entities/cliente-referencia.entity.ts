export class ClienteReferencia {
  private constructor(
    private readonly id: number | null,
    private readonly expedienteId: number | null,

    private readonly nombre: string,
    private readonly telefono: string,
    private readonly relacion: string,
  ) {}

  static crear(params: {
    expedienteId: number;
    nombre: string;
    telefono: string;
    relacion: string;
  }): ClienteReferencia {
    if (!params.nombre || !params.telefono) {
      throw new Error('Referencia inválida');
    }

    return new ClienteReferencia(
      null,
      params.expedienteId,
      params.nombre,
      params.telefono,
      params.relacion,
    );
  }

  static rehidratar(props: {
    id: number;

    expedienteId: number;
    nombre: string;
    telefono: string;
    relacion: string;
  }): ClienteReferencia {
    return new ClienteReferencia(
      props.id,
      props.expedienteId,
      props.nombre,
      props.telefono,
      props.relacion,
    );
  }

  getId() {
    return this.id;
  }

  getExpedienteId() {
    return this.expedienteId;
  }

  getNombre() {
    return this.nombre;
  }
  getTelefono() {
    return this.telefono;
  }
  getRelacion() {
    return this.relacion;
  }
}
