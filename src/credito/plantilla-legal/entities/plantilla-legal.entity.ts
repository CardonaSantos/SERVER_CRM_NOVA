import { TipoPlantillaLegal } from '@prisma/client';

export class PlantillaLegal {
  private constructor(
    readonly id: number,
    readonly tipo: TipoPlantillaLegal,
    readonly nombre: string,
    readonly contenido: string,
    readonly version: string,
    readonly activa: boolean,
    readonly creadoEn: Date,
    readonly actualizadoEn: Date,
  ) {}

  // =========================
  // Rehidratación (desde DB)
  // =========================
  static rehidratar(props: {
    id: number;
    tipo: TipoPlantillaLegal;
    nombre: string;
    contenido: string;
    version: string;
    activa: boolean;
    creadoEn: Date;
    actualizadoEn: Date;
  }): PlantillaLegal {
    return new PlantillaLegal(
      props.id,
      props.tipo,
      props.nombre,
      props.contenido,
      props.version,
      props.activa,
      props.creadoEn,
      props.actualizadoEn,
    );
  }

  // =========================
  // Creación (nueva plantilla)
  // =========================
  static crear(props: {
    tipo: TipoPlantillaLegal;
    nombre: string;
    contenido: string;
    version: string;
  }): PlantillaLegal {
    if (!props.nombre.trim()) {
      throw new Error('El nombre de la plantilla es obligatorio');
    }

    if (!props.contenido.trim()) {
      throw new Error('El contenido de la plantilla no puede estar vacío');
    }

    return new PlantillaLegal(
      0,
      props.tipo,
      props.nombre,
      props.contenido,
      props.version,
      true, // activa por defecto
      new Date(),
      new Date(),
    );
  }

  // =========================
  // Reglas de dominio
  // =========================

  desactivar(): PlantillaLegal {
    if (!this.activa) return this;

    return PlantillaLegal.rehidratar({
      ...this,
      activa: false,
      actualizadoEn: new Date(),
    });
  }

  activar(): PlantillaLegal {
    if (this.activa) return this;

    return PlantillaLegal.rehidratar({
      ...this,
      activa: true,
      actualizadoEn: new Date(),
    });
  }

  actualizarContenido(props: {
    contenido: string;
    version: string;
  }): PlantillaLegal {
    if (!props.contenido.trim()) {
      throw new Error('El contenido no puede estar vacío');
    }

    return PlantillaLegal.rehidratar({
      ...this,
      contenido: props.contenido,
      version: props.version,
      actualizadoEn: new Date(),
    });
  }
}
