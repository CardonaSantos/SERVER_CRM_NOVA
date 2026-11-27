import {
  SectorEliminadoError,
  SectorInvalidoError,
} from '../errors/ubicacion.errors';
import {
  ActualizarSectorProps,
  CrearSectorProps,
  SectorProps,
} from '../props/sector.props';

const LARGO_MAXIMO_NOMBRE = 100;
const LARGO_MAXIMO_DESCRIPCION = 500;

function exigirNombre(nombre: string): string {
  const limpio = nombre.trim();
  if (limpio === '' || limpio.length > LARGO_MAXIMO_NOMBRE) {
    throw new SectorInvalidoError(
      `El nombre es obligatorio y admite hasta ${LARGO_MAXIMO_NOMBRE} caracteres.`,
    );
  }

  return limpio;
}

/** Un texto vacío equivale a no tener descripción. */
function descripcionDe(descripcion: string | null | undefined): string | null {
  const limpia = descripcion?.trim() ?? '';
  if (limpia.length > LARGO_MAXIMO_DESCRIPCION) {
    throw new SectorInvalidoError(
      `La descripción admite hasta ${LARGO_MAXIMO_DESCRIPCION} caracteres.`,
    );
  }

  return limpia === '' ? null : limpia;
}

/** Parte de un municipio en la que se agrupan los clientes. */
export class SectorEntity {
  private constructor(private props: SectorProps) {}

  static create(input: CrearSectorProps, ahora: Date): SectorEntity {
    return new SectorEntity({
      id: null,
      nombre: exigirNombre(input.nombre),
      descripcion: descripcionDe(input.descripcion),
      municipioId: input.municipioId,
      creadoEn: ahora,
      actualizadoEn: ahora,
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  /** Reconstruye desde persistencia sin imponer reglas nuevas a filas antiguas. */
  static hydrate(props: SectorProps): SectorEntity {
    if (props.id === null) {
      throw new SectorInvalidoError('El sector no tiene identificador.');
    }

    return new SectorEntity({ ...props });
  }

  asegurarVigente(): void {
    if (this.props.eliminadoEn) throw new SectorEliminadoError();
  }

  /** Que pueda cambiar de municipio lo comprueba el caso de uso. */
  actualizar(cambios: ActualizarSectorProps, fecha: Date): void {
    this.asegurarVigente();

    // Todo se valida antes de cambiar algo.
    const nombre =
      cambios.nombre === undefined
        ? this.props.nombre
        : exigirNombre(cambios.nombre);
    const descripcion =
      cambios.descripcion === undefined
        ? this.props.descripcion
        : descripcionDe(cambios.descripcion);

    this.props = {
      ...this.props,
      nombre,
      descripcion,
      municipioId: cambios.municipioId ?? this.props.municipioId,
      actualizadoEn: fecha,
    };
  }

  /** Borrado lógico. Que no tenga clientes lo comprueba el caso de uso. */
  eliminar(usuarioId: number, fecha: Date): void {
    this.asegurarVigente();
    this.props = {
      ...this.props,
      eliminadoEn: fecha,
      eliminadoPorId: usuarioId,
      actualizadoEn: fecha,
    };
  }

  get id(): number | null {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get municipioId(): number {
    return this.props.municipioId;
  }

  toPrimitives(): SectorProps {
    return { ...this.props };
  }
}
