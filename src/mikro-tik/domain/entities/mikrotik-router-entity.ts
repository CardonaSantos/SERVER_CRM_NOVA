import {
  ActualizarMikrotikRouterEntityProps,
  CrearMikrotikRouterEntityProps,
  MikrotikRouterEntityProps,
} from '../props/mikrotik-router.props';

export class MikrotikRouterEntity {
  private static readonly DEFAULT_SSH_PORT = 22;

  private static readonly MAX_NAME_LENGTH = 160;

  private static readonly MAX_HOST_LENGTH = 255;

  private static readonly MAX_USERNAME_LENGTH = 160;

  private static readonly MAX_DESCRIPTION_LENGTH = 2_000;

  private constructor(private readonly props: MikrotikRouterEntityProps) {}

  static create(input: CrearMikrotikRouterEntityProps): MikrotikRouterEntity {
    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertOptionalPositiveId(input.oltId, 'oltId');

    const now = new Date();

    return new MikrotikRouterEntity({
      id: null,

      empresaId: input.empresaId,

      nombre: this.normalizeRequiredString(
        input.nombre,
        'nombre',
        this.MAX_NAME_LENGTH,
      ),

      host: this.normalizeRequiredString(
        input.host,
        'host',
        this.MAX_HOST_LENGTH,
      ),

      sshPort: this.normalizeNetworkPort(
        input.sshPort ?? this.DEFAULT_SSH_PORT,
      ),

      usuario: this.normalizeRequiredString(
        input.usuario,
        'usuario',
        this.MAX_USERNAME_LENGTH,
      ),

      descripcion: this.normalizeOptionalString(
        input.descripcion ?? null,
        this.MAX_DESCRIPTION_LENGTH,
      ),

      activo: input.activo ?? true,

      oltId: input.oltId ?? null,

      passwordEnc: this.normalizeProtectedCredential(input.passwordEnc),

      creadoEn: now,
      actualizadoEn: now,
    });
  }

  static hydrate(input: MikrotikRouterEntityProps): MikrotikRouterEntity {
    this.assertPositiveId(input.id, 'id');

    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertOptionalPositiveId(input.oltId, 'oltId');

    this.assertValidDate(input.creadoEn, 'creadoEn');

    this.assertValidDate(input.actualizadoEn, 'actualizadoEn');

    if (input.actualizadoEn.getTime() < input.creadoEn.getTime()) {
      throw new Error('actualizadoEn no puede ser anterior a creadoEn.');
    }

    return new MikrotikRouterEntity({
      id: input.id,

      empresaId: input.empresaId,

      nombre: this.normalizeRequiredString(
        input.nombre,
        'nombre',
        this.MAX_NAME_LENGTH,
      ),

      host: this.normalizeRequiredString(
        input.host,
        'host',
        this.MAX_HOST_LENGTH,
      ),

      sshPort: this.normalizeNetworkPort(input.sshPort),

      usuario: this.normalizeRequiredString(
        input.usuario,
        'usuario',
        this.MAX_USERNAME_LENGTH,
      ),

      descripcion: this.normalizeOptionalString(
        input.descripcion,
        this.MAX_DESCRIPTION_LENGTH,
      ),

      activo: Boolean(input.activo),

      oltId: input.oltId ?? null,

      passwordEnc: input.passwordEnc
        ? this.normalizeProtectedCredential(input.passwordEnc)
        : null,

      creadoEn: new Date(input.creadoEn),

      actualizadoEn: new Date(input.actualizadoEn),
    });
  }

  actualizar(
    input: ActualizarMikrotikRouterEntityProps,
    fecha: Date = new Date(),
  ): void {
    this.assertPersisted();

    if (input.nombre !== undefined) {
      this.props.nombre = MikrotikRouterEntity.normalizeRequiredString(
        input.nombre,
        'nombre',
        MikrotikRouterEntity.MAX_NAME_LENGTH,
      );
    }

    if (input.host !== undefined) {
      this.props.host = MikrotikRouterEntity.normalizeRequiredString(
        input.host,
        'host',
        MikrotikRouterEntity.MAX_HOST_LENGTH,
      );
    }

    if (input.sshPort !== undefined) {
      this.props.sshPort = MikrotikRouterEntity.normalizeNetworkPort(
        input.sshPort,
      );
    }

    if (input.usuario !== undefined) {
      this.props.usuario = MikrotikRouterEntity.normalizeRequiredString(
        input.usuario,
        'usuario',
        MikrotikRouterEntity.MAX_USERNAME_LENGTH,
      );
    }

    if (input.descripcion !== undefined) {
      this.props.descripcion = MikrotikRouterEntity.normalizeOptionalString(
        input.descripcion,
        MikrotikRouterEntity.MAX_DESCRIPTION_LENGTH,
      );
    }

    if (input.activo !== undefined) {
      this.props.activo = input.activo;
    }

    if (input.oltId !== undefined) {
      MikrotikRouterEntity.assertOptionalPositiveId(input.oltId, 'oltId');

      this.props.oltId = input.oltId ?? null;
    }

    if (input.passwordEnc !== undefined) {
      this.props.passwordEnc =
        MikrotikRouterEntity.normalizeProtectedCredential(input.passwordEnc);
    }

    this.touch(fecha);
  }

  activar(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.props.activo = true;

    this.touch(fecha);
  }

  desactivar(fecha: Date = new Date()): void {
    this.assertPersisted();

    this.props.activo = false;

    this.touch(fecha);
  }

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get host(): string {
    return this.props.host;
  }

  get sshPort(): number {
    return this.props.sshPort;
  }

  get usuario(): string {
    return this.props.usuario;
  }

  get descripcion(): string | null {
    return this.props.descripcion;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  get oltId(): number | null {
    return this.props.oltId;
  }

  /**
   * Solo debe consumirse dentro de aplicación
   * o infraestructura.
   */
  get passwordEnc(): string | null {
    return this.props.passwordEnc;
  }

  get tieneCredencialSsh(): boolean {
    return this.props.passwordEnc !== null;
  }

  get creadoEn(): Date {
    return new Date(this.props.creadoEn);
  }

  get actualizadoEn(): Date {
    return new Date(this.props.actualizadoEn);
  }

  perteneceAEmpresa(empresaId: number): boolean {
    return this.props.empresaId === empresaId;
  }

  toPrimitives(): MikrotikRouterEntityProps {
    return {
      id: this.props.id,

      empresaId: this.props.empresaId,

      nombre: this.props.nombre,

      host: this.props.host,

      sshPort: this.props.sshPort,

      usuario: this.props.usuario,

      descripcion: this.props.descripcion,

      activo: this.props.activo,

      oltId: this.props.oltId,

      passwordEnc: this.props.passwordEnc,

      creadoEn: new Date(this.props.creadoEn),

      actualizadoEn: new Date(this.props.actualizadoEn),
    };
  }

  private assertPersisted(): void {
    if (this.props.id === null) {
      throw new Error(
        'El router MikroTik debe estar persistido antes de modificarse.',
      );
    }
  }

  private touch(fecha: Date): void {
    MikrotikRouterEntity.assertValidDate(fecha, 'fecha');

    this.props.actualizadoEn = new Date(fecha);
  }

  private static normalizeRequiredString(
    value: string,
    field: string,
    maxLength: number,
  ): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    if (normalized.length > maxLength) {
      throw new Error(`${field} no puede superar ${maxLength} caracteres.`);
    }

    return normalized;
  }

  private static normalizeOptionalString(
    value: string | null,
    maxLength: number,
  ): string | null {
    if (value === null) {
      return null;
    }

    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    if (normalized.length > maxLength) {
      throw new Error(`El texto no puede superar ${maxLength} caracteres.`);
    }

    return normalized;
  }

  private static normalizeNetworkPort(value: number): number {
    if (!Number.isInteger(value) || value < 1 || value > 65_535) {
      throw new Error('sshPort debe ser un puerto válido entre 1 y 65535.');
    }

    return value;
  }

  private static normalizeProtectedCredential(value: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error('passwordEnc es obligatorio.');
    }

    return normalized;
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

  private static assertValidDate(value: Date, field: string): void {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`${field} debe contener una fecha válida.`);
    }
  }
}
