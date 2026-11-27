import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EliminarSectorResult } from '../../application/use-cases/eliminar-sector.use-case';
import { SectorEntity } from '../../domain/entities/sector.entity';
import {
  SectorListItem,
  SectorOpcion,
} from '../../domain/read-models/sector-listado.read-model';
import {
  SectorEliminadoResponseDto,
  SectorListadoResponseDto,
  SectorOpcionResponseDto,
  SectorResponseDto,
} from '../dto/sector-response.dto';

export class SectorPresenter {
  static guardado(entity: SectorEntity): SectorResponseDto {
    const sector = entity.toPrimitives();

    return {
      id: sector.id!,
      nombre: sector.nombre,
      descripcion: sector.descripcion,
      municipioId: sector.municipioId,
      creadoEn: sector.creadoEn.toISOString(),
      actualizadoEn: sector.actualizadoEn.toISOString(),
    };
  }

  static item(sector: SectorListItem): SectorListadoResponseDto {
    return {
      id: sector.id,
      nombre: sector.nombre,
      descripcion: sector.descripcion,
      municipio: {
        id: sector.municipio.id,
        nombre: sector.municipio.nombre,
      },
      departamento: {
        id: sector.departamento.id,
        nombre: sector.departamento.nombre,
      },
      creadoEn: sector.creadoEn.toISOString(),
      actualizadoEn: sector.actualizadoEn.toISOString(),
      clientes: sector.clientes,
      eliminable: sector.eliminable,
    };
  }

  static listado(
    resultado: ResultadoPaginado<SectorListItem>,
  ): RespuestaPaginada<SectorListadoResponseDto> {
    return presentarPaginado(resultado, (sector) =>
      SectorPresenter.item(sector),
    );
  }

  static opcion(sector: SectorOpcion): SectorOpcionResponseDto {
    return {
      id: sector.id,
      nombre: sector.nombre,
      municipioId: sector.municipioId,
      clientes: sector.clientes,
    };
  }

  static eliminado(result: EliminarSectorResult): SectorEliminadoResponseDto {
    return {
      sectorId: result.sectorId,
      eliminadoEn: result.eliminadoEn.toISOString(),
    };
  }
}
