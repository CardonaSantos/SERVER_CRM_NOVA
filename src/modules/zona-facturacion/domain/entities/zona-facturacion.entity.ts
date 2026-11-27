import {
  ZonaFacturacionEliminadaError,
  ZonaFacturacionInvalidaError,
} from '../errors/zona-facturacion.errors';
import {
  ConfigurarZonaFacturacionProps,
  CrearZonaFacturacionProps,
  ZonaFacturacionProps,
} from '../props/zona-facturacion.props';

const DIAS = {
  diaGeneracionFactura: 'El día de generación de factura',
  diaPago: 'El día de pago',
  diaRecordatorio: 'El día del primer recordatorio',
  diaSegundoRecordatorio: 'El día del segundo recordatorio',
  diaCorte: 'El día de corte',
} as const;

const MAXIMO_FACTURAS_PARA_SUSPENDER = 12;

export class ZonaFacturacionEntity {
  private constructor(private props: ZonaFacturacionProps) {}

  static create(
    input: CrearZonaFacturacionProps,
    ahora: Date,
  ): ZonaFacturacionEntity {
    const datos = normalizar(input);
    validar(datos);

    return new ZonaFacturacionEntity({
      ...input,
      ...datos,
      diaCorte: input.diaCorte ?? null,
      suspenderTrasFacturas: input.suspenderTrasFacturas ?? null,
      id: null,
      creadoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  /** No aplica reglas de captura: los registros anteriores deben poder leerse. */
  static hydrate(props: ZonaFacturacionProps): ZonaFacturacionEntity {
    if (props.id !== null && (!Number.isInteger(props.id) || props.id <= 0)) {
      throw new ZonaFacturacionInvalidaError('La zona no es válida.');
    }
    return new ZonaFacturacionEntity({ ...props });
  }

  /** Solo se validan los datos que cambian. */
  configurar(cambios: ConfigurarZonaFacturacionProps, fecha: Date): void {
    this.asegurarActiva();

    const datos = normalizar(sinIndefinidos(cambios));
    validar(datos);

    this.props = {
      ...this.props,
      ...datos,
      actualizadoEn: new Date(fecha),
    };
  }

  /** Borrado lógico. Que no tenga clientes ni facturas lo verifica el caso de uso. */
  eliminar(usuarioId: number, fecha: Date): void {
    this.asegurarActiva();

    this.props.eliminadoEn = new Date(fecha);
    this.props.eliminadoPorId = usuarioId;
    this.props.actualizadoEn = new Date(fecha);
  }

  asegurarActiva(): void {
    if (this.isEliminada) throw new ZonaFacturacionEliminadaError();
  }

  get id(): number | null {
    return this.props.id;
  }

  get isEliminada(): boolean {
    return this.props.eliminadoEn !== null;
  }

  toPrimitives(): ZonaFacturacionProps {
    return {
      ...this.props,
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
      eliminadoEn: this.props.eliminadoEn && new Date(this.props.eliminadoEn),
    };
  }
}

function sinIndefinidos<T extends object>(datos: T): T {
  return Object.fromEntries(
    Object.entries(datos).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function normalizar<T extends ConfigurarZonaFacturacionProps>(datos: T): T {
  return typeof datos.nombre === 'string'
    ? { ...datos, nombre: datos.nombre.trim() }
    : datos;
}

function validar(datos: ConfigurarZonaFacturacionProps): void {
  if (datos.nombre !== undefined && !datos.nombre) {
    throw new ZonaFacturacionInvalidaError(
      'El nombre de la zona es requerido.',
    );
  }

  for (const [campo, etiqueta] of Object.entries(DIAS)) {
    const dia = datos[campo as keyof typeof DIAS];
    if (dia === undefined || (dia === null && campo === 'diaCorte')) continue;

    if (!estaEntre(dia, 31)) {
      throw new ZonaFacturacionInvalidaError(
        `${etiqueta} debe estar entre 1 y 31.`,
      );
    }
  }

  const facturas = datos.suspenderTrasFacturas;
  if (
    facturas !== undefined &&
    facturas !== null &&
    !estaEntre(facturas, MAXIMO_FACTURAS_PARA_SUSPENDER)
  ) {
    throw new ZonaFacturacionInvalidaError(
      `Las facturas para suspender deben estar entre 1 y ${MAXIMO_FACTURAS_PARA_SUSPENDER}.`,
    );
  }
}

function estaEntre(valor: unknown, maximo: number): boolean {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= 1 &&
    valor <= maximo
  );
}
