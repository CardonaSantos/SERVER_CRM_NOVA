export class ClienteReferencia {
  private constructor(
    private readonly id: number | null,
    private readonly nombre: string,
    private readonly telefono: string,
    private readonly relacion: string,
  ) {}

  static crear(params: {
    nombre: string;
    telefono: string;
    relacion: string;
  }): ClienteReferencia {
    if (!params.nombre || !params.telefono) {
      throw new Error('Referencia inválida');
    }

    return new ClienteReferencia(
      null,
      params.nombre,
      params.telefono,
      params.relacion,
    );
  }

  static rehidratar(props: {
    id: number;
    nombre: string;
    telefono: string;
    relacion: string;
  }): ClienteReferencia {
    return new ClienteReferencia(
      props.id,
      props.nombre,
      props.telefono,
      props.relacion,
    );
  }

  getId() {
    return this.id;
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
