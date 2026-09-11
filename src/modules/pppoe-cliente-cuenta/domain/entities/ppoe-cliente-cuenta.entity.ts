import { EstadoCuentaPppoe } from '../enums/pppoe-cliente-cuenta.enum';
import {
  AdoptarClientePppoeCuentaEntityProps,
  ClientePppoeCuentaEntityProps,
  CrearClientePppoeCuentaEntityProps,
} from '../props/ppoe-cliente-cuenta.props';

export type SecretoPppoeProtegidoProps = {
  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;
};

export class ClientePppoeCuentaEntity {
  private constructor(private readonly props: ClientePppoeCuentaEntityProps) {}

  /**
   * Crea una cuenta PPPoE preparada en el CRM.
   *
   * - Las credenciales ya fueron generadas.
   * - El secreto ya fue cifrado externamente.
   * - Todavía no se ha creado el secret en MikroTik.
   */
  static create(
    input: CrearClientePppoeCuentaEntityProps,
  ): ClientePppoeCuentaEntity {
    this.assertPositiveId(input.empresaId, 'empresaId');
    this.assertPositiveId(input.accesoInternetId, 'accesoInternetId');
    this.assertPositiveId(input.perfilHomologacionId, 'perfilHomologacionId');
    this.assertOptionalPositiveId(input.generadoPorId, 'generadoPorId');

    const usuario = this.normalizeUsuario(input.usuario);

    const secretoCifrado = this.normalizeRequiredString(
      input.secretoCifrado,
      'secretoCifrado',
    );

    const secretoIv = this.normalizeRequiredString(
      input.secretoIv,
      'secretoIv',
    );

    const secretoAuthTag = this.normalizeRequiredString(
      input.secretoAuthTag,
      'secretoAuthTag',
    );

    this.assertPositiveId(input.versionClave, 'versionClave');

    const now = new Date();

    return new ClientePppoeCuentaEntity({
      id: null,

      empresaId: input.empresaId,

      accesoInternetId: input.accesoInternetId,

      perfilHomologacionId: input.perfilHomologacionId,

      usuario,

      secretoCifrado,
      secretoIv,
      secretoAuthTag,
      versionClave: input.versionClave,

      estado: EstadoCuentaPppoe.PENDIENTE_ACTIVACION,

      generadoPorId: input.generadoPorId ?? null,

      adoptadoPorId: null,

      generadoEn: now,

      secretCreadoEn: null,
      activadoEn: null,
      suspendidoEn: null,
      eliminadoEn: null,

      adoptadoEn: null,

      ultimaSincronizacionEn: null,

      ultimoError: null,

      actualizadoEn: now,
    });
  }

  /**
   * Incorpora al CRM un secret PPPoE que ya existe
   * previamente en MikroTik.
   *
   * - No crea ni modifica el secret remoto.
   * - No inventa fechas históricas.
   * - Las credenciales deben haber sido verificadas.
   * - La contraseña debe llegar ya cifrada.
   */
  static adoptarExistente(
    input: AdoptarClientePppoeCuentaEntityProps,
  ): ClientePppoeCuentaEntity {
    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertPositiveId(input.accesoInternetId, 'accesoInternetId');

    this.assertPositiveId(input.perfilHomologacionId, 'perfilHomologacionId');

    this.assertPositiveId(input.adoptadoPorId, 'adoptadoPorId');

    if (
      input.estadoRemoto !== EstadoCuentaPppoe.ACTIVA &&
      input.estadoRemoto !== EstadoCuentaPppoe.SUSPENDIDA
    ) {
      throw new Error(
        'Una cuenta PPPoE adoptada debe encontrarse ACTIVA o SUSPENDIDA en MikroTik.',
      );
    }

    const usuario = this.normalizeUsuario(input.usuario);

    const secretoCifrado = this.normalizeRequiredString(
      input.secretoCifrado,
      'secretoCifrado',
    );

    const secretoIv = this.normalizeRequiredString(
      input.secretoIv,
      'secretoIv',
    );

    const secretoAuthTag = this.normalizeRequiredString(
      input.secretoAuthTag,
      'secretoAuthTag',
    );

    this.assertPositiveId(input.versionClave, 'versionClave');

    const fechaAdopcion = input.fechaAdopcion
      ? new Date(input.fechaAdopcion)
      : new Date();

    this.assertValidDate(fechaAdopcion, 'fechaAdopcion');

    const props: ClientePppoeCuentaEntityProps = {
      id: null,

      empresaId: input.empresaId,

      accesoInternetId: input.accesoInternetId,

      perfilHomologacionId: input.perfilHomologacionId,

      usuario,

      secretoCifrado,
      secretoIv,
      secretoAuthTag,
      versionClave: input.versionClave,

      estado: input.estadoRemoto,

      generadoPorId: null,

      adoptadoPorId: input.adoptadoPorId,

      generadoEn: fechaAdopcion,

      /**
       * Estas fechas históricas no son conocidas.
       */
      secretCreadoEn: null,
      activadoEn: null,
      suspendidoEn: null,
      eliminadoEn: null,

      adoptadoEn: fechaAdopcion,

      /**
       * Sí conocemos el momento en que verificamos
       * la existencia y estado del secret.
       */
      ultimaSincronizacionEn: fechaAdopcion,

      ultimoError: null,

      actualizadoEn: fechaAdopcion,
    };

    this.assertConsistency(props);

    return new ClientePppoeCuentaEntity(props);
  }

  /**
   * Reconstruye una cuenta obtenida desde persistencia.
   */
  static hydrate(
    input: ClientePppoeCuentaEntityProps,
  ): ClientePppoeCuentaEntity {
    this.assertPositiveId(input.id, 'id');

    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertPositiveId(input.accesoInternetId, 'accesoInternetId');

    this.assertPositiveId(input.perfilHomologacionId, 'perfilHomologacionId');

    this.assertOptionalPositiveId(input.generadoPorId, 'generadoPorId');

    this.assertOptionalPositiveId(input.adoptadoPorId, 'adoptadoPorId');

    this.assertPositiveId(input.versionClave, 'versionClave');

    this.assertValidEstado(input.estado);

    this.assertValidDate(input.generadoEn, 'generadoEn');

    this.assertOptionalValidDate(input.secretCreadoEn, 'secretCreadoEn');

    this.assertOptionalValidDate(input.activadoEn, 'activadoEn');

    this.assertOptionalValidDate(input.suspendidoEn, 'suspendidoEn');

    this.assertOptionalValidDate(input.eliminadoEn, 'eliminadoEn');

    this.assertOptionalValidDate(input.adoptadoEn, 'adoptadoEn');

    this.assertOptionalValidDate(
      input.ultimaSincronizacionEn,
      'ultimaSincronizacionEn',
    );

    this.assertValidDate(input.actualizadoEn, 'actualizadoEn');

    const props: ClientePppoeCuentaEntityProps = {
      ...input,

      usuario: this.normalizeUsuario(input.usuario),

      secretoCifrado: this.normalizeRequiredString(
        input.secretoCifrado,
        'secretoCifrado',
      ),

      secretoIv: this.normalizeRequiredString(input.secretoIv, 'secretoIv'),

      secretoAuthTag: this.normalizeRequiredString(
        input.secretoAuthTag,
        'secretoAuthTag',
      ),

      generadoPorId: input.generadoPorId ?? null,

      adoptadoPorId: input.adoptadoPorId ?? null,

      generadoEn: new Date(input.generadoEn),

      secretCreadoEn: this.cloneOptionalDate(input.secretCreadoEn),

      activadoEn: this.cloneOptionalDate(input.activadoEn),

      suspendidoEn: this.cloneOptionalDate(input.suspendidoEn),

      eliminadoEn: this.cloneOptionalDate(input.eliminadoEn),

      adoptadoEn: this.cloneOptionalDate(input.adoptadoEn),

      ultimaSincronizacionEn: this.cloneOptionalDate(
        input.ultimaSincronizacionEn,
      ),

      ultimoError: this.normalizeOptionalError(input.ultimoError),

      actualizadoEn: new Date(input.actualizadoEn),
    };

    this.assertConsistency(props);

    return new ClientePppoeCuentaEntity(props);
  }

  /*
   * Identidad y relaciones
   */

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get accesoInternetId(): number {
    return this.props.accesoInternetId;
  }

  get perfilHomologacionId(): number {
    return this.props.perfilHomologacionId;
  }

  /*
   * Credenciales protegidas
   */

  get usuario(): string {
    return this.props.usuario;
  }

  get secretoCifrado(): string {
    return this.props.secretoCifrado;
  }

  get secretoIv(): string {
    return this.props.secretoIv;
  }

  get secretoAuthTag(): string {
    return this.props.secretoAuthTag;
  }

  get versionClave(): number {
    return this.props.versionClave;
  }

  get secretoProtegido(): SecretoPppoeProtegidoProps {
    return {
      secretoCifrado: this.props.secretoCifrado,

      secretoIv: this.props.secretoIv,

      secretoAuthTag: this.props.secretoAuthTag,

      versionClave: this.props.versionClave,
    };
  }

  /*
   * Estado
   */

  get estado(): EstadoCuentaPppoe {
    return this.props.estado;
  }

  get estaPendienteActivacion(): boolean {
    return this.props.estado === EstadoCuentaPppoe.PENDIENTE_ACTIVACION;
  }

  get estaActiva(): boolean {
    return this.props.estado === EstadoCuentaPppoe.ACTIVA;
  }

  get estaSuspendida(): boolean {
    return this.props.estado === EstadoCuentaPppoe.SUSPENDIDA;
  }

  get estaEliminada(): boolean {
    return this.props.estado === EstadoCuentaPppoe.ELIMINADA;
  }

  get tieneSecretCreado(): boolean {
    return this.props.secretCreadoEn !== null || this.props.adoptadoEn !== null;
  }

  get tieneError(): boolean {
    return (
      this.props.estado === EstadoCuentaPppoe.ERROR ||
      this.props.ultimoError !== null
    );
  }

  /*
   * Auditoría
   */

  get generadoPorId(): number | null {
    return this.props.generadoPorId;
  }

  get adoptadoPorId(): number | null {
    return this.props.adoptadoPorId;
  }

  get generadoEn(): Date {
    return new Date(this.props.generadoEn);
  }

  get adoptadoEn(): Date | null {
    return ClientePppoeCuentaEntity.cloneOptionalDate(this.props.adoptadoEn);
  }

  get esAdoptada(): boolean {
    return this.props.adoptadoEn !== null;
  }

  get secretCreadoEn(): Date | null {
    return ClientePppoeCuentaEntity.cloneOptionalDate(
      this.props.secretCreadoEn,
    );
  }

  get activadoEn(): Date | null {
    return ClientePppoeCuentaEntity.cloneOptionalDate(this.props.activadoEn);
  }

  get suspendidoEn(): Date | null {
    return ClientePppoeCuentaEntity.cloneOptionalDate(this.props.suspendidoEn);
  }

  get eliminadoEn(): Date | null {
    return ClientePppoeCuentaEntity.cloneOptionalDate(this.props.eliminadoEn);
  }

  get ultimaSincronizacionEn(): Date | null {
    return ClientePppoeCuentaEntity.cloneOptionalDate(
      this.props.ultimaSincronizacionEn,
    );
  }

  get ultimoError(): string | null {
    return this.props.ultimoError;
  }

  get actualizadoEn(): Date {
    return new Date(this.props.actualizadoEn);
  }

  /*
   * Instalación y creación del secret
   */

  iniciarInstalacion(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.PENDIENTE_ACTIVACION],
      'iniciar la instalación',
    );

    this.cambiarEstado(EstadoCuentaPppoe.EN_INSTALACION, fecha);
  }

  marcarSecretCreado(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.EN_INSTALACION],
      'marcar el secret como creado',
    );

    ClientePppoeCuentaEntity.assertValidDate(fecha, 'fecha');

    if (!this.props.secretCreadoEn) {
      this.props.secretCreadoEn = new Date(fecha);
    }

    this.props.ultimaSincronizacionEn = new Date(fecha);

    this.props.ultimoError = null;

    this.touch(fecha);
  }

  /*
   * Activación
   */

  iniciarActivacion(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.EN_INSTALACION, EstadoCuentaPppoe.SUSPENDIDA],
      'iniciar la activación',
    );

    if (!this.tieneSecretCreado) {
      throw new Error(
        'No se puede activar una cuenta cuyo secret todavía no ha sido confirmado.',
      );
    }

    this.cambiarEstado(EstadoCuentaPppoe.EN_ACTIVACION, fecha);
  }

  marcarActiva(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.EN_ACTIVACION],
      'marcar la cuenta como activa',
    );

    if (!this.tieneSecretCreado) {
      throw new Error(
        'No se puede marcar como activa una cuenta sin un secret existente.',
      );
    }

    this.props.activadoEn = new Date(fecha);

    this.props.ultimaSincronizacionEn = new Date(fecha);

    this.cambiarEstado(EstadoCuentaPppoe.ACTIVA, fecha);
  }

  /*
   * Suspensión
   */

  marcarSuspendida(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.ACTIVA, EstadoCuentaPppoe.ERROR],
      'suspender la cuenta',
    );

    if (
      !this.tieneSecretCreado ||
      (!this.props.activadoEn && !this.esAdoptada)
    ) {
      throw new Error(
        'No puede suspenderse una cuenta cuyo secret no está confirmado como existente.',
      );
    }

    ClientePppoeCuentaEntity.assertValidDate(fecha, 'fecha');

    this.props.suspendidoEn = new Date(fecha);

    this.props.ultimaSincronizacionEn = new Date(fecha);

    this.cambiarEstado(EstadoCuentaPppoe.SUSPENDIDA, fecha);
  }

  confirmarSuspensionTrasReintento(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.ERROR],
      'confirmar la suspensión reintentada',
    );

    if (
      !this.tieneSecretCreado ||
      (!this.props.activadoEn && !this.esAdoptada)
    ) {
      throw new Error(
        'No puede confirmarse la suspensión de una cuenta cuyo secret no está confirmado como existente.',
      );
    }

    this.props.suspendidoEn = new Date(fecha);

    this.props.ultimaSincronizacionEn = new Date(fecha);

    this.cambiarEstado(EstadoCuentaPppoe.SUSPENDIDA, fecha);
  }

  /*
   * Desinstalación
   */

  iniciarDesinstalacion(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [
        EstadoCuentaPppoe.PENDIENTE_ACTIVACION,
        EstadoCuentaPppoe.EN_INSTALACION,
        EstadoCuentaPppoe.EN_ACTIVACION,
        EstadoCuentaPppoe.ACTIVA,
        EstadoCuentaPppoe.SUSPENDIDA,
        EstadoCuentaPppoe.ERROR,
      ],
      'iniciar la desinstalación',
    );

    this.cambiarEstado(EstadoCuentaPppoe.EN_DESINSTALACION, fecha);
  }

  marcarEliminada(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.EN_DESINSTALACION],
      'marcar la cuenta como eliminada',
    );

    this.props.eliminadoEn = new Date(fecha);

    this.props.ultimaSincronizacionEn = new Date(fecha);

    this.cambiarEstado(EstadoCuentaPppoe.ELIMINADA, fecha);
  }

  /*
   * Errores y sincronización
   */

  registrarError(mensaje: string, fecha: Date = new Date()): void {
    this.assertPersisted();
    this.assertNotDeleted();

    const error = ClientePppoeCuentaEntity.normalizeRequiredString(
      mensaje,
      'mensaje de error',
    );

    this.props.estado = EstadoCuentaPppoe.ERROR;

    this.props.ultimoError = error.slice(0, 1000);

    this.touch(fecha);
  }

  registrarSincronizacion(fecha: Date = new Date()): void {
    this.assertPersisted();

    ClientePppoeCuentaEntity.assertValidDate(fecha, 'fecha');

    this.props.ultimaSincronizacionEn = new Date(fecha);

    this.touch(fecha);
  }

  reintentarInstalacion(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.ERROR],
      'reintentar la instalación',
    );

    if (this.tieneSecretCreado) {
      throw new Error(
        'El secret ya fue creado. Debe reintentar la activación, no la instalación.',
      );
    }

    this.cambiarEstado(EstadoCuentaPppoe.EN_INSTALACION, fecha);
  }

  reintentarActivacion(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.assertCurrentState(
      [EstadoCuentaPppoe.ERROR],
      'reintentar la activación',
    );

    if (!this.tieneSecretCreado) {
      throw new Error(
        'No puede reintentarse la activación porque el secret no ha sido confirmado.',
      );
    }

    this.cambiarEstado(EstadoCuentaPppoe.EN_ACTIVACION, fecha);
  }

  /*
   * Rotación del secreto cifrado
   */

  rotarSecretoProtegido(
    secreto: SecretoPppoeProtegidoProps,
    fecha: Date = new Date(),
  ): void {
    this.assertPersisted();
    this.assertNotDeleted();

    if (secreto.versionClave <= this.props.versionClave) {
      throw new Error(
        'La nueva versión de clave debe ser mayor que la versión actual.',
      );
    }

    this.props.secretoCifrado =
      ClientePppoeCuentaEntity.normalizeRequiredString(
        secreto.secretoCifrado,
        'secretoCifrado',
      );

    this.props.secretoIv = ClientePppoeCuentaEntity.normalizeRequiredString(
      secreto.secretoIv,
      'secretoIv',
    );

    this.props.secretoAuthTag =
      ClientePppoeCuentaEntity.normalizeRequiredString(
        secreto.secretoAuthTag,
        'secretoAuthTag',
      );

    ClientePppoeCuentaEntity.assertPositiveId(
      secreto.versionClave,
      'versionClave',
    );

    this.props.versionClave = secreto.versionClave;

    this.props.ultimoError = null;

    this.touch(fecha);
  }

  /*
   * Salida para mappers
   */

  toPrimitives(): ClientePppoeCuentaEntityProps {
    return {
      id: this.props.id,

      empresaId: this.props.empresaId,

      accesoInternetId: this.props.accesoInternetId,

      perfilHomologacionId: this.props.perfilHomologacionId,

      usuario: this.props.usuario,

      secretoCifrado: this.props.secretoCifrado,

      secretoIv: this.props.secretoIv,

      secretoAuthTag: this.props.secretoAuthTag,

      versionClave: this.props.versionClave,

      estado: this.props.estado,

      generadoPorId: this.props.generadoPorId,

      adoptadoPorId: this.props.adoptadoPorId,

      generadoEn: new Date(this.props.generadoEn),

      secretCreadoEn: ClientePppoeCuentaEntity.cloneOptionalDate(
        this.props.secretCreadoEn,
      ),

      activadoEn: ClientePppoeCuentaEntity.cloneOptionalDate(
        this.props.activadoEn,
      ),

      suspendidoEn: ClientePppoeCuentaEntity.cloneOptionalDate(
        this.props.suspendidoEn,
      ),

      eliminadoEn: ClientePppoeCuentaEntity.cloneOptionalDate(
        this.props.eliminadoEn,
      ),

      adoptadoEn: ClientePppoeCuentaEntity.cloneOptionalDate(
        this.props.adoptadoEn,
      ),

      ultimaSincronizacionEn: ClientePppoeCuentaEntity.cloneOptionalDate(
        this.props.ultimaSincronizacionEn,
      ),

      ultimoError: this.props.ultimoError,

      actualizadoEn: new Date(this.props.actualizadoEn),
    };
  }

  /*
   * Reglas internas
   */

  private cambiarEstado(estado: EstadoCuentaPppoe, fecha: Date): void {
    ClientePppoeCuentaEntity.assertValidDate(fecha, 'fecha');

    this.props.estado = estado;

    this.props.ultimoError = null;

    this.touch(fecha);
  }

  private touch(fecha: Date): void {
    ClientePppoeCuentaEntity.assertValidDate(fecha, 'fecha');

    this.props.actualizadoEn = new Date(fecha);
  }

  private assertCurrentState(
    permittedStates: EstadoCuentaPppoe[],
    action: string,
  ): void {
    if (!permittedStates.includes(this.props.estado)) {
      throw new Error(
        `No se puede ${action} desde el estado ${this.props.estado}.`,
      );
    }
  }

  private assertPersisted(): void {
    if (this.props.id === null) {
      throw new Error(
        'La cuenta PPPoE debe estar persistida antes de modificar su estado.',
      );
    }
  }

  private assertNotDeleted(): void {
    if (this.props.estado === EstadoCuentaPppoe.ELIMINADA) {
      throw new Error('No se puede modificar una cuenta PPPoE eliminada.');
    }
  }

  private static assertConsistency(props: ClientePppoeCuentaEntityProps): void {
    const esAdoptada = props.adoptadoEn !== null;

    if ((props.adoptadoEn === null) !== (props.adoptadoPorId === null)) {
      throw new Error(
        'Una cuenta adoptada debe tener adoptadoEn y adoptadoPorId de forma consistente.',
      );
    }

    if (props.activadoEn && !props.secretCreadoEn && !esAdoptada) {
      throw new Error(
        'Una cuenta activada debe tener una fecha de creación del secret.',
      );
    }

    if (props.suspendidoEn && !props.secretCreadoEn && !esAdoptada) {
      throw new Error('Una cuenta suspendida debe tener un secret creado.');
    }

    if (
      props.estado === EstadoCuentaPppoe.ACTIVA &&
      !props.activadoEn &&
      !esAdoptada
    ) {
      throw new Error('Una cuenta activa debe tener una fecha de activación.');
    }

    if (
      props.estado === EstadoCuentaPppoe.SUSPENDIDA &&
      !props.suspendidoEn &&
      !esAdoptada
    ) {
      throw new Error(
        'Una cuenta suspendida debe tener una fecha de suspensión.',
      );
    }

    if (props.estado === EstadoCuentaPppoe.ELIMINADA && !props.eliminadoEn) {
      throw new Error(
        'Una cuenta eliminada debe tener una fecha de eliminación.',
      );
    }
  }

  private static normalizeUsuario(value: string): string {
    const normalized = this.normalizeRequiredString(value, 'usuario');

    if (/\s/.test(normalized)) {
      throw new Error('El usuario PPPoE no puede contener espacios.');
    }

    if (normalized.length > 128) {
      throw new Error('El usuario PPPoE no puede superar los 128 caracteres.');
    }

    return normalized;
  }

  private static normalizeRequiredString(value: string, field: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    return normalized;
  }

  private static normalizeOptionalError(value: string | null): string | null {
    if (value === null) {
      return null;
    }

    const normalized = value.trim();

    return normalized ? normalized.slice(0, 1000) : null;
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

  private static assertValidEstado(value: EstadoCuentaPppoe): void {
    if (!Object.values(EstadoCuentaPppoe).includes(value)) {
      throw new Error(`Estado de cuenta PPPoE inválido: ${value}.`);
    }
  }

  private static assertValidDate(value: Date, field: string): void {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }

  private static assertOptionalValidDate(
    value: Date | null,
    field: string,
  ): void {
    if (value === null) {
      return;
    }

    this.assertValidDate(value, field);
  }

  private static cloneOptionalDate(value: Date | null): Date | null {
    return value ? new Date(value) : null;
  }
}
