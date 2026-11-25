import { EstadoPasoPppoe, TipoPasoPppoe } from '../enums/pppoe-operacion.enum';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
} from '../errors/pppoe-operacion.errors';
import { verificarConsistenciaPaso } from '../policies/consistencia-pppoe-operacion.policy';
import {
  clonarFecha,
  codigoError,
  codigoErrorObligatorio,
  duracionOpcional,
  enteroPositivo,
  fechaOpcional,
  fechaValida,
  textoTecnico,
  textoTecnicoObligatorio,
  valorDeEnum,
} from '../policies/normalizacion-pppoe-operacion.policy';
import {
  CrearPppoeOperacionPasoProps,
  PppoeOperacionPasoProps,
} from '../props/pppoe-operacion-paso.props';

export type IniciarPppoeOperacionPasoInput = {
  /** Sin contraseñas ni secretos; igual se redacta por defensa. */
  comandoSanitizado?: string | null;
  fecha: Date;
};

export type CompletarPppoeOperacionPasoInput = {
  respuestaSanitizada?: string | null;
  fecha: Date;
};

export type FallarPppoeOperacionPasoInput = {
  /** Código técnico estable, apto para filtros (SSH_TIMEOUT, SECRET_CONFLICT…). */
  errorCodigo: string;
  errorMensaje: string;
  respuestaSanitizada?: string | null;
  fecha: Date;
};

export type OmitirPppoeOperacionPasoInput = {
  motivo?: string | null;
  fecha: Date;
};

/**
 * Una acción técnica dentro de una operación (conectar, buscar, agregar,
 * confirmar el secret…).
 *
 * PENDIENTE → EJECUTANDO → EXITOSO | FALLIDO, o PENDIENTE → OMITIDO cuando la
 * acción ya no hace falta (p. ej. el secret ya existe y coincide).
 */
export class PppoeOperacionPasoEntity {
  private constructor(private props: PppoeOperacionPasoProps) {}

  static create(
    input: CrearPppoeOperacionPasoProps,
    ahora: Date,
  ): PppoeOperacionPasoEntity {
    const creadoEn = fechaValida(ahora, 'ahora');
    return new PppoeOperacionPasoEntity({
      id: null,
      operacionId: enteroPositivo(input.operacionId, 'operacionId'),
      tipo: valorDeEnum(input.tipo, TipoPasoPppoe, 'tipo'),
      orden: enteroPositivo(input.orden, 'orden'),
      estado: EstadoPasoPppoe.PENDIENTE,
      comandoSanitizado: null,
      respuestaSanitizada: null,
      errorCodigo: null,
      errorMensaje: null,
      iniciadoEn: null,
      finalizadoEn: null,
      duracionMs: null,
      creadoEn,
      actualizadoEn: new Date(creadoEn.getTime()),
    });
  }

  static hydrate(p: PppoeOperacionPasoProps): PppoeOperacionPasoEntity {
    if (p.id === null) {
      throw new Error('No se puede hidratar un paso PPPoE sin id.');
    }

    const props: PppoeOperacionPasoProps = {
      id: enteroPositivo(p.id, 'id'),
      operacionId: enteroPositivo(p.operacionId, 'operacionId'),
      tipo: valorDeEnum(p.tipo, TipoPasoPppoe, 'tipo'),
      orden: enteroPositivo(p.orden, 'orden'),
      estado: valorDeEnum(p.estado, EstadoPasoPppoe, 'estado'),
      comandoSanitizado: textoTecnico(p.comandoSanitizado, 'comandoSanitizado'),
      respuestaSanitizada: textoTecnico(
        p.respuestaSanitizada,
        'respuestaSanitizada',
      ),
      errorCodigo: codigoError(p.errorCodigo),
      errorMensaje: textoTecnico(p.errorMensaje, 'errorMensaje'),
      iniciadoEn: fechaOpcional(p.iniciadoEn, 'iniciadoEn'),
      finalizadoEn: fechaOpcional(p.finalizadoEn, 'finalizadoEn'),
      duracionMs: duracionOpcional(p.duracionMs),
      creadoEn: fechaValida(p.creadoEn, 'creadoEn'),
      actualizadoEn: fechaValida(p.actualizadoEn, 'actualizadoEn'),
    };

    verificarConsistenciaPaso(props);
    return new PppoeOperacionPasoEntity(props);
  }

  iniciar(input: IniciarPppoeOperacionPasoInput): void {
    this.exigirEstado(
      EstadoPasoPppoe.PENDIENTE,
      'Solo un paso PENDIENTE puede comenzar su ejecución.',
    );
    const fecha = this.fechaDesdeCreacion(input.fecha, 'fecha de inicio');

    this.props.estado = EstadoPasoPppoe.EJECUTANDO;
    this.props.comandoSanitizado = textoTecnico(
      input.comandoSanitizado,
      'comandoSanitizado',
    );
    this.props.respuestaSanitizada = null;
    this.props.errorCodigo = null;
    this.props.errorMensaje = null;
    this.props.iniciadoEn = fecha;
    this.props.finalizadoEn = null;
    this.props.duracionMs = null;
    this.tocar(fecha);
  }

  marcarExitoso(input: CompletarPppoeOperacionPasoInput): void {
    this.exigirEstado(
      EstadoPasoPppoe.EJECUTANDO,
      'Solo un paso EJECUTANDO puede marcarse como EXITOSO.',
    );
    const fecha = this.fechaDesdeInicio(input.fecha);

    this.props.estado = EstadoPasoPppoe.EXITOSO;
    this.props.respuestaSanitizada = textoTecnico(
      input.respuestaSanitizada,
      'respuestaSanitizada',
    );
    this.props.errorCodigo = null;
    this.props.errorMensaje = null;
    this.terminar(fecha);
  }

  marcarFallido(input: FallarPppoeOperacionPasoInput): void {
    this.exigirEstado(
      EstadoPasoPppoe.EJECUTANDO,
      'Solo un paso EJECUTANDO puede marcarse como FALLIDO.',
    );
    const errorCodigo = codigoErrorObligatorio(input.errorCodigo);
    const errorMensaje = textoTecnicoObligatorio(
      input.errorMensaje,
      'errorMensaje',
    );
    const fecha = this.fechaDesdeInicio(input.fecha);

    this.props.estado = EstadoPasoPppoe.FALLIDO;
    this.props.respuestaSanitizada = textoTecnico(
      input.respuestaSanitizada,
      'respuestaSanitizada',
    );
    this.props.errorCodigo = errorCodigo;
    this.props.errorMensaje = errorMensaje;
    this.terminar(fecha);
  }

  /** El motivo queda en respuestaSanitizada; un paso omitido nunca se inició. */
  omitir(input: OmitirPppoeOperacionPasoInput): void {
    this.exigirEstado(
      EstadoPasoPppoe.PENDIENTE,
      'Solo un paso PENDIENTE puede marcarse como OMITIDO.',
    );
    const fecha = this.fechaDesdeCreacion(input.fecha, 'fecha de omisión');

    this.props.estado = EstadoPasoPppoe.OMITIDO;
    this.props.respuestaSanitizada = textoTecnico(
      input.motivo,
      'motivo de omisión',
    );
    this.props.errorCodigo = null;
    this.props.errorMensaje = null;
    this.props.iniciadoEn = null;
    this.props.finalizadoEn = fecha;
    this.props.duracionMs = 0;
    this.tocar(fecha);
  }

  estaPendiente(): boolean {
    return this.props.estado === EstadoPasoPppoe.PENDIENTE;
  }

  estaEjecutando(): boolean {
    return this.props.estado === EstadoPasoPppoe.EJECUTANDO;
  }

  fueExitoso(): boolean {
    return this.props.estado === EstadoPasoPppoe.EXITOSO;
  }

  fueFallido(): boolean {
    return this.props.estado === EstadoPasoPppoe.FALLIDO;
  }

  fueOmitido(): boolean {
    return this.props.estado === EstadoPasoPppoe.OMITIDO;
  }

  esTerminal(): boolean {
    return [
      EstadoPasoPppoe.EXITOSO,
      EstadoPasoPppoe.FALLIDO,
      EstadoPasoPppoe.OMITIDO,
    ].includes(this.props.estado);
  }

  get id(): number | null {
    return this.props.id;
  }

  get operacionId(): number {
    return this.props.operacionId;
  }

  get tipo(): TipoPasoPppoe {
    return this.props.tipo;
  }

  get orden(): number {
    return this.props.orden;
  }

  get estado(): EstadoPasoPppoe {
    return this.props.estado;
  }

  get iniciadoEn(): Date | null {
    return clonarFecha(this.props.iniciadoEn);
  }

  get finalizadoEn(): Date | null {
    return clonarFecha(this.props.finalizadoEn);
  }

  get duracionMs(): number | null {
    return this.props.duracionMs;
  }

  toPrimitives(): PppoeOperacionPasoProps {
    return {
      ...this.props,
      iniciadoEn: clonarFecha(this.props.iniciadoEn),
      finalizadoEn: clonarFecha(this.props.finalizadoEn),
      creadoEn: new Date(this.props.creadoEn.getTime()),
      actualizadoEn: new Date(this.props.actualizadoEn.getTime()),
    };
  }

  private terminar(fecha: Date): void {
    this.props.finalizadoEn = fecha;
    this.props.duracionMs = fecha.getTime() - this.props.iniciadoEn!.getTime();
    this.tocar(fecha);
  }

  private exigirEstado(esperado: EstadoPasoPppoe, mensaje: string): void {
    if (this.props.estado !== esperado) {
      throw new OperacionPppoeEstadoInvalidoError(
        `${mensaje} Estado actual: ${this.props.estado}.`,
      );
    }
  }

  private fechaDesdeCreacion(valor: Date, campo: string): Date {
    const fecha = fechaValida(valor, campo);
    if (fecha.getTime() < this.props.creadoEn.getTime()) {
      throw new OperacionPppoeDatosInvalidosError(
        'La fecha de la acción no puede ser anterior a creadoEn.',
      );
    }
    return fecha;
  }

  /** Solo se llama en EJECUTANDO, que siempre tiene iniciadoEn. */
  private fechaDesdeInicio(valor: Date): Date {
    const fecha = fechaValida(valor, 'fecha de finalización');
    if (fecha.getTime() < this.props.iniciadoEn!.getTime()) {
      throw new OperacionPppoeDatosInvalidosError(
        'La fecha de finalización no puede ser anterior a iniciadoEn.',
      );
    }
    return fecha;
  }

  private tocar(fecha: Date): void {
    this.props.actualizadoEn = new Date(fecha.getTime());
  }
}
