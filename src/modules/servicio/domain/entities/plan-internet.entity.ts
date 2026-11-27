import { EstadoServicio } from '../enums/estado-servicio.enum';
import {
  PlanInternetEliminadoError,
  PlanInternetInvalidoError,
} from '../errors/servicio.errors';
import {
  exigirNombre,
  exigirPrecio,
  LARGO_MAXIMO_NOMBRE,
  textoOpcional,
} from '../policies/catalogo.policy';
import {
  ActualizarPlanInternetProps,
  CrearPlanInternetProps,
  PlanInternetProps,
} from '../props/plan-internet.props';

const invalido = (mensaje: string) => new PlanInternetInvalidoError(mensaje);

const velocidadDe = (velocidad: string | null | undefined) =>
  textoOpcional(velocidad, 'La velocidad', LARGO_MAXIMO_NOMBRE, invalido);

/** Plan de internet. De su precio salen las facturas de sus clientes. */
export class PlanInternetEntity {
  private constructor(private props: PlanInternetProps) {}

  static create(
    input: CrearPlanInternetProps,
    ahora: Date,
  ): PlanInternetEntity {
    return new PlanInternetEntity({
      id: null,
      empresaId: input.empresaId,
      nombre: exigirNombre(input.nombre, invalido),
      velocidad: velocidadDe(input.velocidad),
      precio: exigirPrecio(input.precio, invalido),
      estado: EstadoServicio.ACTIVO,
      creadoEn: ahora,
      actualizadoEn: ahora,
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  /** Reconstruye desde persistencia sin imponer reglas nuevas a filas antiguas. */
  static hydrate(props: PlanInternetProps): PlanInternetEntity {
    if (props.id === null) {
      throw invalido('El plan no tiene identificador.');
    }

    return new PlanInternetEntity({ ...props });
  }

  asegurarVigente(): void {
    if (this.props.eliminadoEn) throw new PlanInternetEliminadoError();
  }

  actualizar(cambios: ActualizarPlanInternetProps, fecha: Date): void {
    this.asegurarVigente();

    // Todo se valida antes de cambiar algo.
    const nombre =
      cambios.nombre === undefined
        ? this.props.nombre
        : exigirNombre(cambios.nombre, invalido);
    const velocidad =
      cambios.velocidad === undefined
        ? this.props.velocidad
        : velocidadDe(cambios.velocidad);

    this.props = {
      ...this.props,
      nombre,
      velocidad,
      estado: cambios.estado ?? this.props.estado,
      actualizadoEn: fecha,
    };
  }

  /** @returns `false` si ya tenía ese precio. */
  cambiarPrecio(precio: number, fecha: Date): boolean {
    this.asegurarVigente();
    const nuevo = exigirPrecio(precio, invalido);
    if (nuevo === this.props.precio) return false;

    this.props = { ...this.props, precio: nuevo, actualizadoEn: fecha };

    return true;
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

  get precio(): number {
    return this.props.precio;
  }

  get activo(): boolean {
    return this.props.estado === EstadoServicio.ACTIVO;
  }

  toPrimitives(): PlanInternetProps {
    return { ...this.props };
  }
}
