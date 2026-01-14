import { ClienteArchivo } from './cliente-archivo.entity';
import { ClienteReferencia } from './cliente-referencia.entity';

export class ClienteExpediente {
  private readonly archivos: ClienteArchivo[] = [];
  private readonly referencias: ClienteReferencia[] = [];

  private constructor(
    private readonly id: number | null,
    private readonly clienteId: number,

    private fuenteIngresos?: string,
    private tieneDeudas?: boolean,
    private detalleDeudas?: string,
  ) {}

  // Factory
  static crear(params: {
    clienteId: number;
    fuenteIngresos?: string;
    tieneDeudas?: boolean;
    detalleDeudas?: string;
  }): ClienteExpediente {
    return new ClienteExpediente(
      null,
      params.clienteId,
      params.fuenteIngresos,
      params.tieneDeudas,
      params.detalleDeudas,
    );
  }

  // Rehidratación
  static rehidratar(props: {
    id: number;
    clienteId: number;
    fuenteIngresos?: string;
    tieneDeudas?: boolean;
    detalleDeudas?: string;
    archivos?: ClienteArchivo[];
    referencias?: ClienteReferencia[];
  }): ClienteExpediente {
    const expediente = new ClienteExpediente(
      props.id,
      props.clienteId,
      props.fuenteIngresos,
      props.tieneDeudas,
      props.detalleDeudas,
    );

    props.archivos?.forEach((a) => expediente.archivos.push(a));
    props.referencias?.forEach((r) => expediente.referencias.push(r));

    return expediente;
  }
  // Comportamiento
  agregarArchivo(archivo: ClienteArchivo) {
    this.archivos.push(archivo);
  }

  agregarReferencia(referencia: ClienteReferencia) {
    this.referencias.push(referencia);
  }

  // Getters
  getId() {
    return this.id;
  }
  getClienteId() {
    return this.clienteId;
  }
  getFuenteIngresos() {
    return this.fuenteIngresos;
  }
  getTieneDeudas() {
    return this.tieneDeudas;
  }
  getDetalleDeudas() {
    return this.detalleDeudas;
  }

  getArchivos() {
    return [...this.archivos];
  }
  getReferencias() {
    return [...this.referencias];
  }
}
