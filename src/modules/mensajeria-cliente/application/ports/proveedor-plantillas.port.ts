import {
  ComponentePlantilla,
  PaginaPlantillas,
  PlantillaFiltros,
} from '../../domain/read-models/plantilla.read-model';

export const PROVEEDOR_PLANTILLAS = Symbol('PROVEEDOR_PLANTILLAS');

export type NuevaPlantilla = {
  name: string;
  language: string;
  category: string;
  components: ComponentePlantilla[];
};

export type PlantillaCreada = {
  id: string;
  status: string;
  category: string | null;
};

export type ArchivoImagen = {
  nombre: string;
  mimeType: string;
  tamano: number;
  contenido: Buffer;
};

export interface ProveedorPlantillasPort {
  listar(filtros: PlantillaFiltros): Promise<PaginaPlantillas>;

  /** Envía la plantilla a revisión. */
  crear(plantilla: NuevaPlantilla): Promise<PlantillaCreada>;

  /** Borra la plantilla en todos sus idiomas. */
  eliminar(nombre: string): Promise<void>;

  /** Devuelve el identificador que se usa como ejemplo del encabezado. */
  subirImagen(archivo: ArchivoImagen): Promise<{ handle: string }>;
}
