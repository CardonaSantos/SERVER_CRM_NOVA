import { EstadoServicio } from '../enums/estado-servicio.enum';
import { TipoServicioInvalidoError } from '../errors/servicio.errors';
import {
  exigirNombre,
  LARGO_MAXIMO_DESCRIPCION,
  textoOpcional,
} from '../policies/catalogo.policy';
import {
  CrearTipoServicioProps,
  TipoServicioProps,
} from '../props/tipo-servicio.props';

const invalido = (mensaje: string) => new TipoServicioInvalidoError(mensaje);

/** Categoría de los servicios adicionales. */
export class TipoServicioEntity {
  private constructor(private props: TipoServicioProps) {}

  static create(
    input: CrearTipoServicioProps,
    ahora: Date,
  ): TipoServicioEntity {
    return new TipoServicioEntity({
      id: null,
      nombre: exigirNombre(input.nombre, invalido),
      descripcion: textoOpcional(
        input.descripcion,
        'La descripción',
        LARGO_MAXIMO_DESCRIPCION,
        invalido,
      ),
      estado: EstadoServicio.ACTIVO,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  static hydrate(props: TipoServicioProps): TipoServicioEntity {
    if (props.id === null) {
      throw invalido('El tipo de servicio no tiene identificador.');
    }

    return new TipoServicioEntity({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  toPrimitives(): TipoServicioProps {
    return { ...this.props };
  }
}
