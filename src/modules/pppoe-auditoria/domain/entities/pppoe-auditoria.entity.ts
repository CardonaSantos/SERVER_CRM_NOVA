import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../enums/pppoe-auditoria-enums';
import {
  CrearPppoeAuditoriaEntityProps,
  DatosAuditoriaPppoe,
  PppoeAuditoriaEntityProps,
  PppoeAuditoriaJsonValue,
  RegistrarEventoCuentaPppoeProps,
  RegistrarEventoDesinstalacionPppoeProps,
  RegistrarEventoInstalacionPppoeProps,
  RegistrarEventoOperacionPppoeProps,
  RegistrarTransicionCuentaPppoeProps,
} from '../props/auditoria-entity-props';

export class PppoeAuditoriaEntity {
  private static readonly SENSITIVE_DATA_KEYS = new Set([
    'password',
    'passwordoperador',
    'passwordssh',

    'contrasena',
    'contrasenaoperador',
    'contrasenassh',

    'secret',
    'secreto',
    'secretoplano',
    'secretocifrado',
    'secretoiv',
    'secretoauthtag',

    'clave',
    'privatekey',
    'claveprivada',
    'sshpassword',
    'aeskey',

    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'cookie',
  ]);

  private constructor(private readonly props: PppoeAuditoriaEntityProps) {}

  /**
   * Crea un evento genérico de auditoría PPPoE.
   *
   * Este es el factory principal para eventos que no
   * requieren una forma semántica más específica.
   */
  static create(input: CrearPppoeAuditoriaEntityProps): PppoeAuditoriaEntity {
    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertOptionalPositiveId(input.clienteId, 'clienteId');

    this.assertOptionalPositiveId(input.accesoInternetId, 'accesoInternetId');

    this.assertOptionalPositiveId(input.cuentaPppoeId, 'cuentaPppoeId');

    this.assertOptionalPositiveId(
      input.perfilHomologacionId,
      'perfilHomologacionId',
    );

    this.assertOptionalPositiveId(input.instalacionId, 'instalacionId');

    this.assertOptionalPositiveId(input.desinstalacionId, 'desinstalacionId');

    this.assertOptionalPositiveId(input.operacionId, 'operacionId');

    this.assertOptionalPositiveId(input.operadorId, 'operadorId');

    this.assertEnumValue(input.origen, OrigenOperacionPppoe, 'origen');

    this.assertEnumValue(input.accion, AccionAuditoriaPppoe, 'accion');

    this.assertOptionalEnumValue(
      input.estadoCuentaAnterior,
      EstadoCuentaPppoe,
      'estadoCuentaAnterior',
    );

    this.assertOptionalEnumValue(
      input.estadoCuentaNuevo,
      EstadoCuentaPppoe,
      'estadoCuentaNuevo',
    );

    const creadoEn = input.creadoEn ?? new Date();

    this.assertValidDate(creadoEn, 'creadoEn');

    const props: PppoeAuditoriaEntityProps = {
      id: null,

      empresaId: input.empresaId,

      clienteId: input.clienteId ?? null,

      accesoInternetId: input.accesoInternetId ?? null,

      cuentaPppoeId: input.cuentaPppoeId ?? null,

      perfilHomologacionId: input.perfilHomologacionId ?? null,

      instalacionId: input.instalacionId ?? null,

      desinstalacionId: input.desinstalacionId ?? null,

      operacionId: input.operacionId ?? null,

      operadorId: input.operadorId ?? null,

      origen: input.origen,
      accion: input.accion,

      descripcion: this.normalizeRequiredString(
        input.descripcion,
        'descripcion',
      ),

      estadoCuentaAnterior: input.estadoCuentaAnterior ?? null,

      estadoCuentaNuevo: input.estadoCuentaNuevo ?? null,

      usuarioPppoeSnapshot: this.normalizeOptionalString(
        input.usuarioPppoeSnapshot,
      ),

      perfilCodigoSnapshot: this.normalizeOptionalString(
        input.perfilCodigoSnapshot,
      ),

      operadorNombreSnapshot: this.normalizeOptionalString(
        input.operadorNombreSnapshot,
      ),

      datos: this.normalizeDatos(input.datos ?? null),

      ipOrigen: this.normalizeOptionalString(input.ipOrigen),

      userAgent: this.normalizeOptionalString(input.userAgent),

      creadoEn: new Date(creadoEn),
    };

    this.assertConsistency(props);

    return new PppoeAuditoriaEntity(props);
  }

  /**
   * Reconstruye un registro existente.
   *
   * Será utilizado por el mapper Prisma.
   */
  static hydrate(input: PppoeAuditoriaEntityProps): PppoeAuditoriaEntity {
    this.assertPositiveId(input.id, 'id');

    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertOptionalPositiveId(input.clienteId, 'clienteId');

    this.assertOptionalPositiveId(input.accesoInternetId, 'accesoInternetId');

    this.assertOptionalPositiveId(input.cuentaPppoeId, 'cuentaPppoeId');

    this.assertOptionalPositiveId(
      input.perfilHomologacionId,
      'perfilHomologacionId',
    );

    this.assertOptionalPositiveId(input.instalacionId, 'instalacionId');

    this.assertOptionalPositiveId(input.desinstalacionId, 'desinstalacionId');

    this.assertOptionalPositiveId(input.operacionId, 'operacionId');

    this.assertOptionalPositiveId(input.operadorId, 'operadorId');

    this.assertEnumValue(input.origen, OrigenOperacionPppoe, 'origen');

    this.assertEnumValue(input.accion, AccionAuditoriaPppoe, 'accion');

    this.assertOptionalEnumValue(
      input.estadoCuentaAnterior,
      EstadoCuentaPppoe,
      'estadoCuentaAnterior',
    );

    this.assertOptionalEnumValue(
      input.estadoCuentaNuevo,
      EstadoCuentaPppoe,
      'estadoCuentaNuevo',
    );

    this.assertValidDate(input.creadoEn, 'creadoEn');

    const props: PppoeAuditoriaEntityProps = {
      ...input,

      descripcion: this.normalizeRequiredString(
        input.descripcion,
        'descripcion',
      ),

      usuarioPppoeSnapshot: this.normalizeOptionalString(
        input.usuarioPppoeSnapshot,
      ),

      perfilCodigoSnapshot: this.normalizeOptionalString(
        input.perfilCodigoSnapshot,
      ),

      operadorNombreSnapshot: this.normalizeOptionalString(
        input.operadorNombreSnapshot,
      ),

      datos: this.normalizeDatos(input.datos),

      ipOrigen: this.normalizeOptionalString(input.ipOrigen),

      userAgent: this.normalizeOptionalString(input.userAgent),

      creadoEn: new Date(input.creadoEn),
    };

    this.assertConsistency(props);

    return new PppoeAuditoriaEntity(props);
  }

  /*
   * Factories semánticos
   */

  /**
   * Registra cualquier evento relacionado con una cuenta
   * PPPoE concreta.
   */
  static registrarEventoCuenta(
    input: RegistrarEventoCuentaPppoeProps,
  ): PppoeAuditoriaEntity {
    return this.create(input);
  }

  /**
   * Registra un cambio de estado confirmado en la cuenta.
   *
   * Ejemplos:
   * - PENDIENTE_ACTIVACION -> EN_INSTALACION
   * - EN_ACTIVACION -> ACTIVA
   * - ACTIVA -> SUSPENDIDA
   * - EN_DESINSTALACION -> ELIMINADA
   */
  static registrarTransicionCuenta(
    input: RegistrarTransicionCuentaPppoeProps,
  ): PppoeAuditoriaEntity {
    if (input.estadoCuentaAnterior === input.estadoCuentaNuevo) {
      throw new Error(
        'Una transición de cuenta debe tener estados anterior y nuevo diferentes.',
      );
    }

    return this.create(input);
  }

  /**
   * Registra un evento asociado a una ejecución técnica.
   *
   * Ejemplos:
   * - operación iniciada
   * - operación exitosa
   * - operación parcial
   * - operación fallida
   */
  static registrarEventoOperacion(
    input: RegistrarEventoOperacionPppoeProps,
  ): PppoeAuditoriaEntity {
    return this.create(input);
  }

  /**
   * Registra un evento originado dentro del flujo
   * de instalación.
   */
  static registrarEventoInstalacion(
    input: RegistrarEventoInstalacionPppoeProps,
  ): PppoeAuditoriaEntity {
    return this.create(input);
  }

  /**
   * Registra un evento originado dentro del flujo
   * de desinstalación.
   */
  static registrarEventoDesinstalacion(
    input: RegistrarEventoDesinstalacionPppoeProps,
  ): PppoeAuditoriaEntity {
    return this.create(input);
  }

  /*
   * Getters principales
   */

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get clienteId(): number | null {
    return this.props.clienteId;
  }

  get accesoInternetId(): number | null {
    return this.props.accesoInternetId;
  }

  get cuentaPppoeId(): number | null {
    return this.props.cuentaPppoeId;
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

  get operacionId(): number | null {
    return this.props.operacionId;
  }

  get operadorId(): number | null {
    return this.props.operadorId;
  }

  get origen(): OrigenOperacionPppoe {
    return this.props.origen;
  }

  get accion(): AccionAuditoriaPppoe {
    return this.props.accion;
  }

  get descripcion(): string {
    return this.props.descripcion;
  }

  get estadoCuentaAnterior(): EstadoCuentaPppoe | null {
    return this.props.estadoCuentaAnterior;
  }

  get estadoCuentaNuevo(): EstadoCuentaPppoe | null {
    return this.props.estadoCuentaNuevo;
  }

  get usuarioPppoeSnapshot(): string | null {
    return this.props.usuarioPppoeSnapshot;
  }

  get perfilCodigoSnapshot(): string | null {
    return this.props.perfilCodigoSnapshot;
  }

  get operadorNombreSnapshot(): string | null {
    return this.props.operadorNombreSnapshot;
  }

  get datos(): DatosAuditoriaPppoe | null {
    return PppoeAuditoriaEntity.cloneDatos(this.props.datos);
  }

  get ipOrigen(): string | null {
    return this.props.ipOrigen;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get creadoEn(): Date {
    return new Date(this.props.creadoEn);
  }

  /*
   * Consultas semánticas
   */

  get tieneTransicionCuenta(): boolean {
    return (
      this.props.estadoCuentaAnterior !== null ||
      this.props.estadoCuentaNuevo !== null
    );
  }

  get esOrigenOperador(): boolean {
    return this.props.origen === OrigenOperacionPppoe.OPERADOR;
  }

  get esOrigenAutomatico(): boolean {
    return (
      this.props.origen === OrigenOperacionPppoe.SISTEMA ||
      this.props.origen === OrigenOperacionPppoe.COBRANZA_AUTOMATICA
    );
  }

  get tieneContextoHttp(): boolean {
    return this.props.ipOrigen !== null || this.props.userAgent !== null;
  }

  get perteneceAInstalacion(): boolean {
    return this.props.instalacionId !== null;
  }

  get perteneceADesinstalacion(): boolean {
    return this.props.desinstalacionId !== null;
  }

  get perteneceAOperacion(): boolean {
    return this.props.operacionId !== null;
  }

  get perteneceACuenta(): boolean {
    return this.props.cuentaPppoeId !== null;
  }

  /*
   * Salida para mapper y repositorio
   */

  toPrimitives(): PppoeAuditoriaEntityProps {
    return {
      id: this.props.id,

      empresaId: this.props.empresaId,

      clienteId: this.props.clienteId,

      accesoInternetId: this.props.accesoInternetId,

      cuentaPppoeId: this.props.cuentaPppoeId,

      perfilHomologacionId: this.props.perfilHomologacionId,

      instalacionId: this.props.instalacionId,

      desinstalacionId: this.props.desinstalacionId,

      operacionId: this.props.operacionId,

      operadorId: this.props.operadorId,

      origen: this.props.origen,
      accion: this.props.accion,

      descripcion: this.props.descripcion,

      estadoCuentaAnterior: this.props.estadoCuentaAnterior,

      estadoCuentaNuevo: this.props.estadoCuentaNuevo,

      usuarioPppoeSnapshot: this.props.usuarioPppoeSnapshot,

      perfilCodigoSnapshot: this.props.perfilCodigoSnapshot,

      operadorNombreSnapshot: this.props.operadorNombreSnapshot,

      datos: PppoeAuditoriaEntity.cloneDatos(this.props.datos),

      ipOrigen: this.props.ipOrigen,

      userAgent: this.props.userAgent,

      creadoEn: new Date(this.props.creadoEn),
    };
  }

  /*
   * Validaciones internas
   */

  private static assertConsistency(props: PppoeAuditoriaEntityProps): void {
    this.assertHasContext(props);

    if (
      props.origen === OrigenOperacionPppoe.OPERADOR &&
      props.operadorId === null
    ) {
      throw new Error(
        'Una auditoría originada por un operador debe indicar operadorId.',
      );
    }

    if (
      (props.estadoCuentaAnterior !== null ||
        props.estadoCuentaNuevo !== null) &&
      props.cuentaPppoeId === null
    ) {
      throw new Error(
        'Una auditoría con transición de estado debe indicar cuentaPppoeId.',
      );
    }

    if (
      props.usuarioPppoeSnapshot !== null &&
      props.cuentaPppoeId === null &&
      props.accesoInternetId === null
    ) {
      throw new Error(
        'Un snapshot de usuario PPPoE requiere una cuenta o un acceso de internet relacionado.',
      );
    }
  }

  /**
   * Evita bitácoras PPPoE completamente huérfanas.
   */
  private static assertHasContext(props: PppoeAuditoriaEntityProps): void {
    const hasContext = [
      props.clienteId,
      props.accesoInternetId,
      props.cuentaPppoeId,
      props.perfilHomologacionId,
      props.instalacionId,
      props.desinstalacionId,
      props.operacionId,
    ].some((value) => value !== null);

    if (!hasContext) {
      throw new Error(
        'La auditoría PPPoE debe estar relacionada con al menos un contexto de negocio.',
      );
    }
  }

  private static normalizeRequiredString(value: string, field: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    return normalized;
  }

  private static normalizeOptionalString(
    value: string | null | undefined,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private static assertPositiveId(value: number | null, field: string): void {
    if (value === null || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  private static assertOptionalPositiveId(
    value: number | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    this.assertPositiveId(value, field);
  }

  private static assertEnumValue<T extends string>(
    value: T,
    enumObject: Record<string, string>,
    field: string,
  ): void {
    if (!Object.values(enumObject).includes(value)) {
      throw new Error(`${field} contiene un valor inválido: ${value}.`);
    }
  }

  private static assertOptionalEnumValue<T extends string>(
    value: T | null | undefined,
    enumObject: Record<string, string>,
    field: string,
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    this.assertEnumValue(value, enumObject, field);
  }

  private static assertValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }

  /*
   * Manejo seguro del JSON
   */

  private static normalizeDatos(
    value: DatosAuditoriaPppoe | null,
  ): DatosAuditoriaPppoe | null {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('datos debe ser un objeto JSON.');
    }

    return this.cloneDatos(value);
  }

  private static cloneDatos(
    value: DatosAuditoriaPppoe | null,
  ): DatosAuditoriaPppoe | null {
    if (value === null) {
      return null;
    }

    const result: DatosAuditoriaPppoe = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      this.assertSafeDataKey(key);

      result[key] = this.cloneJsonValue(nestedValue, `datos.${key}`);
    }

    return result;
  }

  private static cloneJsonValue(
    value: PppoeAuditoriaJsonValue,
    path: string,
  ): PppoeAuditoriaJsonValue {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new Error(`${path} contiene un número no válido para JSON.`);
      }

      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item, index) =>
        this.cloneJsonValue(item, `${path}[${index}]`),
      );
    }

    if (typeof value !== 'object') {
      throw new Error(`${path} contiene un valor no compatible con JSON.`);
    }

    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${path} debe contener solamente objetos JSON simples.`);
    }

    const result: Record<string, PppoeAuditoriaJsonValue> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      this.assertSafeDataKey(key);

      result[key] = this.cloneJsonValue(nestedValue, `${path}.${key}`);
    }

    return result;
  }

  /**
   * Impide almacenar accidentalmente credenciales
   * dentro del JSON flexible de auditoría.
   */
  private static assertSafeDataKey(key: string): void {
    const normalizedKey = key
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    if (this.SENSITIVE_DATA_KEYS.has(normalizedKey)) {
      throw new Error(
        `El campo ${key} no puede almacenarse dentro de los datos de auditoría por contener información sensible.`,
      );
    }
  }
}
