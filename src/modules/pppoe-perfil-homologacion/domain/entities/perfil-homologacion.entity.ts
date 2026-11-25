import { PerfilHomologacionDatosInvalidosError } from '../errors/pppoe-perfil-homologacion.errors';
import {
  CrearPerfilHomologacionProps,
  PerfilHomologacionProps,
} from '../props/perfil-homologacion.props';

const LARGO_MAXIMO_CODIGO = 100;

/** Homologación de un servicio de internet con un profile de un MikroTik. */
export class PerfilHomologacionEntity {
  private constructor(private readonly props: PerfilHomologacionProps) {}

  /** Nace activa. */
  static create(
    input: CrearPerfilHomologacionProps,
    ahora: Date,
  ): PerfilHomologacionEntity {
    assertIdPositivo(input.empresaId, 'empresaId');
    assertIdPositivo(input.mikrotikRouterId, 'mikrotikRouterId');
    assertIdPositivo(input.servicioInternetId, 'servicioInternetId');
    assertIdOpcional(input.creadoPorId, 'creadoPorId');
    assertFecha(ahora, 'ahora');

    return new PerfilHomologacionEntity({
      id: null,
      empresaId: input.empresaId,
      mikrotikRouterId: input.mikrotikRouterId,
      servicioInternetId: input.servicioInternetId,
      codigoPerfil: normalizarCodigo(input.codigoPerfil),
      activo: true,
      creadoPorId: input.creadoPorId ?? null,
      actualizadoPorId: null,
      creadoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
    });
  }

  static hydrate(props: PerfilHomologacionProps): PerfilHomologacionEntity {
    assertIdPositivo(props.id, 'id');
    assertIdPositivo(props.empresaId, 'empresaId');
    assertIdPositivo(props.mikrotikRouterId, 'mikrotikRouterId');
    assertIdPositivo(props.servicioInternetId, 'servicioInternetId');
    assertIdOpcional(props.creadoPorId, 'creadoPorId');
    assertIdOpcional(props.actualizadoPorId, 'actualizadoPorId');
    assertFecha(props.creadoEn, 'creadoEn');
    assertFecha(props.actualizadoEn, 'actualizadoEn');

    return new PerfilHomologacionEntity({
      ...props,
      codigoPerfil: normalizarCodigo(props.codigoPerfil),
      creadoEn: new Date(props.creadoEn),
      actualizadoEn: new Date(props.actualizadoEn),
    });
  }

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

  get codigoPerfil(): string {
    return this.props.codigoPerfil;
  }

  get activo(): boolean {
    return this.props.activo;
  }

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

  /** Cambia el nombre del profile; router y servicio quedan igual. */
  actualizarCodigoPerfil(
    codigoPerfil: string,
    actualizadoPorId: number,
    fecha: Date,
  ): void {
    this.assertPersistida();
    assertIdPositivo(actualizadoPorId, 'actualizadoPorId');

    const codigo = normalizarCodigo(codigoPerfil);
    if (codigo === this.props.codigoPerfil) return;

    this.props.codigoPerfil = codigo;
    this.registrarActualizacion(actualizadoPorId, fecha);
  }

  /** Vuelve a ofrecerla para prealtas nuevas. */
  activar(actualizadoPorId: number, fecha: Date): void {
    this.assertPersistida();
    assertIdPositivo(actualizadoPorId, 'actualizadoPorId');
    if (this.props.activo) return;

    this.props.activo = true;
    this.registrarActualizacion(actualizadoPorId, fecha);
  }

  /** Deja de ofrecerla para prealtas sin borrar su historial. */
  desactivar(actualizadoPorId: number, fecha: Date): void {
    this.assertPersistida();
    assertIdPositivo(actualizadoPorId, 'actualizadoPorId');
    if (!this.props.activo) return;

    this.props.activo = false;
    this.registrarActualizacion(actualizadoPorId, fecha);
  }

  toPrimitives(): PerfilHomologacionProps {
    return {
      ...this.props,
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
    };
  }

  private registrarActualizacion(actualizadoPorId: number, fecha: Date): void {
    assertFecha(fecha, 'fecha');
    this.props.actualizadoPorId = actualizadoPorId;
    this.props.actualizadoEn = new Date(fecha);
  }

  private assertPersistida(): void {
    if (this.props.id === null) {
      throw new Error('La homologación debe persistirse antes de modificarse.');
    }
  }
}

function normalizarCodigo(valor: string): string {
  const codigo = valor?.trim();

  if (!codigo) {
    throw new PerfilHomologacionDatosInvalidosError(
      'El código del perfil es obligatorio.',
    );
  }
  if (codigo.length > LARGO_MAXIMO_CODIGO) {
    throw new PerfilHomologacionDatosInvalidosError(
      `El código del perfil no puede superar los ${LARGO_MAXIMO_CODIGO} caracteres.`,
    );
  }

  return codigo;
}

function assertIdPositivo(valor: number | null, campo: string): void {
  if (valor === null || !Number.isInteger(valor) || valor <= 0) {
    throw new PerfilHomologacionDatosInvalidosError(
      `${campo} debe ser un identificador entero positivo.`,
    );
  }
}

function assertIdOpcional(
  valor: number | null | undefined,
  campo: string,
): void {
  if (valor !== null && valor !== undefined) assertIdPositivo(valor, campo);
}

function assertFecha(valor: Date, campo: string): void {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
    throw new PerfilHomologacionDatosInvalidosError(
      `${campo} debe ser una fecha válida.`,
    );
  }
}
