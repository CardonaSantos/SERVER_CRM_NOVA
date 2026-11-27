import { DireccionOrden, Paginacion } from 'src/common/hexagonal/paginacion';

export enum OrdenPlantillaContrato {
  NOMBRE = 'nombre',
  CREADO_EN = 'creadoEn',
  ACTUALIZADO_EN = 'actualizadoEn',
}

export type PlantillaContratoFiltros = Paginacion & {
  search?: string;
  sortBy: OrdenPlantillaContrato;
  sortDir: DireccionOrden;
};

/** Fila del listado: sin el texto, que se pide en el detalle. */
export type PlantillaContratoListItem = {
  id: number;
  nombre: string;
  creadoEn: Date;
  actualizadoEn: Date;
};
