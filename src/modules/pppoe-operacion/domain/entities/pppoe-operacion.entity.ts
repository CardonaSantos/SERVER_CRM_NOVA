import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from '../enums/pppoe-operacion.enum';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
} from '../errors/pppoe-operacion.errors';
import {
  autorizacionValida,
  verificarConsistenciaOperacion,
  verificarFechasOperacion,
} from '../policies/consistencia-pppoe-operacion.policy';
import {
  clonarFecha,
  clonarResultado,
  codigoError,
  codigoErrorObligatorio,
  duracionOpcional,
  enteroPositivo,
  enteroPositivoOpcional,
  fechaOpcional,
  fechaValida,
  puertoRed,
  puertoRedOpcional,
  resultadoSeguro,
  textoObligatorio,
  textoOpcional,
  valorDeEnum,
} from '../policies/normalizacion-pppoe-operacion.policy';
import {
  CrearPppoeOperacionProps,
  PppoeOperacionProps,
  PppoeOperacionResultado,
} from '../props/pppoe-operacion.props';

const MAX_IDEMPOTENCIA = 200;
const MAX_USUARIO = 160;
const MAX_PERFIL = 160;
const MAX_HOST = 255;
const MAX_MOTIVO = 2_000;
const MAX_ERROR_MENSAJE = 4_000;

export type AutorizarPppoeOperacionInput = {
  reautenticadoPorId: number;
  fecha: Date;
};

/** La operación sigue PENDIENTE y puede volver a intentar autorizarse. */
export type RegistrarReautenticacionFallidaInput = {
  reautenticadoPorId: number;
  fecha: Date;
};

export type IniciarPppoeOperacionInput = {
  fecha: Date;
};

export type MarcarPppoeOperacionExitosaInput = {
  /** Resumen técnico; se rechaza si trae claves sensibles. */
  resultado?: PppoeOperacionResultado | null;
  fecha: Date;
};

export type MarcarPppoeOperacionConErrorInput = {
  errorCodigo: string;
  errorMensaje: string;
  resultado?: PppoeOperacionResultado | null;
  fecha: Date;
};

export type CancelarPppoeOperacionInput = {
  motivo: string;
  fecha: Date;
};

export type CrearReintentoPppoeOperacionInput = {
  fecha: Date;
  /** Clave nueva: la del intento anterior ya está usada. */
  claveIdempotencia: string;
  /** Explícito para no atribuir el reintento al operador anterior. */
  iniciadoPorId: number | null;
  origen?: OrigenOperacionPppoe;
  canal?: CanalOperacionPppoe;
  requiereReautenticacion?: boolean;
  motivo?: string | null;
  /** Si se omite, se conserva el del intento anterior. */
  perfilHomologacionId?: number | null;
  codigoPerfilSnapshot?: string | null;
  /** El router pudo corregirse o sustituirse desde el intento anterior. */
  mikrotikRouterId: number;
  routerHostSnapshot: string;
  routerPuertoSnapshot: number;
};

export type PppoeOperacionCreatePrimitives = Omit<PppoeOperacionProps, 'id'>;

export type PppoeOperacionPersistedPrimitives = PppoeOperacionProps & {
  id: number;
};

/**
 * Un intento completo contra MikroTik (crear, activar, suspender o eliminar
 * el secret). Sus pasos son `PppoeOperacionPasoEntity`.
 *
 * Con reautenticación: PENDIENTE → AUTORIZADA → EJECUTANDO → EXITOSA | PARCIAL | FALLIDA.
 * Sin reautenticación: PENDIENTE → EJECUTANDO → …
 * PENDIENTE y AUTORIZADA pueden cancelarse.
 */
export class PppoeOperacionEntity {
  private constructor(private props: PppoeOperacionProps) {}

  static create(
    input: CrearPppoeOperacionProps,
    ahora: Date,
  ): PppoeOperacionEntity {
    const props = PppoeOperacionEntity.normalizar({
      id: null,
      empresaId: input.empresaId,
      cuentaPppoeId: input.cuentaPppoeId,
      mikrotikRouterId: input.mikrotikRouterId,
      perfilHomologacionId: input.perfilHomologacionId ?? null,
      instalacionId: input.instalacionId ?? null,
      desinstalacionId: input.desinstalacionId ?? null,
      reintentoDeId: input.reintentoDeId ?? null,
      numeroIntento: input.numeroIntento ?? 1,
      claveIdempotencia: input.claveIdempotencia,
      tipo: input.tipo,
      origen: input.origen,
      canal: input.canal ?? CanalOperacionPppoe.SSH,
      estado: EstadoOperacionPppoe.PENDIENTE,
      iniciadoPorId: input.iniciadoPorId ?? null,
      reautenticadoPorId: null,
      requiereReautenticacion: input.requiereReautenticacion ?? false,
      reautenticacionExitosa: null,
      reautenticadoEn: null,
      usuarioPppoeSnapshot: input.usuarioPppoeSnapshot,
      codigoPerfilSnapshot: input.codigoPerfilSnapshot ?? null,
      routerHostSnapshot: textoObligatorio(
        input.routerHostSnapshot,
        'routerHostSnapshot',
        MAX_HOST,
      ),
      routerPuertoSnapshot: puertoRed(
        input.routerPuertoSnapshot,
        'routerPuertoSnapshot',
      ),
      motivo: input.motivo ?? null,
      resultado: null,
      errorCodigo: null,
      errorMensaje: null,
      iniciadoEn: null,
      finalizadoEn: null,
      canceladoEn: null,
      duracionMs: null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    verificarConsistenciaOperacion(props);
    return new PppoeOperacionEntity(props);
  }

  static hydrate(input: PppoeOperacionProps): PppoeOperacionEntity {
    if (input.id === null) {
      throw new Error('No se puede hidratar una operación PPPoE sin id.');
    }

    const props = PppoeOperacionEntity.normalizar(input);
    verificarConsistenciaOperacion(props);
    verificarFechasOperacion(props);
    return new PppoeOperacionEntity(props);
  }

  /** PENDIENTE → AUTORIZADA, solo si la operación pide reautenticación. */
  autorizar(input: AutorizarPppoeOperacionInput): void {
    this.exigirEstado(
      EstadoOperacionPppoe.PENDIENTE,
      'Solo una operación PENDIENTE puede autorizarse.',
    );
    if (!this.props.requiereReautenticacion) {
      throw new OperacionPppoeEstadoInvalidoError(
        'Esta operación no requiere reautenticación y no debe pasar por AUTORIZADA.',
      );
    }

    const reautenticadoPorId = enteroPositivo(
      input.reautenticadoPorId,
      'reautenticadoPorId',
    );
    const fecha = this.fechaDesdeCreacion(input.fecha, 'fecha de autorización');

    this.props.estado = EstadoOperacionPppoe.AUTORIZADA;
    this.props.reautenticadoPorId = reautenticadoPorId;
    this.props.reautenticacionExitosa = true;
    this.props.reautenticadoEn = fecha;
    this.tocar(fecha);
  }

  registrarReautenticacionFallida(
    input: RegistrarReautenticacionFallidaInput,
  ): void {
    this.exigirEstado(
      EstadoOperacionPppoe.PENDIENTE,
      'Solo una operación PENDIENTE puede registrar una reautenticación fallida.',
    );
    if (!this.props.requiereReautenticacion) {
      throw new OperacionPppoeEstadoInvalidoError(
        'Esta operación no requiere reautenticación.',
      );
    }

    const reautenticadoPorId = enteroPositivo(
      input.reautenticadoPorId,
      'reautenticadoPorId',
    );
    const fecha = this.fechaDesdeCreacion(
      input.fecha,
      'fecha de reautenticación',
    );

    this.props.reautenticadoPorId = reautenticadoPorId;
    this.props.reautenticacionExitosa = false;
    this.props.reautenticadoEn = fecha;
    this.tocar(fecha);
  }

  /** AUTORIZADA (o PENDIENTE si no pide reautenticación) → EJECUTANDO. */
  iniciar(input: IniciarPppoeOperacionInput): void {
    if (this.props.requiereReautenticacion) {
      this.exigirEstado(
        EstadoOperacionPppoe.AUTORIZADA,
        'Una operación protegida debe estar AUTORIZADA antes de ejecutarse.',
      );
      if (!autorizacionValida(this.props)) {
        throw new OperacionPppoeEstadoInvalidoError(
          'La operación no contiene una autorización válida.',
        );
      }
    } else {
      this.exigirEstado(
        EstadoOperacionPppoe.PENDIENTE,
        'Una operación sin reautenticación debe estar PENDIENTE antes de ejecutarse.',
      );
    }

    const fecha = this.fechaDesdeCreacion(input.fecha, 'fecha de inicio');
    this.exigirNoAntesDeReautenticacion(fecha, 'iniciadoEn');

    this.props.estado = EstadoOperacionPppoe.EJECUTANDO;
    this.props.iniciadoEn = fecha;
    this.props.finalizadoEn = null;
    this.props.canceladoEn = null;
    this.props.duracionMs = null;
    this.props.resultado = null;
    this.props.errorCodigo = null;
    this.props.errorMensaje = null;
    this.tocar(fecha);
  }

  marcarExitosa(input: MarcarPppoeOperacionExitosaInput): void {
    this.exigirEstado(
      EstadoOperacionPppoe.EJECUTANDO,
      'Solo una operación EJECUTANDO puede marcarse como EXITOSA.',
    );
    const fecha = this.fechaDesdeInicio(input.fecha);

    this.props.estado = EstadoOperacionPppoe.EXITOSA;
    this.props.resultado = resultadoSeguro(input.resultado ?? null);
    this.props.errorCodigo = null;
    this.props.errorMensaje = null;
    this.terminar(fecha);
  }

  /** El efecto remoto no pudo confirmarse por completo. */
  marcarParcial(input: MarcarPppoeOperacionConErrorInput): void {
    this.terminarConError(EstadoOperacionPppoe.PARCIAL, input);
  }

  marcarFallida(input: MarcarPppoeOperacionConErrorInput): void {
    this.terminarConError(EstadoOperacionPppoe.FALLIDA, input);
  }

  /** Solo antes de ejecutar: PENDIENTE o AUTORIZADA → CANCELADA. */
  cancelar(input: CancelarPppoeOperacionInput): void {
    if (
      this.props.estado !== EstadoOperacionPppoe.PENDIENTE &&
      this.props.estado !== EstadoOperacionPppoe.AUTORIZADA
    ) {
      throw new OperacionPppoeEstadoInvalidoError(
        `Solo una operación PENDIENTE o AUTORIZADA puede cancelarse. Estado actual: ${this.props.estado}.`,
      );
    }

    const motivo = textoObligatorio(input.motivo, 'motivo', MAX_MOTIVO);
    const fecha = this.fechaDesdeCreacion(input.fecha, 'fecha de cancelación');
    this.exigirNoAntesDeReautenticacion(fecha, 'canceladoEn');

    this.props.estado = EstadoOperacionPppoe.CANCELADA;
    this.props.motivo = motivo;
    this.props.canceladoEn = fecha;
    this.props.iniciadoEn = null;
    this.props.finalizadoEn = null;
    this.props.duracionMs = null;
    this.props.resultado = null;
    this.props.errorCodigo = null;
    this.props.errorMensaje = null;
    this.tocar(fecha);
  }

  /**
   * Nueva operación PENDIENTE ligada a esta (que debe estar FALLIDA o
   * PARCIAL). Todos los reintentos apuntan a la operación raíz. Esta no cambia.
   */
  crearReintento(
    input: CrearReintentoPppoeOperacionInput,
  ): PppoeOperacionEntity {
    if (!this.puedeReintentarse()) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación ${this.props.estado} no puede reintentarse.`,
      );
    }
    if (this.props.id === null) {
      throw new Error(
        'No se puede reintentar una operación que todavía no fue persistida.',
      );
    }

    return PppoeOperacionEntity.create(
      {
        empresaId: this.props.empresaId,
        cuentaPppoeId: this.props.cuentaPppoeId,
        mikrotikRouterId: input.mikrotikRouterId,
        perfilHomologacionId:
          input.perfilHomologacionId !== undefined
            ? input.perfilHomologacionId
            : this.props.perfilHomologacionId,
        instalacionId: this.props.instalacionId,
        desinstalacionId: this.props.desinstalacionId,
        reintentoDeId: this.props.reintentoDeId ?? this.props.id,
        numeroIntento: this.props.numeroIntento + 1,
        claveIdempotencia: input.claveIdempotencia,
        tipo: this.props.tipo,
        origen: input.origen ?? this.props.origen,
        canal: input.canal ?? this.props.canal,
        iniciadoPorId: input.iniciadoPorId,
        requiereReautenticacion:
          input.requiereReautenticacion ?? this.props.requiereReautenticacion,
        motivo:
          input.motivo ?? `Reintento de la operación PPPoE ${this.props.id}.`,
        usuarioPppoeSnapshot: this.props.usuarioPppoeSnapshot,
        codigoPerfilSnapshot:
          input.codigoPerfilSnapshot !== undefined
            ? input.codigoPerfilSnapshot
            : this.props.codigoPerfilSnapshot,
        routerHostSnapshot: input.routerHostSnapshot,
        routerPuertoSnapshot: input.routerPuertoSnapshot,
      },
      input.fecha,
    );
  }

  estaPendiente(): boolean {
    return this.props.estado === EstadoOperacionPppoe.PENDIENTE;
  }

  estaAutorizada(): boolean {
    return this.props.estado === EstadoOperacionPppoe.AUTORIZADA;
  }

  estaEjecutando(): boolean {
    return this.props.estado === EstadoOperacionPppoe.EJECUTANDO;
  }

  fueCancelada(): boolean {
    return this.props.estado === EstadoOperacionPppoe.CANCELADA;
  }

  esTerminal(): boolean {
    return [
      EstadoOperacionPppoe.EXITOSA,
      EstadoOperacionPppoe.PARCIAL,
      EstadoOperacionPppoe.FALLIDA,
      EstadoOperacionPppoe.CANCELADA,
    ].includes(this.props.estado);
  }

  estaEnCurso(): boolean {
    return [
      EstadoOperacionPppoe.PENDIENTE,
      EstadoOperacionPppoe.AUTORIZADA,
      EstadoOperacionPppoe.EJECUTANDO,
    ].includes(this.props.estado);
  }

  puedeReintentarse(): boolean {
    return [
      EstadoOperacionPppoe.PARCIAL,
      EstadoOperacionPppoe.FALLIDA,
    ].includes(this.props.estado);
  }

  esReintento(): boolean {
    return this.props.reintentoDeId !== null || this.props.numeroIntento > 1;
  }

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get cuentaPppoeId(): number {
    return this.props.cuentaPppoeId;
  }

  get mikrotikRouterId(): number {
    return this.props.mikrotikRouterId;
  }

  get perfilHomologacionId(): number | null {
    return this.props.perfilHomologacionId;
  }

  get instalacionId(): number | null {
    return this.props.instalacionId;
  }

  get desinstalacionId(): number | null {
    return this.props.desinstalacionId;
  }

  get reintentoDeId(): number | null {
    return this.props.reintentoDeId;
  }

  get numeroIntento(): number {
    return this.props.numeroIntento;
  }

  get claveIdempotencia(): string {
    return this.props.claveIdempotencia;
  }

  get tipo(): TipoOperacionPppoe {
    return this.props.tipo;
  }

  get origen(): OrigenOperacionPppoe {
    return this.props.origen;
  }

  get canal(): CanalOperacionPppoe {
    return this.props.canal;
  }

  get estado(): EstadoOperacionPppoe {
    return this.props.estado;
  }

  get iniciadoPorId(): number | null {
    return this.props.iniciadoPorId;
  }

  get requiereReautenticacion(): boolean {
    return this.props.requiereReautenticacion;
  }

  get usuarioPppoeSnapshot(): string {
    return this.props.usuarioPppoeSnapshot;
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

  toPrimitives(): PppoeOperacionProps {
    return {
      ...this.props,
      reautenticadoEn: clonarFecha(this.props.reautenticadoEn),
      resultado: clonarResultado(this.props.resultado),
      iniciadoEn: clonarFecha(this.props.iniciadoEn),
      finalizadoEn: clonarFecha(this.props.finalizadoEn),
      canceladoEn: clonarFecha(this.props.canceladoEn),
      creadoEn: new Date(this.props.creadoEn.getTime()),
      actualizadoEn: new Date(this.props.actualizadoEn.getTime()),
    };
  }

  toCreatePrimitives(): PppoeOperacionCreatePrimitives {
    if (this.props.id !== null) {
      throw new Error(
        'Una operación persistida no puede convertirse en datos de creación.',
      );
    }
    return this.toPrimitives();
  }

  toPersistedPrimitives(): PppoeOperacionPersistedPrimitives {
    if (this.props.id === null) {
      throw new Error('La operación todavía no fue persistida.');
    }
    return { ...this.toPrimitives(), id: this.props.id };
  }

  private terminarConError(
    estado: EstadoOperacionPppoe.PARCIAL | EstadoOperacionPppoe.FALLIDA,
    input: MarcarPppoeOperacionConErrorInput,
  ): void {
    this.exigirEstado(
      EstadoOperacionPppoe.EJECUTANDO,
      `Solo una operación EJECUTANDO puede marcarse como ${estado}.`,
    );
    const errorCodigo = codigoErrorObligatorio(input.errorCodigo);
    const errorMensaje = textoObligatorio(
      input.errorMensaje,
      'errorMensaje',
      MAX_ERROR_MENSAJE,
    );
    const fecha = this.fechaDesdeInicio(input.fecha);

    this.props.estado = estado;
    this.props.resultado = resultadoSeguro(input.resultado ?? null);
    this.props.errorCodigo = errorCodigo;
    this.props.errorMensaje = errorMensaje;
    this.terminar(fecha);
  }

  private terminar(fecha: Date): void {
    this.props.finalizadoEn = fecha;
    this.props.canceladoEn = null;
    this.props.duracionMs = fecha.getTime() - this.props.iniciadoEn!.getTime();
    this.tocar(fecha);
  }

  private exigirEstado(esperado: EstadoOperacionPppoe, mensaje: string): void {
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

  private exigirNoAntesDeReautenticacion(fecha: Date, campo: string): void {
    const reautenticadoEn = this.props.reautenticadoEn;
    if (reautenticadoEn && fecha.getTime() < reautenticadoEn.getTime()) {
      throw new OperacionPppoeDatosInvalidosError(
        `${campo} no puede ser anterior a reautenticadoEn.`,
      );
    }
  }

  private tocar(fecha: Date): void {
    this.props.actualizadoEn = new Date(fecha.getTime());
  }

  private static normalizar(p: PppoeOperacionProps): PppoeOperacionProps {
    return {
      id: enteroPositivoOpcional(p.id, 'id'),
      empresaId: enteroPositivo(p.empresaId, 'empresaId'),
      cuentaPppoeId: enteroPositivo(p.cuentaPppoeId, 'cuentaPppoeId'),
      mikrotikRouterId: enteroPositivo(p.mikrotikRouterId, 'mikrotikRouterId'),
      perfilHomologacionId: enteroPositivoOpcional(
        p.perfilHomologacionId,
        'perfilHomologacionId',
      ),
      instalacionId: enteroPositivoOpcional(p.instalacionId, 'instalacionId'),
      desinstalacionId: enteroPositivoOpcional(
        p.desinstalacionId,
        'desinstalacionId',
      ),
      reintentoDeId: enteroPositivoOpcional(p.reintentoDeId, 'reintentoDeId'),
      numeroIntento: enteroPositivo(p.numeroIntento, 'numeroIntento'),
      claveIdempotencia: textoObligatorio(
        p.claveIdempotencia,
        'claveIdempotencia',
        MAX_IDEMPOTENCIA,
      ),
      tipo: valorDeEnum(p.tipo, TipoOperacionPppoe, 'tipo'),
      origen: valorDeEnum(p.origen, OrigenOperacionPppoe, 'origen'),
      canal: valorDeEnum(p.canal, CanalOperacionPppoe, 'canal'),
      estado: valorDeEnum(p.estado, EstadoOperacionPppoe, 'estado'),
      iniciadoPorId: enteroPositivoOpcional(p.iniciadoPorId, 'iniciadoPorId'),
      reautenticadoPorId: enteroPositivoOpcional(
        p.reautenticadoPorId,
        'reautenticadoPorId',
      ),
      requiereReautenticacion: Boolean(p.requiereReautenticacion),
      reautenticacionExitosa: p.reautenticacionExitosa,
      reautenticadoEn: fechaOpcional(p.reautenticadoEn, 'reautenticadoEn'),
      usuarioPppoeSnapshot: textoObligatorio(
        p.usuarioPppoeSnapshot,
        'usuarioPppoeSnapshot',
        MAX_USUARIO,
      ),
      codigoPerfilSnapshot: textoOpcional(
        p.codigoPerfilSnapshot,
        'codigoPerfilSnapshot',
        MAX_PERFIL,
      ),
      routerHostSnapshot: textoOpcional(
        p.routerHostSnapshot,
        'routerHostSnapshot',
        MAX_HOST,
      ),
      routerPuertoSnapshot: puertoRedOpcional(
        p.routerPuertoSnapshot,
        'routerPuertoSnapshot',
      ),
      motivo: textoOpcional(p.motivo, 'motivo', MAX_MOTIVO),
      resultado: resultadoSeguro(p.resultado),
      errorCodigo: codigoError(p.errorCodigo),
      errorMensaje: textoOpcional(
        p.errorMensaje,
        'errorMensaje',
        MAX_ERROR_MENSAJE,
      ),
      iniciadoEn: fechaOpcional(p.iniciadoEn, 'iniciadoEn'),
      finalizadoEn: fechaOpcional(p.finalizadoEn, 'finalizadoEn'),
      canceladoEn: fechaOpcional(p.canceladoEn, 'canceladoEn'),
      duracionMs: duracionOpcional(p.duracionMs),
      creadoEn: fechaValida(p.creadoEn, 'creadoEn'),
      actualizadoEn: fechaValida(p.actualizadoEn, 'actualizadoEn'),
    };
  }
}
