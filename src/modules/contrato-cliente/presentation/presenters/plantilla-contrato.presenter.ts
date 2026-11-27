import {
  presentarPaginado,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PlantillaContratoEntity } from '../../domain/entities/plantilla-contrato.entity';
import { PlantillaContratoListItem } from '../../domain/read-models/plantilla-contrato-listado.read-model';
import {
  PlantillaContratoItemResponseDto,
  PlantillaContratoResponseDto,
} from '../dto/plantilla-contrato-response.dto';

export class PlantillaContratoPresenter {
  static item(m: PlantillaContratoListItem): PlantillaContratoItemResponseDto {
    return {
      id: m.id,
      nombre: m.nombre,
      creadoEn: m.creadoEn.toISOString(),
      actualizadaEn: m.actualizadoEn.toISOString(),
    };
  }

  static listado(r: ResultadoPaginado<PlantillaContratoListItem>) {
    return presentarPaginado(r, (m) => PlantillaContratoPresenter.item(m));
  }

  static detalle(
    plantilla: PlantillaContratoEntity,
  ): PlantillaContratoResponseDto {
    const p = plantilla.toPrimitives();

    return {
      id: p.id!,
      nombre: p.nombre,
      body: p.body,
      creadoEn: p.creadoEn.toISOString(),
      actualizadaEn: p.actualizadoEn.toISOString(),
    };
  }
}
