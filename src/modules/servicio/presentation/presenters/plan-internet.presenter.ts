import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { CambiarPrecioPlanInternetResult } from '../../application/use-cases/cambiar-precio-plan-internet.use-case';
import { EliminarPlanInternetResult } from '../../application/use-cases/eliminar-plan-internet.use-case';
import { PlanInternetEntity } from '../../domain/entities/plan-internet.entity';
import {
  PlanInternetDetalle,
  PlanInternetListItem,
  PlanInternetOpcion,
} from '../../domain/read-models/plan-internet-listado.read-model';
import {
  PlanInternetDetalleResponseDto,
  PlanInternetEliminadoResponseDto,
  PlanInternetListadoResponseDto,
  PlanInternetOpcionResponseDto,
  PlanInternetResponseDto,
  PrecioPlanInternetResponseDto,
} from '../dto/plan-internet-response.dto';

export class PlanInternetPresenter {
  static guardado(entity: PlanInternetEntity): PlanInternetResponseDto {
    const plan = entity.toPrimitives();

    return {
      id: plan.id!,
      nombre: plan.nombre,
      velocidad: plan.velocidad,
      precio: plan.precio,
      estado: plan.estado,
      creadoEn: plan.creadoEn.toISOString(),
      actualizadoEn: plan.actualizadoEn.toISOString(),
    };
  }

  static item(plan: PlanInternetListItem): PlanInternetListadoResponseDto {
    return {
      id: plan.id,
      nombre: plan.nombre,
      velocidad: plan.velocidad,
      precio: plan.precio,
      estado: plan.estado,
      creadoEn: plan.creadoEn.toISOString(),
      actualizadoEn: plan.actualizadoEn.toISOString(),
      clientes: plan.clientes,
      eliminable: plan.eliminable,
    };
  }

  static listado(
    resultado: ResultadoPaginado<PlanInternetListItem>,
  ): RespuestaPaginada<PlanInternetListadoResponseDto> {
    return presentarPaginado(resultado, (plan) =>
      PlanInternetPresenter.item(plan),
    );
  }

  static detalle(plan: PlanInternetDetalle): PlanInternetDetalleResponseDto {
    return {
      ...PlanInternetPresenter.item(plan),
      clientesFacturables: plan.clientesFacturables,
      uso: {
        clientesEliminados: plan.uso.clientesEliminados,
        accesos: plan.uso.accesos,
        instalaciones: plan.uso.instalaciones,
        desinstalaciones: plan.uso.desinstalaciones,
        homologaciones: plan.uso.homologaciones,
      },
    };
  }

  static opcion(plan: PlanInternetOpcion): PlanInternetOpcionResponseDto {
    return {
      id: plan.id,
      nombre: plan.nombre,
      velocidad: plan.velocidad,
      precio: plan.precio,
      estado: plan.estado,
    };
  }

  static precio(
    result: CambiarPrecioPlanInternetResult,
  ): PrecioPlanInternetResponseDto {
    return {
      planId: result.planId,
      precioAnterior: result.precioAnterior,
      precioNuevo: result.precioNuevo,
      clientesAfectados: result.clientes.total,
      clientesFacturables: result.clientes.facturables,
    };
  }

  static eliminado(
    result: EliminarPlanInternetResult,
  ): PlanInternetEliminadoResponseDto {
    return {
      planId: result.planId,
      eliminadoEn: result.eliminadoEn.toISOString(),
    };
  }
}
