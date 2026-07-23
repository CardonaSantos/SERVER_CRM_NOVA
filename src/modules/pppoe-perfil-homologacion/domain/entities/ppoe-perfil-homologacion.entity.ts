import {
  CrearPerfilHomologadoEntityProps,
  PerfilHomologadoEntityProps,
} from '../props/entity-props.props';

export class PerfilHomologacionEntity {
  private constructor(private readonly props: PerfilHomologadoEntityProps) {}

  /**
   * Crea una nueva homologación.
   *
   *
   */
  static create(
    input: CrearPerfilHomologadoEntityProps,
  ): PerfilHomologacionEntity {
    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertPositiveId(input.mikrotikRouterId, 'mikrotikRouterId');

    this.assertPositiveId(input.servicioInternetId, 'servicioInternetId');

    this.assertOptionalPositiveId(input.creadoPorId, 'creadoPorId');

    const codigoPerfil = this.normalizeCodigoPerfil(input.codigoPerfil);

    const now = new Date();

    return new PerfilHomologacionEntity({
      id: null,

      empresaId: input.empresaId,
      mikrotikRouterId: input.mikrotikRouterId,
      servicioInternetId: input.servicioInternetId,

      codigoPerfil,
      activo: true,

      creadoPorId: input.creadoPorId ?? null,
      actualizadoPorId: null,

      creadoEn: now,
      actualizadoEn: now,
    });
  }

  /**
   * Reconstruye una homologación ya persistida.
   *
   * mapper Prisma
   */
  static hydrate(props: PerfilHomologadoEntityProps): PerfilHomologacionEntity {
    this.assertPositiveId(props.id, 'id');
    this.assertPositiveId(props.empresaId, 'empresaId');

    this.assertPositiveId(props.mikrotikRouterId, 'mikrotikRouterId');

    this.assertPositiveId(props.servicioInternetId, 'servicioInternetId');

    this.assertOptionalPositiveId(props.creadoPorId, 'creadoPorId');

    this.assertOptionalPositiveId(props.actualizadoPorId, 'actualizadoPorId');

    this.assertValidDate(props.creadoEn, 'creadoEn');

    this.assertValidDate(props.actualizadoEn, 'actualizadoEn');

    return new PerfilHomologacionEntity({
      ...props,

      codigoPerfil: this.normalizeCodigoPerfil(props.codigoPerfil),

      creadoEn: new Date(props.creadoEn),
      actualizadoEn: new Date(props.actualizadoEn),
    });
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

  get mikrotikRouterId(): number {
    return this.props.mikrotikRouterId;
  }

  get servicioInternetId(): number {
    return this.props.servicioInternetId;
  }

  /*
   * Datos de homologación
   */

  get codigoPerfil(): string {
    return this.props.codigoPerfil;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  get estaActiva(): boolean {
    return this.props.activo;
  }

  /*
   * Auditoría
   */

  get creadoPorId(): number | null {
    return this.props.creadoPorId;
  }

  get actualizadoPorId(): number | null {
    return this.props.actualizadoPorId;
  }

  get creadoEn(): Date {
    return new Date(this.props.creadoEn);
  }

  get actualizadoEn(): Date {
    return new Date(this.props.actualizadoEn);
  }

  /*
   * Comportamiento
   */

  /**
   * Cambia el código real del profile existente en MikroTik.
   *
   * No cambia el router ni el servicio vinculados.
   */
  actualizarCodigoPerfil(
    codigoPerfil: string,
    actualizadoPorId: number,
    fecha: Date = new Date(),
  ): void {
    this.assertPersisted();

    PerfilHomologacionEntity.assertPositiveId(
      actualizadoPorId,
      'actualizadoPorId',
    );

    const codigoNormalizado =
      PerfilHomologacionEntity.normalizeCodigoPerfil(codigoPerfil);

    if (codigoNormalizado === this.props.codigoPerfil) {
      return;
    }

    this.props.codigoPerfil = codigoNormalizado;

    this.registrarActualizacion(actualizadoPorId, fecha);
  }

  /**
   * Habilita la homologación para ser utilizada
   * durante nuevas prealtas PPPoE.
   */
  activar(actualizadoPorId: number, fecha: Date = new Date()): void {
    this.assertPersisted();

    PerfilHomologacionEntity.assertPositiveId(
      actualizadoPorId,
      'actualizadoPorId',
    );

    if (this.props.activo) {
      return;
    }

    this.props.activo = true;

    this.registrarActualizacion(actualizadoPorId, fecha);
  }

  /**
   * Deshabilita la homologación sin eliminar su historial.
   */
  desactivar(actualizadoPorId: number, fecha: Date = new Date()): void {
    this.assertPersisted();

    PerfilHomologacionEntity.assertPositiveId(
      actualizadoPorId,
      'actualizadoPorId',
    );

    if (!this.props.activo) {
      return;
    }

    this.props.activo = false;

    this.registrarActualizacion(actualizadoPorId, fecha);
  }

  /*
   * Salida para persistencia
   */

  toPrimitives(): PerfilHomologadoEntityProps {
    return {
      id: this.props.id,

      empresaId: this.props.empresaId,

      mikrotikRouterId: this.props.mikrotikRouterId,

      servicioInternetId: this.props.servicioInternetId,

      codigoPerfil: this.props.codigoPerfil,
      activo: this.props.activo,

      creadoPorId: this.props.creadoPorId,

      actualizadoPorId: this.props.actualizadoPorId,

      creadoEn: new Date(this.props.creadoEn),

      actualizadoEn: new Date(this.props.actualizadoEn),
    };
  }

  /*
   * Reglas internas
   */

  private registrarActualizacion(actualizadoPorId: number, fecha: Date): void {
    PerfilHomologacionEntity.assertValidDate(fecha, 'fecha');

    this.props.actualizadoPorId = actualizadoPorId;

    this.props.actualizadoEn = new Date(fecha);
  }

  private assertPersisted(): void {
    if (this.props.id === null) {
      throw new Error(
        'La homologación debe estar persistida antes de actualizarse.',
      );
    }
  }

  private static normalizeCodigoPerfil(value: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error('El código del perfil es obligatorio.');
    }

    if (normalized.length > 100) {
      throw new Error(
        'El código del perfil no puede superar los 100 caracteres.',
      );
    }

    return normalized;
  }

  private static assertPositiveId(value: number | null, field: string): void {
    if (value === null || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un identificador entero positivo.`);
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
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }
}
