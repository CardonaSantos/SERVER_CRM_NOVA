import { ContratoDatosInvalidosError } from '../errors/contrato-cliente.errors';
import {
  CrearPlantillaContratoProps,
  PlantillaContratoProps,
} from '../props/plantilla-contrato.props';

export class PlantillaContratoEntity {
  private constructor(private props: PlantillaContratoProps) {}

  static create(
    input: CrearPlantillaContratoProps,
    ahora: Date,
  ): PlantillaContratoEntity {
    return new PlantillaContratoEntity({
      id: null,
      nombre: exigirNombre(input.nombre),
      body: exigirTexto(input.body),
      empresaId: input.empresaId,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  static hydrate(props: PlantillaContratoProps): PlantillaContratoEntity {
    return new PlantillaContratoEntity({ ...props });
  }

  /** Solo cambia lo que llega. */
  actualizar(cambios: { nombre?: string; body?: string }, fecha: Date): void {
    const nombre =
      cambios.nombre === undefined
        ? this.props.nombre
        : exigirNombre(cambios.nombre);
    const body =
      cambios.body === undefined ? this.props.body : exigirTexto(cambios.body);

    this.props = { ...this.props, nombre, body, actualizadoEn: fecha };
  }

  get id(): number | null {
    return this.props.id;
  }

  toPrimitives(): PlantillaContratoProps {
    return { ...this.props };
  }
}

function exigirNombre(nombre: string): string {
  const limpio = nombre.trim();
  if (!limpio) {
    throw new ContratoDatosInvalidosError(
      'El nombre de la plantilla es obligatorio.',
    );
  }
  return limpio;
}

// El texto se guarda tal cual: los saltos de línea forman parte del documento.
function exigirTexto(body: string): string {
  if (!body.trim()) {
    throw new ContratoDatosInvalidosError(
      'El contenido de la plantilla es obligatorio.',
    );
  }
  return body;
}
