import {
  ESTADOS_RUTA_ABIERTA,
  EstadoRutaCobro,
} from '../enums/estado-ruta-cobro.enum';
import {
  RutaCobroCerradaError,
  RutaCobroClienteAjenoError,
  RutaCobroEliminadaError,
  RutaCobroInvalidaError,
} from '../errors/ruta-cobro.errors';
import {
  CrearRutaCobroProps,
  EditarRutaCobroProps,
  RutaCobroProps,
} from '../props/ruta-cobro.props';

const LARGO_NOMBRE = 200;
const LARGO_OBSERVACIONES = 2000;

export class RutaCobroEntity {
  private constructor(private props: RutaCobroProps) {}

  static create(input: CrearRutaCobroProps, ahora: Date): RutaCobroEntity {
    return new RutaCobroEntity({
      id: null,
      empresaId: input.empresaId,
      nombre: nombreValido(input.nombre),
      cobradorId: input.cobradorId ?? null,
      estado: EstadoRutaCobro.ASIGNADA,
      observaciones: observacionesValidas(input.observaciones),
      clienteIds: clientesValidos(input.clienteIds),
      creadoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  /** No aplica reglas de captura: las rutas anteriores deben poder leerse. */
  static hydrate(props: RutaCobroProps): RutaCobroEntity {
    if (props.id !== null && (!Number.isInteger(props.id) || props.id <= 0)) {
      throw new RutaCobroInvalidaError('La ruta no es válida.');
    }
    return new RutaCobroEntity({
      ...props,
      clienteIds: [...props.clienteIds],
    });
  }

  /** Solo se validan y cambian los datos que llegan. Permite reabrir. */
  editar(cambios: EditarRutaCobroProps, fecha: Date): void {
    this.asegurarActiva();

    const { nombre, cobradorId, observaciones, estado, clienteIds } = cambios;

    this.props = {
      ...this.props,
      ...(nombre !== undefined && { nombre: nombreValido(nombre) }),
      ...(cobradorId !== undefined && { cobradorId }),
      ...(observaciones !== undefined && {
        observaciones: observacionesValidas(observaciones),
      }),
      ...(estado !== undefined && { estado }),
      ...(clienteIds !== undefined && {
        clienteIds: clientesValidos(clienteIds),
      }),
      actualizadoEn: new Date(fecha),
    };
  }

  cerrar(fecha: Date): void {
    this.asegurarActiva();
    this.asegurarAbierta();

    this.props.estado = EstadoRutaCobro.CERRADO;
    this.props.actualizadoEn = new Date(fecha);
  }

  /** Borrado lógico: la ruta y los pagos cobrados en ella se conservan. */
  eliminar(usuarioId: number, fecha: Date): void {
    this.asegurarActiva();

    this.props.eliminadoEn = new Date(fecha);
    this.props.eliminadoPorId = usuarioId;
    this.props.actualizadoEn = new Date(fecha);
  }

  /** En una ruta solo se cobra mientras está abierta y a sus clientes. */
  asegurarCobrable(clienteId: number): void {
    this.asegurarActiva();
    this.asegurarAbierta();
    if (!this.props.clienteIds.includes(clienteId)) {
      throw new RutaCobroClienteAjenoError();
    }
  }

  asegurarActiva(): void {
    if (this.isEliminada) throw new RutaCobroEliminadaError();
  }

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get cobradorId(): number | null {
    return this.props.cobradorId;
  }

  get isEliminada(): boolean {
    return this.props.eliminadoEn !== null;
  }

  toPrimitives(): RutaCobroProps {
    return {
      ...this.props,
      clienteIds: [...this.props.clienteIds],
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
      eliminadoEn: this.props.eliminadoEn && new Date(this.props.eliminadoEn),
    };
  }

  private asegurarAbierta(): void {
    if (!ESTADOS_RUTA_ABIERTA.includes(this.props.estado)) {
      throw new RutaCobroCerradaError();
    }
  }
}

function nombreValido(valor: string): string {
  const nombre = valor.trim();
  if (!nombre) {
    throw new RutaCobroInvalidaError('El nombre de la ruta es requerido.');
  }
  if (nombre.length > LARGO_NOMBRE) {
    throw new RutaCobroInvalidaError(
      `El nombre de la ruta no puede superar ${LARGO_NOMBRE} caracteres.`,
    );
  }
  return nombre;
}

function observacionesValidas(valor?: string | null): string | null {
  const texto = valor?.trim() ?? '';
  if (texto.length > LARGO_OBSERVACIONES) {
    throw new RutaCobroInvalidaError(
      `Las observaciones no pueden superar ${LARGO_OBSERVACIONES} caracteres.`,
    );
  }
  return texto || null;
}

/** Sin repetidos. Una ruta nueva o editada conserva al menos un cliente. */
function clientesValidos(ids: number[]): number[] {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) {
    throw new RutaCobroInvalidaError('La ruta necesita al menos un cliente.');
  }
  if (!unicos.every((id) => Number.isInteger(id) && id > 0)) {
    throw new RutaCobroInvalidaError('La lista de clientes no es válida.');
  }
  return unicos;
}
