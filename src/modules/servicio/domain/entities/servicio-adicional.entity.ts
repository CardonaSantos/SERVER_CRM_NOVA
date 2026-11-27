import { EstadoServicio } from '../enums/estado-servicio.enum';
import {
  ServicioAdicionalEliminadoError,
  ServicioAdicionalInvalidoError,
} from '../errors/servicio.errors';
import {
  exigirNombre,
  exigirPrecio,
  LARGO_MAXIMO_DESCRIPCION,
  textoOpcional,
} from '../policies/catalogo.policy';
import {
  ActualizarServicioAdicionalProps,
  CrearServicioAdicionalProps,
  ServicioAdicionalProps,
} from '../props/servicio-adicional.props';

const invalido = (mensaje: string) =>
  new ServicioAdicionalInvalidoError(mensaje);

const descripcionDe = (descripcion: string | null | undefined) =>
  textoOpcional(
    descripcion,
    'La descripción',
    LARGO_MAXIMO_DESCRIPCION,
    invalido,
  );

/** Servicio que se contrata aparte del plan de internet. */
export class ServicioAdicionalEntity {
  private constructor(private props: ServicioAdicionalProps) {}

  static create(
    input: CrearServicioAdicionalProps,
    ahora: Date,
  ): ServicioAdicionalEntity {
    return new ServicioAdicionalEntity({
      id: null,
      empresaId: input.empresaId,
      nombre: exigirNombre(input.nombre, invalido),
      descripcion: descripcionDe(input.descripcion),
      precio: exigirPrecio(input.precio, invalido),
      estado: EstadoServicio.ACTIVO,
      tipoServicioId: input.tipoServicioId ?? null,
      creadoEn: ahora,
      actualizadoEn: ahora,
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  /** Reconstruye desde persistencia sin imponer reglas nuevas a filas antiguas. */
  static hydrate(props: ServicioAdicionalProps): ServicioAdicionalEntity {
    if (props.id === null) {
      throw invalido('El servicio no tiene identificador.');
    }

    return new ServicioAdicionalEntity({ ...props });
  }

  asegurarVigente(): void {
    if (this.props.eliminadoEn) throw new ServicioAdicionalEliminadoError();
  }

  actualizar(cambios: ActualizarServicioAdicionalProps, fecha: Date): void {
    this.asegurarVigente();

    // Todo se valida antes de cambiar algo.
    const nombre =
      cambios.nombre === undefined
        ? this.props.nombre
        : exigirNombre(cambios.nombre, invalido);
    const descripcion =
      cambios.descripcion === undefined
        ? this.props.descripcion
        : descripcionDe(cambios.descripcion);
    const precio =
      cambios.precio === undefined
        ? this.props.precio
        : exigirPrecio(cambios.precio, invalido);

    this.props = {
      ...this.props,
      nombre,
      descripcion,
      precio,
      estado: cambios.estado ?? this.props.estado,
      tipoServicioId:
        cambios.tipoServicioId === undefined
          ? this.props.tipoServicioId
          : cambios.tipoServicioId,
      actualizadoEn: fecha,
    };
  }

  /** Borrado lógico. Que no tenga uso lo comprueba el caso de uso. */
  eliminar(usuarioId: number, fecha: Date): void {
    this.asegurarVigente();
    this.props = {
      ...this.props,
      estado: EstadoServicio.INACTIVO,
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

  get activo(): boolean {
    return this.props.estado === EstadoServicio.ACTIVO;
  }

  toPrimitives(): ServicioAdicionalProps {
    return { ...this.props };
  }
}
