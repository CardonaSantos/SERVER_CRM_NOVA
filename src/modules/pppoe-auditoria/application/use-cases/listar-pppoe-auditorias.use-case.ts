import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { dayjs } from 'src/Utils/dayjs.config';

import {
  PPPOE_AUDITORIA_REPOSITORY,
  PppoeAuditoriaRepositoryPort,
} from '../../domain/ports/pppoe-auditoria-repository';

import { PppoeAuditoriaPaginatedResult } from '../../domain/read-models/pppoe-auditoria-list.read-model';

import { ListarPppoeAuditoriasQueryDto } from '../dto/listar-pppoe-auditorias-query.dto';

@Injectable()
export class ListarPppoeAuditoriasUseCase {
  constructor(
    @Inject(PPPOE_AUDITORIA_REPOSITORY)
    private readonly auditoriaRepository: PppoeAuditoriaRepositoryPort,
  ) {}

  execute(
    query: ListarPppoeAuditoriasQueryDto,
  ): Promise<PppoeAuditoriaPaginatedResult> {
    return this.auditoriaRepository.findPaginated({
      empresaId: query.empresaId,

      page: query.page ?? 1,

      limit: query.limit ?? 10,

      search: query.search?.trim() || null,

      accion: query.accion ?? null,

      origen: query.origen ?? null,

      clienteId: query.clienteId ?? null,

      instalacionId: query.instalacionId ?? null,

      accesoInternetId: query.accesoInternetId ?? null,

      cuentaPppoeId: query.cuentaPppoeId ?? null,

      perfilHomologacionId: query.perfilHomologacionId ?? null,

      operadorId: query.operadorId ?? null,

      fechaDesde: this.parseFechaDesde(query.fechaDesde),

      fechaHasta: this.parseFechaHasta(query.fechaHasta),

      /**
       * La auditoría siempre se presenta desde el evento
       * más reciente.
       */
      ordenPor: 'creadoEn',

      ordenDireccion: 'desc',
    });
  }

  private parseFechaDesde(value?: string): Date | null {
    if (!value?.trim()) {
      return null;
    }

    const normalized = value.trim();

    const fecha = dayjs(normalized);

    if (!fecha.isValid()) {
      throw new BadRequestException('fechaDesde no contiene una fecha válida.');
    }

    return this.isDateOnly(normalized)
      ? fecha.startOf('day').toDate()
      : fecha.toDate();
  }

  private parseFechaHasta(value?: string): Date | null {
    if (!value?.trim()) {
      return null;
    }

    const normalized = value.trim();

    const fecha = dayjs(normalized);

    if (!fecha.isValid()) {
      throw new BadRequestException('fechaHasta no contiene una fecha válida.');
    }

    return this.isDateOnly(normalized)
      ? fecha.endOf('day').toDate()
      : fecha.toDate();
  }

  private isDateOnly(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }
}
