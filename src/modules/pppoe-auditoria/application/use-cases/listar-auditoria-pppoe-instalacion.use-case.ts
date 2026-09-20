import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { ListarAuditoriaPppoeInstalacionQueryDto } from '../dto/listar-auditoria-pppoe-instalacion-query.dto';

import {
  PPPOE_AUDITORIA_INSTALACION_QUERY,
  PppoeAuditoriaInstalacionQueryPort,
} from '../../domain/ports/pppoe-auditoria-instalacion-query.port';

import { PppoeAuditoriaInstalacionPaginatedResult } from '../../domain/read-models/pppoe-auditoria-instalacion.read-model';

export type ListarAuditoriaPppoeInstalacionCommand = {
  instalacionId: number;
  empresaId: number;
  actorRol: string;
  query: ListarAuditoriaPppoeInstalacionQueryDto;
};

@Injectable()
export class ListarAuditoriaPppoeInstalacionUseCase {
  constructor(
    @Inject(PPPOE_AUDITORIA_INSTALACION_QUERY)
    private readonly queryPort: PppoeAuditoriaInstalacionQueryPort,
  ) {}

  async execute(
    command: ListarAuditoriaPppoeInstalacionCommand,
  ): Promise<PppoeAuditoriaInstalacionPaginatedResult | null> {
    this.assertPositiveInteger(command.instalacionId, 'instalacionId');
    this.assertPositiveInteger(command.empresaId, 'empresaId');
    this.assertAllowedRole(command.actorRol);

    const fechaDesde = command.query.fechaDesde
      ? new Date(command.query.fechaDesde)
      : null;

    const fechaHasta = command.query.fechaHasta
      ? new Date(command.query.fechaHasta)
      : null;

    if (
      fechaDesde &&
      fechaHasta &&
      fechaDesde.getTime() > fechaHasta.getTime()
    ) {
      throw new BadRequestException(
        'fechaDesde no puede ser posterior a fechaHasta.',
      );
    }

    return this.queryPort.findTimelineByInstalacion({
      empresaId: command.empresaId,
      instalacionId: command.instalacionId,

      page: command.query.page ?? 1,
      limit: command.query.limit ?? 10,

      search: command.query.search?.trim() || null,

      tipoOperacion: command.query.tipoOperacion ?? null,
      estadoOperacion: command.query.estadoOperacion ?? null,

      accion: command.query.accion ?? null,
      origen: command.query.origen ?? null,

      fechaDesde,
      fechaHasta,

      ordenDireccion: command.query.ordenDireccion ?? 'desc',
    });
  }

  private assertAllowedRole(actorRol: string): void {
    const role = actorRol?.trim().toUpperCase();

    if (
      ['ADMIN', 'COORDINADOR_OPERACIONES', 'OFICINA', 'SUPER_ADMIN'].includes(
        role,
      )
    ) {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para consultar la auditoría PPPoE administrativa.',
    );
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
