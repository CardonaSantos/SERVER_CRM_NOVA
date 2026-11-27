import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EliminarServicioAdicionalResult } from '../../application/use-cases/eliminar-servicio-adicional.use-case';
import { ServicioAdicionalEntity } from '../../domain/entities/servicio-adicional.entity';
import {
  ServicioAdicionalListItem,
  ServicioAdicionalOpcion,
} from '../../domain/read-models/servicio-adicional-listado.read-model';
import {
  ServicioAdicionalEliminadoResponseDto,
  ServicioAdicionalListadoResponseDto,
  ServicioAdicionalOpcionResponseDto,
  ServicioAdicionalResponseDto,
} from '../dto/servicio-adicional-response.dto';

export class ServicioAdicionalPresenter {
  static guardado(
    entity: ServicioAdicionalEntity,
  ): ServicioAdicionalResponseDto {
    const servicio = entity.toPrimitives();

    return {
      id: servicio.id!,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
      estado: servicio.estado,
      tipoServicioId: servicio.tipoServicioId,
      creadoEn: servicio.creadoEn.toISOString(),
      actualizadoEn: servicio.actualizadoEn.toISOString(),
    };
  }

  static item(
    servicio: ServicioAdicionalListItem,
  ): ServicioAdicionalListadoResponseDto {
    return {
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
      estado: servicio.estado,
      tipo: servicio.tipo && {
        id: servicio.tipo.id,
        nombre: servicio.tipo.nombre,
      },
      creadoEn: servicio.creadoEn.toISOString(),
      actualizadoEn: servicio.actualizadoEn.toISOString(),
      clientes: servicio.clientes,
      eliminable: servicio.eliminable,
    };
  }

  static listado(
    resultado: ResultadoPaginado<ServicioAdicionalListItem>,
  ): RespuestaPaginada<ServicioAdicionalListadoResponseDto> {
    return presentarPaginado(resultado, (servicio) =>
      ServicioAdicionalPresenter.item(servicio),
    );
  }

  static opcion(
    servicio: ServicioAdicionalOpcion,
  ): ServicioAdicionalOpcionResponseDto {
    return {
      id: servicio.id,
      nombre: servicio.nombre,
      precio: servicio.precio,
      estado: servicio.estado,
    };
  }

  static eliminado(
    result: EliminarServicioAdicionalResult,
  ): ServicioAdicionalEliminadoResponseDto {
    return {
      servicioId: result.servicioId,
      eliminadoEn: result.eliminadoEn.toISOString(),
    };
  }
}
