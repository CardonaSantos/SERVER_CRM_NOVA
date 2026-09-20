import {
  CrearPppoeOperacionPasoProps,
  PppoeOperacionPasoProps,
} from '../props/pppoe-operacion-paso.props';

import {
  EstadoPasoPppoe,
  TipoPasoPppoe,
} from '../enums/pppoe-operacion-operacion-paso.enums';

/**
 * Datos permitidos al comenzar la ejecución de un paso.
 */
export type IniciarPppoeOperacionPasoInput = {
  /**
   * Comando técnico sin contraseñas ni secretos.
   */
  comandoSanitizado?: string | null;

  /**
   * Fecha efectiva de inicio.
   *
   * Si se omite, se utiliza la fecha actual.
   */
  fecha?: Date;
};

/**
 * Datos permitidos al finalizar exitosamente un paso.
 */
export type CompletarPppoeOperacionPasoInput = {
  /**
   * Resultado técnico limpio y seguro.
   */
  respuestaSanitizada?: string | null;

  /**
   * Fecha efectiva de finalización.
   *
   * Si se omite, se utiliza la fecha actual.
   */
  fecha?: Date;
};

/**
 * Datos requeridos para registrar el fallo de un paso.
 */
export type FallarPppoeOperacionPasoInput = {
  /**
   * Código técnico estable y apto para filtros.
   *
   * Ejemplos:
   *
   * - SSH_TIMEOUT
   * - SSH_AUTH_REJECTED
   * - SECRET_CONFLICT
   */
  errorCodigo: string;

  /**
   * Mensaje seguro que no debe contener credenciales.
   */
  errorMensaje: string;

  /**
   * Respuesta técnica limpia obtenida antes del fallo.
   */
  respuestaSanitizada?: string | null;

  /**
   * Fecha efectiva del fallo.
   *
   * Si se omite, se utiliza la fecha actual.
   */
  fecha?: Date;
};

/**
 * Datos utilizados cuando un paso no necesita ejecutarse.
 *
 * Ejemplo:
 *
 * El secret ya existe y coincide, por lo que
 * AGREGAR_SECRET se marca como OMITIDO.
 */
export type OmitirPppoeOperacionPasoInput = {
  /**
   * Explicación segura de por qué se omitió.
   */
  motivo?: string | null;

  /**
   * Fecha efectiva de la omisión.
   *
   * Si se omite, se utiliza la fecha actual.
   */
  fecha?: Date;
};

/**
 * Entidad de dominio que representa una acción técnica
 * dentro de una operación PPPoE.
 *
 * Ejemplos de pasos:
 *
 * - CONECTAR_ROUTER
 * - BUSCAR_SECRET
 * - AGREGAR_SECRET
 * - CONFIRMAR_SECRET
 *
 * Ciclo normal:
 *
 * PENDIENTE -> EJECUTANDO -> EXITOSO
 *
 * Ciclo con error:
 *
 * PENDIENTE -> EJECUTANDO -> FALLIDO
 *
 * Ciclo idempotente:
 *
 * PENDIENTE -> OMITIDO
 */
export class PppoeOperacionPasoEntity {
  /**
   * Límite defensivo para evitar almacenar respuestas
   * técnicas excesivamente grandes.
   *
   * Puede ajustarse posteriormente según el comportamiento
   * real de RouterOS.
   */
  private static readonly MAX_TEXTO_TECNICO_LENGTH = 10_000;

  /**
   * Límite defensivo para códigos técnicos de error.
   */
  private static readonly MAX_ERROR_CODIGO_LENGTH = 120;

  /**
   * El constructor permanece privado para obligar a utilizar:
   *
   * - create(): nuevas entidades;
   * - restore(): entidades provenientes de persistencia.
   */
  private constructor(private props: PppoeOperacionPasoProps) {}

  /**
   * ==========================================================
   * CONSTRUCCIÓN
   * ==========================================================
   */

  /**
   * Crea un paso nuevo en estado PENDIENTE.
   *
   * No permite definir manualmente estado, errores, fechas
   * de ejecución ni resultados técnicos.
   */
  static create(input: CrearPppoeOperacionPasoProps): PppoeOperacionPasoEntity {
    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.assertPositiveInteger(input.orden, 'orden');

    this.assertEnumValue(input.tipo, TipoPasoPppoe, 'tipo');

    const now = new Date();

    return new PppoeOperacionPasoEntity({
      id: null,

      operacionId: input.operacionId,

      tipo: input.tipo,

      orden: input.orden,

      estado: EstadoPasoPppoe.PENDIENTE,

      comandoSanitizado: null,

      respuestaSanitizada: null,

      errorCodigo: null,

      errorMensaje: null,

      iniciadoEn: null,

      finalizadoEn: null,

      duracionMs: null,

      creadoEn: now,

      actualizadoEn: now,
    });
  }

  /**
   * Restaura una entidad previamente persistida.
   *
   * Este método es el que debe utilizar el mapper Prisma
   * al convertir un registro de base de datos al dominio.
   */
  static restore(props: PppoeOperacionPasoProps): PppoeOperacionPasoEntity {
    if (props.id === null) {
      throw new Error('No se puede restaurar un paso PPPoE sin id.');
    }

    this.assertPositiveInteger(props.id, 'id');

    this.assertPositiveInteger(props.operacionId, 'operacionId');

    this.assertPositiveInteger(props.orden, 'orden');

    this.assertEnumValue(props.tipo, TipoPasoPppoe, 'tipo');

    this.assertEnumValue(props.estado, EstadoPasoPppoe, 'estado');

    const normalizedProps: PppoeOperacionPasoProps = {
      id: props.id,

      operacionId: props.operacionId,

      tipo: props.tipo,

      orden: props.orden,

      estado: props.estado,

      comandoSanitizado: this.sanitizeTechnicalText(
        props.comandoSanitizado,
        'comandoSanitizado',
      ),

      respuestaSanitizada: this.sanitizeTechnicalText(
        props.respuestaSanitizada,
        'respuestaSanitizada',
      ),

      errorCodigo: this.normalizeErrorCode(props.errorCodigo),

      errorMensaje: this.sanitizeTechnicalText(
        props.errorMensaje,
        'errorMensaje',
      ),

      iniciadoEn: this.normalizeOptionalDate(props.iniciadoEn, 'iniciadoEn'),

      finalizadoEn: this.normalizeOptionalDate(
        props.finalizadoEn,
        'finalizadoEn',
      ),

      duracionMs: this.normalizeOptionalDuration(props.duracionMs),

      creadoEn: this.normalizeRequiredDate(props.creadoEn, 'creadoEn'),

      actualizadoEn: this.normalizeRequiredDate(
        props.actualizadoEn,
        'actualizadoEn',
      ),
    };

    this.assertTemporalConsistency(normalizedProps);

    this.assertStateConsistency(normalizedProps);

    return new PppoeOperacionPasoEntity(normalizedProps);
  }

  /**
   * ==========================================================
   * TRANSICIONES DE ESTADO
   * ==========================================================
   */

  /**
   * Comienza la ejecución técnica del paso.
   *
   * Transición válida:
   *
   * PENDIENTE -> EJECUTANDO
   */
  iniciar(input: IniciarPppoeOperacionPasoInput = {}): void {
    this.assertCurrentState(
      EstadoPasoPppoe.PENDIENTE,
      'Solo un paso PENDIENTE puede comenzar su ejecución.',
    );

    const fecha = PppoeOperacionPasoEntity.normalizeActionDate(
      input.fecha,
      'fecha de inicio',
    );

    this.assertDateNotBeforeCreation(fecha);

    this.props.estado = EstadoPasoPppoe.EJECUTANDO;

    this.props.comandoSanitizado =
      PppoeOperacionPasoEntity.sanitizeTechnicalText(
        input.comandoSanitizado,
        'comandoSanitizado',
      );

    this.props.respuestaSanitizada = null;

    this.props.errorCodigo = null;

    this.props.errorMensaje = null;

    this.props.iniciadoEn = fecha;

    this.props.finalizadoEn = null;

    this.props.duracionMs = null;

    this.touch(fecha);
  }

  /**
   * Finaliza exitosamente un paso en ejecución.
   *
   * Transición válida:
   *
   * EJECUTANDO -> EXITOSO
   */
  marcarExitoso(input: CompletarPppoeOperacionPasoInput = {}): void {
    this.assertCurrentState(
      EstadoPasoPppoe.EJECUTANDO,
      'Solo un paso EJECUTANDO puede marcarse como EXITOSO.',
    );

    const fecha = PppoeOperacionPasoEntity.normalizeActionDate(
      input.fecha,
      'fecha de finalización',
    );

    this.assertDateNotBeforeStart(fecha);

    this.props.estado = EstadoPasoPppoe.EXITOSO;

    this.props.respuestaSanitizada =
      PppoeOperacionPasoEntity.sanitizeTechnicalText(
        input.respuestaSanitizada,
        'respuestaSanitizada',
      );

    this.props.errorCodigo = null;

    this.props.errorMensaje = null;

    this.props.finalizadoEn = fecha;

    this.props.duracionMs = this.calculateDuration(fecha);

    this.touch(fecha);
  }

  /**
   * Finaliza con error un paso en ejecución.
   *
   * Transición válida:
   *
   * EJECUTANDO -> FALLIDO
   */
  marcarFallido(input: FallarPppoeOperacionPasoInput): void {
    this.assertCurrentState(
      EstadoPasoPppoe.EJECUTANDO,
      'Solo un paso EJECUTANDO puede marcarse como FALLIDO.',
    );

    const errorCodigo = PppoeOperacionPasoEntity.normalizeRequiredErrorCode(
      input.errorCodigo,
    );

    const errorMensaje =
      PppoeOperacionPasoEntity.normalizeRequiredTechnicalText(
        input.errorMensaje,
        'errorMensaje',
      );

    const fecha = PppoeOperacionPasoEntity.normalizeActionDate(
      input.fecha,
      'fecha del fallo',
    );

    this.assertDateNotBeforeStart(fecha);

    this.props.estado = EstadoPasoPppoe.FALLIDO;

    this.props.respuestaSanitizada =
      PppoeOperacionPasoEntity.sanitizeTechnicalText(
        input.respuestaSanitizada,
        'respuestaSanitizada',
      );

    this.props.errorCodigo = errorCodigo;

    this.props.errorMensaje = errorMensaje;

    this.props.finalizadoEn = fecha;

    this.props.duracionMs = this.calculateDuration(fecha);

    this.touch(fecha);
  }

  /**
   * Omite un paso que no necesita ejecutarse.
   *
   * Transición válida:
   *
   * PENDIENTE -> OMITIDO
   *
   * Caso típico:
   *
   * BUSCAR_SECRET confirma que el secret ya existe y coincide,
   * por lo que AGREGAR_SECRET se omite.
   */
  omitir(input: OmitirPppoeOperacionPasoInput = {}): void {
    this.assertCurrentState(
      EstadoPasoPppoe.PENDIENTE,
      'Solo un paso PENDIENTE puede marcarse como OMITIDO.',
    );

    const fecha = PppoeOperacionPasoEntity.normalizeActionDate(
      input.fecha,
      'fecha de omisión',
    );

    this.assertDateNotBeforeCreation(fecha);

    this.props.estado = EstadoPasoPppoe.OMITIDO;

    this.props.respuestaSanitizada =
      PppoeOperacionPasoEntity.sanitizeTechnicalText(
        input.motivo,
        'motivo de omisión',
      );

    this.props.errorCodigo = null;

    this.props.errorMensaje = null;

    /**
     * Un paso omitido nunca comenzó realmente
     * su ejecución técnica.
     */
    this.props.iniciadoEn = null;

    this.props.finalizadoEn = fecha;

    this.props.duracionMs = 0;

    this.touch(fecha);
  }

  /**
   * ==========================================================
   * CONSULTAS DE ESTADO
   * ==========================================================
   */

  /**
   * Indica si el paso todavía no comenzó.
   */
  estaPendiente(): boolean {
    return this.props.estado === EstadoPasoPppoe.PENDIENTE;
  }

  /**
   * Indica si el paso está ejecutándose.
   */
  estaEjecutando(): boolean {
    return this.props.estado === EstadoPasoPppoe.EJECUTANDO;
  }

  /**
   * Indica si el paso terminó exitosamente.
   */
  fueExitoso(): boolean {
    return this.props.estado === EstadoPasoPppoe.EXITOSO;
  }

  /**
   * Indica si el paso terminó con error.
   */
  fueFallido(): boolean {
    return this.props.estado === EstadoPasoPppoe.FALLIDO;
  }

  /**
   * Indica si el paso fue omitido.
   */
  fueOmitido(): boolean {
    return this.props.estado === EstadoPasoPppoe.OMITIDO;
  }

  /**
   * Indica si el paso ya alcanzó un estado terminal.
   */
  esTerminal(): boolean {
    return [
      EstadoPasoPppoe.EXITOSO,
      EstadoPasoPppoe.FALLIDO,
      EstadoPasoPppoe.OMITIDO,
    ].includes(this.props.estado);
  }

  /**
   * ==========================================================
   * GETTERS
   * ==========================================================
   */

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
    return this.cloneOptionalDate(this.props.iniciadoEn);
  }

  get finalizadoEn(): Date | null {
    return this.cloneOptionalDate(this.props.finalizadoEn);
  }

  get duracionMs(): number | null {
    return this.props.duracionMs;
  }

  /**
   * ==========================================================
   * CONVERSIÓN A PRIMITIVOS
   * ==========================================================
   */

  /**
   * Devuelve una copia segura del estado completo.
   *
   * Este método puede ser utilizado por:
   *
   * - mappers;
   * - repositorios;
   * - casos de uso;
   * - pruebas unitarias.
   */
  toPrimitives(): PppoeOperacionPasoProps {
    return {
      id: this.props.id,

      operacionId: this.props.operacionId,

      tipo: this.props.tipo,

      orden: this.props.orden,

      estado: this.props.estado,

      comandoSanitizado: this.props.comandoSanitizado,

      respuestaSanitizada: this.props.respuestaSanitizada,

      errorCodigo: this.props.errorCodigo,

      errorMensaje: this.props.errorMensaje,

      iniciadoEn: this.cloneOptionalDate(this.props.iniciadoEn),

      finalizadoEn: this.cloneOptionalDate(this.props.finalizadoEn),

      duracionMs: this.props.duracionMs,

      creadoEn: new Date(this.props.creadoEn.getTime()),

      actualizadoEn: new Date(this.props.actualizadoEn.getTime()),
    };
  }

  /**
   * ==========================================================
   * VALIDACIONES INTERNAS DE INSTANCIA
   * ==========================================================
   */

  /**
   * Exige que la entidad se encuentre en un estado concreto.
   */
  private assertCurrentState(expected: EstadoPasoPppoe, message: string): void {
    if (this.props.estado !== expected) {
      throw new Error(`${message} Estado actual: ${this.props.estado}.`);
    }
  }

  /**
   * Verifica que una fecha de acción no sea anterior
   * a la creación del paso.
   */
  private assertDateNotBeforeCreation(fecha: Date): void {
    if (fecha.getTime() < this.props.creadoEn.getTime()) {
      throw new Error(
        'La fecha de la acción no puede ser anterior a creadoEn.',
      );
    }
  }

  /**
   * Verifica que la finalización no sea anterior
   * al inicio de la ejecución.
   */
  private assertDateNotBeforeStart(fecha: Date): void {
    if (!this.props.iniciadoEn) {
      throw new Error('El paso no contiene una fecha de inicio válida.');
    }

    if (fecha.getTime() < this.props.iniciadoEn.getTime()) {
      throw new Error(
        'La fecha de finalización no puede ser anterior a iniciadoEn.',
      );
    }
  }

  /**
   * Calcula la duración total desde iniciadoEn.
   */
  private calculateDuration(finalizadoEn: Date): number {
    if (!this.props.iniciadoEn) {
      throw new Error(
        'No se puede calcular la duración de un paso sin iniciadoEn.',
      );
    }

    const duration = finalizadoEn.getTime() - this.props.iniciadoEn.getTime();

    if (duration < 0) {
      throw new Error('La duración calculada del paso no puede ser negativa.');
    }

    return duration;
  }

  /**
   * Actualiza la fecha interna de modificación.
   */
  private touch(fecha: Date): void {
    this.props.actualizadoEn = new Date(fecha.getTime());
  }

  /**
   * Clona una fecha opcional para evitar entregar
   * referencias internas mutables.
   */
  private cloneOptionalDate(value: Date | null): Date | null {
    return value ? new Date(value.getTime()) : null;
  }

  /**
   * ==========================================================
   * VALIDACIONES ESTÁTICAS
   * ==========================================================
   */

  /**
   * Valida identificadores y valores enteros positivos.
   */
  private static assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  /**
   * Valida que un valor exista en el enum recibido.
   */
  private static assertEnumValue<TEnum extends Record<string, string>>(
    value: string,
    enumObject: TEnum,
    field: string,
  ): void {
    const allowedValues = Object.values(enumObject);

    if (!allowedValues.includes(value)) {
      throw new Error(`${field} contiene un valor no soportado: ${value}.`);
    }
  }

  /**
   * Convierte una fecha opcional en una copia segura.
   */
  private static normalizeOptionalDate(
    value: Date | null,
    field: string,
  ): Date | null {
    if (value === null) {
      return null;
    }

    return this.normalizeRequiredDate(value, field);
  }

  /**
   * Valida y clona una fecha obligatoria.
   */
  private static normalizeRequiredDate(value: Date, field: string): Date {
    const normalized = new Date(value);

    if (Number.isNaN(normalized.getTime())) {
      throw new Error(`${field} debe contener una fecha válida.`);
    }

    return normalized;
  }

  /**
   * Normaliza una fecha recibida por una transición.
   */
  private static normalizeActionDate(
    value: Date | undefined,
    field: string,
  ): Date {
    return this.normalizeRequiredDate(value ?? new Date(), field);
  }

  /**
   * Valida una duración opcional.
   */
  private static normalizeOptionalDuration(
    value: number | null,
  ): number | null {
    if (value === null) {
      return null;
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new Error('duracionMs debe ser un entero mayor o igual que cero.');
    }

    return value;
  }

  /**
   * Normaliza un código de error opcional.
   */
  private static normalizeErrorCode(value: string | null): string | null {
    if (value === null) {
      return null;
    }

    const normalized = value.trim().toUpperCase();

    if (!normalized) {
      return null;
    }

    if (normalized.length > this.MAX_ERROR_CODIGO_LENGTH) {
      throw new Error(
        `errorCodigo no puede superar ${this.MAX_ERROR_CODIGO_LENGTH} caracteres.`,
      );
    }

    if (!/^[A-Z0-9_.:-]+$/.test(normalized)) {
      throw new Error(
        'errorCodigo solo puede contener letras, números, guion bajo, punto, dos puntos y guion.',
      );
    }

    return normalized;
  }

  /**
   * Normaliza un código de error obligatorio.
   */
  private static normalizeRequiredErrorCode(value: string): string {
    const normalized = this.normalizeErrorCode(value);

    if (!normalized) {
      throw new Error(
        'errorCodigo es obligatorio al marcar un paso como FALLIDO.',
      );
    }

    return normalized;
  }

  /**
   * Normaliza texto técnico opcional y aplica
   * una sanitización defensiva.
   *
   * Esta protección no sustituye la sanitización
   * que debe realizar el módulo mikrotik-ssh.
   */
  private static sanitizeTechnicalText(
    value: string | null | undefined,
    field: string,
  ): string | null {
    if (value == null) {
      return null;
    }

    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    const sanitized = normalized
      /**
       * Redacta asignaciones comunes:
       *
       * password=valor
       * token: valor
       * authorization=valor
       */
      .replace(
        /(\b(?:password|passwd|pass|token|authorization|private[_ -]?key|secretoCifrado|secretoIv|secretoAuthTag)\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
        '$1[REDACTED]',
      )

      /**
       * Redacta variables de entorno AES del proyecto.
       */
      .replace(/(PPPOE_SECRET_KEY_V\d+\s*=\s*)[^\s]+/gi, '$1[REDACTED]');

    if (sanitized.length > this.MAX_TEXTO_TECNICO_LENGTH) {
      throw new Error(
        `${field} no puede superar ${this.MAX_TEXTO_TECNICO_LENGTH} caracteres.`,
      );
    }

    return sanitized;
  }

  /**
   * Normaliza texto técnico obligatorio.
   */
  private static normalizeRequiredTechnicalText(
    value: string,
    field: string,
  ): string {
    const normalized = this.sanitizeTechnicalText(value, field);

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    return normalized;
  }

  /**
   * Valida la relación cronológica de las fechas
   * restauradas desde persistencia.
   */
  private static assertTemporalConsistency(
    props: PppoeOperacionPasoProps,
  ): void {
    if (props.actualizadoEn.getTime() < props.creadoEn.getTime()) {
      throw new Error('actualizadoEn no puede ser anterior a creadoEn.');
    }

    if (
      props.iniciadoEn &&
      props.iniciadoEn.getTime() < props.creadoEn.getTime()
    ) {
      throw new Error('iniciadoEn no puede ser anterior a creadoEn.');
    }

    if (
      props.finalizadoEn &&
      props.finalizadoEn.getTime() < props.creadoEn.getTime()
    ) {
      throw new Error('finalizadoEn no puede ser anterior a creadoEn.');
    }

    if (
      props.iniciadoEn &&
      props.finalizadoEn &&
      props.finalizadoEn.getTime() < props.iniciadoEn.getTime()
    ) {
      throw new Error('finalizadoEn no puede ser anterior a iniciadoEn.');
    }
  }

  /**
   * Valida que fechas, errores y duración sean coherentes
   * con el estado persistido.
   */
  private static assertStateConsistency(props: PppoeOperacionPasoProps): void {
    switch (props.estado) {
      case EstadoPasoPppoe.PENDIENTE: {
        if (
          props.iniciadoEn !== null ||
          props.finalizadoEn !== null ||
          props.duracionMs !== null
        ) {
          throw new Error(
            'Un paso PENDIENTE no puede contener fechas de ejecución ni duración.',
          );
        }

        if (props.errorCodigo !== null || props.errorMensaje !== null) {
          throw new Error(
            'Un paso PENDIENTE no puede contener datos de error.',
          );
        }

        return;
      }

      case EstadoPasoPppoe.EJECUTANDO: {
        if (props.iniciadoEn === null) {
          throw new Error('Un paso EJECUTANDO debe contener iniciadoEn.');
        }

        if (props.finalizadoEn !== null || props.duracionMs !== null) {
          throw new Error(
            'Un paso EJECUTANDO no puede contener finalizadoEn ni duracionMs.',
          );
        }

        if (props.errorCodigo !== null || props.errorMensaje !== null) {
          throw new Error(
            'Un paso EJECUTANDO no puede contener un error final.',
          );
        }

        return;
      }

      case EstadoPasoPppoe.EXITOSO: {
        this.assertCompletedExecutionFields(props, 'EXITOSO');

        if (props.errorCodigo !== null || props.errorMensaje !== null) {
          throw new Error('Un paso EXITOSO no puede contener datos de error.');
        }

        return;
      }

      case EstadoPasoPppoe.FALLIDO: {
        this.assertCompletedExecutionFields(props, 'FALLIDO');

        if (!props.errorCodigo || !props.errorMensaje) {
          throw new Error(
            'Un paso FALLIDO debe contener errorCodigo y errorMensaje.',
          );
        }

        return;
      }

      case EstadoPasoPppoe.OMITIDO: {
        if (props.iniciadoEn !== null) {
          throw new Error('Un paso OMITIDO no debe contener iniciadoEn.');
        }

        if (props.finalizadoEn === null) {
          throw new Error('Un paso OMITIDO debe contener finalizadoEn.');
        }

        if (props.duracionMs !== 0) {
          throw new Error(
            'Un paso OMITIDO debe tener duracionMs igual a cero.',
          );
        }

        if (props.errorCodigo !== null || props.errorMensaje !== null) {
          throw new Error('Un paso OMITIDO no puede contener datos de error.');
        }

        return;
      }

      default: {
        const exhaustiveCheck: never = props.estado;

        throw new Error(`Estado de paso no soportado: ${exhaustiveCheck}.`);
      }
    }
  }

  /**
   * Valida los campos comunes de una ejecución terminada.
   */
  private static assertCompletedExecutionFields(
    props: PppoeOperacionPasoProps,
    estado: 'EXITOSO' | 'FALLIDO',
  ): void {
    if (
      props.iniciadoEn === null ||
      props.finalizadoEn === null ||
      props.duracionMs === null
    ) {
      throw new Error(
        `Un paso ${estado} debe contener iniciadoEn, finalizadoEn y duracionMs.`,
      );
    }
  }
}
